import Hapi, { ServerRoute } from '@hapi/hapi';
import { connection } from './db/connection';
import { validateToken } from './middleware/validateToken';
import * as hapiAuthJwt2 from 'hapi-auth-jwt2';
import cartRoutes from './routes/cart.routes';
import userRoutes from './routes/user.routes';
import productRoutes from './routes/product.routes';
import categoryRoutes from './routes/categories.routes';
import ordersRoutes from './routes/order.routes';
import vision from "@hapi/vision";
import inert from "@hapi/inert";
import path from 'path';
import hapiswagger from 'hapi-swagger';


const init = async () => {
  const server = Hapi.server({
    port: 3001,
    host: 'localhost',
  });

  const secretKey = process.env.SECRET_KEY;


  await connection();


  await server.register(hapiAuthJwt2);
  server.auth.strategy('jwt', 'jwt', {
    key: secretKey,
    validate: validateToken,
    verifyOptions: { algorithms: ['HS256'] },
  });


  await server.register([inert, vision,
    {
      plugin: hapiswagger,
      options: {
        info: {
          title: 'API Documentation',
          version: '1.0.0',
        },
        securityDefinitions: {
          jwt: {
            type: 'apiKey',
            name: 'Authorization',
            in: 'header',
          },
        },
        security: [{ jwt: [] }],
        grouping: 'tags',
        tags:
          [{ name: 'user', description: 'User endpoints' },
          { name: 'admin', description: 'Admin endpoints' },
          { name: 'vendor', description: 'Vendor endpoints' },
          ]
      }
    },]);



  const allRoutes: ServerRoute[] = [
    ...userRoutes,
    ...cartRoutes,
    ...productRoutes,
    ...categoryRoutes,
    ...ordersRoutes,
  ];

  server.route(allRoutes);


  await server.start();

  console.log('Server running on %s', server.info.uri);
};

init();
