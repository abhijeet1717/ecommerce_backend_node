import Hapi from '@hapi/hapi';
import Boom from '@hapi/boom';

type ValidateFuncType = (
  decoded: any,
  request: Hapi.Request,
  h: Hapi.ResponseToolkit
) => Promise<Hapi.Lifecycle.ReturnValueTypes>;

export const validateToken: ValidateFuncType = async (decoded, request, h) => {
  try {

    const credentials: Hapi.Lifecycle.ReturnValueTypes = {
      isValid: true,
      credentials: {
        customerId: decoded.customerId,
        role: decoded.role,
      },
    };

    return credentials;
  } catch (error) {
    throw Boom.unauthorized('Invalid token'); // Create an unauthorized error using Boom
  }
};




