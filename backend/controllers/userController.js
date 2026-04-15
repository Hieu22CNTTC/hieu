import bcrypt from 'bcrypt';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

/**
 * Get user profile
 * GET /api/users/profile
 */
export const getProfile = asyncHandler(async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  res.json({
    success: true,
    data: user
  });
});

/**
 * Update user profile
 * PUT /api/users/profile
 */
export const updateProfile = asyncHandler(async (req, res) => {
  const { fullName, phoneNumber } = req.body;

  // Build update data (only include provided fields)
  const updateData = {};
  if (fullName !== undefined) updateData.fullName = fullName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;

  const user = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true,
      lastLoginAt: true
    }
  });

  logger.info(`User profile updated: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: user
  });
});

/**
 * Change password
 * PUT /api/users/password
 */
export const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  // Get user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id }
  });

  if (!user) {
    throw new ApiError(404, 'User not found');
  }

  // Verify current password
  const isPasswordValid = await bcrypt.compare(currentPassword, user.password);

  if (!isPasswordValid) {
    throw new ApiError(401, 'Current password is incorrect');
  }

  // Check if new password is same as current
  const isSamePassword = await bcrypt.compare(newPassword, user.password);
  if (isSamePassword) {
    throw new ApiError(400, 'New password must be different from current password');
  }

  // Hash new password
  const hashedPassword = await bcrypt.hash(newPassword, 10);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { password: hashedPassword }
  });

  logger.info(`Password changed for user: ${req.user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully'
  });
});

/**
 * Get all bookings for current user
 * GET /api/users/bookings
 */
export const getMyBookings = asyncHandler(async (req, res) => {
  const bookings = await prisma.booking.findMany({
    where: { userId: req.user.id },
    include: {
      flight: {
        include: {
          route: {
            include: {
              departure: true,
              arrival: true
            }
          }
        }
      },
      passengers: {
        include: {
          ticketType: true
        }
      },
      payments: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    data: bookings,
    count: bookings.length
  });
});

/**
 * Get booking by ID (must belong to user)
 * GET /api/users/bookings/:id
 */
export const getMyBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    include: {
      flight: {
        include: {
          route: {
            include: {
              departure: true,
              arrival: true
            }
          },
          aircraft: true
        }
      },
      passengers: {
        include: {
          ticketType: true
        }
      },
      payments: true
    }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  res.json({
    success: true,
    data: booking
  });
});

/**
 * Cancel booking (user can only cancel PENDING bookings)
 * PUT /api/users/bookings/:id/cancel
 */
export const cancelBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Find booking
  const booking = await prisma.booking.findFirst({
    where: {
      id,
      userId: req.user.id
    },
    include: {
      flight: true,
      payments: true
    }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Check if booking can be cancelled
  if (booking.status !== 'PENDING') {
    throw new ApiError(400, `Cannot cancel booking with status: ${booking.status}`);
  }

  // Check if flight has already departed
  const now = new Date();
  if (booking.flight.departureTime < now) {
    throw new ApiError(400, 'Cannot cancel booking for past flights');
  }

  // Update booking status
  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: { 
      status: 'CANCELLED',
      rejectionReason: 'Cancelled by user'
    }
  });

  logger.info(`Booking cancelled by user: ${booking.bookingCode}`);

  res.json({
    success: true,
    message: 'Booking cancelled successfully',
    data: updatedBooking
  });
});
