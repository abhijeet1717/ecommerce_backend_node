import mongoose, { Schema, Document } from 'mongoose';
import Joi from 'joi';
import { Customer } from './customers';

export interface ProductDoc extends mongoose.Document {
  name: string;
  price: number;
  description?: string;
  category: Schema.Types.ObjectId | string;
  stock_quantity: number;
  images: [string];
  vendor_id : Schema.Types.ObjectId,
  created_at: Date;
  updated_at: Date;
}

const productSchema = new mongoose.Schema<ProductDoc>({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String },
  category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
  stock_quantity: { type: Number, required: true },
  images: [{ type: String }],
  vendor_id : {
    type: Schema.Types.ObjectId ,ref:'Customer',required:true
  },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

productSchema.pre<ProductDoc>('save', function (next) {
  this.updated_at = new Date();
  next();
});

const Product = mongoose.model<ProductDoc>('Product', productSchema);

const productJoiSchema = Joi.object<ProductDoc>({
  name: Joi.string().required(),
  description: Joi.string().required(),
  price: Joi.number().min(0).required(),
  category: Joi.string().required(),
  stock_quantity: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string()),    
  
});

export { Product, productJoiSchema };
