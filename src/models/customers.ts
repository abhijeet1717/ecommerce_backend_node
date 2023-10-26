import mongoose, { Schema, Document } from 'mongoose';
import Joi from 'joi';
import bcrypt from 'bcrypt';

export enum UserRole {
  CUSTOMER = 'customer',
  ADMIN = 'admin',
  VENDOR = 'vendor'
}

export interface CustomerDoc extends Document {
  email: string;
  password: string;
  full_name: string;
  phone : number;
  role: UserRole;
  created_at: Date;
  updated_at: Date;

  comparePassword(password: string): Promise<boolean>;
}

const customerSchema: Schema<CustomerDoc> = new Schema({
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  full_name: { type: String },
  phone: {type:Number},
  role: { type: String, enum: Object.values(UserRole), default: UserRole.CUSTOMER },
  created_at: { type: Date, default: Date.now },
  updated_at: { type: Date, default: Date.now },
});

customerSchema.pre<CustomerDoc>('save', function (next) {
  this.updated_at = new Date();
  next();
});

customerSchema.methods.comparePassword = async function (password: string): Promise<boolean> {
  return bcrypt.compare(password, this.password);
};

const Customer = mongoose.model<CustomerDoc>('Customer', customerSchema);

const customerSignupJoiSchema = Joi.object<CustomerDoc>({
  email: Joi.string().email().required(),
  password: Joi.string()
  .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.*[!@#$%^&*])[A-Za-z0-9!@#$%^&*]{8,}$'))
  .required()
  .messages({
    'string.pattern.base':
      'Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one numeric digit, and one special character.',
  }),
  full_name: Joi.string().required(), 
  phone: Joi.string().required(),
})

const customerLoginJoiSchema = Joi.object<CustomerDoc>({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
  
});

export { Customer, customerSignupJoiSchema, customerLoginJoiSchema };
