import nodemailer from 'nodemailer';

// Check if email configuration is active
const isEmailConfigured = () =>
  !!process.env.EMAIL_USER &&
  !!process.env.EMAIL_PASS &&
  process.env.EMAIL_USER !== 'mock_user';

let transporter: nodemailer.Transporter | null = null;

if (isEmailConfigured()) {
  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: Number(process.env.EMAIL_PORT) || 587,
    secure: process.env.EMAIL_SECURE === 'true', // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
  console.log('[Email Service] Nodemailer Transporter initialized.');
} else {
  console.log('[Email Service] SMTP credentials missing. Running in MOCK logging mode.');
}

export const sendWelcomeEmail = async (email: string, name: string): Promise<boolean> => {
  const mailOptions = {
    from: `"ShopCraft Support" <${process.env.EMAIL_FROM || 'support@shopcraft.com'}>`,
    to: email,
    subject: 'Welcome to ShopCraft! 🛍️',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #0f172a;">Welcome to ShopCraft, ${name}!</h2>
        <p>We are thrilled to welcome you to our modern shopping platform. Only verified Gmail accounts like yours can access our exclusive ecosystem.</p>
        <p>Explore thousands of products with express deliveries, flexible payment methods (Stripe & Razorpay), and hassle-free returns.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${process.env.CLIENT_URL || 'http://localhost:3000'}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Start Shopping Now</a>
        </div>
        <p style="font-size: 12px; color: #94a3b8;">If you did not make this request, please ignore this email.</p>
      </div>
    `,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Welcome email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('[Email Service] Welcome email error:', error);
      return false;
    }
  }

  console.log(`[Mock Email Service] Sent welcome email to: ${email}`);
  return true;
};

export const sendOrderConfirmationEmail = async (
  email: string,
  order: any,
  pdfBuffer: Buffer
): Promise<boolean> => {
  const invoiceId = `INV-${order._id.toString().substring(18).toUpperCase()}`;
  
  const mailOptions = {
    from: `"ShopCraft Orders" <${process.env.EMAIL_FROM || 'orders@shopcraft.com'}>`,
    to: email,
    subject: `Order Confirmed! #${order._id.toString().substring(18).toUpperCase()} 📦`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #10b981;">Your Order is Confirmed!</h2>
        <p>Thank you for shopping with us. We have received your order and are processing it.</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p><strong>Order ID:</strong> ${order._id}</p>
        <p><strong>Grand Total:</strong> INR ${order.grandTotal.toFixed(2)}</p>
        <p><strong>Shipping To:</strong> ${order.shippingAddress.name}, ${order.shippingAddress.streetAddress}, ${order.shippingAddress.city}</p>
        <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
        <p>We have attached the official PDF invoice (<strong>${invoiceId}.pdf</strong>) to this email for your records.</p>
        <p>You can track your package details inside your ShopCraft Customer Dashboard.</p>
      </div>
    `,
    attachments: [
      {
        filename: `${invoiceId}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Order confirmation email sent to: ${email}`);
      return true;
    } catch (error) {
      console.error('[Email Service] Order confirmation email error:', error);
      return false;
    }
  }

  console.log(`[Mock Email Service] Sent order confirmation + invoice pdf attachment to: ${email}`);
  return true;
};

export const sendCustomEmail = async (options: {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}): Promise<boolean> => {
  const mailOptions = {
    from: `"ShopCraft Security" <${process.env.EMAIL_FROM || 'security@shopcraft.com'}>`,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html,
  };

  if (transporter) {
    try {
      await transporter.sendMail(mailOptions);
      console.log(`[Email Service] Custom email sent to: ${options.to}`);
      return true;
    } catch (error) {
      console.error('[Email Service] Custom email send error:', error);
      return false;
    }
  }

  console.log(`[Mock Email Service] Sent custom email mock. To: ${options.to}, Subject: ${options.subject}, Body: ${options.text || options.html}`);
  return true;
};
