import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

/**
 * Auto-release expired seat holds every minute
 */
export const startSeatCleanupJob = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const result = await prisma.seatHold.deleteMany({
        where: {
          expiresAt: { lt: new Date() }
        }
      });

      if (result.count > 0) {
        logger.info(`[Cron] Released ${result.count} expired seat holds`);
      }
    } catch (error) {
      logger.error('[Cron] Error releasing expired seats:', error);
    }
  });

  logger.info('[Cron] Seat cleanup job started - runs every minute');
};

/**
 * Auto-cleanup old PENDING payments every 30 minutes
 * Delete payments older than 5 minutes that are still PENDING
 */
export const startPaymentCleanupJob = () => {
  // Run every 30 minutes
  cron.schedule('0 */30 * * * *', async () => {
    try {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      // Find old pending payments to delete
      const oldPayments = await prisma.payment.findMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: fiveMinutesAgo }
        },
        include: {
          booking: true
        }
      });

      // Delete them
      const result = await prisma.payment.deleteMany({
        where: {
          status: 'PENDING',
          createdAt: { lt: fiveMinutesAgo }
        }
      });

      if (result.count > 0) {
        logger.info(`[Cron] Cleaned up ${result.count} old PENDING payments`);
        oldPayments.forEach(payment => {
          logger.debug(`  • Booking: ${payment.booking.bookingCode}, Age: ${Math.floor((Date.now() - payment.createdAt) / 60000)}m`);
        });
      }
    } catch (error) {
      logger.error('[Cron] Error cleaning up old payments:', error);
    }
  });

  logger.info('[Cron] Payment cleanup job started - runs every 30 minutes');
};

/**
 * Auto-cancel expired bookings every 5 minutes
 * PENDING bookings that have exceeded expiresAt time are marked as CANCELLED
 */
export const startBookingExpirationJob = () => {
  // Run every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      const now = new Date();
      
      // Find expired bookings
      const expiredBookings = await prisma.booking.findMany({
        where: {
          status: 'PENDING',
          expiresAt: { lt: now }
        }
      });

      if (expiredBookings.length > 0) {
        // Update bookings
        const updateResult = await prisma.booking.updateMany({
          where: {
            status: 'PENDING',
            expiresAt: { lt: now }
          },
          data: {
            status: 'CANCELLED'
          }
        });

        // Clean up associated seat holds
        await prisma.seatHold.deleteMany({
          where: {
            bookingId: {
              in: expiredBookings.map(b => b.id)
            }
          }
        });

        logger.info(`[Cron] Cancelled ${updateResult.count} expired bookings`);
        expiredBookings.forEach(booking => {
          const expiredMinutes = Math.floor((now - booking.expiresAt) / 60000);
          logger.debug(`  • ${booking.bookingCode} - Expired ${expiredMinutes}m ago`);
        });
      }
    } catch (error) {
      logger.error('[Cron] Error cancelling expired bookings:', error);
    }
  });

  logger.info('[Cron] Booking expiration job started - runs every 5 minutes');
};
