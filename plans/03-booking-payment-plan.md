# Plan 03: Booking & Payment System

## Mục tiêu
Implement tìm kiếm chuyến bay, tạo booking, quản lý seat inventory, và tích hợp MoMo payment gateway.

## Các module chính
1. Flight Search
2. Booking Management
3. Seat Inventory
4. MoMo Payment Integration
5. Booking Expiration Cron Job

---

## 1. Flight Search Module

### src/validations/searchSchema.ts
```typescript
import { z } from 'zod';
import { CabinClass } from '@prisma/client';

export const searchFlightsSchema = z.object({
  query: z.object({
    fromAirportCode: z.string().length(3, 'Airport code must be 3 characters'),
    toAirportCode: z.string().length(3, 'Airport code must be 3 characters'),
    departDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
    passengers: z.string().transform(val => parseInt(val)).pipe(z.number().min(1).max(9)),
    cabinClass: z.nativeEnum(CabinClass).optional().default(CabinClass.ECONOMY),
    sortBy: z.enum(['price_asc', 'price_desc', 'time_asc', 'time_desc']).optional(),
  }),
});

export const getFlightDetailSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
```

### src/services/searchService.ts
```typescript
import prisma from '../config/database';
import { CabinClass } from '@prisma/client';
import { AppError } from '../utils/errors';

export class SearchService {
  async searchFlights(params: {
    fromAirportCode: string;
    toAirportCode: string;
    departDate: string;
    passengers: number;
    cabinClass: CabinClass;
    sortBy?: string;
  }) {
    const { fromAirportCode, toAirportCode, departDate, passengers, cabinClass, sortBy } = params;

    // Parse date range (start of day to end of day)
    const startDate = new Date(departDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(departDate);
    endDate.setHours(23, 59, 59, 999);

    // Find route
    const route = await prisma.route.findFirst({
      where: {
        fromAirport: { code: fromAirportCode },
        toAirport: { code: toAirportCode },
      },
      include: {
        fromAirport: true,
        toAirport: true,
      },
    });

    if (!route) {
      return [];
    }

    // Find flights with available seats
    const flights = await prisma.flight.findMany({
      where: {
        routeId: route.id,
        departTime: {
          gte: startDate,
          lte: endDate,
        },
        status: 'SCHEDULED',
        seatInventories: {
          some: {
            cabinClass: cabinClass,
            remainingSeats: { gte: passengers },
          },
        },
      },
      include: {
        route: {
          include: {
            fromAirport: true,
            toAirport: true,
          },
        },
        aircraft: true,
        seatInventories: {
          where: { cabinClass },
        },
      },
    });

    // Calculate prices and format response
    const formattedFlights = flights.map(flight => {
      const inventory = flight.seatInventories[0];
      const basePrice = Number(flight.route.basePrice);
      const multiplier = Number(inventory.priceMultiplier);
      const totalPrice = basePrice * multiplier * passengers;

      return {
        id: flight.id,
        flightNumber: flight.flightNumber,
        from: {
          code: flight.route.fromAirport.code,
          name: flight.route.fromAirport.name,
          city: flight.route.fromAirport.city,
        },
        to: {
          code: flight.route.toAirport.code,
          name: flight.route.toAirport.name,
          city: flight.route.toAirport.city,
        },
        departTime: flight.departTime,
        arriveTime: flight.arriveTime,
        duration: flight.duration,
        aircraft: flight.aircraft.model,
        cabinClass,
        availableSeats: inventory.remainingSeats,
        pricePerPerson: basePrice * multiplier,
        totalPrice,
      };
    });

    // Sort results
    if (sortBy) {
      formattedFlights.sort((a, b) => {
        switch (sortBy) {
          case 'price_asc':
            return a.totalPrice - b.totalPrice;
          case 'price_desc':
            return b.totalPrice - a.totalPrice;
          case 'time_asc':
            return a.departTime.getTime() - b.departTime.getTime();
          case 'time_desc':
            return b.departTime.getTime() - a.departTime.getTime();
          default:
            return 0;
        }
      });
    }

    return formattedFlights;
  }

  async getFlightDetail(flightId: string) {
    const flight = await prisma.flight.findUnique({
      where: { id: flightId },
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
    });

    if (!flight) {
      throw new AppError('Flight not found', 404);
    }

    return flight;
  }
}
```

### src/controllers/searchController.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { SearchService } from '../services/searchService';

const searchService = new SearchService();

export class SearchController {
  async searchFlights(req: Request, res: Response, next: NextFunction) {
    try {
      const flights = await searchService.searchFlights(req.query as any);
      res.json({
        success: true,
        data: flights,
        count: flights.length,
      });
    } catch (error) {
      next(error);
    }
  }

  async getFlightDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const flight = await searchService.getFlightDetail(req.params.id);
      res.json({
        success: true,
        data: flight,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### src/routes/search.routes.ts
```typescript
import { Router } from 'express';
import { SearchController } from '../controllers/searchController';
import { validate } from '../middlewares/validate';
import { searchFlightsSchema, getFlightDetailSchema } from '../validations/searchSchema';

const router = Router();
const searchController = new SearchController();

router.get('/flights', validate(searchFlightsSchema), searchController.searchFlights);
router.get('/flights/:id', validate(getFlightDetailSchema), searchController.getFlightDetail);

export default router;
```

---

## 2. Booking Module

### src/validations/bookingSchema.ts
```typescript
import { z } from 'zod';
import { CabinClass, PassengerType } from '@prisma/client';

export const createBookingSchema = z.object({
  body: z.object({
    flightId: z.string().uuid(),
    cabinClass: z.nativeEnum(CabinClass),
    passengers: z.array(z.object({
      type: z.nativeEnum(PassengerType),
      fullName: z.string().min(2),
      dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
      idNumber: z.string().optional(),
    })).min(1),
    contactName: z.string().min(2),
    contactPhone: z.string().regex(/^[0-9]{10}$/),
    contactEmail: z.string().email(),
    couponCode: z.string().optional(),
  }),
});

export const cancelBookingSchema = z.object({
  params: z.object({
    id: z.string().uuid(),
  }),
});
```

### src/services/bookingService.ts
```typescript
import prisma from '../config/database';
import { CabinClass, PassengerType, BookingStatus } from '@prisma/client';
import { AppError } from '../utils/errors';

export class BookingService {
  async createBooking(
    userId: string,
    data: {
      flightId: string;
      cabinClass: CabinClass;
      passengers: Array<{
        type: PassengerType;
        fullName: string;
        dob: string;
        gender: string;
        idNumber?: string;
      }>;
      contactName: string;
      contactPhone: string;
      contactEmail: string;
      couponCode?: string;
    }
  ) {
    return await prisma.$transaction(async (tx) => {
      // 1. Get flight and seat inventory
      const flight = await tx.flight.findUnique({
        where: { id: data.flightId },
        include: {
          route: true,
          seatInventories: {
            where: { cabinClass: data.cabinClass },
          },
        },
      });

      if (!flight) {
        throw new AppError('Flight not found', 404);
      }

      const inventory = flight.seatInventories[0];
      if (!inventory) {
        throw new AppError('Cabin class not available', 400);
      }

      // 2. Check seat availability
      const passengersCount = data.passengers.length;
      if (inventory.remainingSeats < passengersCount) {
        throw new AppError('Not enough seats available', 400);
      }

      // 3. Calculate price
      const basePrice = Number(flight.route.basePrice);
      const multiplier = Number(inventory.priceMultiplier);
      let totalAmount = basePrice * multiplier * passengersCount;

      // 4. Apply coupon if provided
      let discount = 0;
      if (data.couponCode) {
        const coupon = await tx.coupon.findUnique({
          where: { code: data.couponCode },
        });

        if (coupon && coupon.isActive) {
          const now = new Date();
          if (now >= coupon.startAt && now <= coupon.endAt && coupon.usedCount < coupon.maxUses) {
            if (coupon.discountType === 'PERCENT') {
              discount = (totalAmount * Number(coupon.value)) / 100;
            } else {
              discount = Number(coupon.value);
            }
            
            // Update coupon usage
            await tx.coupon.update({
              where: { id: coupon.id },
              data: { usedCount: { increment: 1 } },
            });
          }
        }
      }

      totalAmount -= discount;

      // 5. Create booking
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 15);

      const booking = await tx.booking.create({
        data: {
          userId,
          flightId: data.flightId,
          cabinClass: data.cabinClass,
          passengersCount,
          contactName: data.contactName,
          contactPhone: data.contactPhone,
          contactEmail: data.contactEmail,
          totalAmount,
          couponCode: data.couponCode,
          discount,
          status: BookingStatus.PENDING_PAYMENT,
          expiresAt,
        },
      });

      // 6. Create passengers
      await tx.bookingPassenger.createMany({
        data: data.passengers.map(p => ({
          bookingId: booking.id,
          type: p.type,
          fullName: p.fullName,
          dob: new Date(p.dob),
          gender: p.gender,
          idNumber: p.idNumber,
        })),
      });

      // 7. Decrease seat inventory
      await tx.seatInventory.update({
        where: { id: inventory.id },
        data: {
          remainingSeats: { decrement: passengersCount },
        },
      });

      // 8. Return booking with passengers
      return await tx.booking.findUnique({
        where: { id: booking.id },
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
          passengers: true,
        },
      });
    });
  }

  async getMyBookings(userId: string) {
    return await prisma.booking.findMany({
      where: { userId },
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
        passengers: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getBookingById(bookingId: string, userId: string) {
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId,
      },
      include: {
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
        payments: true,
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    return booking;
  }

  async cancelBooking(bookingId: string, userId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findFirst({
        where: { id: bookingId, userId },
        include: { flight: { include: { seatInventories: true } } },
      });

      if (!booking) {
        throw new AppError('Booking not found', 404);
      }

      if (booking.status !== BookingStatus.PENDING_PAYMENT) {
        throw new AppError('Cannot cancel this booking', 400);
      }

      // Update booking status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: BookingStatus.CANCELLED },
      });

      // Restore seat inventory
      const inventory = booking.flight.seatInventories.find(
        inv => inv.cabinClass === booking.cabinClass
      );

      if (inventory) {
        await tx.seatInventory.update({
          where: { id: inventory.id },
          data: {
            remainingSeats: { increment: booking.passengersCount },
          },
        });
      }

      return booking;
    });
  }
}
```

### src/controllers/bookingController.ts
```typescript
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { BookingService } from '../services/bookingService';

const bookingService = new BookingService();

export class BookingController {
  async createBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.createBooking(req.user!.id, req.body);
      res.status(201).json({
        success: true,
        message: 'Booking created successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async getMyBookings(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const bookings = await bookingService.getMyBookings(req.user!.id);
      res.json({
        success: true,
        data: bookings,
      });
    } catch (error) {
      next(error);
    }
  }

  async getBookingById(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.getBookingById(req.params.id, req.user!.id);
      res.json({
        success: true,
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }

  async cancelBooking(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const booking = await bookingService.cancelBooking(req.params.id, req.user!.id);
      res.json({
        success: true,
        message: 'Booking cancelled successfully',
        data: booking,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 3. MoMo Payment Integration

### src/services/momoService.ts
```typescript
import crypto from 'crypto';
import axios from 'axios';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

interface MoMoConfig {
  partnerCode: string;
  accessKey: string;
  secretKey: string;
  endpoint: string;
  ipnUrl: string;
  returnUrl: string;
}

export class MoMoService {
  private config: MoMoConfig;

  constructor() {
    this.config = {
      partnerCode: process.env.MOMO_PARTNER_CODE!,
      accessKey: process.env.MOMO_ACCESS_KEY!,
      secretKey: process.env.MOMO_SECRET_KEY!,
      endpoint: process.env.MOMO_ENDPOINT!,
      ipnUrl: process.env.MOMO_IPN_URL!,
      returnUrl: process.env.MOMO_RETURN_URL!,
    };
  }

  generateSignature(data: Record<string, any>): string {
    const rawSignature = Object.keys(data)
      .sort()
      .map(key => `${key}=${data[key]}`)
      .join('&');

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(rawSignature)
      .digest('hex');
  }

  async createPayment(params: {
    bookingId: string;
    amount: number;
    orderInfo: string;
  }) {
    const { bookingId, amount, orderInfo } = params;

    const orderId = `FLIGHT_${Date.now()}_${bookingId.slice(0, 8)}`;
    const requestId = `REQ_${Date.now()}`;

    const requestData = {
      accessKey: this.config.accessKey,
      amount: amount.toString(),
      extraData: Buffer.from(JSON.stringify({ bookingId })).toString('base64'),
      ipnUrl: this.config.ipnUrl,
      orderId,
      orderInfo,
      partnerCode: this.config.partnerCode,
      redirectUrl: this.config.returnUrl,
      requestId,
      requestType: 'captureWallet',
    };

    const signature = this.generateSignature(requestData);

    try {
      const response = await axios.post(this.config.endpoint, {
        ...requestData,
        signature,
        lang: 'en',
      });

      logger.info('MoMo payment created:', { orderId, requestId });

      return {
        orderId,
        requestId,
        payUrl: response.data.payUrl,
        qrCodeUrl: response.data.qrCodeUrl,
        deeplink: response.data.deeplink,
      };
    } catch (error: any) {
      logger.error('MoMo payment creation failed:', error.response?.data || error.message);
      throw new AppError('Failed to create payment', 500);
    }
  }

  verifySignature(data: Record<string, any>, receivedSignature: string): boolean {
    const calculatedSignature = this.generateSignature(data);
    return calculatedSignature === receivedSignature;
  }

  async handleIPN(ipnData: any) {
    const {
      accessKey,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId,
      signature,
    } = ipnData;

    // Verify signature
    const verifyData = {
      accessKey,
      amount,
      extraData,
      message,
      orderId,
      orderInfo,
      orderType,
      partnerCode,
      payType,
      requestId,
      responseTime,
      resultCode,
      transId,
    };

    const isValid = this.verifySignature(verifyData, signature);

    if (!isValid) {
      logger.error('Invalid MoMo signature:', { orderId });
      throw new AppError('Invalid signature', 400);
    }

    // Decode extraData to get bookingId
    const decodedExtraData = JSON.parse(Buffer.from(extraData, 'base64').toString());
    const bookingId = decodedExtraData.bookingId;

    return {
      bookingId,
      orderId,
      requestId,
      transId,
      amount: parseInt(amount),
      resultCode: parseInt(resultCode),
      message,
      payType,
      rawResponse: ipnData,
    };
  }
}
```

### src/services/paymentService.ts
```typescript
import prisma from '../config/database';
import { BookingStatus, PaymentStatus } from '@prisma/client';
import { MoMoService } from './momoService';
import { AppError } from '../utils/errors';
import logger from '../config/logger';

export class PaymentService {
  private momoService: MoMoService;

  constructor() {
    this.momoService = new MoMoService();
  }

  async createMoMoPayment(bookingId: string, userId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        flight: {
          include: {
            route: {
              include: { fromAirport: true, toAirport: true },
            },
          },
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    if (booking.status !== BookingStatus.PENDING_PAYMENT) {
      throw new AppError('Booking is not pending payment', 400);
    }

    // Check if booking expired
    if (new Date() > booking.expiresAt) {
      throw new AppError('Booking has expired', 400);
    }

    const amount = Math.round(Number(booking.totalAmount));
    const orderInfo = `Flight ${booking.flight.flightNumber} - ${booking.flight.route.fromAirport.code} to ${booking.flight.route.toAirport.code}`;

    // Create payment in MoMo
    const momoResponse = await this.momoService.createPayment({
      bookingId: booking.id,
      amount,
      orderInfo,
    });

    // Save payment record
    await prisma.payment.create({
      data: {
        bookingId: booking.id,
        provider: 'MOMO',
        amount: booking.totalAmount,
        orderId: momoResponse.orderId,
        requestId: momoResponse.requestId,
        status: PaymentStatus.PENDING,
      },
    });

    return momoResponse;
  }

  async handleMoMoIPN(ipnData: any) {
    const result = await this.momoService.handleIPN(ipnData);

    return await prisma.$transaction(async (tx) => {
      // Find payment
      const payment = await tx.payment.findUnique({
        where: { orderId: result.orderId },
        include: { booking: true },
      });

      if (!payment) {
        logger.error('Payment not found for IPN:', { orderId: result.orderId });
        throw new AppError('Payment not found', 404);
      }

      // Update payment
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          transId: result.transId,
          payType: result.payType,
          status: result.resultCode === 0 ? PaymentStatus.SUCCESS : PaymentStatus.FAILED,
          rawResponseJson: JSON.stringify(result.rawResponse),
        },
      });

      // Update booking if payment success
      if (result.resultCode === 0) {
        const eTicketCode = this.generateETicketCode(payment.booking.flightId, payment.bookingId);

        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: BookingStatus.PAID,
            eTicketCode,
          },
        });

        logger.info('Payment successful:', {
          bookingId: payment.bookingId,
          orderId: result.orderId,
          eTicketCode,
        });
      } else {
        logger.warn('Payment failed:', {
          bookingId: payment.bookingId,
          orderId: result.orderId,
          resultCode: result.resultCode,
        });
      }

      return { success: result.resultCode === 0 };
    });
  }

  private generateETicketCode(flightId: string, bookingId: string): string {
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    const bookingShort = bookingId.slice(0, 8).toUpperCase();
    return `VN${bookingShort}${random}`;
  }

  async getPaymentStatus(bookingId: string, userId: string) {
    const booking = await prisma.booking.findFirst({
      where: { id: bookingId, userId },
      include: {
        payments: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!booking) {
      throw new AppError('Booking not found', 404);
    }

    return {
      bookingStatus: booking.status,
      eTicketCode: booking.eTicketCode,
      payment: booking.payments[0] || null,
    };
  }
}
```

### src/controllers/paymentController.ts
```typescript
import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { PaymentService } from '../services/paymentService';

const paymentService = new PaymentService();

export class PaymentController {
  async createMoMoPayment(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.body;
      const result = await paymentService.createMoMoPayment(bookingId, req.user!.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  async handleMoMoIPN(req: Request, res: Response, next: NextFunction) {
    try {
      await paymentService.handleMoMoIPN(req.body);
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }

  async handleMoMoReturn(req: Request, res: Response, next: NextFunction) {
    try {
      // Redirect to frontend with query params
      const { orderId, resultCode } = req.query;
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
      res.redirect(`${frontendUrl}/payment/status?orderId=${orderId}&resultCode=${resultCode}`);
    } catch (error) {
      next(error);
    }
  }

  async getPaymentStatus(req: AuthRequest, res: Response, next: NextFunction) {
    try {
      const { bookingId } = req.params;
      const result = await paymentService.getPaymentStatus(bookingId, req.user!.id);
      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}
```

---

## 4. Booking Expiration Cron Job

### src/jobs/bookingExpiration.ts
```typescript
import cron from 'node-cron';
import prisma from '../config/database';
import { BookingStatus } from '@prisma/client';
import logger from '../config/logger';

export function startBookingExpirationJob() {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();

      // Find expired bookings
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: BookingStatus.PENDING_PAYMENT,
          expiresAt: { lt: now },
        },
        include: {
          flight: {
            include: { seatInventories: true },
          },
        },
      });

      if (expiredBookings.length === 0) {
        return;
      }

      logger.info(`Found ${expiredBookings.length} expired bookings`);

      // Process each expired booking
      for (const booking of expiredBookings) {
        await prisma.$transaction(async (tx) => {
          // Update booking status
          await tx.booking.update({
            where: { id: booking.id },
            data: { status: BookingStatus.EXPIRED },
          });

          // Restore seat inventory
          const inventory = booking.flight.seatInventories.find(
            inv => inv.cabinClass === booking.cabinClass
          );

          if (inventory) {
            await tx.seatInventory.update({
              where: { id: inventory.id },
              data: {
                remainingSeats: { increment: booking.passengersCount },
              },
            });
          }

          logger.info(`Expired booking ${booking.id}, restored ${booking.passengersCount} seats`);
        });
      }
    } catch (error) {
      logger.error('Booking expiration job failed:', error);
    }
  });

  logger.info('✅ Booking expiration cron job started');
}
```

### Update src/server.ts
```typescript
import app from './app';
import logger from './config/logger';
import prisma from './config/database';
import { startBookingExpirationJob } from './jobs/bookingExpiration';

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected');

    // Start cron jobs
    startBookingExpirationJob();

    app.listen(PORT, () => {
      logger.info(`🚀 Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
```

---

## 5. Routes Configuration

### Update src/routes/index.ts
```typescript
import { Router } from 'express';
import authRoutes from './auth.routes';
import searchRoutes from './search.routes';
import bookingRoutes from './booking.routes';
import paymentRoutes from './payment.routes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/search', searchRoutes);
router.use('/bookings', bookingRoutes);
router.use('/payments', paymentRoutes);

export default router;
```

### src/routes/booking.routes.ts
```typescript
import { Router } from 'express';
import { BookingController } from '../controllers/bookingController';
import { authenticate } from '../middlewares/auth';
import { validate } from '../middlewares/validate';
import { createBookingSchema, cancelBookingSchema } from '../validations/bookingSchema';

const router = Router();
const bookingController = new BookingController();

router.use(authenticate); // All booking routes require auth

router.post('/', validate(createBookingSchema), bookingController.createBooking);
router.get('/my', bookingController.getMyBookings);
router.get('/:id', bookingController.getBookingById);
router.patch('/:id/cancel', validate(cancelBookingSchema), bookingController.cancelBooking);

export default router;
```

### src/routes/payment.routes.ts
```typescript
import { Router } from 'express';
import { PaymentController } from '../controllers/paymentController';
import { authenticate } from '../middlewares/auth';

const router = Router();
const paymentController = new PaymentController();

router.post('/momo/create', authenticate, paymentController.createMoMoPayment);
router.post('/momo/ipn', paymentController.handleMoMoIPN);
router.get('/momo/return', paymentController.handleMoMoReturn);
router.get('/:bookingId/status', authenticate, paymentController.getPaymentStatus);

export default router;
```

---

## 6. Testing Flow

### 1. Search Flights
```bash
GET http://localhost:3000/api/search/flights?fromAirportCode=HAN&toAirportCode=SGN&departDate=2026-02-01&passengers=2&cabinClass=ECONOMY
```

### 2. Create Booking
```bash
POST http://localhost:3000/api/bookings
Authorization: Bearer <token>
Content-Type: application/json

{
  "flightId": "<flight-id>",
  "cabinClass": "ECONOMY",
  "passengers": [
    {
      "type": "ADULT",
      "fullName": "Nguyen Van A",
      "dob": "1990-01-01",
      "gender": "MALE",
      "idNumber": "123456789"
    }
  ],
  "contactName": "Nguyen Van A",
  "contactPhone": "0123456789",
  "contactEmail": "test@example.com",
  "couponCode": "NEWYEAR2026"
}
```

### 3. Create Payment
```bash
POST http://localhost:3000/api/payments/momo/create
Authorization: Bearer <token>
Content-Type: application/json

{
  "bookingId": "<booking-id>"
}
```

### 4. Test IPN (simulate MoMo callback)
```bash
POST http://localhost:3000/api/payments/momo/ipn
Content-Type: application/json

{
  "partnerCode": "MOMOBKUN20180529",
  "orderId": "FLIGHT_...",
  "requestId": "REQ_...",
  "amount": "3000000",
  "resultCode": 0,
  "message": "Success",
  ...
}
```

---

## Next Steps
→ Proceed to **Plan 04: Admin APIs**
