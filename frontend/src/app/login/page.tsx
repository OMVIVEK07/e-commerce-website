'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch, useSelector } from 'react-redux';
import Script from 'next/script';
import { setCredentials } from '../../store/authSlice';
import { RootState } from '../../store';
import api from '../../services/api';
import { LogIn, Sparkles, Layers, ShieldCheck, UserCheck, Mail, Key } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email OTP Authentication States
  const [emailInput, setEmailInput] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpMessage, setOtpMessage] = useState<string | null>(null);

  // Initialize Google Sign In (Google Identity Services)
  const initializeGoogleSignIn = () => {
    if (typeof window !== 'undefined' && (window as any).google) {
      const clientId =
        process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ||
        '1039864756304-mockclientid.apps.googleusercontent.com'; // Fallback mock ID
      
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          handleGoogleLogin(response.credential);
        },
      });

      (window as any).google.accounts.id.renderButton(
        document.getElementById('google-signin-button'),
        {
          theme: 'outline',
          size: 'large',
          text: 'signin_with',
          shape: 'pill',
          width: '320',
        }
      );
    }
  };

  // Redirect if authenticated on mount, or configure GSI triggers
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }

    if (typeof window !== 'undefined' && (window as any).google) {
      initializeGoogleSignIn();
    }
  }, [isAuthenticated, router]);

  const handleLoginResponse = (data: any) => {
    if (data.success) {
      dispatch(
        setCredentials({
          token: data.token,
          user: data.user,
        })
      );
      router.push('/');
    } else {
      setError(data.message || 'Login failed.');
    }
  };

  // Google Login API Dispatch
  const handleGoogleLogin = async (tokenValue: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/auth/google', { token: tokenValue });
      handleLoginResponse(response.data);
    } catch (err: any) {
      console.error('[Google Login Error]:', err);
      setError(
        err.response?.data?.message ||
          'Authentication with Google failed. Make sure only verified @gmail.com accounts are used.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 1. Send OTP Request
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setError('Please provide your email address.');
      return;
    }
    if (!emailInput.endsWith('@gmail.com')) {
      setError('Only verified @gmail.com accounts are allowed.');
      return;
    }

    setLoading(true);
    setError(null);
    setOtpMessage(null);

    try {
      const response = await api.post('/auth/otp/send', { email: emailInput });
      if (response.data.success) {
        setOtpSent(true);
        setOtpMessage('A 6-digit verification code has been dispatched to your email.');
      } else {
        setError(response.data.message || 'Failed to send OTP.');
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request verification code.');
    } finally {
      setLoading(false);
    }
  };

  // 2. Verify OTP Request
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpInput.trim() || otpInput.length !== 6) {
      setError('Please provide the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await api.post('/auth/otp/verify', {
        email: emailInput,
        otp: otpInput,
      });
      handleLoginResponse(response.data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid or expired OTP code.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-slate-50 dark:bg-slate-950 transition">
      {/* Load Google Identity Services Script */}
      <Script
        src="https://accounts.google.com/gsi/client"
        onLoad={initializeGoogleSignIn}
        strategy="afterInteractive"
      />

      <div className="w-full max-w-md p-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-xl space-y-6">
        {/* Branding Logo */}
        <div className="flex flex-col items-center space-y-2 text-center">
          <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 rounded-2xl text-indigo-600 dark:text-indigo-400">
            <Layers className="h-8 w-8 stroke-[2.5]" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100 font-sans">Welcome to ShopCraft</h2>
          <p className="text-xs text-slate-400">Enter our secure production-ready marketplace</p>
        </div>

        {error && (
          <div className="p-4 text-xs font-semibold bg-red-50 dark:bg-red-950/20 text-red-655 dark:text-red-400 rounded-2xl border border-red-100 dark:border-red-950/50">
            {error}
          </div>
        )}

        {otpMessage && (
          <div className="p-4 text-xs font-semibold bg-green-50 dark:bg-green-950/20 text-green-600 dark:text-green-400 rounded-2xl border border-green-100 dark:border-green-950/50">
            {otpMessage}
          </div>
        )}

        {/* Passwordless Email OTP Login Form */}
        <div className="space-y-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Email OTP Sign-In</span>
          </div>

          {!otpSent ? (
            // Request OTP Step
            <form onSubmit={handleSendOtp} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-450 uppercase block">Gmail Address *</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="email"
                    placeholder="example@gmail.com"
                    value={emailInput}
                    onChange={(e) => setEmailInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-3 outline-hidden focus:ring-2 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
              >
                {loading ? 'Sending OTP Code...' : 'Request 6-Digit OTP'}
              </button>
            </form>
          ) : (
            // Verify OTP Step
            <form onSubmit={handleVerifyOtp} className="space-y-3 text-xs font-semibold">
              <div className="space-y-1">
                <label className="text-[9px] text-slate-450 uppercase block">Enter Code sent to {emailInput} *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter 6-digit OTP code"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-850 rounded-xl pl-10 pr-4 py-3 text-center tracking-widest font-mono text-base font-extrabold focus:ring-2 focus:ring-indigo-500 transition"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-3 rounded-2xl transition disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Verify OTP & Log In'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOtpSent(false);
                  setOtpInput('');
                  setOtpMessage(null);
                }}
                className="w-full text-center text-slate-455 text-[10px] hover:text-indigo-500 font-bold block pt-1"
              >
                Change Email Address
              </button>
            </form>
          )}
        </div>

        {/* Real Sign In with Google GSI Button Container */}
        <div className="space-y-4 border-t border-slate-100 dark:border-slate-850 pt-4">
          <div className="relative flex items-center justify-center">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-200 dark:border-slate-800"></span>
            </div>
            <span className="relative bg-white dark:bg-slate-900 px-3 text-[10px] text-slate-400 uppercase font-extrabold tracking-wider">Or Single Click</span>
          </div>

          <div className="flex flex-col items-center justify-center space-y-2 py-4 bg-slate-50/50 dark:bg-slate-950/20 rounded-2xl border border-slate-100 dark:border-slate-850">
            <div id="google-signin-button" className="w-full flex justify-center"></div>
            <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Secure Google Sign In</p>
          </div>
        </div>

        {/* Developer Sandbox Bypass Credentials */}
        <div className="bg-slate-50 dark:bg-slate-950 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-black text-indigo-600 dark:text-indigo-450 uppercase tracking-widest">
            <UserCheck className="h-4 w-4" />
            <span>Developer Mock Logins</span>
          </div>
          <p className="text-xs text-slate-455">
            Skip verification keys completely in local sandbox. Press a role below to auto-login.
          </p>

          <div className="grid grid-cols-1 gap-2.5">
            <button
              onClick={() => handleGoogleLogin('mock_customer')}
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>Login as Mock Customer</span>
            </button>

            <button
              onClick={() => handleGoogleLogin('mock_seller')}
              disabled={loading}
              className="w-full bg-teal-600 hover:bg-teal-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>Login as Mock Seller</span>
            </button>

            <button
              onClick={() => handleGoogleLogin('mock_admin')}
              disabled={loading}
              className="w-full bg-violet-650 hover:bg-violet-750 text-white font-bold py-2.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 transition disabled:opacity-50"
            >
              <LogIn className="h-4 w-4" />
              <span>Login as Mock Admin</span>
            </button>
          </div>
        </div>

        <p className="text-[11px] text-center text-slate-400 leading-relaxed">
          OTP verification ensures validated Gmail credentials. Your account profile details (Name, Email, Default Avatar) are registered automatically on first login.
        </p>
      </div>
    </div>
  );
}
