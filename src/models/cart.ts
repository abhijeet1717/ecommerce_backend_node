import mongoose, { Document, Schema } from 'mongoose';

export interface CartItemDoc extends Document {
  customerId: Schema.Types.ObjectId;
  products: {
    productId: Schema.Types.ObjectId;
    quantity: number;
    unit_price:number;
  }[];
  cartTotal: number;
}

const cartItemSchema = new mongoose.Schema<CartItemDoc>({
  customerId:
  {
    type: Schema.Types.ObjectId, required: true,
    ref: 'Customer'
  },
  products: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, required: true, default: 1 },
    unit_price: {type: Number}
  }],

  cartTotal: { type: Number, required: true },
});

const Cart = mongoose.model<CartItemDoc>('cart', cartItemSchema);

export default Cart;
