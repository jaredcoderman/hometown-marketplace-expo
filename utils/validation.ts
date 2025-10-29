import { z } from 'zod';

// Email validation
export const emailSchema = z.string().email('Invalid email address');

// Password validation (min 8 chars, at least one letter and one number)
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[a-zA-Z]/, 'Password must contain at least one letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

// User signup schema
export const signupSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  confirmPassword: z.string(),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  userType: z.enum(['buyer', 'seller']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Login schema
export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

// Product schema
export const productSchema = z.object({
  name: z.string().min(3, 'Product name must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  price: z.number().positive('Price must be greater than 0'),
  category: z.string().min(1, 'Category is required'),
  inStock: z.boolean(),
  quantity: z.number().int().nonnegative().optional(),
});

// Seller profile schema
export const sellerProfileSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  description: z.string().min(20, 'Description must be at least 20 characters'),
  categories: z.array(z.string()).min(1, 'Select at least one category'),
});

