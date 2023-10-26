import { Request, ResponseToolkit } from '@hapi/hapi';
import { Product, productJoiSchema } from '../models/products';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

export class ProductController {

  static addProduct = async (request: Request, h: ResponseToolkit) => {
    try {

      const { error, value } = productJoiSchema.validate(request.payload);
      if (error) {
        return h.response({ message: 'Invalid payload', error }).code(400);
      }
      const customerId = request.auth.credentials.customerId;


      const { name, price, description, category, stock_quantity, images } = value;

      const existingProduct = await Product.findOne({ name });

      if (existingProduct) {
        return h.response({ message: 'Product with the same name already exists' }).code(409);
      }
      const newProduct = new Product({
        name, price, description,
        category, stock_quantity,
        images, vendor_id: customerId
      });


      await newProduct.save();

      return h.response({ message: 'Product added successfully' }).code(201);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'An error occurred while adding the product' }).code(500);
    }
  };



  //get all products 
  static getAllProducts = async (request: Request, h: ResponseToolkit) => {
    try {
      const product = await Product.find();
      return h.response(product).code(200);
    } catch (error) {
      console.log(error);

    }
  }



  //filter products
  static filterByCategory = async (request: Request, h: ResponseToolkit) => {
    try {
      const category = request.query.categoryId;     //changess    ----
      const sortBy = request.query.sortBy; // 'priceLowToHigh' or undefined for default

      if (!category) {
        return h.response({ message: 'Category parameter is missing' }).code(400);
      }

      let filteredProducts = await Product.find({ category });

      if (sortBy === 'priceLowToHigh') {
        filteredProducts = filteredProducts.sort((a, b) => a.price - b.price);
      }

      return h.response(filteredProducts).code(200);
    } catch (error: any) {
      console.log(error);
      return h.response({ message: 'Error filtering products by category' }).code(500);
    }
  };


  static getProduct = async (request: Request, h: ResponseToolkit) => {
    try {
      const productId = request.params.productId;

      // Find the product by ID
      const product = await Product.findById(productId);
      if (!product) {
        return h.response({ message: 'Product not found' }).code(404);
      }

      return h.response(product).code(200);
    } catch (error: any) {
      console.log(error);
      return h.response({ message: 'Error getting product' }).code(500);
    }
  }


  static updateProduct = async (request: Request, h: ResponseToolkit) => {
    try {

      const productId = request.params.productId;
      const { error, value } = productJoiSchema.validate(request.payload);

      if (error) {
        return h.response({ message: 'Invalid payload', error }).code(400);
      }

      // Find the product by ID and update its fields
      const updatedProduct = await Product.findByIdAndUpdate(productId, value, { new: true });
      if (!updatedProduct) {
        return h.response({ message: 'Product not found' }).code(404);
      }

      return h.response({ message: 'Product updated successfully', product: updatedProduct }).code(200);
    } catch (error: any) {
      console.log(error);
      return h.response({ message: 'Error updating product' }).code(500);
    }
  };

  // Delete a product by ID
  static deleteProduct = async (request: Request, h: ResponseToolkit) => {
    try {

      const productId = request.params.productId;

      // Find and delete the product by ID
      const deletedProduct = await Product.findByIdAndDelete(productId);
      if (!deletedProduct) {
        return h.response({ message: 'Product not found' }).code(404);
      }

      return h.response({ message: 'Product deleted successfully' }).code(200);
    } catch (error: any) {
      console.log(error);
      return h.response({ message: 'Error deleting product' }).code(500);
    }
  };



  static async uploadProductImage(request: any, h: ResponseToolkit) {
    try {
      const productId = request.query.productId;
      const data: any = request.payload;

      // console.log("data?>>>>>>>>>>>S", JSON.stringify(data));
      if (!data.file) {
        return h.response({ message: "No file Provided" }).code(400);
      }
      const name = data.file.hapi.filename;
      console.log("----->", name);

      const product = await Product.findById({ _id: productId });
      if (product) {
        product.images.push(name);
        await product.save();
      }



      return h.response({ message: "Image uploaded" })

    }
    catch (error) {
      console.log("ERROR", error);
      return h.response({ message: "Error:" }).code(500);
    }
  }
}