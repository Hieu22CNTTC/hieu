import express from 'express';
import {
  searchFlights,
  getPublicFlightById,
  createPublicBooking,
  checkBooking,
  getBookingTicket,
  getTicketTypes,
  getAirports,
  validateCoupon
} from '../controllers/publicController.js';
import validate from '../middleware/validate.js';
import { optionalAuth } from '../middleware/auth.js';
import {
  searchFlightsSchema,
  createPublicBookingSchema,
  checkBookingSchema
} from '../validators/publicValidator.js';

const router = express.Router();

/**
 * @route   GET /api/public/flights
 * @desc    Search available flights
 * @access  Public
 */
router.get('/flights', validate(searchFlightsSchema), searchFlights);
router.get('/flights/:id', getPublicFlightById);

/**
 * @route   POST /api/public/bookings
 * @desc    Create booking without login (but will link to user if logged in)
 * @access  Public
 */
router.post('/bookings', optionalAuth, validate(createPublicBookingSchema), createPublicBooking);

/**
 * @route   GET /api/public/bookings/:bookingCode
 * @desc    Check booking by code
 * @access  Public
 */
router.get('/bookings/:bookingCode', validate(checkBookingSchema), checkBooking);

/**
 * @route   GET /api/public/bookings/:bookingCode/ticket
 * @desc    Download ticket PDF
 * @access  Public
 */
router.get('/bookings/:bookingCode/ticket', validate(checkBookingSchema), getBookingTicket);

/**
 * @route   GET /api/public/ticket-types
 * @desc    Get available ticket types
 * @access  Public
 */
router.get('/ticket-types', getTicketTypes);

/**
 * @route   GET /api/public/airports
 * @desc    Get list of airports
 * @access  Public
 */
router.get('/airports', getAirports);

/**
 * @route   POST /api/public/coupons/validate
 * @desc    Validate coupon code
 * @access  Public
 */
router.post('/coupons/validate', validateCoupon);

export default router;
