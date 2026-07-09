import { Schema, model, Document, Types } from 'mongoose';

export interface IOrderItem {
  product: Types.ObjectId;
  quantity: number;
  selectedVariant?: {
    color?: string;
    size?: string;
    weight?: string;
  };
  price: number; // Price of the item at purchase time
}

export interface IOrderAddress {
  name: string;
  phone: string;
  alternatePhone?: string;
  streetAddress: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface ITrackingStage {
  status: 'pending' | 'processed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  description: string;
  timestamp: Date;
}

export interface IOrder extends Document {
  customer: Types.ObjectId;
  items: IOrderItem[];
  shippingAddress: IOrderAddress;
  billingAddress: IOrderAddress;
  paymentMethod: 'stripe' | 'razorpay' | 'cod';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  orderStatus: 'pending' | 'processed' | 'shipped' | 'delivered' | 'cancelled' | 'returned';
  tracking: ITrackingStage[];
  discountAmount: number;
  couponApplied?: string;
  gst: number;
  shippingCharges: number;
  grandTotal: number;
  invoiceUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const OrderAddressSchema = new Schema<IOrderAddress>({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  alternatePhone: { type: String },
  streetAddress: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, required: true },
  postalCode: { type: String, required: true },
  country: { type: String, required: true },
});

const OrderItemSchema = new Schema<IOrderItem>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  quantity: { type: Number, required: true, min: 1 },
  selectedVariant: {
    color: { type: String },
    size: { type: String },
    weight: { type: String },
  },
  price: { type: Number, required: true },
});

const TrackingStageSchema = new Schema<ITrackingStage>({
  status: {
    type: String,
    enum: ['pending', 'processed', 'shipped', 'delivered', 'cancelled', 'returned'],
    required: true,
  },
  description: { type: String, required: true },
  timestamp: { type: Date, default: Date.now },
});

const OrderSchema = new Schema<IOrder>(
  {
    customer: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    items: [OrderItemSchema],
    shippingAddress: { type: OrderAddressSchema, required: true },
    billingAddress: { type: OrderAddressSchema, required: true },
    paymentMethod: { type: String, enum: ['stripe', 'razorpay', 'cod'], required: true },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['pending', 'processed', 'shipped', 'delivered', 'cancelled', 'returned'],
      default: 'pending',
      index: true,
    },
    tracking: [TrackingStageSchema],
    discountAmount: { type: Number, default: 0 },
    couponApplied: { type: String },
    gst: { type: Number, required: true },
    shippingCharges: { type: Number, required: true },
    grandTotal: { type: Number, required: true },
    invoiceUrl: { type: String },
  },
  { timestamps: true }
);

export const Order = model<IOrder>('Order', OrderSchema);
