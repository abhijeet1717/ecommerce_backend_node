import { ServerRoute } from '@hapi/hapi';
import { UserController } from '../controller/users.controller';
import dotenv from 'dotenv';
import Joi, { any } from 'joi';
import { UserRole, customerLoginJoiSchema, customerSignupJoiSchema } from '../models/customers';
import { adminAuthMiddleware } from '../middleware/admin.check';
import { checkSessionInRedis } from '../middleware/redis.session';

dotenv.config();

const api = process.env.API_URL;

const userRoutes: ServerRoute[] = [
  {
    method: 'POST',
    path: api + '/signup',
    handler: UserController.signup,
    options: {
      tags: ['api', 'user'],
      description: 'User signup',
      validate: {
        payload: customerSignupJoiSchema,
      },
    }
  },

  {
    method: 'POST',
    path: api + '/login',
    handler: UserController.login,
    options: {
      tags: ['api', 'user'],
      description: 'User login',
      validate: {
        payload: customerLoginJoiSchema,
      },
    },
  },

  {
    method: 'POST',
    path: api + '/logout',
    handler: UserController.logout,
    options: {
      tags: ['api', 'user'],
      description: 'User logout',
      auth: 'jwt',
      plugins: {
        'hapi-swagger': {
          security: [{ jwt: [] }],
        },
      },
    }
  },



  {
    method: 'GET',
    path: api + '/profile',
    handler: UserController.getProfile,
    options: {
      auth: 'jwt',
      pre: [{ method: checkSessionInRedis }],
      tags: ['api', 'user'],
      description: 'User profile',
      plugins: {
        'hapi-swagger': {
          security: [{ jwt: [] }],
        },
      },

    }
  },

  {
    method: 'PUT',
    path: api + '/profile',
    handler: UserController.updateProfile,
    options: {
      tags: ['api', 'user'],
      description: 'Update profile',
      auth: 'jwt',
      validate: {
        payload: Joi.object({
          full_name: Joi.string(),
          phone: Joi.number(),
        }).min(1)
      },
      plugins: {
        'hapi-swagger': {
          security: [{ jwt: [] }],
        },
      },
    }
  },

  {
    method: 'DELETE',
    path: api + '/profile',
    handler: UserController.deleteProfile,
    options: {
      tags: ['api', 'user'],
      description: 'Delete profile',
      auth: 'jwt',
      plugins: {
        'hapi-swagger': {
          security: [{ jwt: [] }],
        },
      },
    }
  },

  {
    method: 'POST',
    path: api + '/forget-password',
    handler: UserController.forgetPassword,
    options: {
      tags: ['api', 'user'],
      description: 'Forget password',
      validate: {
        payload: Joi.object({
          email: Joi.string().email().required()
        })
      }
    }
  },

  {
    method: 'POST',
    path: api + '/reset-password',
    handler: UserController.resetPassword,
    options: {
      tags: ['api', 'user'],
      description: 'Reset Password',
      validate: {
        payload: Joi.object({
          otp: Joi.number().required(),
          email: Joi.string().required(),
          newPassword: Joi.string().required()
        })
      }

    }
  },

  {
    method: 'GET',
    path: api + '/users',
    handler: UserController.getAllUsers,
    options: {
      auth: 'jwt',
      tags: ['api', 'admin'],
      description: 'Get all users',
      pre: [{ method: adminAuthMiddleware }],
    },
  },

  {
    method: 'PUT',
    path: api + '/users/{userId}/role',
    handler: UserController.updateUserRole,
    options: {
      auth: 'jwt',
      tags: ['api', 'admin'],
      description: 'Update user role',
      pre: [{ method: adminAuthMiddleware }],
      validate: {
        params: Joi.object({
          userId: Joi.string().required(),
        }),
        payload: Joi.object({
          role: Joi.string().valid(...Object.values(UserRole)).required(),

        }),
      },
    },
  }


];

export default userRoutes;
