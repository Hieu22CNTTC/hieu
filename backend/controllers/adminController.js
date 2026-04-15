import prisma from '../config/database.js';
import { ApiError } from '../middleware/errorHandler.js';
import asyncHandler from '../utils/asyncHandler.js';
import logger from '../utils/logger.js';
import bcrypt from 'bcrypt';

// ==================== AIRPORTS MANAGEMENT ====================

/**
 * Get all airports with filters and pagination
 * GET /api/admin/airports
 */
export const getAllAirports = asyncHandler(async (req, res) => {
  const {
    city,
    country,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build where clause
  const where = {};

  if (city) {
    where.city = {
      contains: city
    };
  }

  if (country) {
    where.country = {
      contains: country
    };
  }

  if (search) {
    where.OR = [
      { code: { contains: search } },
      { name: { contains: search } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get airports with counts
  const [airports, total] = await Promise.all([
    prisma.airport.findMany({
      where,
      include: {
        _count: {
          select: {
            departureRoutes: true,
            arrivalRoutes: true
          }
        }
      },
      orderBy: {
        [sortBy]: sortOrder
      },
      skip,
      take
    }),
    prisma.airport.count({ where })
  ]);

  // Format response
  const formattedAirports = airports.map(airport => ({
    id: airport.id,
    code: airport.code,
    name: airport.name,
    city: airport.city,
    country: airport.country,
    timezone: airport.timezone,
    routeCount: airport._count.departureRoutes + airport._count.arrivalRoutes,
    createdAt: airport.createdAt,
    updatedAt: airport.updatedAt
  }));

  res.json({
    success: true,
    data: {
      airports: formattedAirports,
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
 * Get airport by ID
 * GET /api/admin/airports/:id
 */
export const getAirportById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const airport = await prisma.airport.findUnique({
    where: { id },
    include: {
      departureRoutes: {
        include: {
          arrival: {
            select: {
              code: true,
              name: true,
              city: true
            }
          },
          _count: {
            select: {
              flights: true
            }
          }
        }
      },
      arrivalRoutes: {
        include: {
          departure: {
            select: {
              code: true,
              name: true,
              city: true
            }
          },
          _count: {
            select: {
              flights: true
            }
          }
        }
      }
    }
  });

  if (!airport) {
    throw new ApiError('Airport not found', 404);
  }

  // Format routes
  const formattedAirport = {
    ...airport,
    departureRoutes: airport.departureRoutes.map(route => ({
      id: route.id,
      arrival: route.arrival,
      distance: route.distance,
      flightCount: route._count.flights
    })),
    arrivalRoutes: airport.arrivalRoutes.map(route => ({
      id: route.id,
      departure: route.departure,
      distance: route.distance,
      flightCount: route._count.flights
    }))
  };

  res.json({
    success: true,
    data: formattedAirport
  });
});

/**
 * Create new airport
 * POST /api/admin/airports
 */
export const createAirport = asyncHandler(async (req, res) => {
  const { code, name, city, country, timezone } = req.body;

  // Check if airport code already exists
  const existingAirport = await prisma.airport.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existingAirport) {
    throw new ApiError('Airport code already exists', 409);
  }

  // Create airport
  const airport = await prisma.airport.create({
    data: {
      code: code.toUpperCase(),
      name,
      city,
      country,
      timezone: timezone || 'Asia/Ho_Chi_Minh'
    }
  });

  logger.info(`Airport created: ${code} by admin ${req.user.id}`);

  res.status(201).json({
    success: true,
    data: airport,
    message: 'Airport created successfully'
  });
});

/**
 * Update airport
 * PUT /api/admin/airports/:id
 */
export const updateAirport = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, city, country, timezone } = req.body;

  // Check if airport exists
  const existingAirport = await prisma.airport.findUnique({
    where: { id }
  });

  if (!existingAirport) {
    throw new ApiError('Airport not found', 404);
  }

  // Update airport (code is immutable)
  const airport = await prisma.airport.update({
    where: { id },
    data: {
      ...(name && { name }),
      ...(city && { city }),
      ...(country && { country }),
      ...(timezone && { timezone })
    }
  });

  logger.info(`Airport updated: ${id} by admin ${req.user.id}`);

  res.json({
    success: true,
    data: airport,
    message: 'Airport updated successfully'
  });
});

/**
 * Delete airport
 * DELETE /api/admin/airports/:id
 */
export const deleteAirport = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if airport exists and has routes
  const airport = await prisma.airport.findUnique({
    where: { id },
    include: {
      _count: {
        select: {
          departureRoutes: true,
          arrivalRoutes: true
        }
      }
    }
  });

  if (!airport) {
    throw new ApiError('Airport not found', 404);
  }

  const totalRoutes = airport._count.departureRoutes + airport._count.arrivalRoutes;

  if (totalRoutes > 0) {
    throw new ApiError(
      `Cannot delete airport with ${totalRoutes} existing route(s)`,
      422
    );
  }

  // Delete airport
  await prisma.airport.delete({
    where: { id }
  });

  logger.info(`Airport deleted: ${airport.code} by admin ${req.user.id}`);

  res.json({
    success: true,
    message: 'Airport deleted successfully'
  });
});

// ==================== AIRCRAFT MANAGEMENT ====================

/**
 * Get all aircraft with pagination
 * GET /api/admin/aircraft
 */
export const getAllAircraft = asyncHandler(async (req, res) => {
  const {
    model,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build where clause
  const where = {};

  if (model) {
    where.model = {
      contains: model
    };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get aircraft with counts
  const [aircraft, total] = await Promise.all([
    prisma.aircraft.findMany({
      where,
      include: {
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
    prisma.aircraft.count({ where })
  ]);

  // Format response
  const formattedAircraft = aircraft.map(ac => ({
    id: ac.id,
    model: ac.model,
    totalSeats: ac.totalSeats,
    businessSeats: ac.businessSeats,
    economySeats: ac.economySeats,
    flightCount: ac._count.flights,
    createdAt: ac.createdAt,
    updatedAt: ac.updatedAt
  }));

  res.json({
    success: true,
    data: {
      aircrafts: formattedAircraft,
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
 * Get aircraft by ID
 * GET /api/admin/aircraft/:id
 */
export const getAircraftById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const aircraft = await prisma.aircraft.findUnique({
    where: { id },
    include: {
      flights: {
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
          }
        },
        orderBy: {
          departureTime: 'asc'
        },
        take: 10
      }
    }
  });

  if (!aircraft) {
    throw new ApiError('Aircraft not found', 404);
  }

  res.json({
    success: true,
    data: aircraft
  });
});

/**
 * Create new aircraft
 * POST /api/admin/aircraft
 */
export const createAircraft = asyncHandler(async (req, res) => {
  const { model, totalSeats, businessSeats, economySeats } = req.body;

  // Validate seat calculation
  if (totalSeats !== businessSeats + economySeats) {
    throw new ApiError('Total seats must equal business seats + economy seats', 400);
  }

  // Create aircraft
  const aircraft = await prisma.aircraft.create({
    data: {
      model,
      totalSeats,
      businessSeats,
      economySeats
    }
  });

  logger.info(`Aircraft created: ${model} by admin ${req.user.id}`);

  res.status(201).json({
    success: true,
    data: aircraft,
    message: 'Aircraft created successfully'
  });
});

/**
 * Update aircraft
 * PUT /api/admin/aircraft/:id
 */
export const updateAircraft = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { model, businessSeats, economySeats } = req.body;

  // Check if aircraft exists
  const existingAircraft = await prisma.aircraft.findUnique({
    where: { id }
  });

  if (!existingAircraft) {
    throw new ApiError('Aircraft not found', 404);
  }

  // Calculate new total if seats are being updated
  let updateData = {};
  
  if (model) {
    updateData.model = model;
  }

  if (businessSeats !== undefined || economySeats !== undefined) {
    const newBusinessSeats = businessSeats !== undefined ? businessSeats : existingAircraft.businessSeats;
    const newEconomySeats = economySeats !== undefined ? economySeats : existingAircraft.economySeats;
    const newTotalSeats = newBusinessSeats + newEconomySeats;

    updateData = {
      ...updateData,
      businessSeats: newBusinessSeats,
      economySeats: newEconomySeats,
      totalSeats: newTotalSeats
    };
  }

  // Update aircraft
  const aircraft = await prisma.aircraft.update({
    where: { id },
    data: updateData
  });

  logger.info(`Aircraft updated: ${id} by admin ${req.user.id}`);

  res.json({
    success: true,
    data: aircraft,
    message: 'Aircraft updated successfully'
  });
});

/**
 * Delete aircraft
 * DELETE /api/admin/aircraft/:id
 */
export const deleteAircraft = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if aircraft exists and has future flights
  const aircraft = await prisma.aircraft.findUnique({
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

  if (!aircraft) {
    throw new ApiError('Aircraft not found', 404);
  }

  if (aircraft.flights.length > 0) {
    throw new ApiError(
      `Cannot delete aircraft with ${aircraft.flights.length} future flight(s)`,
      422
    );
  }

  // Delete aircraft
  await prisma.aircraft.delete({
    where: { id }
  });

  logger.info(`Aircraft deleted: ${aircraft.model} by admin ${req.user.id}`);

  res.json({
    success: true,
    message: 'Aircraft deleted successfully'
  });
});

// ==================== COUPONS MANAGEMENT ====================

/**
 * Get all coupons with filters
 * GET /api/admin/coupons
 */
export const getAllCoupons = asyncHandler(async (req, res) => {
  const {
    isActive,
    code,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build where clause
  const where = {};

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (code) {
    where.code = {
      contains: code.toUpperCase()
    };
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get coupons with counts
  const [coupons, total] = await Promise.all([
    prisma.coupon.findMany({
      where,
      include: {
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
    prisma.coupon.count({ where })
  ]);

  // Format response
  const formattedCoupons = coupons.map(coupon => ({
    id: coupon.id,
    code: coupon.code,
    description: coupon.description,
    discount: coupon.discount,
    minPurchase: coupon.minPurchase,
    maxDiscount: coupon.maxDiscount,
    validFrom: coupon.validFrom,
    validUntil: coupon.validUntil,
    usageLimit: coupon.usageLimit,
    usedCount: coupon.usedCount,
    isActive: coupon.isActive,
    flightCount: coupon._count.flights,
    createdAt: coupon.createdAt,
    updatedAt: coupon.updatedAt
  }));

  res.json({
    success: true,
    data: {
      coupons: formattedCoupons,
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
 * Get coupon by ID
 * GET /api/admin/coupons/:id
 */
export const getCouponById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const coupon = await prisma.coupon.findUnique({
    where: { id },
    include: {
      flights: {
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
          }
        },
        take: 10
      }
    }
  });

  if (!coupon) {
    throw new ApiError('Coupon not found', 404);
  }

  res.json({
    success: true,
    data: coupon
  });
});

/**
 * Create new coupon
 * POST /api/admin/coupons
 */
export const createCoupon = asyncHandler(async (req, res) => {
  const {
    code,
    description,
    discount,
    minPurchase,
    maxDiscount,
    validFrom,
    validUntil,
    usageLimit,
    isActive
  } = req.body;

  // Check if coupon code already exists
  const existingCoupon = await prisma.coupon.findUnique({
    where: { code: code.toUpperCase() }
  });

  if (existingCoupon) {
    throw new ApiError('Coupon code already exists', 409);
  }

  // Create coupon
  const coupon = await prisma.coupon.create({
    data: {
      code: code.toUpperCase(),
      description: description || null,
      discount,
      minPurchase: minPurchase || null,
      maxDiscount: maxDiscount || null,
      validFrom: new Date(validFrom),
      validUntil: new Date(validUntil),
      usageLimit: usageLimit || null,
      usedCount: 0,
      isActive: isActive !== undefined ? isActive : true
    }
  });

  logger.info(`Coupon created: ${code} by admin ${req.user.id}`);

  res.status(201).json({
    success: true,
    data: coupon,
    message: 'Coupon created successfully'
  });
});

/**
 * Update coupon
 * PUT /api/admin/coupons/:id
 */
export const updateCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const {
    description,
    discount,
    minPurchase,
    maxDiscount,
    validFrom,
    validUntil,
    usageLimit,
    isActive
  } = req.body;

  // Check if coupon exists
  const existingCoupon = await prisma.coupon.findUnique({
    where: { id }
  });

  if (!existingCoupon) {
    throw new ApiError('Coupon not found', 404);
  }

  // Validate usage limit
  if (usageLimit !== undefined && usageLimit < existingCoupon.usedCount) {
    throw new ApiError(
      `Cannot set usage limit below current used count (${existingCoupon.usedCount})`,
      400
    );
  }

  // Update coupon (code is immutable)
  const coupon = await prisma.coupon.update({
    where: { id },
    data: {
      ...(description !== undefined && { description }),
      ...(discount !== undefined && { discount }),
      ...(minPurchase !== undefined && { minPurchase }),
      ...(maxDiscount !== undefined && { maxDiscount }),
      ...(validFrom && { validFrom: new Date(validFrom) }),
      ...(validUntil && { validUntil: new Date(validUntil) }),
      ...(usageLimit !== undefined && { usageLimit }),
      ...(isActive !== undefined && { isActive })
    }
  });

  logger.info(`Coupon updated: ${id} by admin ${req.user.id}`);

  res.json({
    success: true,
    data: coupon,
    message: 'Coupon updated successfully'
  });
});

/**
 * Delete coupon
 * DELETE /api/admin/coupons/:id
 */
export const deleteCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if coupon exists
  const coupon = await prisma.coupon.findUnique({
    where: { id }
  });

  if (!coupon) {
    throw new ApiError('Coupon not found', 404);
  }

  // Delete coupon (can delete even if used - keeps historical data)
  await prisma.coupon.delete({
    where: { id }
  });

  logger.info(`Coupon deleted: ${coupon.code} by admin ${req.user.id}`);

  res.json({
    success: true,
    message: 'Coupon deleted successfully'
  });
});

/**
 * Toggle coupon active status
 * PATCH /api/admin/coupons/:id/toggle
 */
export const toggleCoupon = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Check if coupon exists
  const coupon = await prisma.coupon.findUnique({
    where: { id }
  });

  if (!coupon) {
    throw new ApiError('Coupon not found', 404);
  }

  // Toggle active status
  const updatedCoupon = await prisma.coupon.update({
    where: { id },
    data: {
      isActive: !coupon.isActive
    },
    select: {
      id: true,
      code: true,
      isActive: true
    }
  });

  logger.info(`Coupon ${updatedCoupon.isActive ? 'activated' : 'deactivated'}: ${coupon.code} by admin ${req.user.id}`);

  res.json({
    success: true,
    data: updatedCoupon,
    message: `Coupon ${updatedCoupon.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

// ==================== USERS MANAGEMENT ====================

/**
 * Get all users with filters
 * GET /api/admin/users
 */
export const getAllUsers = asyncHandler(async (req, res) => {
  const {
    role,
    isActive,
    search,
    page = 1,
    limit = 20,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = req.query;

  // Build where clause
  const where = {};

  if (role) {
    where.role = role.toUpperCase();
  }

  if (isActive !== undefined) {
    where.isActive = isActive === 'true';
  }

  if (search) {
    where.OR = [
      { email: { contains: search } },
      { fullName: { contains: search } }
    ];
  }

  // Calculate pagination
  const skip = (parseInt(page) - 1) * parseInt(limit);
  const take = parseInt(limit);

  // Get users with counts
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      select: {
        id: true,
        email: true,
        fullName: true,
        phoneNumber: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        updatedAt: true,
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
    prisma.user.count({ where })
  ]);

  // Format response
  const formattedUsers = users.map(user => ({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    phoneNumber: user.phoneNumber,
    role: user.role,
    isActive: user.isActive,
    lastLoginAt: user.lastLoginAt,
    bookingCount: user._count.bookings,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  }));

  res.json({
    success: true,
    data: {
      users: formattedUsers,
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
 * Get user by ID
 * GET /api/admin/users/:id
 */
export const getUserById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      lastLoginAt: true,
      createdAt: true,
      updatedAt: true,
      bookings: {
        include: {
          flight: {
            select: {
              flightNumber: true,
              departureTime: true
            }
          }
        },
        orderBy: {
          createdAt: 'desc'
        },
        take: 10
      }
    }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Get booking statistics
  const stats = await prisma.booking.groupBy({
    by: ['status'],
    where: {
      userId: id
    },
    _count: true,
    _sum: {
      totalAmount: true
    }
  });

  const statistics = {
    totalBookings: stats.reduce((sum, s) => sum + s._count, 0),
    totalSpent: stats.reduce((sum, s) => sum + (s._sum.totalAmount || 0), 0),
    pendingBookings: stats.find(s => s.status === 'PENDING')?._count || 0,
    confirmedBookings: stats.find(s => s.status === 'CONFIRMED')?._count || 0,
    cancelledBookings: stats.find(s => s.status === 'CANCELLED')?._count || 0,
    rejectedBookings: stats.find(s => s.status === 'REJECTED')?._count || 0,
    completedBookings: stats.find(s => s.status === 'COMPLETED')?._count || 0
  };

  res.json({
    success: true,
    data: {
      ...user,
      statistics
    }
  });
});

/**
 * Update user role
 * PUT /api/admin/users/:id/role
 */
export const updateUserRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  // Cannot change own role
  if (id === req.user.id) {
    throw new ApiError('Cannot change your own role', 400);
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { id }
  });

  if (!existingUser) {
    throw new ApiError('User not found', 404);
  }

  // Update user role
  const user = await prisma.user.update({
    where: { id },
    data: {
      role: role.toUpperCase()
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      role: true,
      updatedAt: true
    }
  });

  logger.info(`User role updated: ${user.email} -> ${role} by admin ${req.user.id}`);

  res.json({
    success: true,
    data: user,
    message: 'User role updated successfully'
  });
});

/**
 * Create new user
 * POST /api/admin/users
 */
export const createUser = asyncHandler(async (req, res) => {
  const { email, password, fullName, phoneNumber, role } = req.body;

  // Check if email exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new ApiError('Email already exists', 400);
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      fullName,
      phoneNumber,
      role: role || 'USER'
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });

  logger.info(`New user created by admin ${req.user.id}: ${email}`);

  res.status(201).json({
    success: true,
    data: user,
    message: 'User created successfully'
  });
});

/**
 * Update user
 * PUT /api/admin/users/:id
 */
export const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { email, fullName, phoneNumber, role, password } = req.body;

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check if email is being changed and already exists
  if (email && email !== user.email) {
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    if (existingUser) {
      throw new ApiError('Email already exists', 400);
    }
  }

  // Prepare update data
  const updateData = {};
  if (email) updateData.email = email;
  if (fullName) updateData.fullName = fullName;
  if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
  if (role) updateData.role = role;
  if (password) {
    updateData.password = await bcrypt.hash(password, 10);
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id },
    data: updateData,
    select: {
      id: true,
      email: true,
      fullName: true,
      phoneNumber: true,
      role: true,
      isActive: true,
      updatedAt: true
    }
  });

  logger.info(`User updated by admin ${req.user.id}: ${updatedUser.email}`);

  res.json({
    success: true,
    data: updatedUser,
    message: 'User updated successfully'
  });
});

/**
 * Delete user
 * DELETE /api/admin/users/:id
 */
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cannot delete own account
  if (id === req.user.id) {
    throw new ApiError('Cannot delete your own account', 400);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Check if user has bookings
  const bookingCount = await prisma.booking.count({
    where: { userId: id }
  });

  if (bookingCount > 0) {
    throw new ApiError('Cannot delete user with existing bookings. Deactivate instead.', 400);
  }

  // Delete user
  await prisma.user.delete({
    where: { id }
  });

  logger.info(`User deleted by admin ${req.user.id}: ${user.email}`);

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

/**
 * Toggle user active status
 * PATCH /api/admin/users/:id/toggle
 */
export const toggleUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  // Cannot toggle own status
  if (id === req.user.id) {
    throw new ApiError('Cannot change your own status', 400);
  }

  // Check if user exists
  const user = await prisma.user.findUnique({
    where: { id }
  });

  if (!user) {
    throw new ApiError('User not found', 404);
  }

  // Toggle active status
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isActive: !user.isActive
    },
    select: {
      id: true,
      email: true,
      fullName: true,
      isActive: true
    }
  });

  logger.info(`User ${updatedUser.isActive ? 'activated' : 'deactivated'}: ${user.email} by admin ${req.user.id}`);

  res.json({
    success: true,
    data: updatedUser,
    message: `User ${updatedUser.isActive ? 'activated' : 'deactivated'} successfully`
  });
});

// ==================== DASHBOARD & STATISTICS ====================

/**
 * Get dashboard overview
 * GET /api/admin/dashboard
 */
export const getDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const todayStart = new Date(now.setHours(0, 0, 0, 0));
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  // Get overview counts
  const [
    totalUsers,
    totalBookings,
    totalFlights,
    todayUsers,
    todayBookings,
    monthUsers,
    monthBookings
  ] = await Promise.all([
    prisma.user.count(),
    prisma.booking.count(),
    prisma.flight.count(),
    prisma.user.count({
      where: {
        createdAt: { gte: todayStart }
      }
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: todayStart },
        status: 'CONFIRMED'
      }
    }),
    prisma.user.count({
      where: {
        createdAt: { gte: monthStart }
      }
    }),
    prisma.booking.count({
      where: {
        createdAt: { gte: monthStart },
        status: 'CONFIRMED'
      }
    })
  ]);

  // Get revenue stats
  const [totalRevenue, todayRevenue, monthRevenue] = await Promise.all([
    prisma.booking.aggregate({
      where: { status: 'CONFIRMED' },
      _sum: { totalAmount: true }
    }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: todayStart },
        status: 'CONFIRMED'
      },
      _sum: { totalAmount: true }
    }),
    prisma.booking.aggregate({
      where: {
        createdAt: { gte: monthStart },
        status: 'CONFIRMED'
      },
      _sum: { totalAmount: true }
    })
  ]);

  // Get recent bookings
  const recentBookings = await prisma.booking.findMany({
    include: {
      user: {
        select: {
          fullName: true,
          email: true
        }
      },
      flight: {
        select: {
          flightNumber: true
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 5
  });

  // Get top routes
  const topRoutes = await prisma.booking.groupBy({
    by: ['flightId'],
    where: {
      status: 'CONFIRMED'
    },
    _count: true,
    _sum: {
      totalAmount: true
    },
    orderBy: {
      _count: {
        flightId: 'desc'
      }
    },
    take: 5
  });

  res.json({
    success: true,
    data: {
      overview: {
        totalUsers,
        totalBookings,
        totalRevenue: totalRevenue._sum.totalAmount || 0,
        totalFlights
      },
      today: {
        newUsers: todayUsers,
        newBookings: todayBookings,
        revenue: todayRevenue._sum.totalAmount || 0,
        scheduledFlights: 0 // Can add if needed
      },
      thisMonth: {
        newUsers: monthUsers,
        newBookings: monthBookings,
        revenue: monthRevenue._sum.totalAmount || 0,
        avgBookingValue: monthBookings > 0 
          ? (monthRevenue._sum.totalAmount || 0) / monthBookings 
          : 0
      },
      recentBookings: recentBookings.map(b => ({
        id: b.id,
        bookingCode: b.bookingCode,
        user: b.user,
        flight: b.flight,
        totalAmount: b.totalAmount,
        status: b.status,
        createdAt: b.createdAt
      }))
    }
  });
});

/**
 * Get revenue statistics
 * GET /api/admin/statistics/revenue
 */
export const getRevenueStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate, groupBy = 'day' } = req.query;

  if (!startDate || !endDate) {
    throw new ApiError('startDate and endDate are required', 400);
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  end.setDate(end.getDate() + 1); // Include end date

  // Get all confirmed bookings in date range
  const bookings = await prisma.booking.findMany({
    where: {
      createdAt: {
        gte: start,
        lt: end
      },
      status: 'CONFIRMED'
    },
    select: {
      createdAt: true,
      totalAmount: true,
      _count: {
        select: {
          passengers: true
        }
      }
    },
    orderBy: {
      createdAt: 'asc'
    }
  });

  // Group by time period
  const grouped = {};

  bookings.forEach(booking => {
    const date = new Date(booking.createdAt);
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
        totalRevenue: 0,
        totalBookings: 0,
        totalPassengers: 0
      };
    }

    grouped[key].totalRevenue += booking.totalAmount;
    grouped[key].totalBookings++;
    grouped[key].totalPassengers += booking._count.passengers;
  });

  // Format results
  const revenue = Object.values(grouped).map(stats => ({
    ...stats,
    avgBookingValue: stats.totalBookings > 0 
      ? parseFloat((stats.totalRevenue / stats.totalBookings).toFixed(2))
      : 0
  }));

  // Calculate summary
  const summary = {
    totalRevenue: revenue.reduce((sum, r) => sum + r.totalRevenue, 0),
    totalBookings: revenue.reduce((sum, r) => sum + r.totalBookings, 0),
    avgDailyRevenue: revenue.length > 0
      ? parseFloat((revenue.reduce((sum, r) => sum + r.totalRevenue, 0) / revenue.length).toFixed(2))
      : 0
  };

  res.json({
    success: true,
    data: {
      revenue,
      summary
    }
  });
});

/**
 * Get user statistics
 * GET /api/admin/statistics/users
 */
export const getUserStatistics = asyncHandler(async (req, res) => {
  // Get total users by role
  const byRole = await prisma.user.groupBy({
    by: ['role'],
    _count: true
  });

  // Get active/inactive counts
  const [active, inactive, totalUsers] = await Promise.all([
    prisma.user.count({ where: { isActive: true } }),
    prisma.user.count({ where: { isActive: false } }),
    prisma.user.count()
  ]);

  // Get new users this month
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const newThisMonth = await prisma.user.count({
    where: {
      createdAt: { gte: monthStart }
    }
  });

  // Get top users by booking
  const topUsersData = await prisma.booking.groupBy({
    by: ['userId'],
    where: {
      status: 'CONFIRMED'
    },
    _count: true,
    _sum: {
      totalAmount: true
    },
    orderBy: {
      _count: {
        userId: 'desc'
      }
    },
    take: 10
  });

  // Get user details for top users
  const topUserIds = topUsersData.map(u => u.userId);
  const topUsersDetails = await prisma.user.findMany({
    where: {
      id: { in: topUserIds }
    },
    select: {
      id: true,
      fullName: true,
      email: true
    }
  });

  const topUsers = topUsersData.map(data => {
    const user = topUsersDetails.find(u => u.id === data.userId);
    return {
      id: data.userId,
      fullName: user?.fullName || 'Unknown',
      email: user?.email || 'Unknown',
      totalBookings: data._count,
      totalSpent: data._sum.totalAmount || 0
    };
  });

  res.json({
    success: true,
    data: {
      total: totalUsers,
      byRole: Object.fromEntries(byRole.map(r => [r.role, r._count])),
      active,
      inactive,
      newThisMonth,
      topUsers
    }
  });
});

/**
 * Get statistics with date range
 * GET /api/admin/statistics
 */
export const getStatistics = asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  // Parse dates
  const start = startDate ? new Date(startDate) : new Date(new Date().setMonth(new Date().getMonth() - 1));
  const end = endDate ? new Date(endDate) : new Date();

  // Revenue by date
  const revenueData = await prisma.booking.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: start,
        lte: end
      },
      status: {
        in: ['CONFIRMED', 'COMPLETED']
      }
    },
    _sum: {
      totalAmount: true
    }
  });

  // Group revenue by date
  const revenueByDate = revenueData.reduce((acc, item) => {
    const date = new Date(item.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += item._sum.totalAmount || 0;
    return acc;
  }, {});

  const revenueArray = Object.entries(revenueByDate).map(([date, revenue]) => ({
    date,
    revenue
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Bookings by date
  const bookingsData = await prisma.booking.groupBy({
    by: ['createdAt'],
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    _count: true
  });

  const bookingsByDate = bookingsData.reduce((acc, item) => {
    const date = new Date(item.createdAt).toISOString().split('T')[0];
    if (!acc[date]) {
      acc[date] = 0;
    }
    acc[date] += item._count;
    return acc;
  }, {});

  const bookingsArray = Object.entries(bookingsByDate).map(([date, count]) => ({
    date,
    count
  })).sort((a, b) => new Date(a.date) - new Date(b.date));

  // Top routes
  const topRoutesData = await prisma.booking.groupBy({
    by: ['flightId'],
    where: {
      createdAt: {
        gte: start,
        lte: end
      }
    },
    _count: true,
    orderBy: {
      _count: {
        flightId: 'desc'
      }
    },
    take: 10
  });

  const flightIds = topRoutesData.map(r => r.flightId);
  const flights = await prisma.flight.findMany({
    where: {
      id: { in: flightIds }
    },
    include: {
      route: {
        include: {
          departure: true,
          arrival: true
        }
      }
    }
  });

  const topRoutes = topRoutesData.map(data => {
    const flight = flights.find(f => f.id === data.flightId);
    return {
      route: flight ? `${flight.route.departure.code} → ${flight.route.arrival.code}` : 'Unknown',
      bookings: data._count
    };
  });

  res.json({
    success: true,
    data: {
      revenueByDate: revenueArray,
      bookingsByDate: bookingsArray,
      topRoutes
    }
  });
});
