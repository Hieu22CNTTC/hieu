# Plan 04: Admin APIs & Dashboard

## Mục tiêu
Implement các API cho admin để quản lý airports, routes, flights, aircrafts, seat inventories, coupons, bookings và dashboard statistics.

## Tech Stack
- Express.js + Prisma
- Role-based access control
- Data aggregation for statistics

---

## 1. Admin Middleware

### src/middlewares/roleCheck.ts (update)
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { AppError } from '../utils/errors';

export const requireAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }

  if (req.user.role !== 'ADMIN') {
    return next(new AppError('Admin access required', 403));
  }

  next();
};
```

---

## 2. Airport Management

### src/validations/adminSchema.ts
```typescript
import { z } from 'zod';

// Airport schemas
export const createAirportSchema = z.object({
  body: z.object({
    code: z.string().length(3).toUpperCase(),
    name: z.string().min(3),
    city: z.string().min(2),
    country: z.string().min(2),
  }),
});

export const updateAirportSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    code: z.string().length(3).toUpperCase().optional(),
    name: z.string().min(3).optional(),
    city: z.string().min(2).optional(),
    country: z.string().min(2).optional(),
  }),
});

export const deleteAirportSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});

// Aircraft schemas
export const createAircraftSchema = z.object({
  body: z.object({
    model: z.string().min(3),
    totalSeats: z.number().int().positive(),
  }),
});

export const updateAircraftSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    model: z.string().min(3).optional(),
    totalSeats: z.number().int().positive().optional(),
  }),
});

// Route schemas
export const createRouteSchema = z.object({
  body: z.object({
    fromAirportId: z.string().uuid(),
    toAirportId: z.string().uuid(),
    basePrice: z.number().positive(),
  }),
});

export const updateRouteSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    fromAirportId: z.string().uuid().optional(),
    toAirportId: z.string().uuid().optional(),
    basePrice: z.number().positive().optional(),
  }),
});

// Flight schemas
export const createFlightSchema = z.object({
  body: z.object({
    flightNumber: z.string().min(3),
    routeId: z.string().uuid(),
    aircraftId: z.string().uuid(),
    departTime: z.string().datetime(),
    arriveTime: z.string().datetime(),
    duration: z.number().int().positive(),
    status: z.enum(['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED']).optional(),
  }),
});

export const updateFlightSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    flightNumber: z.string().min(3).optional(),
    routeId: z.string().uuid().optional(),
    aircraftId: z.string().uuid().optional(),
    departTime: z.string().datetime().optional(),
    arriveTime: z.string().datetime().optional(),
    duration: z.number().int().positive().optional(),
    status: z.enum(['SCHEDULED', 'DELAYED', 'CANCELLED', 'COMPLETED']).optional(),
  }),
});

// Seat Inventory schemas
export const createSeatInventorySchema = z.object({
  body: z.object({
    flightId: z.string().uuid(),
    cabinClass: z.enum(['ECONOMY', 'BUSINESS']),
    totalSeats: z.number().int().positive(),
    remainingSeats: z.number().int().min(0),
    priceMultiplier: z.number().positive(),
  }),
});

export const updateSeatInventorySchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    totalSeats: z.number().int().positive().optional(),
    remainingSeats: z.number().int().min(0).optional(),
    priceMultiplier: z.number().positive().optional(),
  }),
});

// Coupon schemas
export const createCouponSchema = z.object({
  body: z.object({
    code: z.string().min(3).toUpperCase(),
    discountType: z.enum(['PERCENT', 'FIXED']),
    value: z.number().positive(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
    maxUses: z.number().int().positive(),
  }),
});

export const updateCouponSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    code: z.string().min(3).toUpperCase().optional(),
    discountType: z.enum(['PERCENT', 'FIXED']).optional(),
    value: z.number().positive().optional(),
    startAt: z.string().datetime().optional(),
    endAt: z.string().datetime().optional(),
    maxUses: z.number().int().positive().optional(),
    isActive: z.boolean().optional(),
  }),
});

// Booking management schemas
export const updateBookingStatusSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
  body: z.object({
    status: z.enum(['PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED']),
  }),
});
```

---

## 3. Admin Service

### src/services/adminService.ts
```typescript
import prisma from '../config/database';
import { AppError } from '../utils/errors';

export class AdminService {
  // ============ AIRPORTS ============
  async getAllAirports() {
    return await prisma.airport.findMany({
      orderBy: { code: 'asc' },
    });
  }

  async createAirport(data: {
    code: string;
    name: string;
    city: string;
    country: string;
  }) {
    const existing = await prisma.airport.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Airport code already exists', 400);
    }

    return await prisma.airport.create({ data });
  }

  async updateAirport(id: string, data: Partial<typeof data>) {
    return await prisma.airport.update({
      where: { id },
      data,
    });
  }

  async deleteAirport(id: string) {
    // Check if airport is used in routes
    const routeCount = await prisma.route.count({
      where: {
        OR: [{ fromAirportId: id }, { toAirportId: id }],
      },
    });

    if (routeCount > 0) {
      throw new AppError('Cannot delete airport used in routes', 400);
    }

    return await prisma.airport.delete({ where: { id } });
  }

  // ============ AIRCRAFTS ============
  async getAllAircrafts() {
    return await prisma.aircraft.findMany({
      include: {
        _count: {
          select: { flights: true },
        },
      },
    });
  }

  async createAircraft(data: { model: string; totalSeats: number }) {
    return await prisma.aircraft.create({ data });
  }

  async updateAircraft(id: string, data: Partial<typeof data>) {
    return await prisma.aircraft.update({
      where: { id },
      data,
    });
  }

  async deleteAircraft(id: string) {
    const flightCount = await prisma.flight.count({
      where: { aircraftId: id },
    });

    if (flightCount > 0) {
      throw new AppError('Cannot delete aircraft used in flights', 400);
    }

    return await prisma.aircraft.delete({ where: { id } });
  }

  // ============ ROUTES ============
  async getAllRoutes() {
    return await prisma.route.findMany({
      include: {
        fromAirport: true,
        toAirport: true,
        _count: {
          select: { flights: true },
        },
      },
    });
  }

  async createRoute(data: {
    fromAirportId: string;
    toAirportId: string;
    basePrice: number;
  }) {
    if (data.fromAirportId === data.toAirportId) {
      throw new AppError('From and To airports must be different', 400);
    }

    const existing = await prisma.route.findFirst({
      where: {
        fromAirportId: data.fromAirportId,
        toAirportId: data.toAirportId,
      },
    });

    if (existing) {
      throw new AppError('Route already exists', 400);
    }

    return await prisma.route.create({
      data,
      include: {
        fromAirport: true,
        toAirport: true,
      },
    });
  }

  async updateRoute(id: string, data: Partial<typeof data>) {
    return await prisma.route.update({
      where: { id },
      data,
      include: {
        fromAirport: true,
        toAirport: true,
      },
    });
  }

  async deleteRoute(id: string) {
    const flightCount = await prisma.flight.count({
      where: { routeId: id },
    });

    if (flightCount > 0) {
      throw new AppError('Cannot delete route with flights', 400);
    }

    return await prisma.route.delete({ where: { id } });
  }

  // ============ FLIGHTS ============
  async getAllFlights(filters?: {
    status?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.fromDate || filters?.toDate) {
      where.departTime = {};
      if (filters.fromDate) {
        where.departTime.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.departTime.lte = new Date(filters.toDate);
      }
    }

    return await prisma.flight.findMany({
      where,
      include: {
        route: {
          include: {
            fromAirport: true,
            toAirport: true,
          },
        },
        aircraft: true,
        seatInventories: true,
      },
      orderBy: { departTime: 'asc' },
    });
  }

  async createFlight(data: {
    flightNumber: string;
    routeId: string;
    aircraftId: string;
    departTime: string;
    arriveTime: string;
    duration: number;
    status?: string;
  }) {
    const existing = await prisma.flight.findUnique({
      where: { flightNumber: data.flightNumber },
    });

    if (existing) {
      throw new AppError('Flight number already exists', 400);
    }

    return await prisma.flight.create({
      data: {
        ...data,
        departTime: new Date(data.departTime),
        arriveTime: new Date(data.arriveTime),
      },
      include: {
        route: {
          include: {
            fromAirport: true,
            toAirport: true,
          },
        },
        aircraft: true,
      },
    });
  }

  async updateFlight(id: string, data: Partial<typeof data>) {
    const updateData: any = { ...data };

    if (data.departTime) {
      updateData.departTime = new Date(data.departTime);
    }
    if (data.arriveTime) {
      updateData.arriveTime = new Date(data.arriveTime);
    }

    return await prisma.flight.update({
      where: { id },
      data: updateData,
      include: {
        route: {
          include: {
            fromAirport: true,
            toAirport: true,
          },
        },
        aircraft: true,
      },
    });
  }

  async deleteFlight(id: string) {
    const bookingCount = await prisma.booking.count({
      where: { flightId: id, status: 'PAID' },
    });

    if (bookingCount > 0) {
      throw new AppError('Cannot delete flight with paid bookings', 400);
    }

    return await prisma.flight.delete({ where: { id } });
  }

  // ============ SEAT INVENTORIES ============
  async getSeatInventories(flightId?: string) {
    const where = flightId ? { flightId } : {};

    return await prisma.seatInventory.findMany({
      where,
      include: {
        flight: {
          include: {
            route: {
              include: {
                fromAirport: true,
                toAirport: true,
              },
            },
          },
        },
      },
    });
  }

  async createSeatInventory(data: {
    flightId: string;
    cabinClass: 'ECONOMY' | 'BUSINESS';
    totalSeats: number;
    remainingSeats: number;
    priceMultiplier: number;
  }) {
    const existing = await prisma.seatInventory.findFirst({
      where: {
        flightId: data.flightId,
        cabinClass: data.cabinClass,
      },
    });

    if (existing) {
      throw new AppError('Seat inventory already exists for this flight and cabin class', 400);
    }

    return await prisma.seatInventory.create({
      data,
      include: { flight: true },
    });
  }

  async updateSeatInventory(id: string, data: Partial<typeof data>) {
    return await prisma.seatInventory.update({
      where: { id },
      data,
      include: { flight: true },
    });
  }

  async deleteSeatInventory(id: string) {
    return await prisma.seatInventory.delete({ where: { id } });
  }

  // ============ COUPONS ============
  async getAllCoupons() {
    return await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async createCoupon(data: {
    code: string;
    discountType: 'PERCENT' | 'FIXED';
    value: number;
    startAt: string;
    endAt: string;
    maxUses: number;
  }) {
    const existing = await prisma.coupon.findUnique({
      where: { code: data.code },
    });

    if (existing) {
      throw new AppError('Coupon code already exists', 400);
    }

    return await prisma.coupon.create({
      data: {
        ...data,
        startAt: new Date(data.startAt),
        endAt: new Date(data.endAt),
      },
    });
  }

  async updateCoupon(id: string, data: Partial<typeof data>) {
    const updateData: any = { ...data };

    if (data.startAt) {
      updateData.startAt = new Date(data.startAt);
    }
    if (data.endAt) {
      updateData.endAt = new Date(data.endAt);
    }

    return await prisma.coupon.update({
      where: { id },
      data: updateData,
    });
  }

  async deleteCoupon(id: string) {
    return await prisma.coupon.delete({ where: { id } });
  }

  // ============ BOOKINGS ============
  async getAllBookings(filters?: {
    status?: string;
    userId?: string;
    fromDate?: string;
    toDate?: string;
  }) {
    const where: any = {};

    if (filters?.status) {
      where.status = filters.status;
    }
    if (filters?.userId) {
      where.userId = filters.userId;
    }
    if (filters?.fromDate || filters?.toDate) {
      where.createdAt = {};
      if (filters.fromDate) {
        where.createdAt.gte = new Date(filters.fromDate);
      }
      if (filters.toDate) {
        where.createdAt.lte = new Date(filters.toDate);
      }
    }

    return await prisma.booking.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
          },
        },
        flight: {
          include: {
            route: {
              include: {
                fromAirport: true,
                toAirport: true,
              },
            },
          },
        },
        passengers: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(id: string) {
    const booking = await prisma.booking.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            fullName: true,
            phone: true,
          },
        },
        flight: {
          include: {
            route: {
              include: {
                fromAirport: true,
                toAirport: true,
              },
            },
            aircraft: true,
          },
        },
        passengers: true,
        payments: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    return booking;
  }

  async updateBookingStatus(id: string, status: string) {
    return await prisma.booking.update({
      where: { id },
      data: { status: status as any },
    });
  }

  // ============ STATISTICS ============
  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

    // Total bookings
    const totalBookings = await prisma.booking.count();
    const todayBookings = await prisma.booking.count({
      where: {
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Revenue
    const totalRevenue = await prisma.booking.aggregate({
      where: { status: 'PAID' },
      _sum: { totalAmount: true },
    });

    const monthRevenue = await prisma.booking.aggregate({
      where: {
        status: 'PAID',
        createdAt: {
          gte: thisMonth,
          lt: nextMonth,
        },
      },
      _sum: { totalAmount: true },
    });

    // Bookings by status
    const bookingsByStatus = await prisma.booking.groupBy({
      by: ['status'],
      _count: true,
    });

    // Top routes
    const topRoutes = await prisma.booking.groupBy({
      by: ['flightId'],
      where: { status: 'PAID' },
      _count: true,
      orderBy: { _count: { flightId: 'desc' } },
      take: 5,
    });

    const routesWithDetails = await Promise.all(
      topRoutes.map(async (item) => {
        const flight = await prisma.flight.findUnique({
          where: { id: item.flightId },
          include: {
            route: {
              include: {
                fromAirport: true,
                toAirport: true,
              },
            },
          },
        });

        return {
          flightNumber: flight?.flightNumber,
          route: `${flight?.route.fromAirport.code} → ${flight?.route.toAirport.code}`,
          bookings: item._count,
        };
      })
    );

    return {
      totalBookings,
      todayBookings,
      totalRevenue: Number(totalRevenue._sum.totalAmount || 0),
      monthRevenue: Number(monthRevenue._sum.totalAmount || 0),
      bookingsByStatus: bookingsByStatus.map(item => ({
        status: item.status,
        count: item._count,
      })),
      topRoutes: routesWithDetails,
    };
  }

  async getRevenueStats(params: { fromDate?: string; toDate?: string }) {
    const where: any = { status: 'PAID' };

    if (params.fromDate || params.toDate) {
      where.createdAt = {};
      if (params.fromDate) {
        where.createdAt.gte = new Date(params.fromDate);
      }
      if (params.toDate) {
        where.createdAt.lte = new Date(params.toDate);
      }
    }

    const bookings = await prisma.booking.findMany({
      where,
      select: {
        createdAt: true,
        totalAmount: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const revenueByDate: Record<string, number> = {};

    bookings.forEach(booking => {
      const date = booking.createdAt.toISOString().split('T')[0];
      revenueByDate[date] = (revenueByDate[date] || 0) + Number(booking.totalAmount);
    });

    return Object.entries(revenueByDate).map(([date, revenue]) => ({
      date,
      revenue,
    }));
  }
}
```

---

## 4. Admin Controller

### src/controllers/adminController.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { AdminService } from '../services/adminService';

const adminService = new AdminService();

export class AdminController {
  // ============ AIRPORTS ============
  async getAllAirports(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getAllAirports();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createAirport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.createAirport(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateAirport(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.updateAirport(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteAirport(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteAirport(req.params.id);
      res.json({ success: true, message: 'Airport deleted' });
    } catch (error) {
      next(error);
    }
  }

  // ============ AIRCRAFTS ============
  async getAllAircrafts(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getAllAircrafts();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async createAircraft(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.createAircraft(req.body);
      res.status(201).json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async updateAircraft(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.updateAircraft(req.params.id, req.body);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async deleteAircraft(req: Request, res: Response, next: NextFunction) {
    try {
      await adminService.deleteAircraft(req.params.id);
      res.json({ success: true, message: 'Aircraft deleted' });
    } catch (error) {
      next(error);
    }
  }

  // Similar methods for routes, flights, seat inventories, coupons...
  // (Implementation follows the same pattern)

  // ============ STATISTICS ============
  async getDashboardStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getDashboardStats();
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }

  async getRevenueStats(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getRevenueStats(req.query as any);
      res.json({ success: true, data });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 5. Admin Routes

### src/routes/admin.routes.ts
```typescript
import { Router } from 'express';
import { AdminController } from '../controllers/adminController';
import { authenticate } from '../middlewares/auth';
import { requireAdmin } from '../middlewares/roleCheck';
import { validate } from '../middlewares/validate';
import * as schemas from '../validations/adminSchema';

const router = Router();
const adminController = new AdminController();

// All admin routes require authentication + admin role
router.use(authenticate);
router.use(requireAdmin);

// Airports
router.get('/airports', adminController.getAllAirports);
router.post('/airports', validate(schemas.createAirportSchema), adminController.createAirport);
router.put('/airports/:id', validate(schemas.updateAirportSchema), adminController.updateAirport);
router.delete('/airports/:id', validate(schemas.deleteAirportSchema), adminController.deleteAirport);

// Aircrafts
router.get('/aircrafts', adminController.getAllAircrafts);
router.post('/aircrafts', validate(schemas.createAircraftSchema), adminController.createAircraft);
router.put('/aircrafts/:id', validate(schemas.updateAircraftSchema), adminController.updateAircraft);
router.delete('/aircrafts/:id', adminController.deleteAircraft);

// Routes (flight routes)
router.get('/routes', adminController.getAllRoutes);
router.post('/routes', validate(schemas.createRouteSchema), adminController.createRoute);
router.put('/routes/:id', validate(schemas.updateRouteSchema), adminController.updateRoute);
router.delete('/routes/:id', adminController.deleteRoute);

// Flights
router.get('/flights', adminController.getAllFlights);
router.post('/flights', validate(schemas.createFlightSchema), adminController.createFlight);
router.put('/flights/:id', validate(schemas.updateFlightSchema), adminController.updateFlight);
router.delete('/flights/:id', adminController.deleteFlight);

// Seat Inventories
router.get('/seat-inventories', adminController.getSeatInventories);
router.post('/seat-inventories', validate(schemas.createSeatInventorySchema), adminController.createSeatInventory);
router.put('/seat-inventories/:id', validate(schemas.updateSeatInventorySchema), adminController.updateSeatInventory);
router.delete('/seat-inventories/:id', adminController.deleteSeatInventory);

// Coupons
router.get('/coupons', adminController.getAllCoupons);
router.post('/coupons', validate(schemas.createCouponSchema), adminController.createCoupon);
router.put('/coupons/:id', validate(schemas.updateCouponSchema), adminController.updateCoupon);
router.delete('/coupons/:id', adminController.deleteCoupon);

// Bookings
router.get('/bookings', adminController.getAllBookings);
router.get('/bookings/:id', adminController.getBookingById);
router.patch('/bookings/:id/status', validate(schemas.updateBookingStatusSchema), adminController.updateBookingStatus);

// Statistics
router.get('/stats/dashboard', adminController.getDashboardStats);
router.get('/stats/revenue', adminController.getRevenueStats);

export default router;
```

---

## 6. Update Routes Index

### src/routes/index.ts
```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import searchRoutes from './search.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';
import adminRoutes from './admin.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/search', searchRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);
router.use('/admin', adminRoutes);

export default router;
```

---

## 7. Testing Admin Endpoints

### Login as Admin
```bash
POST http://localhost:3000/api/auth/login
{
  "email": "admin@flight.com",
  "password": "Admin@123"
}
```

### Get Dashboard Stats
```bash
GET http://localhost:3000/api/admin/stats/dashboard
Authorization: Bearer <admin-token>
```

### Create Airport
```bash
POST http://localhost:3000/api/admin/airports
Authorization: Bearer <admin-token>
{
  "code": "BMV",
  "name": "Buon Ma Thuot Airport",
  "city": "Buon Ma Thuot",
  "country": "Vietnam"
}
```

### Get All Bookings
```bash
GET http://localhost:3000/api/admin/bookings?status=PAID&fromDate=2026-01-01
Authorization: Bearer <admin-token>
```

---

## Next Steps
→ Proceed to **Plan 05: Frontend Setup**
