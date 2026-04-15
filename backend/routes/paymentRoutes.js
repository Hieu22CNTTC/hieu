import express from 'express';
import { 
  createMoMoPayment, 
  handleMoMoCallback, 
  handleMoMoReturn,
  checkPaymentStatus 
} from '../controllers/paymentController.js';
import { optionalAuth } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { body, param } from 'express-validator';

const router = express.Router();

/**
 * @route   POST /api/payments/momo/callback
 * @desc    Handle MoMo IPN callback
 * @access  Public (MoMo server)
 */
router.post('/momo/callback', handleMoMoCallback);

/**
 * @route   GET /api/payments/momo/return
 * @desc    Handle MoMo return URL
 * @access  Public (User redirect)
 */
router.get('/momo/return', handleMoMoReturn);

/**
 * @route   POST /api/payments/momo
 * @desc    Create MoMo payment
 * @access  Public (with optional auth)
 */
router.post(
  '/momo',
  optionalAuth,
  [
    body('bookingId')
      .notEmpty()
      .withMessage('Booking ID is required')
      .isString()
      .withMessage('Booking ID must be a string')
  ],
  validateRequest,
  createMoMoPayment
);

/**
 * @route   GET /api/payments/status/:bookingId
 * @desc    Check payment status for a booking
 * @access  Public
 */
router.get(
  '/status/:bookingId',
  [
    param('bookingId')
      .notEmpty()
      .withMessage('Booking ID is required')
      .isString()
      .withMessage('Booking ID must be a string')
  ],
  validateRequest,
  checkPaymentStatus
);

export default router;
