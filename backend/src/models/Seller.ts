import { Schema, model, Document, Types } from 'mongoose';

export interface ISeller extends Document {
  user: Types.ObjectId;
  companyName: string;
  description?: string;
  phone: string;
  address: string;
  gstin?: string;
  bankDetails: {
    accountNumber: string;
    ifscCode: string;
    bankName: string;
  };
  isVerified: boolean;
  revenue: number;
  rating: number;
  createdAt: Date;
  updatedAt: Date;
}

const SellerSchema = new Schema<ISeller>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    companyName: { type: String, required: true },
    description: { type: String },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    gstin: { type: String },
    bankDetails: {
      accountNumber: { type: String, required: true },
      ifscCode: { type: String, required: true },
      bankName: { type: String, required: true },
    },
    isVerified: { type: Boolean, default: false },
    revenue: { type: Number, default: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
  },
  { timestamps: true }
);

export const Seller = model<ISeller>('Seller', SellerSchema);
