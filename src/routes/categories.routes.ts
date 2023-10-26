// routes.ts
import { ServerRoute } from '@hapi/hapi';
import { CategoryController } from '../controller/categories.controller';
import { adminAuthMiddleware } from '../middleware/admin.check';
import { categoryJoiSchema } from '../models/categories';
import Joi from 'joi';

const api = process.env.API_URL;

const categoryRoutes: ServerRoute[] = [
    // add category
    {
        method: 'POST',
        path: api + '/categories',
        handler: CategoryController.addCategory,
        options: {
            tags: ['api', 'admin'],
            description: 'Add category',
            auth: 'jwt',
            pre: [{ method: adminAuthMiddleware }],
            validate: {
                payload: categoryJoiSchema,
            },
        },
    },
    // Get all categories
    {
        method: 'GET',
        path: api + '/categories',
        handler: CategoryController.getCategories,
        options: {
            tags: ['api', 'user'],
            description: 'Get all categories',
        }
    },
    // Get all subcategories
    {
        method: 'GET',
        path: api + '/categories/{parentId}',
        handler: CategoryController.getCategory,
        options: {
            tags: ['api', 'user'],
            description: 'Get all subcategories',
            validate: {
                params: Joi.object({
                    parentId: Joi.string().required(),
                }),
            },
        }
    },

    // Update a category by ID (Admin only)
    {
        method: 'PUT',
        path: api + '/categories/{categoryId}',
        handler: CategoryController.updateCategory,
        options: {
            tags: ['api', 'admin'],
            description: 'Update Category',
            auth: 'jwt',
            pre: [{ method: adminAuthMiddleware }],
            validate: {
                payload: categoryJoiSchema,
                params: Joi.object({
                    categoryId: Joi.string().required(),
                }),
            },
        },
    },

    // Delete a category by ID (Admin only)
    {
        method: 'DELETE',
        path: api + '/categories/{categoryId}',
        handler: CategoryController.deleteCategory,
        options: {
            tags: ['api', 'admin'],
            description: 'Delete Category',
            auth: 'jwt',
            pre: [{ method: adminAuthMiddleware }],
            validate: {
                params: Joi.object({
                    categoryId: Joi.string().required(),
                }),
            },
        },
    },
];
export default categoryRoutes;
