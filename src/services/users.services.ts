import bcrypt from 'bcrypt';
import { Customer } from '../models/customers';
import jwt, { Secret } from 'jsonwebtoken';
import Session from '../models/sessions';
import { createSessionInRedis,markSessionAsInactiveInRedis } from '../middleware/redis.session'; 

export async function signupUser(payload: {
    email: string;
    password: string;
    full_name: string;
    phone: string;
}) {
    try {
        const { email, password, full_name, phone } = payload;

        // Check if the customer already exists
        const existingCustomer = await Customer.findOne({ email });
        if (existingCustomer) {
            return { message: 'Email already registered', statusCode: 409 };
        }

        // Hash the password before saving it to the database
        const hashedPassword = await bcrypt.hash(password, 10);

        const newCustomerDocument = {
            email: email,
            password: hashedPassword,
            full_name: full_name,
            phone: phone,
        };

        await Customer.create(newCustomerDocument);

        return { message: 'Signup successful', statusCode: 201 };
    } catch (error) {
        return { message: 'Error signing up', error, statusCode: 500 };
    }
}

export async function loginUser(payload: { email: string; password: string }) {
    try {
      const { email, password } = payload;
  
      // Check if the customer exists
      const customer = await Customer.findOne({ email });
      if (!customer) {
        return { message: 'Customer not found', statusCode: 404 };
      }
  
      // Compare the provided password with the hashed password in the database
      const passwordMatch = await bcrypt.compare(password, customer.password);
      if (!passwordMatch) {
        return { message: 'Invalid credentials', statusCode: 401 };
      }
  
      // Create a JWT token with the customer's ID as the payload
      const secretKey = process.env.SECRET_KEY as Secret;
      const token = jwt.sign({ customerId: customer._id, role: customer.role }, secretKey, {
        expiresIn: '1h',
      });
  
      const expirationTime = new Date(Date.now() + 60 * 60 * 1000);
      // Create a new session entry
      const session = new Session({
        customerId: customer._id,
        isActive: true,
        expiresAt: expirationTime,
      });
      await session.save();
  
      // Redis session
      await createSessionInRedis(customer._id, {
        customerId: customer._id,
        isActive: true,
        expiresAt: expirationTime,
      });
  
      return { message: 'Login successful', token, statusCode: 200 };
    } catch (error) {
      return { message: 'Error logging in', error, statusCode: 500 };
    }
  }


export async function logoutUser(customerId: string) {
    try {
      // Update the session to mark it as inactive
      await Session.updateOne({ customerId, isActive: true }, { isActive: false });
      await markSessionAsInactiveInRedis(customerId);
  
      return { message: 'Logged out successfully', statusCode: 200 };
    } catch (error) {
      return { message: 'Error while logging out', statusCode: 500 };
    }
  }

  export async function getUserProfile(customerId: string) {
    try {
      // Find the customer by ID
      const customer = await Customer.findById(customerId);
      if (!customer) {
        return { message: 'Customer not found', statusCode: 404 };
      }
  
      return {
        email: customer.email,
        full_name: customer.full_name,
        phone: customer.phone,
        role: customer.role,
        statusCode: 200,
      };
    } catch (error) {
      console.log(error);
      return { message: 'Error retrieving profile', statusCode: 500 };
    }
  }

