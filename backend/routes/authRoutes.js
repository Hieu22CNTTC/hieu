import express from 'express';
import {
  register,
  login,
  refreshToken,
  getCurrentUser,
  logout,
  forgotPassword,
  resetPassword,
  approvePasswordReset
} from '../controllers/authController.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  registerSchema,
  loginSchema,
  refreshTokenSchema,
  forgotPasswordSchema,
  resetPasswordSchema
} from '../validators/authValidator.js';

const router = express.Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), register);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), login);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post('/refresh', validate(refreshTokenSchema), refreshToken);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user info
 * @access  Private
 */
router.get('/me', authenticate, getCurrentUser);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authenticate, logout);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post('/forgot-password', validate(forgotPasswordSchema), forgotPassword);

/**
 * @route   GET /api/auth/approve-reset/:approvalToken
 * @desc    Admin approves password reset request
 * @access  Public (but only admin has the link)
 */
router.get('/approve-reset/:approvalToken', approvePasswordReset);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post('/reset-password', validate(resetPasswordSchema), resetPassword);

export default router;
