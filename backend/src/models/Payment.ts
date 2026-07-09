import { Schema, model, Document, Types } from 'mongoose';

export interface IPayment extends Document {
  order: Types.ObjectId;
  amount: number;
  currency: string;
  provider: 'stripe' | 'razorpay';
  status: 'pending' | 'succeeded' | 'failed' | 'refunded';
  transactionId: string; // payment intent id or razorpay payment id
  paymentMethod?: string; // card, upi, wallet, netbanking
  receiptUrl?: string;
  refundDetails?: {
    refundId?: string;
    amountRefunded?: number;
    reason?: string;
    refundedAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    order: { type: Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    amount: { type: Number, required: true },
    currency: { type: String, required: true, default: 'INR' },
    provider: { type: String, enum: ['stripe', 'razorpay'], required: true },
    status: {
      type: String,
      enum: ['pending', 'succeeded', 'failed', 'refunded'],
      default: 'pending',
      index: true,
    },
    transactionId: { type: String, required: true, unique: true, index: true },
    paymentMethod: { type: String },
    receiptUrl: { type: String },
    refundDetails: {
      refundId: { type: String },
      amountRefunded: { type: Number },
      reason: { type: String },
      refundedAt: { type: Date },
    },
  },
  { timestamps: true }
);

export const Payment = model<IPayment>('Payment', PaymentSchema);
