import { Schema, model, Document, Types } from 'mongoose';

export interface IReview extends Document {
  product: Types.ObjectId;
  user: Types.ObjectId;
  rating: number; // 1-5 stars
  comment?: string;
  photos: string[];
  videos: string[];
  likes: Types.ObjectId[]; // Users who liked this review
  helpfulUsers: Types.ObjectId[]; // Users who clicked "Helpful"
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    product: { type: Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String },
    photos: [{ type: String }],
    videos: [{ type: String }],
    likes: [{ type: Schema.Types.ObjectId, ref: 'User' }],
    helpfulUsers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Compound index so a user can write only one review per product
ReviewSchema.index({ product: 1, user: 1 }, { unique: true });

export const Review = model<IReview>('Review', ReviewSchema);
