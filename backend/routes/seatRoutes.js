import express from 'express';
import {
  getFlightSeatMap,
  holdSeats,
  confirmSeats,
  releaseExpiredHolds,
  cancelSeatSelection
} from '../controllers/seatController.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

/**
 * @route   GET /api/seats/:flightId
 * @desc    Get seat map for a flight
 * @access  Public
 */
router.get('/:flightId', getFlightSeatMap);

/**
 * @route   POST /api/seats/hold
 * @desc    Hold seats temporarily (5 minutes)
 * @access  Private/Public
 */
router.post('/hold', optionalAuth, holdSeats);

/**
 * @route   POST /api/seats/confirm
 * @desc    Confirm seat selection
 * @access  Private/Public
 */
router.post('/confirm', optionalAuth, confirmSeats);

/**
 * @route   DELETE /api/seats/release-expired
 * @desc    Release expired seat holds (cron job)
 * @access  Private (Admin)
 */
router.delete('/release-expired', authenticate, releaseExpiredHolds);

/**
 * @route   DELETE /api/seats/cancel/:bookingCode
 * @desc    Cancel seat selection
 * @access  Private/Public
 */
router.delete('/cancel/:bookingCode', optionalAuth, cancelSeatSelection);

export default router;
