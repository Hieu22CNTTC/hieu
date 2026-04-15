import fetch from 'node-fetch';
import prisma from './config/database.js';

async function testPaymentAPI() {
  try {
    console.log('=== TESTING PAYMENT API ===\n');

    // Get a PENDING booking
    const booking = await prisma.booking.findFirst({
      where: { status: 'PENDING' },
      include: { flight: true }
    });

    if (!booking) {
      console.log('❌ No PENDING bookings found!');
      process.exit(1);
    }

    console.log(`📌 Testing with Booking: ${booking.bookingCode}`);
    console.log(`   Amount: ${booking.totalAmount} VND`);
    console.log(`   Flight: ${booking.flight.flightNumber}\n`);

    // Make payment request
    const response = await fetch('http://localhost:3000/api/payments/momo', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        bookingId: booking.id
      })
    });

    const data = await response.json();
    
    console.log(`📡 API Response Status: ${response.status}`);
    console.log(`📊 API Response:\n`, JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Payment URL generated successfully!');
      console.log(`🔗 Payment URL: ${data.data?.paymentUrl}`);
    } else {
      console.log('\n❌ Payment API Error:');
      console.log(`   Message: ${data.message}`);
      console.log(`   Error: ${data.error}`);
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

testPaymentAPI();
