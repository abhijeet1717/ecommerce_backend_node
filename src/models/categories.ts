import Joi from 'joi';
import mongoose, { Document, Schema } from 'mongoose';

export interface CategoryDoc extends Document {
  name: string;
  description?: string;
  parent_category: Schema.Types.ObjectId | CategoryDoc | null; // Change here
  created_at: Date;
  updated_at: Date;
}

const categorySchema = new mongoose.Schema<CategoryDoc>({
  name: { type: String, required: true },
  description: { type: String },
  parent_category: { type: Schema.Types.ObjectId, ref: 'Category', default: null }, // Change here
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

categorySchema.pre<CategoryDoc>('save', function (next) {
  this.updated_at = new Date();
  next();
});
export const categoryJoiSchema = Joi.object<CategoryDoc>({
  name: Joi.string().required(),
  description: Joi.string(),
  parent_category: Joi.string().allow(null),  // Assuming parent_category is a string representation of ObjectId
});
const Category = mongoose.model<CategoryDoc>('Category', categorySchema);

export default Category;
