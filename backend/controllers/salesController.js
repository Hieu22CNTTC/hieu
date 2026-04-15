import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

/**
 * Get all bookings with filters and pagination
 * GET /api/sales/bookings
 */
export const getAllBookings = asyncHandler(async (req, res) => {
  const {
    status,
    flightId,
    startDate,
    endDate,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build where clause
  const where = {};

  if (status) {
    where.status = status;
  }

  if (flightId) {
    where.flightId = flightId;
  }

  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      where.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      where.createdAt.lt = endDateTime;
    }
  }

  // Search by booking code or passenger name
  if (search) {
    where.OR = [
      {
        bookingCode: {
          contains: search.toUpperCase()
        }
      },
      {
        contactEmail: {
          contains: search,
          mode: 'insensitive'
        }
      },
      {
        passengers: {
          some: {
            fullName: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      }
    ];
  }

  // Calculate pagination
  const skip = (page - 1) * limit;

  // Get total count
  const total = await prisma.booking.count({ where });

  // Get bookings
  const bookings = await prisma.booking.findMany({
    where,
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
      payments: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true
        }
      }
    },
    orderBy: {
      [sortBy]: sortOrder
    },
    skip,
    take: limit
  });

  res.json({
    success: true,
    data: bookings,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

/**
 * Get booking details by ID
 * GET /api/sales/bookings/:id
 */
export const getBookingById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id },
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
      payments: true,
      user: {
        select: {
          id: true,
          email: true,
          fullName: true,
          phoneNumber: true
        }
      }
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
 * Reject booking with reason
 * PUT /api/sales/bookings/:id/reject
 */
export const rejectBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { rejectionReason } = req.body;

  // Get booking with flight and seat inventory
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      flight: {
        include: {
          seatInventories: true
        }
      },
      passengers: true
    }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  // Check if booking can be rejected
  if (booking.status === 'CANCELLED') {
    throw new ApiError(400, 'Booking is already cancelled');
  }

  if (booking.status === 'REJECTED') {
    throw new ApiError(400, 'Booking is already rejected');
  }

  if (booking.status === 'COMPLETED') {
    throw new ApiError(400, 'Cannot reject completed booking');
  }

  // Update booking and restore seat inventory in transaction
  const updatedBooking = await prisma.$transaction(async (tx) => {
    // Update booking status
    const updated = await tx.booking.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason
      }
    });

    // Restore seat inventory
    const seatInventory = booking.flight.seatInventories.find(
      s => s.seatClass === booking.seatClass
    );

    if (seatInventory) {
      await tx.seatInventory.update({
        where: { id: seatInventory.id },
        data: {
          availableSeats: {
            increment: booking.passengers.length
          },
          bookedSeats: {
            decrement: booking.passengers.length
          }
        }
      });
    }

    return updated;
  });

  logger.info(`Booking rejected by ${req.user.email}: ${booking.bookingCode} - Reason: ${rejectionReason}`);

  res.json({
    success: true,
    message: 'Booking rejected successfully',
    data: updatedBooking
  });
});

/**
 * Confirm booking
 * PUT /api/sales/bookings/:id/confirm
 */
export const confirmBooking = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const booking = await prisma.booking.findUnique({
    where: { id }
  });

  if (!booking) {
    throw new ApiError(404, 'Booking not found');
  }

  if (booking.status !== 'PENDING') {
    throw new ApiError(400, `Cannot confirm booking with status: ${booking.status}`);
  }

  const updatedBooking = await prisma.booking.update({
    where: { id },
    data: {
      status: 'CONFIRMED'
    },
    include: {
      flight: true,
      passengers: true
    }
  });

  logger.info(`Booking confirmed by ${req.user.email}: ${booking.bookingCode}`);

  res.json({
    success: true,
    message: 'Booking confirmed successfully',
    data: updatedBooking
  });
});

/**
 * Get booking statistics
 * GET /api/sales/statistics
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Build date filter
  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      dateFilter.createdAt.lt = endDateTime;
    }
  }

  // Get booking counts by status
  const bookingsByStatus = await prisma.booking.groupBy({
    by: ['status'],
    where: dateFilter,
    _count: {
      id: true
    }
  });

  // Get total revenue
  const confirmedBookings = await prisma.booking.aggregate({
    where: {
      ...dateFilter,
      status: 'CONFIRMED'
    },
    _sum: {
      finalAmount: true
    },
    _count: {
      id: true
    }
  });

  // Get pending revenue
  const pendingBookings = await prisma.booking.aggregate({
    where: {
      ...dateFilter,
      status: 'PENDING'
    },
    _sum: {
      finalAmount: true
    },
    _count: {
      id: true
    }
  });

  // Get popular routes
  const popularRoutes = await prisma.booking.groupBy({
    by: ['flightId'],
    where: {
      ...dateFilter,
      status: {
        in: ['CONFIRMED', 'COMPLETED']
      }
    },
    _count: {
      id: true
    },
    orderBy: {
      _count: {
        id: 'desc'
      }
    },
    take: 5
  });

  // Get flight details for popular routes
  const flightIds = popularRoutes.map(r => r.flightId);
  const flights = await prisma.flight.findMany({
    where: {
      id: {
        in: flightIds
      }
    },
    include: {
      route: {
        include: {
          originAirport: true,
          destinationAirport: true
        }
      }
    }
  });

  const popularRoutesWithDetails = popularRoutes.map(r => {
    const flight = flights.find(f => f.id === r.flightId);
    return {
      flightNumber: flight?.flightNumber,
      route: flight ? `${flight.route.originAirport.city} → ${flight.route.destinationAirport.city}` : 'Unknown',
      bookings: r._count.id
    };
  });

  // Get bookings trend (last 7 days if no date filter)
  let trendData = [];
  if (!startDate && !endDate) {
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      last7Days.push(date);
    }

    trendData = await Promise.all(
      last7Days.map(async (date) => {
        const nextDay = new Date(date);
        nextDay.setDate(nextDay.getDate() + 1);

        const count = await prisma.booking.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDay
            }
          }
        });

        return {
          date: date.toISOString().split('T')[0],
          bookings: count
        };
      })
    );
  }

  res.json({
    success: true,
    data: {
      bookingsByStatus: bookingsByStatus.reduce((acc, item) => {
        acc[item.status] = item._count.id;
        return acc;
      }, {}),
      revenue: {
        confirmed: confirmedBookings._sum.finalAmount || 0,
        pending: pendingBookings._sum.finalAmount || 0,
        total: (confirmedBookings._sum.finalAmount || 0) + (pendingBookings._sum.finalAmount || 0)
      },
      bookingCounts: {
        confirmed: confirmedBookings._count.id,
        pending: pendingBookings._count.id
      },
      popularRoutes: popularRoutesWithDetails,
      trend: trendData
    }
  });
});

/**
 * Get daily revenue report
 * GET /api/sales/revenue
 */
export const getRevenue = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  const dateFilter = {};
  if (startDate || endDate) {
    dateFilter.createdAt = {};
    if (startDate) {
      dateFilter.createdAt.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      dateFilter.createdAt.lt = endDateTime;
    }
  }

  // Get revenue by date
  const bookings = await prisma.booking.findMany({
    where: {
      ...dateFilter,
      status: {
        in: ['CONFIRMED', 'COMPLETED']
      }
    },
    select: {
      createdAt: true,
      finalAmount: true,
      status: true
    }
  });

  // Group by date
  const revenueByDate = bookings.reduce((acc, booking) => {
    const date = booking.createdAt.toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = {
        date,
        revenue: 0,
        bookings: 0
      };
    }
    acc[date].revenue += booking.finalAmount;
    acc[date].bookings += 1;
    return acc;
  }, {});

  const result = Object.values(revenueByDate).sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  res.json({
    success: true,
    data: result,
    summary: {
      totalRevenue: bookings.reduce((sum, b) => sum + b.finalAmount, 0),
      totalBookings: bookings.length,
      averageBookingValue: bookings.length > 0 
        ? bookings.reduce((sum, b) => sum + b.finalAmount, 0) / bookings.length 
        : 0
    }
  });
});
