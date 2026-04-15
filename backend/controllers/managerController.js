import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';

// ==================== ROUTES MANAGEMENT ====================

/**
 * Get all routes with filters and pagination
 * GET /api/manager/routes
 */
export const getAllRoutes = asyncHandler(async (req, res) => {
  const {
    departureId,
    arrivalId,
    isActive,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build where clause
  const where = {};
  
  if (departureId) {
    where.departureId = departureId;
  }
  
  if (arrivalId) {
    where.arrivalId = arrivalId;
  }
  
  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get routes with related data
  const [routes, total] = await Promise.all([
    prisma.route.findMany({
      where,
      include: {
        departure: {
          select: {
            id: true,
            code: true,
            name: true,
            city: true,
            country: true
          }
        },
        arrival: {
          select: {
            id: true,
            code: true,
            name: true,
            city: true,
            country: true
          }
        },
        _count: {
          select: {
            flights: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take
    }),
    prisma.route.count({ where })
  ]);

  // Format response
  const formattedRoutes = routes.map(route => ({
    id: route.id,
    departure: route.departure,
    arrival: route.arrival,
    distance: route.distance,
    duration: route.duration,
    standardPrice: route.standardPrice,
    isActive: route.isActive,
    flightCount: route._count.flights,
    createdAt: route.createdAt,
    updatedAt: route.updatedAt
  }));

  res.json({
    success: true,
    data: {
      routes: formattedRoutes,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * Get route details by ID
 * GET /api/manager/routes/:id
 */
export const getRouteById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      departure: true,
      arrival: true,
      flights: {
        select: {
          id: true,
          flightNumber: true,
          departureTime: true,
          arrivalTime: true,
          basePrice: true,
          businessPrice: true
        },
        orderBy: {
          departureTime: 'asc'
        },
        take: 10 // Limit to next 10 flights
      }
    }
  });

  if (!route) {
    throw new ApiError('Route not found', 404);
  }

  res.json({
    success: true,
    data: route
  });
});

/**
 * Create new route
 * POST /api/manager/routes
 */
export const createRoute = asyncHandler(async (req, res) => {
  const { departureId, arrivalId, distance, duration, standardPrice } = req.body;

  // Check if both airports exist
  const [departureAirport, arrivalAirport] = await Promise.all([
    prisma.airport.findUnique({ where: { id: departureId } }),
    prisma.airport.findUnique({ where: { id: arrivalId } })
  ]);

  if (!departureAirport) {
    throw new ApiError('Departure airport not found', 404);
  }

  if (!arrivalAirport) {
    throw new ApiError('Arrival airport not found', 404);
  }

  // Check if route already exists
  const existingRoute = await prisma.route.findFirst({
    where: {
      departureId,
      arrivalId
    }
  });

  if (existingRoute) {
    throw new ApiError('Route already exists between these airports', 409);
  }

  // Create route
  const route = await prisma.route.create({
    data: {
      departureId,
      arrivalId,
      distance: distance || null,
      duration: duration || null,
      standardPrice: standardPrice || null,
      isActive: true
    },
    include: {
      departure: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true
        }
      },
      arrival: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true
        }
      }
    }
  });

  logger.info(`Route created: ${route.departure.code} -> ${route.arrival.code} by manager ${req.user.id}`);

  res.status(201).json({
    success: true,
    data: route,
    message: 'Route created successfully'
  });
});

/**
 * Update route
 * PUT /api/manager/routes/:id
 */
export const updateRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { distance, duration, standardPrice, isActive } = req.body;

  // Check if route exists
  const existingRoute = await prisma.route.findUnique({
    where: { id },
    include: {
      flights: {
        where: {
          departureTime: {
            gte: new Date()
          }
        }
      }
    }
  });

  if (!existingRoute) {
    throw new ApiError('Route not found', 404);
  }

  // If deactivating, check for active flights
  if (isActive === false && existingRoute.flights.length > 0) {
    throw new ApiError(
      `Cannot deactivate route with ${existingRoute.flights.length} active flight(s)`,
      422
    );
  }

  // Update route
  const updatedRoute = await prisma.route.update({
    where: { id },
    data: {
      ...(distance !== undefined && { distance }),
      ...(duration !== undefined && { duration }),
      ...(standardPrice !== undefined && { standardPrice }),
      ...(isActive !== undefined && { isActive })
    },
    include: {
      departure: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true
        }
      },
      arrival: {
        select: {
          id: true,
          code: true,
          name: true,
          city: true
        }
      }
    }
  });

  logger.info(`Route updated: ${id} by manager ${req.user.id}`);

  res.json({
    success: true,
    data: updatedRoute,
    message: 'Route updated successfully'
  });
});

/**
 * Delete route
 * DELETE /api/manager/routes/:id
 */
export const deleteRoute = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if route exists and has flights
  const route = await prisma.route.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          flights: true
        }
      }
    }
  });

  if (!route) {
    throw new ApiError('Route not found', 404);
  }

  if (route._count.flights > 0) {
    throw new ApiError(
      `Cannot delete route with ${route._count.flights} existing flight(s). Deactivate instead.`,
      422
    );
  }

  // Delete route
  await prisma.route.delete({
    where: { id }
  });

  logger.info(`Route deleted: ${id} by manager ${req.user.id}`);

  res.json({
    success: true,
    message: 'Route deleted successfully'
  });
});

// ==================== FLIGHTS MANAGEMENT ====================

/**
 * Get all flights with filters and pagination
 * GET /api/manager/flights
 */
export const getAllFlights = asyncHandler(async (req, res) => {
  const {
    routeId,
    aircraftId,
    flightNumber,
    startDate,
    endDate,
    page = 1,
    limit = 20,
    sortBy = 'departureTime',
    sortOrder = 'asc'
  } = req.query;

  // Build where clause
  const where = {};

  if (routeId) {
    where.routeId = routeId;
  }

  if (aircraftId) {
    where.aircraftId = aircraftId;
  }

  if (flightNumber) {
    where.flightNumber = {
      contains: flightNumber
    };
  }

  if (startDate || endDate) {
    where.departureTime = {};
    if (startDate) {
      where.departureTime.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      where.departureTime.lt = endDateTime;
    }
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get flights with related data
  const [flights, total] = await Promise.all([
    prisma.flight.findMany({
      where,
      include: {
        route: {
          include: {
            departure: {
              select: {
                code: true,
                city: true
              }
            },
            arrival: {
              select: {
                code: true,
                city: true
              }
            }
          }
        },
        aircraft: {
          select: {
            id: true,
            model: true,
            totalSeats: true,
            businessSeats: true,
            economySeats: true
          }
        },
        seatInventory: {
          select: {
            ticketClass: true,
            availableSeats: true,
            bookedSeats: true
          }
        },
        promotion: {
          select: {
            id: true,
            code: true,
            discountPercent: true
          }
        },
        _count: {
          select: {
            bookings: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take
    }),
    prisma.flight.count({ where })
  ]);

  // Format response with available seats
  const formattedFlights = flights.map(flight => {
    const availableSeats = {
      economy: flight.seatInventory.find(s => s.ticketClass === 'ECONOMY')?.availableSeats || 0,
      business: flight.seatInventory.find(s => s.ticketClass === 'BUSINESS')?.availableSeats || 0
    };

    return {
      id: flight.id,
      flightNumber: flight.flightNumber,
      route: flight.route,
      aircraft: flight.aircraft,
      departureTime: flight.departureTime,
      arrivalTime: flight.arrivalTime,
      basePrice: flight.basePrice,
      businessPrice: flight.businessPrice,
      availableSeats,
      totalBookings: flight._count.bookings,
      promotion: flight.promotion,
      notes: flight.notes
    };
  });

  res.json({
    success: true,
    data: {
      flights: formattedFlights,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages: Math.ceil(total / parseInt(limit))
      }
    }
  });
});

/**
 * Get flight details by ID
 * GET /api/manager/flights/:id
 */
export const getFlightById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const flight = await prisma.flight.findUnique({
    where: { id },
    include: {
      route: {
        include: {
          departure: true,
          arrival: true
        }
      },
      aircraft: true,
      seatInventory: {
        select: {
          id: true,
          ticketClass: true,
          availableSeats: true,
          bookedSeats: true
        }
      },
      bookings: {
        select: {
          id: true,
          bookingCode: true,
          status: true,
          totalAmount: true,
          _count: {
            select: {
              passengers: true
            }
          }
        }
      },
      promotion: true
    }
  });

  if (!flight) {
    throw new ApiError('Flight not found', 404);
  }

  // Calculate sold seats
  const formattedFlight = {
    ...flight,
    seatInventory: flight.seatInventory.map(inv => ({
      ...inv,
      totalSeats: inv.availableSeats + inv.bookedSeats,
      soldSeats: inv.bookedSeats
    })),
    bookings: flight.bookings.map(booking => ({
      ...booking,
      passengerCount: booking._count.passengers
    }))
  };

  res.json({
    success: true,
    data: formattedFlight
  });
});

/**
 * Create new flight
 * POST /api/manager/flights
 */
export const createFlight = asyncHandler(async (req, res) => {
  const {
    flightNumber,
    routeId,
    aircraftId,
    departureTime,
    arrivalTime,
    basePrice,
    businessPrice,
    promotionId,
    notes
  } = req.body;

  // Validate flight number format (2 letters + 3-4 digits)
  const flightNumberRegex = /^[A-Z]{2}\d{3,4}$/;
  if (!flightNumberRegex.test(flightNumber)) {
    throw new ApiError('Invalid flight number format. Use format: VN101', 400);
  }

  // Check if flight number already exists
  const existingFlight = await prisma.flight.findUnique({
    where: { flightNumber }
  });

  if (existingFlight) {
    throw new ApiError('Flight number already exists', 409);
  }

  // Validate route and aircraft exist
  const [route, aircraft] = await Promise.all([
    prisma.route.findUnique({ where: { id: routeId } }),
    prisma.aircraft.findUnique({ where: { id: aircraftId } })
  ]);

  if (!route) {
    throw new ApiError('Route not found', 404);
  }

  if (!aircraft) {
    throw new ApiError('Aircraft not found', 404);
  }

  // Validate departure time is in the future
  const depTime = new Date(departureTime);
  const arrTime = new Date(arrivalTime);
  const now = new Date();

  if (depTime <= now) {
    throw new ApiError('Departure time must be in the future', 400);
  }

  if (arrTime <= depTime) {
    throw new ApiError('Arrival time must be after departure time', 400);
  }

  // Check for aircraft scheduling conflicts
  const conflictingFlights = await prisma.flight.findFirst({
    where: {
      aircraftId,
      OR: [
        {
          AND: [
            { departureTime: { lte: depTime } },
            { arrivalTime: { gte: depTime } }
          ]
        },
        {
          AND: [
            { departureTime: { lte: arrTime } },
            { arrivalTime: { gte: arrTime } }
          ]
        },
        {
          AND: [
            { departureTime: { gte: depTime } },
            { arrivalTime: { lte: arrTime } }
          ]
        }
      ]
    }
  });

  if (conflictingFlights) {
    throw new ApiError(
      `Aircraft already scheduled for flight ${conflictingFlights.flightNumber} at this time`,
      409
    );
  }

  // Validate promotion if provided
  if (promotionId) {
    const promotion = await prisma.coupon.findUnique({
      where: { id: promotionId }
    });

    if (!promotion) {
      throw new ApiError('Promotion not found', 404);
    }
  }

  // Create flight with seat inventory in a transaction
  const flight = await prisma.$transaction(async (tx) => {
    // Create flight
    const newFlight = await tx.flight.create({
      data: {
        flightNumber,
        routeId,
        aircraftId,
        departureTime: depTime,
        arrivalTime: arrTime,
        basePrice,
        businessPrice,
        promotionId: promotionId || null,
        notes: notes || null
      }
    });

    // Create seat inventory based on aircraft capacity
    await tx.seatInventory.createMany({
      data: [
        {
          flightId: newFlight.id,
          ticketClass: 'ECONOMY',
          availableSeats: aircraft.economySeats,
          bookedSeats: 0
        },
        {
          flightId: newFlight.id,
          ticketClass: 'BUSINESS',
          availableSeats: aircraft.businessSeats,
          bookedSeats: 0
        }
      ]
    });

    return newFlight;
  });

  // Fetch complete flight data
  const completeFlightData = await prisma.flight.findUnique({
    where: { id: flight.id },
    include: {
      route: {
        include: {
          departure: true,
          arrival: true
        }
      },
      aircraft: true,
      seatInventory: true,
      promotion: true
    }
  });

  logger.info(`Flight created: ${flightNumber} by manager ${req.user.id}`);

  res.status(201).json({
    success: true,
    data: completeFlightData,
    message: 'Flight created successfully'
  });
});

/**
 * Update flight
 * PUT /api/manager/flights/:id
 */
export const updateFlight = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    departureTime,
    arrivalTime,
    basePrice,
    businessPrice,
    promotionId,
    notes
  } = req.body;

  // Check if flight exists
  const existingFlight = await prisma.flight.findUnique({
    where: { id },
    include: {
      bookings: {
        where: {
          status: 'CONFIRMED'
        }
      }
    }
  });

  if (!existingFlight) {
    throw new ApiError('Flight not found', 404);
  }

  // Validate time changes
  if (departureTime || arrivalTime) {
    const depTime = departureTime ? new Date(departureTime) : existingFlight.departureTime;
    const arrTime = arrivalTime ? new Date(arrivalTime) : existingFlight.arrivalTime;
    const now = new Date();

    if (depTime <= now) {
      throw new ApiError('Departure time must be in the future', 400);
    }

    if (arrTime <= depTime) {
      throw new ApiError('Arrival time must be after departure time', 400);
    }
  }

  // If increasing prices with confirmed bookings, warn but allow
  if (existingFlight.bookings.length > 0) {
    if (basePrice && basePrice > existingFlight.basePrice) {
      logger.warn(`Flight ${existingFlight.flightNumber} price increased with ${existingFlight.bookings.length} confirmed booking(s)`);
    }
  }

  // Validate promotion if provided
  if (promotionId) {
    const promotion = await prisma.coupon.findUnique({
      where: { id: promotionId }
    });

    if (!promotion) {
      throw new ApiError('Promotion not found', 404);
    }
  }

  // Update flight
  const updatedFlight = await prisma.flight.update({
    where: { id },
    data: {
      ...(departureTime && { departureTime: new Date(departureTime) }),
      ...(arrivalTime && { arrivalTime: new Date(arrivalTime) }),
      ...(basePrice !== undefined && { basePrice }),
      ...(businessPrice !== undefined && { businessPrice }),
      ...(promotionId !== undefined && { promotionId: promotionId || null }),
      ...(notes !== undefined && { notes })
    },
    include: {
      route: {
        include: {
          departure: true,
          arrival: true
        }
      },
      aircraft: true,
      promotion: true
    }
  });

  logger.info(`Flight updated: ${id} by manager ${req.user.id}`);

  res.json({
    success: true,
    data: updatedFlight,
    message: 'Flight updated successfully'
  });
});

/**
 * Delete flight
 * DELETE /api/manager/flights/:id
 */
export const deleteFlight = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if flight exists and has bookings
  const flight = await prisma.flight.findUnique({
    where: { id },
    include: {
      bookings: {
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        }
      }
    }
  });

  if (!flight) {
    throw new ApiError('Flight not found', 404);
  }

  if (flight.bookings.length > 0) {
    throw new ApiError(
      `Cannot delete flight with ${flight.bookings.length} active booking(s). Cancel bookings first.`,
      422
    );
  }

  // Check if departure is more than 24 hours away
  const hoursUntilDeparture = (new Date(flight.departureTime) - new Date()) / (1000 * 60 * 60);
  if (hoursUntilDeparture < 24) {
    throw new ApiError('Cannot delete flight less than 24 hours before departure', 422);
  }

  // Delete flight (cascade will delete seat inventory)
  await prisma.flight.delete({
    where: { id }
  });

  logger.info(`Flight deleted: ${flight.flightNumber} by manager ${req.user.id}`);

  res.json({
    success: true,
    message: 'Flight deleted successfully'
  });
});

// ==================== TICKET TYPES MANAGEMENT ====================

/**
 * Get all ticket types
 * GET /api/manager/ticket-types
 */
export const getAllTicketTypes = asyncHandler(async (req, res) => {
  const ticketTypes = await prisma.ticketType.findMany({
    orderBy: {
      pricePercentage: 'desc'
    }
  });

  res.json({
    success: true,
    data: ticketTypes
  });
});

/**
 * Get ticket type by ID
 * GET /api/manager/ticket-types/:id
 */
export const getTicketTypeById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const ticketType = await prisma.ticketType.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          bookingPassengers: true
        }
      }
    }
  });

  if (!ticketType) {
    throw new ApiError('Ticket type not found', 404);
  }

  // Get usage statistics
  const usageStats = await prisma.bookingPassenger.aggregate({
    where: {
      ticketTypeId: id
    },
    _sum: {
      price: true
    }
  });

  const response = {
    ...ticketType,
    usageStats: {
      totalBookings: ticketType._count.bookingPassengers,
      totalRevenue: usageStats._sum.price || 0
    }
  };

  res.json({
    success: true,
    data: response
  });
});

/**
 * Create new ticket type
 * POST /api/manager/ticket-types
 */
export const createTicketType = asyncHandler(async (req, res) => {
  const { name, pricePercentage, minAge, maxAge, description } = req.body;

  // Check if ticket type name already exists
  const existingType = await prisma.ticketType.findUnique({
    where: { name }
  });

  if (existingType) {
    throw new ApiError('Ticket type with this name already exists', 409);
  }

  // Create ticket type
  const ticketType = await prisma.ticketType.create({
    data: {
      name,
      pricePercentage,
      minAge: minAge || null,
      maxAge: maxAge || null,
      description: description || null
    }
  });

  logger.info(`Ticket type created: ${name} by manager ${req.user.id}`);

  res.status(201).json({
    success: true,
    data: ticketType,
    message: 'Ticket type created successfully'
  });
});

/**
 * Update ticket type
 * PUT /api/manager/ticket-types/:id
 */
export const updateTicketType = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { pricePercentage, minAge, maxAge, description } = req.body;

  // Check if ticket type exists
  const existingType = await prisma.ticketType.findUnique({
    where: { id }
  });

  if (!existingType) {
    throw new ApiError('Ticket type not found', 404);
  }

  // Update ticket type
  const ticketType = await prisma.ticketType.update({
    where: { id },
    data: {
      ...(pricePercentage !== undefined && { pricePercentage }),
      ...(minAge !== undefined && { minAge }),
      ...(maxAge !== undefined && { maxAge }),
      ...(description !== undefined && { description })
    }
  });

  logger.info(`Ticket type updated: ${id} by manager ${req.user.id}`);

  res.json({
    success: true,
    data: ticketType,
    message: 'Ticket type updated successfully'
  });
});

// ==================== SEAT INVENTORY MANAGEMENT ====================

/**
 * Get seat inventory for a flight
 * GET /api/manager/flights/:flightId/seats
 */
export const getFlightSeatInventory = asyncHandler(async (req, res) => {
  const { flightId } = req.params;

  // Check if flight exists
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      aircraft: {
        select: {
          model: true,
          totalSeats: true
        }
      },
      seatInventory: true
    }
  });

  if (!flight) {
    throw new ApiError('Flight not found', 404);
  }

  // Calculate utilization
  const inventory = flight.seatInventory.map(inv => {
    const totalSeats = inv.availableSeats + inv.bookedSeats;
    const soldSeats = inv.bookedSeats;
    return {
      id: inv.id,
      ticketClass: inv.ticketClass,
      totalSeats,
      availableSeats: inv.availableSeats,
      soldSeats,
      utilizationRate: totalSeats > 0 ? ((soldSeats / totalSeats) * 100).toFixed(2) : '0.00'
    };
  });

  res.json({
    success: true,
    data: {
      flightId: flight.id,
      flightNumber: flight.flightNumber,
      aircraft: flight.aircraft,
      inventory
    }
  });
});

/**
 * Update seat inventory
 * PUT /api/manager/flights/:flightId/seats
 */
export const updateFlightSeatInventory = asyncHandler(async (req, res) => {
  const { flightId } = req.params;
  const { inventory } = req.body;

  // Check if flight exists
  const flight = await prisma.flight.findUnique({
    where: { id: flightId },
    include: {
      aircraft: true,
      seatInventory: true
    }
  });

  if (!flight) {
    throw new ApiError('Flight not found', 404);
  }

  // Validate inventory updates
  for (const update of inventory) {
    const existingInv = flight.seatInventory.find(
      inv => inv.ticketClass === update.ticketClass
    );

    if (!existingInv) {
      throw new ApiError(`Invalid ticket class: ${update.ticketClass}`, 400);
    }

    const soldSeats = existingInv.bookedSeats;

    if (update.availableSeats < 0) {
      throw new ApiError(
        `Available seats cannot be negative for ${update.ticketClass}`,
        400
      );
    }

    const maxSeats = update.ticketClass === 'ECONOMY' 
      ? flight.aircraft.economySeats 
      : flight.aircraft.businessSeats;

    if (update.availableSeats + soldSeats > maxSeats) {
      throw new ApiError(
        `Total seats for ${update.ticketClass} cannot exceed aircraft capacity of ${maxSeats}`,
        400
      );
    }
  }

  // Update seat inventory
  const updates = inventory.map(update => {
    const existingInv = flight.seatInventory.find(
      inv => inv.ticketClass === update.ticketClass
    );

    return prisma.seatInventory.update({
      where: { id: existingInv.id },
      data: {
        availableSeats: update.availableSeats
      }
    });
  });

  const updatedInventory = await Promise.all(updates);

  logger.info(`Seat inventory updated for flight ${flightId} by manager ${req.user.id}`);

  res.json({
    success: true,
    data: {
      flightId,
      inventory: updatedInventory.map(inv => ({
        ticketClass: inv.ticketClass,
        totalSeats: inv.availableSeats + inv.bookedSeats,
        availableSeats: inv.availableSeats,
        soldSeats: inv.bookedSeats
      }))
    },
    message: 'Seat inventory updated successfully'
  });
});

// ==================== STATISTICS & REPORTS ====================

/**
 * Get route performance statistics
 * GET /api/manager/statistics/routes
 */
export const getRouteStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, routeId } = req.query;

  // Build filters
  const flightWhere = {};
  
  if (startDate || endDate) {
    flightWhere.departureTime = {};
    if (startDate) {
      flightWhere.departureTime.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      flightWhere.departureTime.lt = endDateTime;
    }
  }

  if (routeId) {
    flightWhere.routeId = routeId;
  }

  // Get all flights with bookings
  const flights = await prisma.flight.findMany({
    where: flightWhere,
    include: {
      route: {
        include: {
          departure: { select: { code: true } },
          arrival: { select: { code: true } }
        }
      },
      bookings: {
        where: {
          status: 'CONFIRMED'
        },
        select: {
          totalAmount: true
        }
      },
      aircraft: {
        select: {
          totalSeats: true
        }
      },
      seatInventory: {
        select: {
          availableSeats: true,
          bookedSeats: true
        }
      }
    }
  });

  // Group by route
  const routeStats = {};
  
  flights.forEach(flight => {
    const routeKey = flight.routeId;
    
    if (!routeStats[routeKey]) {
      routeStats[routeKey] = {
        routeId: flight.routeId,
        departure: flight.route.departure.code,
        arrival: flight.route.arrival.code,
        totalFlights: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalSeats: 0,
        soldSeats: 0,
        prices: []
      };
    }

    const stats = routeStats[routeKey];
    stats.totalFlights++;
    stats.totalBookings += flight.bookings.length;
    stats.totalRevenue += flight.bookings.reduce((sum, b) => sum + b.totalAmount, 0);
    
    const flightTotalSeats = flight.seatInventory.reduce(
      (sum, inv) => sum + inv.availableSeats + inv.bookedSeats, 
      0
    );
    const flightSoldSeats = flight.seatInventory.reduce(
      (sum, inv) => sum + inv.bookedSeats, 
      0
    );
    
    stats.totalSeats += flightTotalSeats;
    stats.soldSeats += flightSoldSeats;
    stats.prices.push(flight.basePrice);
  });

  // Calculate averages
  const routeArray = Object.values(routeStats).map(stats => ({
    routeId: stats.routeId,
    departure: stats.departure,
    arrival: stats.arrival,
    totalFlights: stats.totalFlights,
    totalBookings: stats.totalBookings,
    totalRevenue: stats.totalRevenue,
    avgOccupancyRate: stats.totalSeats > 0 
      ? parseFloat((stats.soldSeats / stats.totalSeats * 100).toFixed(2))
      : 0,
    avgPrice: stats.prices.length > 0
      ? parseFloat((stats.prices.reduce((a, b) => a + b, 0) / stats.prices.length).toFixed(2))
      : 0
  }));

  // Calculate summary
  const summary = {
    totalRoutes: routeArray.length,
    totalFlights: routeArray.reduce((sum, r) => sum + r.totalFlights, 0),
    totalRevenue: routeArray.reduce((sum, r) => sum + r.totalRevenue, 0),
    avgOccupancyRate: routeArray.length > 0
      ? parseFloat((routeArray.reduce((sum, r) => sum + r.avgOccupancyRate, 0) / routeArray.length).toFixed(2))
      : 0
  };

  res.json({
    success: true,
    data: {
      routes: routeArray,
      summary
    }
  });
});

/**
 * Get flight statistics
 * GET /api/manager/statistics/flights
 */
export const getFlightStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, routeId, groupBy = 'day' } = req.query;

  // Build filters
  const where = {};
  
  if (startDate || endDate) {
    where.departureTime = {};
    if (startDate) {
      where.departureTime.gte = new Date(startDate);
    }
    if (endDate) {
      const endDateTime = new Date(endDate);
      endDateTime.setDate(endDateTime.getDate() + 1);
      where.departureTime.lt = endDateTime;
    }
  }

  if (routeId) {
    where.routeId = routeId;
  }

  // Get flights
  const flights = await prisma.flight.findMany({
    where,
    include: {
      bookings: {
        where: {
          status: 'CONFIRMED'
        },
        select: {
          totalAmount: true
        }
      },
      seatInventory: {
        select: {
          availableSeats: true,
          bookedSeats: true
        }
      }
    },
    orderBy: {
      departureTime: 'asc'
    }
  });

  // Group by time period
  const grouped = {};
  
  flights.forEach(flight => {
    const date = new Date(flight.departureTime);
    let key;

    if (groupBy === 'day') {
      key = date.toISOString().split('T')[0];
    } else if (groupBy === 'week') {
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay());
      key = weekStart.toISOString().split('T')[0];
    } else if (groupBy === 'month') {
      key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    }

    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        totalFlights: 0,
        totalBookings: 0,
        totalRevenue: 0,
        totalSeats: 0,
        soldSeats: 0,
        cancelledFlights: 0
      };
    }

    const stats = grouped[key];
    stats.totalFlights++;
    stats.totalBookings += flight.bookings.length;
    stats.totalRevenue += flight.bookings.reduce((sum, b) => sum + b.totalAmount, 0);

    const flightTotalSeats = flight.seatInventory.reduce(
      (sum, inv) => sum + inv.availableSeats + inv.bookedSeats, 
      0
    );
    const flightSoldSeats = flight.seatInventory.reduce(
      (sum, inv) => sum + inv.bookedSeats,
      0
    );

    stats.totalSeats += flightTotalSeats;
    stats.soldSeats += flightSoldSeats;
  });

  // Format results
  const flightStats = Object.values(grouped).map(stats => ({
    ...stats,
    avgOccupancyRate: stats.totalSeats > 0
      ? parseFloat((stats.soldSeats / stats.totalSeats * 100).toFixed(2))
      : 0
  }));

  // Calculate summary
  const summary = {
    totalFlights: flightStats.reduce((sum, s) => sum + s.totalFlights, 0),
    totalBookings: flightStats.reduce((sum, s) => sum + s.totalBookings, 0),
    totalRevenue: flightStats.reduce((sum, s) => sum + s.totalRevenue, 0),
    avgOccupancyRate: flightStats.length > 0
      ? parseFloat((flightStats.reduce((sum, s) => sum + s.avgOccupancyRate, 0) / flightStats.length).toFixed(2))
      : 0
  };

  res.json({
    success: true,
    data: {
      flights: flightStats,
      summary
    }
  });
});


