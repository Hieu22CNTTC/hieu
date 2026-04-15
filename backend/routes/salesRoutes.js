import express from 'express';
import {
  getAllBookings,
  getBookingById,
  rejectBooking,
  confirmBooking,
  getStatistics,
  getRevenue
} from '../controllers/salesController.js';
import { authenticate, requireSales } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import {
  getAllBookingsSchema,
  rejectBookingSchema,
  statisticsSchema
} from '../validators/salesValidator.js';

const router = express.Router();

// All routes require authentication and SALES role (or higher)
router.use(authenticate);
router.use(requireSales);

/**
 * @route   GET /api/sales/bookings
 * @desc    Get all bookings with filters and pagination
 * @access  Private (SALES, MANAGER, ADMIN)
 */
router.get('/bookings', validate(getAllBookingsSchema), getAllBookings);

/**
 * @route   GET /api/sales/bookings/:id
 * @desc    Get booking details by ID
 * @access  Private (SALES, MANAGER, ADMIN)
 */
router.get('/bookings/:id', getBookingById);

/**
 * @route   PUT /api/sales/bookings/:id/reject
 * @desc    Reject booking with reason
 * @access  Private (SALES, MANAGER, ADMIN)
 */
router.put('/bookings/:id/reject', validate(rejectBookingSchema), rejectBooking);

/**
 * @route   PUT /api/sales/bookings/:id/confirm
 * @desc    Confirm booking
 * @access  Private (SALES, MANAGER, ADMIN)
 */
router.put('/bookings/:id/confirm', confirmBooking);

/**
 * @route   GET /api/sales/statistics
 * @desc    Get booking statistics
 * @access  Private (SALES, MANAGER, ADMIN)
 */
router.get('/statistics', validate(statisticsSchema), getStatistics);

/**
 * @route   GET /api/sales/revenue
 * @desc    Get daily revenue report
 * @access  Private (SALES, MANAGER, ADMIN)
 */
router.get('/revenue', validate(statisticsSchema), getRevenue);

export default router;
