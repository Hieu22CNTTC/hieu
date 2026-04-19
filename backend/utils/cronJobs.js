import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import logger from '../utils/logger.js';
import { crawlAndStoreFlightsFromHtml } from '../services/htmlFlightCrawlerService.js';

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

/**
 * Crawl HTML source and upsert flights
 * Default schedule: every 8 hours
 */
export const startFlightHtmlCrawlJob = () => {
  const enabled = String(process.env.CRAWL_JOB_ENABLED ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    logger.info('[Cron] Flight HTML crawl job disabled (CRAWL_JOB_ENABLED=false)');
    return;
  }

  const schedule = process.env.CRAWL_JOB_SCHEDULE || '0 */8 * * *';

  const CRAWL_AIRPORTS = [
    { code: 'HAN', url: 'https://r.jina.ai/http://www.airportia.com/vietnam/noi-bai-international-airport/departures/' },
    { code: 'SGN', url: 'https://r.jina.ai/http://www.airportia.com/vietnam/tan-son-nhat-international-airport/departures/' },
    { code: 'DAD', url: 'https://r.jina.ai/http://www.airportia.com/vietnam/da-nang-international-airport/departures/' },
  ];

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

  cron.schedule(schedule, async () => {
    logger.info('[Cron] Starting flight crawl for all airports...');
    let totalImported = 0;
    let totalSkipped = 0;
    for (const airport of CRAWL_AIRPORTS) {
      try {
        process.env.CRAWL_SOURCE_URL = airport.url;
        process.env.CRAWL_ORIGIN_CODE = airport.code;
        process.env.CRAWL_SOURCE_MODE = 'markdown';
        const result = await crawlAndStoreFlightsFromHtml();
        totalImported += result.imported || 0;
        totalSkipped += result.skipped || 0;
        logger.info(`[Cron] ${airport.code}: imported=${result.imported || 0}, skipped=${result.skipped || 0}`);
      } catch (err) {
        logger.error(`[Cron] ${airport.code} crawl failed: ${err.message}`);
      }
      await sleep(3000);
    }
    logger.info(`[Cron] Crawl done. Total imported=${totalImported}, skipped=${totalSkipped}`);
  });

  logger.info(`[Cron] Flight HTML crawl job started - schedule: ${schedule} (airports: HAN, SGN, DAD)`);
};

/**
 * Delete all expired flights that have already departed
 * Safety: only removes flights that do not have any bookings
 * Default schedule: every 8 hours
 */
export const startExpiredFlightCleanupJob = () => {
  const enabled = String(process.env.EXPIRED_FLIGHT_CLEANUP_ENABLED ?? 'true').toLowerCase() !== 'false';
  if (!enabled) {
    logger.info('[Cron] Expired flight cleanup disabled (EXPIRED_FLIGHT_CLEANUP_ENABLED=false)');
    return;
  }

  const schedule = process.env.EXPIRED_FLIGHT_CLEANUP_SCHEDULE || '15 */8 * * *';

  cron.schedule(schedule, async () => {
    try {
      const now = new Date();

      // Find expired flights with no bookings
      const expiredFlights = await prisma.flight.findMany({
        where: {
          departureTime: { lt: now },
          bookings: {
            none: {}
          }
        },
        select: { id: true, flightNumber: true }
      });

      if (expiredFlights.length === 0) return;

      const ids = expiredFlights.map(f => f.id);

      // Delete seat inventory first (FK constraint)
      await prisma.seatInventory.deleteMany({ where: { flightId: { in: ids } } });
      // Delete seat holds
      await prisma.seatHold.deleteMany({ where: { flightId: { in: ids } } });
      // Delete flights
      const deleted = await prisma.flight.deleteMany({ where: { id: { in: ids } } });

      logger.info(`[Cron] Deleted ${deleted.count} expired flights (manual + crawled)`);
    } catch (error) {
      logger.error(`[Cron] Expired flight cleanup failed: ${error.message}`);
    }
  });

  logger.info(`[Cron] Expired flight cleanup job started - schedule: ${schedule}`);
};
