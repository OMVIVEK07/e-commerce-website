import { Request, Response } from 'express';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { Cart } from '../models/Cart';
import { Wishlist } from '../models/Wishlist';
import { Otp } from '../models/Otp';
import { sendCustomEmail } from '../services/emailService';

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

interface GoogleUserPayload {
  email: string;
  email_verified: boolean;
  name: string;
  picture?: string;
  googleId: string;
}

// Helper to sign JWT
const generateToken = (userId: string): string => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET || 'fallback_secret', {
    expiresIn: '7d',
  });
};

export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.body;

    if (!token) {
      res.status(400).json({ success: false, message: 'Google ID Token is required' });
      return;
    }

    let payload: GoogleUserPayload | null = null;

    // Developer Mock Bypass Flow
    if (token.startsWith('mock_')) {
      const mockRole = token.split('_')[1] || 'customer';
      console.log(`[Auth Controller] Using developer mock login bypass for role: ${mockRole}`);
      
      payload = {
        email: `mock_${mockRole}@gmail.com`,
        email_verified: true,
        name: `Mock ${mockRole.charAt(0).toUpperCase() + mockRole.slice(1)}`,
        picture: 'https://cdn-icons-png.flaticon.com/512/149/149071.png',
        googleId: `mock_google_id_${mockRole}`,
      };
    } else {
      // Standard Google OAuth verification
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: token,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        const googlePayload = ticket.getPayload();

        if (googlePayload) {
          payload = {
            email: googlePayload.email || '',
            email_verified: !!googlePayload.email_verified,
            name: googlePayload.name || 'Google User',
            picture: googlePayload.picture,
            googleId: googlePayload.sub,
          };
        }
      } catch (err: any) {
        console.error('[Auth Controller] Google verification failed:', err.message);
        res.status(401).json({ success: false, message: 'Invalid Google token' });
        return;
      }
    }

    if (!payload || !payload.email) {
      res.status(400).json({ success: false, message: 'Unable to retrieve user info from Google' });
      return;
    }

    if (!payload.email) {
      res.status(400).json({ success: false, message: 'Unable to retrieve user info' });
      return;
    }

    if (!payload.email_verified) {
      res.status(403).json({ success: false, message: 'Your Google email account is not verified' });
      return;
    }

    // Find user in database
    let user = await User.findOne({ email: payload.email });

    if (!user) {
      // Automatic Account Creation on first login
      console.log(`[Auth Controller] Registering new user: ${payload.email}`);
      
      // Determine initial role (if it's the mock admin or if email matches designated admin env, set admin)
      let role: 'customer' | 'seller' | 'admin' = 'customer';
      if (
        payload.email === process.env.ADMIN_EMAIL ||
        payload.email.includes('mock_admin')
      ) {
        role = 'admin';
      } else if (payload.email.includes('mock_seller')) {
        role = 'seller';
      }

      user = await User.create({
        name: payload.name,
        email: payload.email,
        profilePic: payload.picture,
        googleId: payload.googleId,
        role: role,
      });

      // Create cart & wishlist records for this user
      await Cart.create({ user: user._id, items: [] });
      await Wishlist.create({ user: user._id, products: [] });
    } else {
      // If user exists but is blocked, reject access
      if (user.isBlocked) {
        res.status(403).json({
          success: false,
          message: 'Your account is blocked. Please contact admin support.',
        });
        return;
      }

      // Update picture or name if changed
      if (payload.picture && user.profilePic !== payload.picture) {
        user.profilePic = payload.picture;
        await user.save();
      }
    }

    // Sign JWT
    const localToken = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      token: localToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller] Error during authentication:', error);
    res.status(500).json({ success: false, message: 'Internal authentication error' });
  }
};

export const getMe = async (req: any, res: Response): Promise<void> => {
  try {
    const user = await User.findById(req.user.id).select('-googleId');
    res.status(200).json({ success: true, user });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving profile data' });
  }
};

export const sendOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ success: false, message: 'Email address is required' });
      return;
    }

    // Validate proper email syntax
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({ success: false, message: 'Please enter a valid email address' });
      return;
    }

    // Generate 6-digit OTP code
    const generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Delete any existing OTP for this email first
    await Otp.deleteMany({ email });

    // Save the new OTP
    await Otp.create({
      email,
      otp: generatedOtp,
    });

    console.log(`[OTP Authentication] Generated OTP for ${email}: ${generatedOtp}`);

    // Send email using custom SMTP mailer
    try {
      await sendCustomEmail({
        to: email,
        subject: 'ShopCraft Sign-In Verification Code',
        text: `Your ShopCraft verification code is: ${generatedOtp}. This OTP is valid for 5 minutes.`,
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #333; max-width: 500px; margin: auto; border: 1px solid #e5e7eb; border-radius: 12px;">
            <h2 style="color: #4f46e5; margin-bottom: 5px;">ShopCraft Security</h2>
            <p style="font-size: 14px; color: #4b5563;">Please use the following 6-digit OTP to authenticate your secure login request:</p>
            <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 4px; text-align: center; margin: 20px 0; color: #1e1b4b;">
              ${generatedOtp}
            </div>
            <p style="font-size: 11px; color: #9ca3af;">This code is valid for 5 minutes. If you did not make this request, please secure your email account.</p>
          </div>
        `,
      });
    } catch (mailErr: any) {
      console.error('[OTP Authentication] Email dispatch error:', mailErr.message);
    }

    res.status(200).json({ success: true, message: 'Verification OTP sent successfully!' });
  } catch (error: any) {
    console.error('[Auth Controller] Send OTP Error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to send verification OTP' });
  }
};

export const verifyOtp = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ success: false, message: 'Email and verification OTP are required' });
      return;
    }

    // Find latest matching OTP record
    const record = await Otp.findOne({ email, otp });

    if (!record) {
      res.status(401).json({ success: false, message: 'Invalid or expired verification OTP' });
      return;
    }

    // Check user database
    let user = await User.findOne({ email });

    if (!user) {
      const namePart = email.split('@')[0];
      const name = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      
      console.log(`[OTP Verification] Registering new customer user: ${email}`);

      user = await User.create({
        name,
        email,
        profilePic: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(namePart)}`,
        role: 'customer',
      });

      // Initialize default cart and wishlist
      await Cart.create({ user: user._id, items: [] });
      await Wishlist.create({ user: user._id, products: [] });
    } else {
      if (user.isBlocked) {
        res.status(403).json({ success: false, message: 'Your account is blocked. Please contact support.' });
        return;
      }
    }

    // Valid OTP - remove OTP records for this email after user creation succeeds
    await Otp.deleteMany({ email });

    const localToken = generateToken(user._id.toString());

    res.status(200).json({
      success: true,
      token: localToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        profilePic: user.profilePic,
        role: user.role,
        loyaltyPoints: user.loyaltyPoints,
        referralCode: user.referralCode,
      },
    });
  } catch (error: any) {
    console.error('[Auth Controller] Verify OTP Error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify OTP' });
  }
};
