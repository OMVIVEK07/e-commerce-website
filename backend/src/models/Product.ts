import { Schema, model, Document, Types } from 'mongoose';

export interface IVariant {
  color?: string;
  size?: string;
  weight?: string;
  additionalPrice?: number;
  stock: number;
  sku: string;
  images: string[];
}

export interface IProduct extends Document {
  name: string;
  brand: string;
  description: string;
  specifications: Record<string, string>;
  features: string[];
  category: Types.ObjectId;
  subcategory?: Types.ObjectId;
  price: number;
  discount: number; // percentage discount (e.g., 15 for 15% off)
  images: string[];
  videos: string[];
  threeSixtyImages: string[]; // For 360 degree viewer
  stock: number;
  rating: number;
  reviewsCount: number;
  seller: Types.ObjectId;
  variants: IVariant[];
  warranty: string;
  deliveryTime: string;
  returnPolicy: string;
  createdAt: Date;
  updatedAt: Date;
}

const VariantSchema = new Schema<IVariant>({
  color: { type: String },
  size: { type: String },
  weight: { type: String },
  additionalPrice: { type: Number, default: 0 },
  stock: { type: Number, required: true, default: 0 },
  sku: { type: String, required: true },
  images: [{ type: String }],
});

const ProductSchema = new Schema<IProduct>(
  {
    name: { type: String, required: true, index: true },
    brand: { type: String, required: true, index: true },
    description: { type: String, required: true },
    specifications: { type: Map, of: String, default: {} },
    features: [{ type: String }],
    category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
    subcategory: { type: Schema.Types.ObjectId, ref: 'Category' },
    price: { type: Number, required: true, min: 0 },
    discount: { type: Number, default: 0, min: 0, max: 100 },
    images: [{ type: String, required: true }],
    videos: [{ type: String }],
    threeSixtyImages: [{ type: String }],
    stock: { type: Number, required: true, default: 0, min: 0 },
    rating: { type: Number, default: 0, min: 0, max: 5 },
    reviewsCount: { type: Number, default: 0 },
    seller: { type: Schema.Types.ObjectId, ref: 'Seller', required: true },
    variants: [VariantSchema],
    warranty: { type: String, default: 'No warranty' },
    deliveryTime: { type: String, default: '3-5 business days' },
    returnPolicy: { type: String, default: '7 days returnable' },
  },
  { timestamps: true }
);

// Indexes for search and filters
ProductSchema.index({ name: 'text', brand: 'text', description: 'text' });

export const Product = model<IProduct>('Product', ProductSchema);
