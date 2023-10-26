import { Request, ResponseToolkit } from '@hapi/hapi';
import CartItem from '../models/cart';
import { Product } from '../models/products';
import { createClient } from 'redis';
import Cart from '../models/cart';
import { Customer } from '../models/customers';
// import { any } from 'joi';


const client = createClient();
client.on('error', (error) => {
  console.error('Redis connection error:', error);
});


interface AddToCartPayload {
  productId: string;
  quantity?: number;
}

export class CartController {

  static addToCart = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;
      const payload = request.payload as AddToCartPayload;

      const productId = payload.productId;
      const quantity = payload.quantity || 1;

      const product = await Product.findById(productId);
      if (!product) {
        return h.response({ message: 'Product not found' }).code(404);
      }

      let cart = await Cart.findOne({ customerId });

      const unit_price = product.price;
      const cartItem: any = {
        productId,
        quantity,
        unit_price,
      };

      if (cart) {
        const existingItem = cart.products.find(item => item.productId.toString() === productId);
        if (existingItem) {
          existingItem.quantity += quantity;
          cart.cartTotal += unit_price * quantity;
        } else {
          cart.products.push(cartItem);
          cart.cartTotal += unit_price * quantity;
        }
        await cart.save();
      } else {
        const cartTotal = quantity * unit_price;
        const newCart = new Cart({
          customerId,
          products: [cartItem],
          cartTotal,
        });
        await newCart.save();
      }

      return h.response({ message: 'Item added to cart successfully' }).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error adding item to cart' }).code(500);
    }
  };

  // Get the cart items for a customer
  static getCart = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;
      const cart = await Cart.findOne({ customerId });
      if (!cart) {
        return h.response({ message: 'Cart not found' }).code(404);
      }
      const customerCart = {
        products: cart.products,
        cartTotal: cart.cartTotal,
      };
      return h.response(customerCart).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error fetching cart items' }).code(500);
    }
  };


  // Update an item in the cart
  static updateCartItem = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;
      const productId = request.params.productId;

      const payload = request.payload as AddToCartPayload;
      const newQuantity = payload.quantity || 1; // Default to 1 if quantity is not provided

      let cart = await Cart.findOne({ customerId });

      if (!cart) {
        return h.response({ message: 'Cart not found' }).code(404);
      }

      const existingItem = cart.products.find(item => item.productId.toString() === productId);

      if (existingItem) {
        const oldQuantity = existingItem.quantity;
        const unit_price = existingItem.unit_price;
        const priceDifference = unit_price * (newQuantity - oldQuantity);

        existingItem.quantity = newQuantity;
        cart.cartTotal += priceDifference;

        await cart.save();

        return h.response({ message: 'Cart item updated successfully' }).code(200);
      } else {
        return h.response({ message: 'Item not found in cart' }).code(404);
      }
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error updating cart item' }).code(500);
    }
  };


  // Remove an item from the cart
  static removeCartItem = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;
      const productId = request.params.productId;


      const cart = await Cart.findOne({ customerId });

      if (!cart) {
        return h.response({ message: 'Cart not found' }).code(404);
      }

      const existingItemIndex = cart.products.findIndex(item => (item.productId).toString() == productId.toString());
      if (existingItemIndex === -1) {
        return h.response({ message: 'Product not in cart' }).code(404);
      }

      const removedItem = cart.products.splice(existingItemIndex, 1)[0];
      cart.cartTotal -= removedItem.quantity * removedItem.unit_price;

      if (cart.products.length === 0) {

        await Cart.deleteOne({ _id: cart._id });
      } else {
        await cart.save();
      }

      return h.response({ message: 'Item removed from cart successfully' }).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error removing item from cart' }).code(500);
    }
  };
}