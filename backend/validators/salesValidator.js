import { z } from 'zod';

/**
 * Get all bookings validation schema
 */
export const getAllBookingsSchema = {
  query: z.object({
    status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED'])
      .optional(),
    flightId: z.string()
      .optional(),
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    search: z.string()
      .optional(), // Search by booking code or passenger name
    page: z.string()
      .regex(/^\d+$/, 'Page must be a number')
      .transform(Number)
      .optional(),
    limit: z.string()
      .regex(/^\d+$/, 'Limit must be a number')
      .transform(Number)
      .optional(),
    sortBy: z.enum(['createdAt', 'departureTime', 'finalAmount'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
  })
};

/**
 * Reject booking validation schema
 */
export const rejectBookingSchema = {
  params: z.object({
    id: z.string()
      .min(1, 'Booking ID is required')
  }),
  body: z.object({
    rejectionReason: z.string()
      .min(10, 'Rejection reason must be at least 10 characters')
      .max(500, 'Rejection reason must not exceed 500 characters')
  })
};

/**
 * Statistics validation schema
 */
export const statisticsSchema = {
  query: z.object({
    startDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    endDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional()
  })
};
