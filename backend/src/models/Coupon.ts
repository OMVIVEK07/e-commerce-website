import { Schema, model, Document, Types } from 'mongoose';

export interface ICoupon extends Document {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountAmount: number;
  minPurchase: number; // Minimum order value to apply coupon
  expiryDate: Date;
  isActive: boolean;
  usedBy: Types.ObjectId[]; // Track users who applied this coupon
  createdAt: Date;
  updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
  {
    code: { type: String, required: true, unique: true, uppercase: true, index: true },
    discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
    discountAmount: { type: Number, required: true },
    minPurchase: { type: Number, default: 0 },
    expiryDate: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

export const Coupon = model<ICoupon>('Coupon', CouponSchema);
