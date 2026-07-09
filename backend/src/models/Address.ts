import { Schema, model, Document, Types } from 'mongoose';

export interface IAddress extends Document {
  user: Types.ObjectId;
  name: string;
  phone: string;
  alternatePhone?: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  addressType: 'home' | 'work' | 'other';
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const AddressSchema = new Schema<IAddress>(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    alternatePhone: { type: String },
    streetAddress: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, required: true, default: 'India' },
    addressType: { type: String, enum: ['home', 'work', 'other'], default: 'home' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Address = model<IAddress>('Address', AddressSchema);
