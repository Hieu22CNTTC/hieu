import prisma from './config/database.js';

async function checkData() {
  try {
    console.log('=== CHECKING SYSTEM DATA ===\n');

    // Check flights
    const flights = await prisma.flight.findMany({
      select: { id: true, flightNumber: true, departureTime: true, basePrice: true, businessPrice: true }
    });
    console.log(`✅ Total Flights: ${flights.length}`);
    if (flights.length > 0) {
      console.log('Sample Flight:', flights[0]);
    }

    // Check users
    const users = await prisma.user.findMany({
      select: { id: true, email: true, role: true, createdAt: true }
    });
    console.log(`\n✅ Total Users: ${users.length}`);
    if (users.length > 0) {
      console.log('Sample User:', users[0]);
    }

    // Check bookings
    const bookings = await prisma.booking.findMany({
      include: { flight: { select: { flightNumber: true } }, passengers: true },
      take: 5
    });
    console.log(`\n✅ Total Bookings: ${bookings.length}`);
    if (bookings.length > 0) {
      console.log('Recent Bookings:');
      bookings.forEach((b, i) => {
        console.log(`  [${i+1}] Code: ${b.bookingCode}, Status: ${b.status}, Total: ${b.totalAmount}, Passengers: ${b.passengers.length}`);
      });
    }

    // Check seat inventory
    const seats = await prisma.seatInventory.findMany();
    console.log(`\n✅ Total Seat Inventory Records: ${seats.length}`);
    if (seats.length > 0) {
      console.log('Sample Seat Inventory:', seats[0]);
    }

    // Check payments
    const payments = await prisma.payment.findMany({
      include: { booking: { select: { bookingCode: true } } },
      take: 5
    });
    console.log(`\n✅ Total Payments: ${payments.length}`);
    if (payments.length > 0) {
      console.log('Recent Payments:');
      payments.forEach((p, i) => {
        console.log(`  [${i+1}] Amount: ${p.amount}, Status: ${p.status}, Method: ${p.paymentMethod}`);
      });
    }

    // Check if any booking needs testing
    const pendingBookings = await prisma.booking.findMany({
      where: { status: 'PENDING' },
      include: { flight: true, passengers: true },
      take: 3
    });
    console.log(`\n✅ Total PENDING Bookings: ${pendingBookings.length}`);
    if (pendingBookings.length > 0) {
      console.log('\n📌 PENDING Bookings Available for Testing:');
      pendingBookings.forEach((b, i) => {
        console.log(`\n  [${i+1}] Booking Code: ${b.bookingCode}`);
        console.log(`      Flight: ${b.flight.flightNumber}`);
        console.log(`      Amount: ${b.totalAmount} VND`);
        console.log(`      Passengers: ${b.passengers.length}`);
        console.log(`      Contact: ${b.contactEmail}`);
      });
    }

  } catch (error) {
    console.error('❌ Error checking data:', error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkData();
