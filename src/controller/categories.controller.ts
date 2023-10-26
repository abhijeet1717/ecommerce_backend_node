import { Request, ResponseToolkit } from '@hapi/hapi';
import Category, { categoryJoiSchema } from '../models/categories';

export class CategoryController {
  static addCategory = async (request: Request, h: ResponseToolkit) => {
    try {

      const { error, value } = categoryJoiSchema.validate(request.payload);

      if (error) {
        return h.response({ message: 'Invalid payload', error }).code(400);
      }

      const { name, description, parent_category } = value;

      // Check if a category with the same name already exists
      const existingCategory = await Category.findOne({ name });
      if (existingCategory) {
        return h.response({ message: 'Category with the same name already exists' }).code(409);
      }

      let newCategory;

      if (parent_category) {
        // Check if the provided parent_category exists in the database
        const parentCategory = await Category.findById(parent_category);
        if (!parentCategory) {
          return h.response({ message: 'Parent category not found' }).code(404);
        }

        // Add subcategory
        newCategory = new Category({ name, description, parent_category });
      } else {
        // Add top-level category
        newCategory = new Category({ name, description });
      }

      await newCategory.save();

      return h.response({ message: 'Category created successfully', category: newCategory }).code(201);
    } catch (error) {
      return h.response({ message: 'Error creating category', error }).code(500);
    }
  };


  // Get all categories
  static getCategories = async (_request: Request, h: ResponseToolkit) => {
    try {
      const categories = await Category.find();
      return h.response(categories).code(200);
    } catch (error: any) {
      console.error(error);
      return h.response({ message: 'Error fetching categories' }).code(500);
    }
  };

  static getCategory = async (request: Request, h: ResponseToolkit) => {
    try {
      const parentId = request.params.parentId; // Assuming you have a route parameter for the parent category ID
      const parentCategory = await Category.findById(parentId);

      if (!parentCategory) {
        return h.response({ message: 'Parent category not found' }).code(404);
      }

      const subcategories = await Category.find({ parent_category: parentCategory._id });

      return h.response({ subcategories }).code(200);
    } catch (error) {
      return h.response({ message: 'Error retrieving subcategories', error }).code(500);
    }
  };

  // Update a category by ID (Admin only)
  static updateCategory = async (request: Request, h: ResponseToolkit) => {
    try {
      const categoryId = request.params.categoryId;
      const { error, value } = categoryJoiSchema.validate(request.payload);

      if (error) {
        return h.response({ message: 'Invalid payload', error }).code(400);
      }

      const { name, description } = value;

      const updatedCategory = await Category.findByIdAndUpdate(
        categoryId,
        { name, description },
        { new: true }
      );

      if (!updatedCategory) {
        return h.response({ message: 'Category not found' }).code(404);
      }

      return h.response({ message: 'Category updated successfully' }).code(200);
    } catch (error: any) {
      console.error(error);
      return h.response({ message: 'Error updating category' }).code(500);
    }
  };

  // Delete a category by ID (Admin only)
  static deleteCategory = async (request: Request, h: ResponseToolkit) => {
    try {
      const categoryId = request.params.categoryId;
      const deletedCategory = await Category.findByIdAndDelete(categoryId);

      if (!deletedCategory) {
        return h.response({ message: 'Category not found' }).code(404);
      }

      return h.response({ message: 'Category deleted successfully' }).code(200);
    } catch (error: any) {
      console.error(error);
      return h.response({ message: 'Error deleting category' }).code(500);
    }
  };
}