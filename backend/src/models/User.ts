import { Schema, model, Document } from 'mongoose';

export interface IUser extends Document {
  name: string;
  email: string;
  profilePic?: string;
  googleId?: string;
  role: 'customer' | 'seller' | 'admin';
  isBlocked: boolean;
  loyaltyPoints: number;
  referralCode: string;
  referredBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    profilePic: { type: String },
    googleId: { type: String, unique: true, index: true, sparse: true },
    role: {
      type: String,
      enum: ['customer', 'seller', 'admin'],
      default: 'customer',
    },
    isBlocked: { type: Boolean, default: false },
    loyaltyPoints: { type: Number, default: 0 },
    referralCode: { type: String, unique: true },
    referredBy: { type: String },
  },
  { timestamps: true }
);

// Pre-save hook to generate referral code if not present
UserSchema.pre('save', function (next) {
  if (!this.referralCode) {
    this.referralCode = 'REF-' + Math.random().toString(36).substring(2, 8).toUpperCase();
  }
  next();
});

export const User = model<IUser>('User', UserSchema);
