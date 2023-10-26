import { Request, ResponseToolkit } from '@hapi/hapi';
import Order, { OrderStatus } from '../models/orders';
import dotenv from 'dotenv';
import Cart from '../models/cart';
import { log } from 'console';
import { Customer } from '../models/customers';
import nodemailer from 'nodemailer';
import { Product } from '../models/products';
dotenv.config();

interface CheckoutPayload {
  paymentMethod: string;
  shippingAddress: {
    houseNo: string;
    city: string;
    district: string;
    country: string;
  };
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.PASSWORD,
  },
});

// Define a function to send the order confirmation email
const sendOrderConfirmationEmail = async (email: string, orderId: string, products: any[], totalAmount: number) => {
  try {
    const mailOptions = {
      from: process.env.EMAIL,
      to: email,
      subject: 'Order Confirmation',
      html: `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Order Confirmation</title>
      </head>
      <body style="font-family: Arial, sans-serif; margin: 0; padding: 20px; background-color: #f5f5f5;">
      
        <div style="background-color: white; border-radius: 5px; box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1); padding: 20px;">
      
          <h1 style="color: #333;">Order Confirmation</h1>
      
          <p>Your order with ID <strong>${orderId}</strong> has been placed successfully.</p>
      
          <h2>Order Details:</h2>
          <p>Total Amount: <strong>$${totalAmount}</strong></p>
      
          <p>Thank you for shopping with us!</p>
        </div>
      
      </body>
      </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log('Order confirmation email sent.');
  } catch (error) {
    console.error('Error sending email:', error);
  }
};



const stripe = require('stripe')('sk_test_51Ng5VRSDGc9VTgGkVvLh6Nk4BYBN1fti7YYr9lZce0tbo5aQdtoP4GH3Q2SfIffgFkpDo2F5tYUtninF7ui6YQQG00Uc8BCNSz');
export class OrderController {

  static checkout = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;
      const payload = request.payload as CheckoutPayload;
      const { paymentMethod, shippingAddress } = payload;
      const customer = await Customer.findById(customerId);

      const customerEmail = customer?.email;
      if (!customerEmail) {
        return h.response({ message: 'Customer email not found' }).code(400); // Handle the missing email case
      }

      let cart = await Cart.findOne({ customerId }).populate('products.productId');

      if (!cart) {
        return h.response({ message: 'Cart not found' }).code(404);
      }

      if (cart.products.length === 0) {
        return h.response({ message: 'Cart is empty' }).code(400);
      }

      const orderItems = cart.products.map(item => ({
        product: item.productId,
        quantity: item.quantity,
        unit_price: item.unit_price,
      }));

      await Promise.all(orderItems.map(async (item) => {
        const product = await Product.findById(item.product);

        if (!product) {
          return h.response({ message: 'Product not found' }).code(404);
        }

        if (product.stock_quantity < item.quantity) {
          return h.response({ message: 'Insufficient stock for the product' }).code(400);
        }
        product.stock_quantity -= item.quantity;
        await product.save();
      }));

      // Validate paymentMethod
      if (paymentMethod !== 'cod' && paymentMethod !== 'card') {
        return h.response({ message: 'Invalid payment method' }).code(400);
      }

      if (paymentMethod === 'card') {
        const session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          mode: 'payment',
          line_items: cart.products.map(item => ({
            price_data: {
              currency: 'usd',
              unit_amount: item.unit_price * 100,
              product_data: {
                name: "Items",
                description: "Please pay for your order"
              },
            },
            quantity: item.quantity,
          })),
          success_url: 'http://localhost:3001/public/success.html',
          cancel_url: `${process.env.SERVER_URL}/public/.html`,
        });
        console.log("hello" + process.env.SERVER_URL);

        await Cart.deleteOne({ _id: cart._id });
        await sendOrderConfirmationEmail(customerEmail, 'Card Payment Order', cart.products, cart.cartTotal);
        return h.response({
          stripeCheckoutUrl: session.url,
        }).code(200);
      }

//cash on delivery
      const orderTotal = cart.cartTotal;

      const newOrder = new Order({
        customerId,
        items: orderItems,
        orderTotal,
        paymentMethod,
        shippingAddress,
      });

      const savedOrder = await newOrder.save();
      await sendOrderConfirmationEmail(customerEmail, savedOrder._id, savedOrder.items, savedOrder.orderTotal);
      await Cart.deleteOne({ _id: cart._id });

      return h.response({
        message: 'Order placed successfully',
        customerId: savedOrder.customerId,
        products: savedOrder.items,
        orderId: savedOrder._id,
        totalAmount: savedOrder.orderTotal,
        paymentMethod: savedOrder.paymentMethod,
        orderStatus: savedOrder.status
      }).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error placing order' }).code(500);
    }

  }

  //get order by id
  static getOrder = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;
      const orderId = request.params.orderId;

      const order = await Order.findOne({ _id: orderId, customerId }).populate('items.product');
      console.log(order);

      if (!order) {
        return h.response({ message: 'Order not found' }).code(404);
      }

      const formattedOrder = {
        orderId: order._id,
        orderItems: order.items,
        orderTotal: order.orderTotal,
        order_status: order.status,
        ordered: order.createdAt
      };

      return h.response(formattedOrder).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error fetching order' }).code(500);
    }
  };


  //get all orders
  static getAllOrders = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;

      const orders = await Order.find({ customerId }).populate('items.product').sort({ createdAt: -1 });
      console.log(orders);
      const formattedOrders: any = orders.map(order => ({
        orderId: order._id,
        orderTotal: order.orderTotal,
        order_status: order.status,
        ordered: order.createdAt,
      }));

      return h.response(formattedOrders).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error fetching orders' }).code(500);
    }
  };


  static updateOrderStatus = async (request: Request, h: ResponseToolkit) => {
    try {

      const orderId = request.params.orderId;
      const { status } = request.payload as { status: OrderStatus };

      const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });
      if (!order) {
        return h.response({ message: 'Order not found' }).code(404);
      }

      return h.response({ message: 'Order status updated successfully' }).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Error updating order status' }).code(500);
    }
  };
}