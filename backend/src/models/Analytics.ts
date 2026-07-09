import { Schema, model, Document, Types } from 'mongoose';

export interface IProductStat {
  product: Types.ObjectId;
  unitsSold: number;
  revenue: number;
}

export interface ISellerStat {
  seller: Types.ObjectId;
  revenue: number;
}

export interface IAnalytics extends Document {
  date: string; // Format: YYYY-MM-DD for unique index mapping per day
  totalSales: number;
  ordersCount: number;
  unitsSold: number;
  topProducts: IProductStat[];
  topSellers: ISellerStat[];
  createdAt: Date;
  updatedAt: Date;
}

const ProductStatSchema = new Schema<IProductStat>({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  unitsSold: { type: Number, default: 0 },
  revenue: { type: Number, default: 0 },
});

const SellerStatSchema = new Schema<ISellerStat>({
  seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  revenue: { type: Number, default: 0 },
});

const AnalyticsSchema = new Schema<IAnalytics>(
  {
    date: { type: String, required: true, unique: true, index: true },
    totalSales: { type: Number, default: 0 },
    ordersCount: { type: Number, default: 0 },
    unitsSold: { type: Number, default: 0 },
    topProducts: [ProductStatSchema],
    topSellers: [SellerStatSchema],
  },
  { timestamps: true }
);

export const Analytics = model<IAnalytics>('Analytics', AnalyticsSchema);
