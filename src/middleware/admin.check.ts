import { Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';

export const adminAuthMiddleware = (request: Request, h: ResponseToolkit) => {
  const { role } = request.auth.credentials;

  if (role !== 'admin') {
    throw Boom.forbidden('Unauthorized access');
  }

  return h.continue; 
};
