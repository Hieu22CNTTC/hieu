import { z } from 'zod';

/**
 * Registration validation schema
 */
export const registerSchema = {
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must not exceed 50 characters'),
    fullName: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim(),
    phoneNumber: z.string()
      .min(1, 'Phone number is required')
      .regex(/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits')
  })
};

/**
 * Login validation schema
 */
export const loginSchema = {
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    password: z.string()
      .min(1, 'Password is required')
  })
};

/**
 * Refresh token validation schema
 */
export const refreshTokenSchema = {
  body: z.object({
    refreshToken: z.string()
      .min(1, 'Refresh token is required')
  })
};

/**
 * Change password validation schema
 */
export const changePasswordSchema = {
  body: z.object({
    currentPassword: z.string()
      .min(1, 'Current password is required'),
    newPassword: z.string()
      .min(6, 'New password must be at least 6 characters')
      .max(50, 'New password must not exceed 50 characters')
  })
};

/**
 * Forgot password validation schema
 */
export const forgotPasswordSchema = {
  body: z.object({
    email: z.string()
      .email('Invalid email format')
      .toLowerCase()
      .trim()
  })
};

/**
 * Reset password validation schema
 */
export const resetPasswordSchema = {
  body: z.object({
    token: z.string()
      .min(1, 'Reset token is required'),
    newPassword: z.string()
      .min(6, 'Password must be at least 6 characters')
      .max(50, 'Password must not exceed 50 characters')
  })
};

/**
 * Update profile validation schema
 */
export const updateProfileSchema = {
  body: z.object({
    fullName: z.string()
      .min(2, 'Full name must be at least 2 characters')
      .max(100, 'Full name must not exceed 100 characters')
      .trim()
      .optional(),
    phoneNumber: z.string()
      .regex(/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits')
      .optional()
      .nullable(),
    address: z.string()
      .max(200, 'Address must not exceed 200 characters')
      .optional()
      .nullable()
  })
};
