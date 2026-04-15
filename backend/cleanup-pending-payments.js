#!/usr/bin/env node

/**
 * Cleanup script for old PENDING payments
 * Xóa tất cả PENDING payments cũ (> 5 phút)
 */

import prisma from './config/database.js';
import logger from './utils/logger.js';

async function cleanupPendingPayments() {
  console.log('\n🧹 Cleaning up old PENDING payments...\n');

  try {
    // Calculate 5 minutes ago
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

    // Find payments to delete
    const paymentsToDelete = await prisma.payment.findMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: fiveMinutesAgo
        }
      },
      include: {
        booking: true
      }
    });

    console.log(`Found ${paymentsToDelete.length} old PENDING payments to delete:\n`);

    // Display info about payments to delete
    paymentsToDelete.forEach(payment => {
      const createdAt = new Date(payment.createdAt).toLocaleString('vi-VN');
      const ageMinutes = Math.floor((Date.now() - payment.createdAt) / 60000);
      console.log(`  📌 Payment ID: ${payment.id}`);
      console.log(`     Booking: ${payment.booking.bookingCode}`);
      console.log(`     Amount: ${payment.amount} VND`);
      console.log(`     Created: ${createdAt} (${ageMinutes} minutes ago)`);
      console.log(`     MoMo Order: ${payment.momoOrderId || 'N/A'}\n`);
    });

    // Delete all old PENDING payments
    const result = await prisma.payment.deleteMany({
      where: {
        status: 'PENDING',
        createdAt: {
          lt: fiveMinutesAgo
        }
      }
    });

    console.log(`\n✅ Successfully deleted ${result.count} old PENDING payments\n`);
    logger.info(`Cleanup: Deleted ${result.count} old PENDING payments`);

    // Show remaining PENDING payments
    const remainingPending = await prisma.payment.findMany({
      where: {
        status: 'PENDING'
      },
      include: {
        booking: true
      }
    });

    if (remainingPending.length > 0) {
      console.log(`⚠️  ${remainingPending.length} recent PENDING payments still exist:\n`);
      remainingPending.forEach(payment => {
        const createdAt = new Date(payment.createdAt).toLocaleString('vi-VN');
        const ageSeconds = Math.floor((Date.now() - payment.createdAt) / 1000);
        console.log(`  • ${payment.booking.bookingCode} - Created ${ageSeconds}s ago`);
      });
      console.log('\n');
    } else {
      console.log('✨ No recent PENDING payments. System is clean!\n');
    }

  } catch (error) {
    console.error('❌ Error cleaning up payments:', error.message);
    logger.error('Cleanup error:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run cleanup
cleanupPendingPayments();
