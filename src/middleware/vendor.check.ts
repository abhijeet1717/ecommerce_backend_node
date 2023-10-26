import { Request, ResponseToolkit } from '@hapi/hapi';
import Boom from '@hapi/boom';

export const vendorAuthMiddleware = (request: Request, h: ResponseToolkit) => {
  const { role } = request.auth.credentials;

  if (role !== 'vendor') {
    throw Boom.forbidden('Sorry you are not a vendor');
  }

  return h.continue; 
};
