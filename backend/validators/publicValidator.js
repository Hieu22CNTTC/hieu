import { z } from 'zod';

/**
 * Search flights validation schema
 */
export const searchFlightsSchema = {
  query: z.object({
    originAirportId: z.string()
      .min(1, 'Origin airport is required')
      .optional(),
    destinationAirportId: z.string()
      .min(1, 'Destination airport is required')
      .optional(),
    departureDate: z.string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
      .optional(),
    minPrice: z.string()
      .regex(/^\d+$/, 'Min price must be a number')
      .transform(Number)
      .optional(),
    maxPrice: z.string()
      .regex(/^\d+$/, 'Max price must be a number')
      .transform(Number)
      .optional(),
    sortBy: z.enum(['price', 'departureTime', 'duration'])
      .optional(),
    sortOrder: z.enum(['asc', 'desc'])
      .optional()
  })
};

/**
 * Create public booking validation schema
 */
export const createPublicBookingSchema = {
  body: z.object({
    flightId: z.string()
      .min(1, 'Flight ID is required'),
    contactEmail: z.string()
      .email('Invalid email format')
      .toLowerCase()
      .trim(),
    contactPhone: z.string()
      .regex(/^[0-9]{10,11}$/, 'Phone number must be 10-11 digits'),
    passengers: z.array(
      z.object({
        fullName: z.string()
          .min(2, 'Full name must be at least 2 characters')
          .max(100, 'Full name must not exceed 100 characters')
          .trim(),
        dateOfBirth: z.string()
          .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
        gender: z.enum(['Male', 'Female', 'Other']).optional(),
        nationality: z.string().optional(),
        idNumber: z.string()
          .min(9, 'ID number must be at least 9 characters')
          .max(20, 'ID number must not exceed 20 characters')
          .trim(),
        ticketTypeId: z.string()
          .min(1, 'Ticket type is required')
      })
    ).min(1, 'At least one passenger is required')
    .max(10, 'Maximum 10 passengers per booking'),
    seatClass: z.enum(['ECONOMY', 'BUSINESS'], {
      errorMap: () => ({ message: 'Seat class must be ECONOMY or BUSINESS' })
    }),
    couponCode: z.string()
      .optional()
      .nullable(),
    notes: z.string()
      .max(500, 'Notes must not exceed 500 characters')
      .optional()
      .nullable()
  })
};

/**
 * Check booking by code validation schema
 */
export const checkBookingSchema = {
  params: z.object({
    bookingCode: z.string()
      .length(8, 'Booking code must be 8 characters')
      .toUpperCase()
  })
};
