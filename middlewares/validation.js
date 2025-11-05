// src/middlewares/validation.js

const { z } = require('zod');

// Validation schemas
const schemas = {
  register: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'staff', 'user']).optional(),
  }),

  login: z.object({
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(1, 'Password is required'),
  }),

  createEnquiry: z.object({
    customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100, 'Customer name is too long'),
    email: z.string().email('Please enter a valid email address'),
    phone: z.string().regex(/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits'),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long'),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),

  updateEnquiry: z.object({
    customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100, 'Customer name is too long').optional(),
    email: z.string().email('Please enter a valid email address').optional(),
    phone: z.string().regex(/^[0-9]{10,15}$/, 'Phone number must be 10-15 digits').optional(),
    message: z.string().min(10, 'Message must be at least 10 characters').max(1000, 'Message is too long').optional(),
    status: z.enum(['new', 'in_progress', 'closed']).optional(),
    assignedTo: z.string().optional(),
    priority: z.enum(['low', 'medium', 'high']).optional(),
  }),

  createUser: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters'),
    email: z.string().email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['admin', 'staff', 'user'], { errorMap: () => ({ message: 'Role must be admin, staff, or user' }) }),
  }),

  updateUser: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(50, 'Name must be less than 50 characters').optional(),
    email: z.string().email('Please enter a valid email address').optional(),
    role: z.enum(['admin', 'staff', 'user'], { errorMap: () => ({ message: 'Role must be admin, staff, or user' }) }).optional(),
    isActive: z.boolean().optional(),
  }),
};

// 🎯 UPDATED: Better validation middleware
exports.validate = (schemaName) => {
  return (req, res, next) => {
    try {
      schemas[schemaName].parse(req.body);
      next();
    } catch (error) {
      // Format Zod errors into user-friendly messages
      const formattedErrors = error.errors.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      }));

      // Create a single readable error message
      const errorMessage = formattedErrors.map(err => err.message).join(', ');

      return res.status(400).json({
        success: false,
        message: errorMessage, // User-friendly combined message
        errors: formattedErrors, // Detailed errors for frontend
      });
    }
  };
};