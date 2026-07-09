import Stripe from 'stripe';
import Razorpay from 'razorpay';

// Helper to determine if actual payment gateway integration should be bypassed for local testing
const isStripeConfigured = () => !!process.env.STRIPE_SECRET_KEY && process.env.STRIPE_SECRET_KEY !== 'mock_key';
const isRazorpayConfigured = () => !!process.env.RAZORPAY_KEY_ID && !!process.env.RAZORPAY_KEY_SECRET && process.env.RAZORPAY_KEY_ID !== 'mock_id';

let stripe: Stripe | null = null;
let razorpay: Razorpay | null = null;

if (isStripeConfigured()) {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
    apiVersion: '2024-06-20' as any,
  });
  console.log('[Payment Service] Stripe initialized.');
} else {
  console.log('[Payment Service] Stripe key missing. Stripe running in MOCK mode.');
}

if (isRazorpayConfigured()) {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID!,
    key_secret: process.env.RAZORPAY_KEY_SECRET!,
  });
  console.log('[Payment Service] Razorpay initialized.');
} else {
  console.log('[Payment Service] Razorpay keys missing. Razorpay running in MOCK mode.');
}

export interface PaymentIntentResult {
  id: string;
  clientSecret: string | null;
  status: string;
}

export interface RazorpayOrderResult {
  id: string;
  amount: number;
  currency: string;
  status: string;
}

export const createStripePaymentIntent = async (
  amountInINR: number,
  currency: string = 'INR'
): Promise<PaymentIntentResult> => {
  if (stripe) {
    try {
      // Stripe uses subunits, for INR it's paise (amount * 100)
      const intent = await stripe.paymentIntents.create({
        amount: Math.round(amountInINR * 100),
        currency: currency.toLowerCase(),
        payment_method_types: ['card'],
      });
      return {
        id: intent.id,
        clientSecret: intent.client_secret,
        status: intent.status,
      };
    } catch (error: any) {
      console.error('[Payment Service] Stripe PaymentIntent error:', error.message);
      throw error;
    }
  }

  // Mock Payment Intent
  console.log(`[Payment Service] Creating mock Stripe intent for: ${amountInINR} ${currency}`);
  return {
    id: `mock_stripe_intent_${Math.random().toString(36).substring(2, 10)}`,
    clientSecret: `mock_stripe_secret_${Math.random().toString(36).substring(2, 10)}`,
    status: 'requires_payment_method',
  };
};

export const createRazorpayOrder = async (
  amountInINR: number,
  currency: string = 'INR',
  receiptId: string
): Promise<RazorpayOrderResult> => {
  if (razorpay) {
    try {
      // Razorpay uses subunits, for INR it's paise (amount * 100)
      const order = await razorpay.orders.create({
        amount: Math.round(amountInINR * 100),
        currency: currency,
        receipt: receiptId,
      });
      return {
        id: order.id,
        amount: Number(order.amount) / 100,
        currency: order.currency,
        status: order.status,
      };
    } catch (error: any) {
      console.error('[Payment Service] Razorpay Order error:', error.message);
      throw error;
    }
  }

  // Mock Razorpay Order
  console.log(`[Payment Service] Creating mock Razorpay order for receipt: ${receiptId}`);
  return {
    id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
    amount: amountInINR,
    currency: currency,
    status: 'created',
  };
};

export const refundStripePayment = async (
  paymentIntentId: string,
  amountInINR?: number
): Promise<{ success: boolean; refundId?: string }> => {
  if (stripe && !paymentIntentId.startsWith('mock_')) {
    try {
      const refundParams: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
      };
      if (amountInINR) {
        refundParams.amount = Math.round(amountInINR * 100);
      }
      const refund = await stripe.refunds.create(refundParams);
      return { success: true, refundId: refund.id };
    } catch (error: any) {
      console.error('[Payment Service] Stripe Refund error:', error.message);
      throw error;
    }
  }

  console.log(`[Payment Service] Mocking Stripe Refund for transaction: ${paymentIntentId}`);
  return { success: true, refundId: `mock_stripe_refund_${Math.random().toString(36).substring(2, 10)}` };
};

export const refundRazorpayPayment = async (
  paymentId: string,
  amountInINR: number
): Promise<{ success: boolean; refundId?: string }> => {
  if (razorpay && !paymentId.startsWith('mock_')) {
    try {
      const refund = await razorpay.payments.refund(paymentId, {
        amount: Math.round(amountInINR * 100),
        speed: 'normal',
      });
      return { success: true, refundId: refund.id };
    } catch (error: any) {
      console.error('[Payment Service] Razorpay Refund error:', error.message);
      throw error;
    }
  }

  console.log(`[Payment Service] Mocking Razorpay Refund for payment: ${paymentId}`);
  return { success: true, refundId: `mock_rzp_refund_${Math.random().toString(36).substring(2, 10)}` };
};
