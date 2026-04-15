import { nanoid } from 'nanoid';
import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

/**
 * Search flights
 * GET /api/public/flights
 */
export const searchFlights = asyncHandler(async (req, res) => {
  const { 
    originAirportId, 
    destinationAirportId, 
    departureDate,
    minPrice,
    maxPrice,
    sortBy = 'departureTime',
    sortOrder = 'asc'
  } = req.query;

  // Build where clause
  const where = {};

  // Filter by route if airports specified
  if (originAirportId || destinationAirportId) {
    where.route = {};
    if (originAirportId) {
      where.route.departureId = originAirportId;
    }
    if (destinationAirportId) {
      where.route.arrivalId = destinationAirportId;
    }
  }

  // Filter by departure date
  if (departureDate) {
    const date = new Date(departureDate);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);
    
    where.departureTime = {
      gte: date,
      lt: nextDay
    };
  } else {
    // Only show future flights
    where.departureTime = {
      gte: new Date()
    };
  }

  // Get flights
  const flights = await prisma.flight.findMany({
    where,
    include: {
      route: {
        include: {
          departure: true,
          arrival: true
        }
      },
      aircraft: true,
      seatInventory: true
    },
    orderBy: {
      [sortBy === 'basePrice' ? 'basePrice' : 'departureTime']: sortOrder
    }
  });

  // Calculate available seats and filter by price
  const availableFlights = flights
    .map(flight => {
      const economySeats = flight.seatInventory.find(s => s.ticketClass === 'ECONOMY');
      const businessSeats = flight.seatInventory.find(s => s.ticketClass === 'BUSINESS');

      return {
        id: flight.id,
        flightNumber: flight.flightNumber,
        departureTime: flight.departureTime,
        arrivalTime: flight.arrivalTime,
        basePrice: flight.basePrice,
        businessPrice: flight.businessPrice,
        economyAvailable: economySeats?.availableSeats || 0,
        businessAvailable: businessSeats?.availableSeats || 0,
        origin: {
          id: flight.route.departure.id,
          code: flight.route.departure.code,
          name: flight.route.departure.name,
          city: flight.route.departure.city
        },
        destination: {
          id: flight.route.arrival.id,
          code: flight.route.arrival.code,
          name: flight.route.arrival.name,
          city: flight.route.arrival.city
        },
        duration: flight.route.duration,
        distance: flight.route.distance,
        aircraft: {
          model: flight.aircraft.model,
          totalSeats: flight.aircraft.totalSeats
        }
      };
    })
    .filter(flight => {
      // Filter by price range
      if (minPrice && flight.basePrice < minPrice) return false;
      if (maxPrice && flight.basePrice > maxPrice) return false;
      
      // Only show flights with available seats
      return flight.economyAvailable > 0 || flight.businessAvailable > 0;
    });

  res.json({
    success: true,
    data: availableFlights,
    count: availableFlights.length
  });
});

/**
 * Create public booking (no login required)
 * POST /api/public/bookings
 */
export const createPublicBooking = asyncHandler(async (req, res) => {
  const { 
    flightId, 
    contactEmail, 
    contactPhone, 
    passengers, 
    seatClass,
    couponCode,
    notes 
  } = req.body;

  // Verify flight exists and has available seats
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      route: true,
      seatInventory: true
    }
  });

  if (!flight) {
    throw new ApiError(404, 'Flight not found');
  }

  if (!flight.isActive) {
    throw new ApiError(400, 'Flight is not available for booking');
  }

  // Check if flight is in the future
  if (flight.departureTime < new Date()) {
    throw new ApiError(400, 'Cannot book past flights');
  }

  // Check seat availability
  const seatInventory = flight.seatInventory.find(s => s.ticketClass === seatClass);
  if (!seatInventory || seatInventory.availableSeats < passengers.length) {
    throw new ApiError(400, `Not enough ${seatClass} seats available`);
  }

  // Verify coupon if provided
  let coupon = null;
  if (couponCode) {
    coupon = await prisma.coupon.findUnique({
      where: { code: couponCode }
    });

    if (!coupon || !coupon.isActive) {
      throw new ApiError(400, 'Invalid coupon code');
    }

    const now = new Date();
    if (coupon.validFrom > now || coupon.validTo < now) {
      throw new ApiError(400, 'Coupon is not valid at this time');
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      throw new ApiError(400, 'Coupon usage limit exceeded');
    }
  }

  // Calculate total price
  let totalAmount = 0;
  const passengerDetails = [];
  
  // Determine base price from flight based on seat class
  const basePrice = seatClass === 'ECONOMY' ? flight.basePrice : flight.businessPrice;

  for (const passenger of passengers) {
    // Get ticket type for pricing
    const ticketType = await prisma.ticketType.findUnique({
      where: { id: passenger.ticketTypeId }
    });

    if (!ticketType) {
      throw new ApiError(400, `Invalid ticket type: ${passenger.ticketTypeId}`);
    }

    // Calculate passenger price
    const passengerPrice = basePrice * (ticketType.pricePercentage / 100);
    totalAmount += passengerPrice;

    passengerDetails.push({
      ...passenger,
      ticketPrice: passengerPrice
    });
  }

  // Apply coupon discount
  let discountAmount = 0;
  if (coupon) {
    // Calculate discount based on percentage
    discountAmount = (totalAmount * coupon.discountPercent) / 100;
    // Apply max discount limit if exists
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  }

  const finalAmount = totalAmount - discountAmount;

  // Generate unique booking code
  const bookingCode = nanoid(8).toUpperCase();
  
  // Set booking expiration (24 hours from now)
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  // IMPORTANT: Only set userId if user is actually logged in and verified
  // req.user is only set by optionalAuth if token is valid and user is active
  const userId = req.user?.id || null;
  
  // Log for debugging
  logger.info(`Creating booking - User ID: ${userId ? userId : 'Guest (no login)'}, Email: ${contactEmail}`);

  // Create booking with passengers in a transaction
  const booking = await prisma.$transaction(async (tx) => {
    // Create booking
    const newBooking = await tx.booking.create({
      data: {
        bookingCode,
        flightId,
        userId,
        contactEmail,
        contactPhone,
        totalAmount: finalAmount,
        status: 'PENDING',
        expiresAt
      }
    });

    // Create passengers
    await tx.bookingPassenger.createMany({
      data: passengerDetails.map(p => ({
        bookingId: newBooking.id,
        fullName: p.fullName,
        dateOfBirth: new Date(p.dateOfBirth),
        ticketTypeId: p.ticketTypeId,
        ticketClass: seatClass,
        priceAmount: p.ticketPrice,
        seatNumber: null // Will be assigned later
      }))
    });

    // Update seat inventory
    await tx.seatInventory.update({
      where: { id: seatInventory.id },
      data: {
        availableSeats: {
          decrement: passengers.length
        },
        bookedSeats: {
          increment: passengers.length
        }
      }
    });

    // Update coupon usage
    if (coupon) {
      await tx.coupon.update({
        where: { id: coupon.id },
        data: {
          usedCount: {
            increment: 1
          }
        }
      });
    }

    return newBooking;
  });

  logger.info(`Public booking created: ${bookingCode} for flight ${flight.flightNumber}`);

  // Return booking with details
  const bookingWithDetails = await prisma.booking.findUnique({
    where: { id: booking.id },
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
      }
    }
  });

  res.status(201).json({
    success: true,
    message: 'Booking created successfully',
    data: {
      bookingCode: booking.bookingCode,
      booking: bookingWithDetails
    }
  });
});

/**
 * Check booking by code
 * GET /api/public/bookings/:bookingCode
 */
export const checkBooking = asyncHandler(async (req, res) => {
  const { bookingCode } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: bookingCode.toUpperCase() },
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
 * Get booking ticket (PDF) - placeholder for now
 * GET /api/public/bookings/:bookingCode/ticket
 */
export const getBookingTicket = asyncHandler(async (req, res) => {
  const { bookingCode } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode: bookingCode.toUpperCase() },
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
      }
    }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Check if booking is confirmed
  if (booking.status !== 'CONFIRMED') {
    throw new ApiError(400, 'Ticket can only be downloaded for confirmed bookings');
  }

  // TODO: Generate PDF with PDFKit and QR code
  // For now, return JSON data
  res.json({
    success: true,
    message: 'PDF generation will be implemented with PDFKit',
    data: {
      bookingCode: booking.bookingCode,
      flight: {
        number: booking.flight.flightNumber,
        departure: {
          airport: booking.flight.route.departure.name,
          city: booking.flight.route.departure.city,
          time: booking.flight.departureTime
        },
        arrival: {
          airport: booking.flight.route.arrival.name,
          city: booking.flight.route.arrival.city,
          time: booking.flight.arrivalTime
        }
      },
      passengers: booking.passengers.map(p => ({
        name: p.fullName,
        ticketType: p.ticketType.name,
        seatNumber: p.seatNumber,
        price: p.ticketPrice
      })),
      totalAmount: booking.finalAmount
    }
  });
});

/**
 * Get available ticket types
 * GET /api/public/ticket-types
 */
export const getTicketTypes = asyncHandler(async (req, res) => {
  const ticketTypes = await prisma.ticketType.findMany({
    orderBy: { pricePercentage: 'desc' }
  });

  res.json({
    success: true,
    data: ticketTypes
  });
});

/**
 * Get airports list
 * GET /api/public/airports
 */
export const getAirports = asyncHandler(async (req, res) => {
  const airports = await prisma.airport.findMany({
    orderBy: { city: 'asc' }
  });

  res.json({
    success: true,
    data: airports,
    count: airports.length
  });
});

/**
 * Validate coupon code
 * POST /api/public/coupons/validate
 */
export const validateCoupon = asyncHandler(async (req, res) => {
  const { couponCode } = req.body;

  const coupon = await prisma.coupon.findUnique({
    where: { code: couponCode.toUpperCase() }
  });

  if (!coupon) {
    throw new ApiError(404, 'Coupon not found');
  }

  if (!coupon.isActive) {
    throw new ApiError(400, 'Coupon is not active');
  }

  const now = new Date();
  if (coupon.validFrom > now || coupon.validTo < now) {
    throw new ApiError(400, 'Coupon is not valid at this time');
  }

  if (coupon.usedCount >= coupon.usageLimit) {
    throw new ApiError(400, 'Coupon usage limit exceeded');
  }

  res.json({
    success: true,
    message: 'Coupon is valid',
    data: {
      code: coupon.code,
      discountPercent: coupon.discountPercent,
      maxDiscount: coupon.maxDiscount,
      validFrom: coupon.validFrom,
      validTo: coupon.validTo,
      remainingUsage: coupon.usageLimit - coupon.usedCount
    }
  });
});
