import express from 'express';
import {
  getProfile,
  updateProfile,
  changePassword,
  getMyBookings,
  getMyBookingById,
  cancelBooking
} from '../controllers/userController.js';
import { authenticate } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  changePasswordSchema,
  updateProfileSchema
} from '../validators/authValidator.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/users/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get('/profile', getProfile);

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', validate(updateProfileSchema), updateProfile);

/**
 * @route   PUT /api/users/password
 * @desc    Change password
 * @access  Private
 */
router.put('/password', validate(changePasswordSchema), changePassword);

/**
 * @route   GET /api/users/bookings
 * @desc    Get all bookings for current user
 * @access  Private
 */
router.get('/bookings', getMyBookings);

/**
 * @route   GET /api/users/bookings/:id
 * @desc    Get booking by ID
 * @access  Private
 */
router.get('/bookings/:id', getMyBookingById);

/**
 * @route   PUT /api/users/bookings/:id/cancel
 * @desc    Cancel booking
 * @access  Private
 */
router.put('/bookings/:id/cancel', cancelBooking);

export default router;
