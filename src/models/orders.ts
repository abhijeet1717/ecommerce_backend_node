import mongoose, { Document, Schema } from 'mongoose';
import Joi from 'joi';
export enum OrderStatus {
  Pending = 'pending',
  Confirmed = 'confirmed',
  Shipped = 'shipped',
  Delivered = 'delivered',
  Cancelled = 'cancelled',
}
export interface OrderItem {
  product: Schema.Types.ObjectId;
  quantity: number;
  unit_price: number;
}

interface ShippingAddress {
  houseNo: string;
  city: string;
  district: string;
  country: string;
}

export interface OrderDoc extends Document {
  customerId: Schema.Types.ObjectId;
  items: OrderItem[];
  orderTotal: number;
  status: OrderStatus;
  paymentMethod: string;
  shippingAddress: ShippingAddress; 
  createdAt: Date;
}


const orderSchema = new mongoose.Schema<OrderDoc>(
  {
    customerId: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: 'Customer',
    },
    items: [
      {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        unit_price: { type: Number, required: true },
      },
    ],
    orderTotal: { type: Number, required: true },
    paymentMethod: { type: String, required: true },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.Pending },
    shippingAddress: {
      houseNo: { type: String, required: true },
      city: { type: String, required: true },
      district: { type: String, required: true },
      country: { type: String, required: true },
    },
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const Order = mongoose.model<OrderDoc>('OrdersN', orderSchema);


export default Order;
