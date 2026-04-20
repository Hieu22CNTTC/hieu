import crypto from 'crypto';
import prisma from '../config/database.js';
import logger from '../utils/logger.js';
import { fetchMoMoPaymentUrl } from '../utils/momoMock.js';
import { generateETicketCode } from '../utils/ticketGenerator.js';

/**
 * Generate MoMo payment URL
 */
export const createMoMoPayment = async (req, res) => {
  try {
    const { bookingId } = req.body;

    if (!bookingId) {
      return res.status(400).json({
        success: false,
        message: 'Booking ID is required'
      });
    }

    // Get booking with user info
    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { 
        flight: { select: { flightNumber: true } },
        user: { select: { fullName: true, email: true, phoneNumber: true } }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }

    // Check if already paid
    const existingPayment = await prisma.payment.findFirst({
      where: {
        bookingId: booking.id,
        status: 'SUCCESS'
      }
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: 'Booking already paid'
      });
    }

    // MoMo config
    const partnerCode = process.env.MOMO_PARTNER_CODE;
    const accessKey = process.env.MOMO_ACCESS_KEY;
    const secretKey = process.env.MOMO_SECRET_KEY;
    const endpoint = process.env.MOMO_ENDPOINT;
    const returnUrl = process.env.MOMO_REDIRECT_URL;
    const ipnUrl = process.env.MOMO_IPN_URL;

    // Generate IDs
    const orderId = `ORD_${booking.bookingCode}_${Date.now()}`;
    const requestId = `REQ_${booking.bookingCode}_${Date.now()}`;
    const pendingTransactionId = `PENDING_TX_${requestId}`;
    const pendingETicketCode = `PENDING_${requestId}`;
    const amount = Math.round(booking.totalAmount);
    const orderInfo = `Thanh toán vé máy bay ${booking.flight.flightNumber}`;
    const requestType = 'captureWallet';
    const extraData = Buffer.from(JSON.stringify({ bookingId: booking.id })).toString('base64');

    // Create signature - field names must match MoMo spec (alphabetical order)
    const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${returnUrl}&requestId=${requestId}&requestType=${requestType}`;
    
    const signature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    // Prepare userInfo (MoMo v3 feature)
    const userInfo = {
      name: booking.user?.fullName || '',
      phoneNumber: booking.user?.phoneNumber || '',
      email: booking.user?.email || ''
    };

    // Prepare request body (MoMo v3 compliant)
    const requestBody = {
      partnerCode,
      accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl: returnUrl,
      ipnUrl,
      requestType,
      extraData,
      signature,
      lang: 'vi',
      // MoMo v3 optional fields for better tracking
      storeName: 'TrungHieuFlight',
      storeId: 'TSF001',
      userInfo,
      referenceId: `USER_${booking.userId}`
    };

    logger.info(`[PAYMENT] Creating payment for booking ${booking.bookingCode}, amount: ${amount}`);

    // Create payment record
    const payment = await prisma.payment.create({
      data: {
        bookingId: booking.id,
        userId: booking.userId,
        amount: booking.totalAmount,
        status: 'PENDING',
        paymentMethod: 'MoMo',
        // SQL Server unique constraints allow only one NULL value,
        // so keep a unique placeholder before getting real transactionId.
        transactionId: pendingTransactionId,
        momoRequestId: requestId,
        momoOrderId: orderId,
        // SQL Server unique constraints allow only one NULL value,
        // so we store a temporary unique value and replace it after success.
        eTicketCode: pendingETicketCode
      }
    });

    logger.info(`[PAYMENT] Payment record created: ${payment.id}`);

    // Call MoMo API
    let momoResult;
    try {
      momoResult = await fetchMoMoPaymentUrl(requestBody, endpoint);
      logger.info(`[PAYMENT] MoMo response received successfully`);
    } catch (error) {
      logger.error(`[PAYMENT] MoMo error: ${error.message}`);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });
      
      return res.status(500).json({
        success: false,
        message: 'Failed to connect to payment gateway'
      });
    }

    const momoResponse = momoResult.data;

    if (momoResponse.resultCode === 0) {
      logger.info(`[PAYMENT] Success - payment URL: ${momoResponse.payUrl}`);
      return res.json({
        success: true,
        message: 'Payment URL generated',
        data: {
          paymentId: payment.id,
          paymentUrl: momoResponse.payUrl,
          qrCodeUrl: momoResponse.qrCodeUrl,
          deeplink: momoResponse.deeplink
        }
      });
    } else {
      logger.error(`[PAYMENT] MoMo returned error: ${momoResponse.message}`);
      await prisma.payment.update({
        where: { id: payment.id },
        data: { status: 'FAILED' }
      });
      
      return res.status(400).json({
        success: false,
        message: momoResponse.message || 'Payment creation failed'
      });
    }

  } catch (error) {
    logger.error(`[PAYMENT] Unexpected error: ${error.message}`);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
};

/**
 * Handle MoMo IPN (Instant Payment Notification) callback
 */
export const handleMoMoCallback = async (req, res) => {
  try {
    const {
      partnerCode,
      orderId,
      requestId,
      amount,
      orderInfo,
      orderType,
      transId,
      resultCode,
      message,
      payType,
      responseTime,
      extraData,
      signature,
      // MoMo v3 additional fields
      paymentOption,
      userFee,
      promotionInfo
    } = req.body;

    logger.info('=== MoMo IPN Callback Received ===');
    logger.info(`Order ID: ${orderId}, Result Code: ${resultCode}`);
    logger.info(`Trans ID: ${transId}, Message: ${message}`);
    logger.info(`Payment Method: ${paymentOption || 'N/A'}, User Fee: ${userFee || 0}`);
    if (promotionInfo) {
      logger.info(`Promotions Applied: ${JSON.stringify(promotionInfo)}`);
    }

    // Verify signature
    const secretKey = process.env.MOMO_SECRET_KEY;
    const rawSignature = `accessKey=${process.env.MOMO_ACCESS_KEY}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', secretKey)
      .update(rawSignature)
      .digest('hex');

    logger.info(`Signature verification: ${signature === expectedSignature ? 'VALID' : 'INVALID'}`);

    if (signature !== expectedSignature) {
      logger.error('Invalid MoMo callback signature');
      // Still return 204 to prevent MoMo retry
      return res.status(204).end();
    }

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: {
        momoRequestId: requestId,
        momoOrderId: orderId
      },
      include: {
        booking: true
      }
    });

    if (!payment) {
      logger.error(`Payment not found for requestId: ${requestId}`);
      // Still return 204 to prevent MoMo retry
      return res.status(204).end();
    }

    // Update payment and booking status
    if (resultCode === 0) {
      // Payment successful - Update BOTH payment and booking
      const eTicketCode = generateETicketCode();
      
      await prisma.$transaction(async (tx) => {
        // Update payment status with eTicket code
        await tx.payment.update({
          where: { id: payment.id },
          data: {
            status: 'SUCCESS',
            transactionId: transId.toString(),
            eTicketCode: eTicketCode,
            updatedAt: new Date()
          }
        });

        // Update booking status to CONFIRMED - THIS IS CRITICAL!
        await tx.booking.update({
          where: { id: payment.bookingId },
          data: {
            status: 'CONFIRMED',
            updatedAt: new Date()
          }
        });
      });

      logger.info(`✅ Payment SUCCESS - Booking ${payment.booking.bookingCode} CONFIRMED`);
      logger.info(`Transaction ID: ${transId}`);
      logger.info(`E-Ticket Code: ${eTicketCode}`);
    } else {
      // Payment failed - delete seat holds for this booking
      await prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: 'FAILED',
          transactionId: transId ? transId.toString() : `FAILED_TX_${payment.id}_${Date.now()}`,
          updatedAt: new Date()
        }
      });

      // Release seat holds for failed payment
      const releasedSeats = await prisma.seatHold.deleteMany({
        where: {
          bookingId: payment.bookingId
        }
      });

      logger.error(`❌ Payment FAILED - Booking ${payment.booking.bookingCode}`);
      logger.error(`Reason: ${message}`);
      if (releasedSeats.count > 0) {
        logger.info(`Released ${releasedSeats.count} seat holds due to payment failure`);
      }
    }

    // Always return 204 No Content to MoMo
    res.status(204).end();
  } catch (error) {
    logger.error('MoMo callback error:', error);
    // Still return 204 to prevent MoMo retry
    res.status(204).end();
  }
};

/**
 * Handle MoMo return URL (when user is redirected back)
 */
export const handleMoMoReturn = async (req, res) => {
  try {
    const { orderId, resultCode, message } = req.query;

    logger.info('=== MoMo Return URL ===');
    logger.info(`Order ID: ${orderId}, Result Code: ${resultCode}`);

    // Find payment
    const payment = await prisma.payment.findFirst({
      where: { momoOrderId: orderId },
      include: {
        booking: true
      }
    });

    if (!payment) {
      logger.error(`Payment not found for orderId: ${orderId}`);
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-management?status=error&message=Payment not found`);
    }

    if (resultCode === '0') {
      // Payment successful - update payment and booking status immediately
      try {
        const eTicketCode = payment.eTicketCode || generateETicketCode();
        
        await prisma.$transaction(async (tx) => {
          // Update payment status with eTicket if not already set
          await tx.payment.update({
            where: { id: payment.id },
            data: {
              status: 'SUCCESS',
              eTicketCode: eTicketCode,
              updatedAt: new Date()
            }
          });

          // Update booking status to CONFIRMED
          await tx.booking.update({
            where: { id: payment.bookingId },
            data: {
              status: 'CONFIRMED',
              updatedAt: new Date()
            }
          });
        });

        logger.info(`✅ User return - Payment SUCCESS for booking ${payment.booking.bookingCode}`);
        logger.info(`E-Ticket Code: ${eTicketCode}`);
      } catch (updateError) {
        logger.error('Error updating payment/booking status:', updateError);
      }

      // Redirect to confirmation page
      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/confirmation/${payment.booking.bookingCode}?payment=success`);
    } else {
      // Failed - release seat holds and redirect
      const releasedSeats = await prisma.seatHold.deleteMany({
        where: {
          bookingId: payment.bookingId
        }
      });

      logger.error(`❌ User return - Payment FAILED: ${message}`);
      if (releasedSeats.count > 0) {
        logger.info(`Released ${releasedSeats.count} seat holds due to payment failure`);
      }

      return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-management?status=failed&bookingCode=${payment.booking.bookingCode}&message=${encodeURIComponent(message || 'Payment failed')}`);
    }
  } catch (error) {
    logger.error('MoMo return error:', error);
    return res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}/booking-management?status=error&message=System error`);
  }
};

/**
 * Check payment status
 */
export const checkPaymentStatus = async (req, res) => {
  try {
    const { bookingId } = req.params;

    const payment = await prisma.payment.findFirst({
      where: {
        bookingId,
        paymentMethod: 'MoMo'
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: 'Payment not found'
      });
    }

    res.json({
      success: true,
      data: {
        id: payment.id,
        amount: payment.amount,
        status: payment.status,
        transactionId: payment.transactionId,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt
      }
    });
  } catch (error) {
    logger.error('Check payment status error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
      error: error.message
    });
  }
};
