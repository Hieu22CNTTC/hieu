import { PrismaClient } from '@prisma/client';
import asyncHandler from '../utils/asyncHandler.js';
import { ApiError } from '../middleware/errorHandler.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Aircraft seat configurations
const AIRCRAFT_CONFIGS = {
  'Boeing 747-400': {
    totalSeats: 540,
    business: { seats: 140, rows: '1-14', seatsPerRow: 10 },
    economy: { seats: 400, rows: '15-54', seatsPerRow: 10 }
  },
  'Boeing 777': {
    totalSeats: 368,
    business: { seats: 68, rows: '1-8', seatsPerRow: 8 },
    economy: { seats: 300, rows: '10-47', seatsPerRow: 8 }
  },
  'Airbus A321': {
    totalSeats: 184,
    business: { seats: 16, rows: '10-12', seatsPerRow: 4 },
    economy: { seats: 168, rows: '14-38', seatsPerRow: 6 }
  },
  'Airbus A350-900': {
    totalSeats: 305,
    business: { seats: 29, rows: '1-8', seatsPerRow: 4 },
    economy: { seats: 276, rows: '10-45', seatsPerRow: 9 }
  },
  'Boeing 787-9': {
    totalSeats: 280,
    business: { seats: 28, rows: '1-7', seatsPerRow: 4 },
    economy: { seats: 252, rows: '10-41', seatsPerRow: 9 }
  }
};

// Generate seat layout based on aircraft model
const generateSeatLayout = (aircraftModel) => {
  const config = AIRCRAFT_CONFIGS[aircraftModel];
  if (!config) throw new Error('Unknown aircraft model');

  const seats = [];
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  // Business class
  const businessRows = config.business.rows.split('-').map(Number);
  for (let row = businessRows[0]; row <= businessRows[1]; row++) {
    for (let i = 0; i < config.business.seatsPerRow; i++) {
      seats.push({
        seatNumber: `${row}${letters[i]}`,
        class: 'BUSINESS',
        row: row,
        column: letters[i]
      });
    }
  }

  // Economy class
  const economyRows = config.economy.rows.split('-').map(Number);
  for (let row = economyRows[0]; row <= economyRows[1]; row++) {
    for (let i = 0; i < config.economy.seatsPerRow; i++) {
      seats.push({
        seatNumber: `${row}${letters[i]}`,
        class: 'ECONOMY',
        row: row,
        column: letters[i]
      });
    }
  }

  return seats;
};

/**
 * Get seat map for a flight
 * GET /api/seats/:flightId
 */
export const getFlightSeatMap = asyncHandler(async (req, res) => {
  const { flightId } = req.params;

  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      aircraft: true,
      bookings: {
        where: {
          status: { in: ['PENDING', 'CONFIRMED'] }
        },
        include: {
          passengers: {
            select: {
              seatNumber: true,
              ticketClass: true
            }
          }
        }
      }
    }
  });

  if (!flight) {
    throw new ApiError(404, 'Flight not found');
  }

  // Generate seat layout
  const allSeats = generateSeatLayout(flight.aircraft.model);

  // Get occupied seats from bookings
  const occupiedSeats = new Set();
  flight.bookings.forEach(booking => {
    booking.passengers.forEach(passenger => {
      if (passenger.seatNumber) {
        occupiedSeats.add(passenger.seatNumber);
      }
    });
  });

  // Get held seats (not expired)
  const heldSeats = await prisma.seatHold.findMany({
    where: {
      flightId,
      expiresAt: { gt: new Date() }
    },
    select: {
      seatNumber: true,
      bookingId: true,
      heldBy: true,
      expiresAt: true
    }
  });

  // Map seat status
  const seatMap = allSeats.map(seat => {
    const isOccupied = occupiedSeats.has(seat.seatNumber);
    const hold = heldSeats.find(h => h.seatNumber === seat.seatNumber);

    return {
      ...seat,
      status: isOccupied ? 'occupied' : hold ? 'held' : 'available',
      heldBy: hold?.heldBy,
      heldUntil: hold?.expiresAt,
      bookingId: hold?.bookingId
    };
  });

  res.json({
    success: true,
    data: {
      flightId,
      aircraftModel: flight.aircraft.model,
      config: AIRCRAFT_CONFIGS[flight.aircraft.model],
      seats: seatMap
    }
  });
});

/**
 * Hold seats temporarily (5 minutes)
 * POST /api/seats/hold
 */
export const holdSeats = asyncHandler(async (req, res) => {
  const { flightId, seatNumbers, bookingCode } = req.body;
  const userId = req.user?.id;

  // Validate booking
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      flight: { include: { aircraft: true } },
      passengers: true
    }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.flightId !== flightId) {
    throw new ApiError(400, 'Booking does not match flight');
  }

  if (booking.status !== 'PENDING' && booking.status !== 'CONFIRMED') {
    throw new ApiError(400, 'Cannot select seats for this booking status');
  }

  // Validate seat count matches passengers
  if (seatNumbers.length !== booking.passengers.length) {
    throw new ApiError(400, `Must select ${booking.passengers.length} seats for ${booking.passengers.length} passengers`);
  }

  // Check if seats are available
  const existingHolds = await prisma.seatHold.findMany({
    where: {
      flightId,
      seatNumber: { in: seatNumbers },
      expiresAt: { gt: new Date() }
    }
  });

  if (existingHolds.length > 0) {
    throw new ApiError(400, 'One or more seats are already held');
  }

  // Check if seats are already booked
  const occupiedSeats = await prisma.bookingPassenger.findMany({
    where: {
      booking: {
        flightId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      seatNumber: { in: seatNumbers }
    }
  });

  if (occupiedSeats.length > 0) {
    throw new ApiError(400, 'One or more seats are already occupied');
  }

  // Create seat holds (5 minutes)
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // Delete old holds for this booking
  await prisma.seatHold.deleteMany({
    where: { bookingId: booking.id }
  });

  // Create new holds
  const holds = await Promise.all(
    seatNumbers.map(async (seatNumber, index) => {
      const passenger = booking.passengers[index];
      return prisma.seatHold.create({
        data: {
          flightId,
          seatNumber,
          ticketClass: passenger.ticketClass,
          bookingId: booking.id,
          heldBy: userId,
          expiresAt
        }
      });
    })
  );

  logger.info(`Seats held for booking ${bookingCode}: ${seatNumbers.join(', ')}`);

  res.json({
    success: true,
    message: 'Seats held successfully',
    data: {
      holds,
      expiresAt
    }
  });
});

/**
 * Confirm seat selection
 * POST /api/seats/confirm
 */
export const confirmSeats = asyncHandler(async (req, res) => {
  const { bookingCode } = req.body;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      passengers: true
    }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Get held seats
  const holds = await prisma.seatHold.findMany({
    where: {
      bookingId: booking.id,
      expiresAt: { gt: new Date() }
    }
  });

  if (holds.length === 0) {
    throw new ApiError(400, 'No seats held for this booking');
  }

  if (holds.length !== booking.passengers.length) {
    throw new ApiError(400, 'Seat count mismatch');
  }

  // Assign seats to passengers
  await Promise.all(
    holds.map(async (hold, index) => {
      await prisma.bookingPassenger.update({
        where: { id: booking.passengers[index].id },
        data: { seatNumber: hold.seatNumber }
      });
    })
  );

  // Delete holds
  await prisma.seatHold.deleteMany({
    where: { bookingId: booking.id }
  });

  logger.info(`Seats confirmed for booking ${bookingCode}`);

  res.json({
    success: true,
    message: 'Seats confirmed successfully',
    data: {
      bookingCode,
      seats: holds.map(h => h.seatNumber)
    }
  });
});

/**
 * Release expired seat holds (cron job)
 * DELETE /api/seats/release-expired
 */
export const releaseExpiredHolds = asyncHandler(async (req, res) => {
  const result = await prisma.seatHold.deleteMany({
    where: {
      expiresAt: { lt: new Date() }
    }
  });

  logger.info(`Released ${result.count} expired seat holds`);

  res.json({
    success: true,
    message: `Released ${result.count} expired holds`
  });
});

/**
 * Cancel seat selection
 * DELETE /api/seats/cancel/:bookingCode
 */
export const cancelSeatSelection = asyncHandler(async (req, res) => {
  const { bookingCode } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { bookingCode }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  await prisma.seatHold.deleteMany({
    where: { bookingId: booking.id }
  });

  logger.info(`Seat holds cancelled for booking ${bookingCode}`);

  res.json({
    success: true,
    message: 'Seat selection cancelled'
  });
});
