import { Schema, model, Document, Types } from 'mongoose';

export interface ICategory extends Document {
  name: string;
  slug: string;
  parent?: Types.ObjectId | null;
  image?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
  {
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true, index: true },
    parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    image: { type: String },
  },
  { timestamps: true }
);

export const Category = model<ICategory>('Category', CategorySchema);
