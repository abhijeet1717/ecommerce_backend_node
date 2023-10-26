import { Request, ResponseToolkit } from '@hapi/hapi';
import bcrypt from 'bcrypt';
import { Customer } from '../models/customers';
import dotenv from 'dotenv';
import { createClient } from 'redis';
import Session from '../models/sessions';
import nodemailer from 'nodemailer';
import { createSessionInRedis, markSessionAsInactiveInRedis } from '../middleware/redis.session';
import { getUserProfile, loginUser, logoutUser, signupUser } from '../services/users.services';
import { request } from 'http';
import { any } from 'joi';

dotenv.config();

const client = createClient();
client.on('connect', function () {
  console.log('Redis client connected');
});
client.connect();


export class UserController {
  //------------------- User signup ------------
  static signup = async (request: Request, h: ResponseToolkit) => {
    try {
      const payload = request.payload as {
        email: string;
        password: string;
        full_name: string;
        phone: string;
      };
      const result = await signupUser(payload);

      return h.response({ message: result.message }).code(result.statusCode);
    } catch (error) {
      return h.response({ message: 'Error signing up', error }).code(500);
    }
  };


  //------------------- User login ------------------------
  static login = async (request: Request, h: ResponseToolkit) => {
    try {
      const payload = request.payload as {
        email: string;
        password: string;
      };
      const result = await loginUser(payload);

      return h.response({ message: result.message, token: result.token }).code(result.statusCode);

    } catch (error) {
      return h.response({ message: 'Error logging in', error }).code(500);
    }
  };

  //--------------------- user logout -- -  -- -- - - - -- 
  static logout = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId as string;

      const result = await logoutUser(customerId);

      return h.response({ message: result.message }).code(result.statusCode);
    } catch (error) {
      // Handle logout error
      return h.response({ message: 'Error while logging out' });
    }
  };


  // -----  -- --  - - get User profile ---- 
  static getProfile = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId: any = request.auth.credentials.customerId;

      const result = await getUserProfile(customerId);

      return h.response(result).code(result.statusCode);
    } catch (error: any) {
      console.log(error);
      return h.response({ message: 'Error retrieving profile' }).code(500);
    }
  };


  //---------------update profile---------
  static updateProfile = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId; // Extract customer ID from authenticated token

      const { full_name, phone }: any = request.payload;
      if (!full_name) {
        return h.response({ message: 'Missing required field: full_name' }).code(400);
      }
      const updateObject: any = { full_name };
      if (phone) {
        updateObject.phone = phone;
      }
      // Find the customer by ID and update the full_name field
      const updatedCustomer = await Customer.findByIdAndUpdate(
        customerId,
        updateObject,
        { new: true }
      );

      if (!updatedCustomer) {
        return h.response({ message: 'Customer not found' }).code(404);
      }

      // Return the updated user profile
      return h.response({
        email: updatedCustomer.email,
        full_name: updatedCustomer.full_name,
        phone: updatedCustomer.phone,
        role: updatedCustomer.role,
      }).code(200);
    } catch (error) {
      console.log(error);

      return h.response({ message: 'Error updating profile' }).code(500);
    }
  };


  //--------delete profile----------------

  static deleteProfile = async (request: Request, h: ResponseToolkit) => {
    try {
      const customerId = request.auth.credentials.customerId;

      //retrieve the customer session
      const session = await Session.findOne({ customerId });

      // Check if the session is active
      if (!session || !session.isActive) {
        return h.response({ message: 'Session is inactive or not found' }).code(401);
      }
      if (!customerId) {
        return h.response({ message: 'Customer not found or already deleted' }).code(404);
      }

      // Find and delete the customer by ID
      const deletedCustomer = await Customer.findByIdAndDelete(customerId);

      if (!deletedCustomer) {
        return h.response({ message: 'Customer not found or already deleted' }).code(404);
      }


      return h.response({ message: 'Customer deleted successfully' }).code(200);
    } catch (error) {
      console.log(error);
      return h.response({ message: 'Error deleting customer profile' }).code(500);
    }
  };

  // forget password
  static forgetPassword = async (request: Request, h: ResponseToolkit) => {
    try {
      const { email }: any = request.payload;

      const user = await Customer.findOne({ email });

      if (!user) {
        return h.response({ message: 'Email not found' }).code(404);
      }

      let OTP = Math.floor(1000 + Math.random() * 7000);
      client.set(email, OTP);

      const transporter = nodemailer.createTransport({
        service: 'gmail',
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: process.env.EMAIL,
          pass: process.env.PASSWORD,
        },
      });
      console.log(process.env.EMAIL);


      const mailOptions = {
        from: process.env.EMAIL,
        to: email,
        subject: 'Password Reset Request',
        text: ` You are receiving this email because you (or someone else) has requested a password reset for your account.\n\n YOUR RESET PASSWORD OTP IS: ${OTP}\n\n If you did not request this, please ignore this email and your password will remain unchanged.\n`,
      };

      await transporter.sendMail(mailOptions);

      console.log('Email sent');
      return h.response({ message: 'OTP sent successfully' }).code(200);
    } catch (error) {
      console.error(error);
      return h.response({ message: 'Something went wrong' }).code(500);
    }
  };

  // reset password
  static resetPassword = async (request: Request, h: ResponseToolkit) => {

    const { email, otp, newPassword }: any = request.payload;
    const redisOTP = await client.get(email);

    if (redisOTP == otp) {
      const hashedPassword = await bcrypt.hash(newPassword, 10)
      const update = await Customer.findOneAndUpdate(
        { email: email },
        {
          $set: { password: hashedPassword }
        });
      if (update) {
        await client.DEL(email);
        return h.response({
          message: "Password has been reset successfully",
        })
      }
    }
    else {
      return h.response({
        message: "Invalid Otp",
      });
    }
  }

  static getAllUsers = async (request: Request, h: ResponseToolkit) => {
    try {

      const users = await Customer.aggregate([
        {
          $project: {
            _id: 0,
            userId: '$_id',
            email: 1,
            full_name: 1,
            role: 1,
            created_at: 1,
            updated_at: 1,
          },
        },
      ]);

      return h.response(users).code(404);

    } catch (error: any) {
      console.log(error);
      return h.response({ message: 'Error retrieving users' }).code(500);
    }

  }

  //update user role
  static updateUserRole = async (request: Request, h: ResponseToolkit) => {
    try {
      const userId = request.params.userId;
      const {role}:any = request.payload;
      const updatedUser = await Customer.findByIdAndUpdate(userId, { role }, { new: true });

      if (!updatedUser) {
        return h.response({ message: 'User not found' }).code(404);
      }

      return h.response(updatedUser).code(200);

    } catch (error) {
      console.error('Error updating user role:', error);
      return h.response({ message: 'Error updating user role' }).code(500);
    }
  }
}