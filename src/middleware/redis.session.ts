import {Request,ResponseToolkit } from '@hapi/hapi';
import Redis from 'ioredis';
import Boom from '@hapi/boom';
const redis = new Redis();

export const createSessionInRedis = async (customerId: string, sessionData: any) => {
    try {
      // Convert sessionData to a JSON string before storing it in Redis
      const sessionDataJSON = JSON.stringify(sessionData);

      // Store the session data in Redis with a specific key
      await redis.set(`session:${customerId}`, sessionDataJSON);
    } catch (error) {
      console.error('Error storing session in Redis:', error);
    }
  };
  
  // Function to mark session as inactive in Redis
  export const markSessionAsInactiveInRedis = async (customerId: string) => {
    try {
      await redis.del(`session:${customerId}`);
    } catch (error) {
      console.error('Error marking session as inactive in Redis:', error);
    }
  };
  

 
  export const checkSessionInRedis = async (request:Request, h:ResponseToolkit) => {
    const customerId = request.auth.credentials.customerId;
    const sessionExists = await redis.exists(`session:${customerId}`);
  
    // console.log("Redis check:", sessionExists);
  
    if (sessionExists === 0) {
      throw Boom.forbidden('You have been logged out ! Please login again');
    }
  
    return h.continue;
  };
  