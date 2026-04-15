import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Clear existing data
  console.log('🧹 Cleaning database...');
  await prisma.bookingPassenger.deleteMany();
  await prisma.payment.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.seatInventory.deleteMany();
  await prisma.flight.deleteMany();
  await prisma.route.deleteMany();
  await prisma.aircraft.deleteMany();
  await prisma.airport.deleteMany();
  await prisma.ticketType.deleteMany();
  await prisma.coupon.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Ticket Types (SRS Enhancement)
  console.log('🎫 Creating ticket types...');
  const ticketTypes = await Promise.all([
    prisma.ticketType.create({
      data: {
        id: 'tt_adult_001',
        name: 'ADULT',
        pricePercentage: 100,
        minAge: 12,
        maxAge: null,
        description: 'Adult passenger (12+ years old)',
      },
    }),
    prisma.ticketType.create({
      data: {
        id: 'tt_child_001',
        name: 'CHILD',
        pricePercentage: 75,
        minAge: 2,
        maxAge: 11,
        description: 'Child passenger (2-11 years old)',
      },
    }),
    prisma.ticketType.create({
      data: {
        id: 'tt_infant_001',
        name: 'INFANT',
        pricePercentage: 10,
        minAge: 0,
        maxAge: 1,
        description: 'Infant passenger (0-1 years old)',
      },
    }),
  ]);
  console.log(`✅ Created ${ticketTypes.length} ticket types`);

  // 2. Create Users with different roles
  console.log('👥 Creating users...');
  const adminPassword = await bcrypt.hash('admin', 10);
  const otherPassword = await bcrypt.hash('123', 10);
  
  const users = await Promise.all([
    prisma.user.create({
      data: {
        email: 'admin@flight.com',
        password: adminPassword,
        fullName: 'Admin User',
        phoneNumber: '0901234567',
        role: 'ADMIN',
      },
    }),
    prisma.user.create({
      data: {
        email: 'manager@flight.com',
        password: otherPassword,
        fullName: 'Manager User',
        phoneNumber: '0901234568',
        role: 'MANAGER',
      },
    }),
    prisma.user.create({
      data: {
        email: 'sales@flight.com',
        password: otherPassword,
        fullName: 'Sales User',
        phoneNumber: '0901234569',
        role: 'SALES',
      },
    }),
    prisma.user.create({
      data: {
        email: 'customer@gmail.com',
        password: otherPassword,
        fullName: 'Nguyen Van A',
        phoneNumber: '0909123456',
        role: 'USER',
      },
    }),
  ]);
  console.log(`✅ Created ${users.length} users`);

  // 3. Create Airports
  console.log('✈️ Creating airports...');
  const airports = await Promise.all([
    prisma.airport.create({
      data: {
        code: 'VN-HAN',
        name: 'Noi Bai International Airport',
        city: 'Hanoi',
        country: 'Vietnam',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    }),
    prisma.airport.create({
      data: {
        code: 'VN-SGN',
        name: 'Tan Son Nhat International Airport',
        city: 'Ho Chi Minh City',
        country: 'Vietnam',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    }),
    prisma.airport.create({
      data: {
        code: 'VN-DAD',
        name: 'Da Nang International Airport',
        city: 'Da Nang',
        country: 'Vietnam',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    }),
    prisma.airport.create({
      data: {
        code: 'VN-CXR',
        name: 'Cam Ranh International Airport',
        city: 'Nha Trang',
        country: 'Vietnam',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    }),
    prisma.airport.create({
      data: {
        code: 'VN-PQC',
        name: 'Phu Quoc International Airport',
        city: 'Phu Quoc',
        country: 'Vietnam',
        timezone: 'Asia/Ho_Chi_Minh',
      },
    }),
  ]);
  console.log(`✅ Created ${airports.length} airports`);

  // 4. Create Aircraft
  console.log('🛩️ Creating aircraft...');
  const aircraft = await Promise.all([
    prisma.aircraft.create({
      data: {
        model: 'Airbus A321',
        totalSeats: 184,
        businessSeats: 16,
        economySeats: 168,
      },
    }),
    prisma.aircraft.create({
      data: {
        model: 'Boeing 787-9',
        totalSeats: 280,
        businessSeats: 28,
        economySeats: 252,
      },
    }),
    prisma.aircraft.create({
      data: {
        model: 'Airbus A350-900',
        totalSeats: 305,
        businessSeats: 29,
        economySeats: 276,
      },
    }),
  ]);
  console.log(`✅ Created ${aircraft.length} aircraft types`);

  // 5. Create Routes
  console.log('🛣️ Creating routes...');
  const routes = await Promise.all([
    // Hanoi routes
    prisma.route.create({
      data: {
        departureId: airports[0].id, // HAN
        arrivalId: airports[1].id,   // SGN
        distance: 1160,
        duration: 120,
        standardPrice: 1500000,
        isActive: true,
      },
    }),
    prisma.route.create({
      data: {
        departureId: airports[0].id, // HAN
        arrivalId: airports[2].id,   // DAD
        distance: 620,
        duration: 75,
        standardPrice: 900000,
        isActive: true,
      },
    }),
    prisma.route.create({
      data: {
        departureId: airports[0].id, // HAN
        arrivalId: airports[3].id,   // CXR
        distance: 980,
        duration: 105,
        standardPrice: 1200000,
        isActive: true,
      },
    }),
    // Ho Chi Minh routes
    prisma.route.create({
      data: {
        departureId: airports[1].id, // SGN
        arrivalId: airports[0].id,   // HAN
        distance: 1160,
        duration: 120,
        standardPrice: 1500000,
        isActive: true,
      },
    }),
    prisma.route.create({
      data: {
        departureId: airports[1].id, // SGN
        arrivalId: airports[2].id,   // DAD
        distance: 610,
        duration: 75,
        standardPrice: 850000,
        isActive: true,
      },
    }),
    prisma.route.create({
      data: {
        departureId: airports[1].id, // SGN
        arrivalId: airports[4].id,   // PQC
        distance: 300,
        duration: 50,
        standardPrice: 700000,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${routes.length} routes`);

  // 6. Create Coupons
  console.log('🎟️ Creating coupons...');
  const coupons = await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'SUMMER2026',
        discountPercent: 15,
        maxDiscount: 300000,
        validFrom: new Date('2026-06-01'),
        validTo: new Date('2026-08-31'),
        usageLimit: 1000,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'NEWYEAR2026',
        discountPercent: 20,
        maxDiscount: 500000,
        validFrom: new Date('2026-01-01'),
        validTo: new Date('2026-02-28'),
        usageLimit: 500,
        isActive: true,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'FLASH50',
        discountPercent: 50,
        maxDiscount: 1000000,
        validFrom: new Date('2026-01-08'),
        validTo: new Date('2026-01-15'),
        usageLimit: 100,
        isActive: true,
      },
    }),
  ]);
  console.log(`✅ Created ${coupons.length} coupons`);

  // 7. Create Flights with seat inventory
  console.log('🛫 Creating flights...');
  const baseDate = new Date('2026-06-01T00:00:00Z');
  const flights = [];

  // Define flight schedule for each route
  const routeSchedules = [
    { routeIdx: 0, aircraftIdx: 0, flightsPerDay: 3, baseFlightNum: 100, hours: [6, 12, 18] },   // HAN-SGN
    { routeIdx: 1, aircraftIdx: 0, flightsPerDay: 2, baseFlightNum: 200, hours: [7, 15] },      // HAN-DAD
    { routeIdx: 2, aircraftIdx: 1, flightsPerDay: 2, baseFlightNum: 300, hours: [8, 16] },      // HAN-CXR
    { routeIdx: 3, aircraftIdx: 0, flightsPerDay: 3, baseFlightNum: 400, hours: [6, 12, 18] },   // SGN-HAN
    { routeIdx: 4, aircraftIdx: 0, flightsPerDay: 2, baseFlightNum: 500, hours: [7, 15] },      // SGN-DAD
    { routeIdx: 5, aircraftIdx: 2, flightsPerDay: 4, baseFlightNum: 600, hours: [6, 10, 14, 18] }, // SGN-PQC
  ];

  for (let day = 0; day < 30; day++) {
    for (const schedule of routeSchedules) {
      const route = routes[schedule.routeIdx];
      const selectedAircraft = aircraft[schedule.aircraftIdx];
      
      for (let i = 0; i < schedule.flightsPerDay; i++) {
        const hour = schedule.hours[i];
        const departureTime = new Date(baseDate);
        departureTime.setDate(departureTime.getDate() + day);
        departureTime.setHours(hour, 0, 0, 0);
        
        const arrivalTime = new Date(departureTime);
        arrivalTime.setMinutes(departureTime.getMinutes() + route.duration);

        // Calculate price with variation
        const priceVariation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
        const basePrice = route.standardPrice * priceVariation;
        const businessPrice = basePrice * 2.2;

        const flight = await prisma.flight.create({
          data: {
            flightNumber: `VN${schedule.baseFlightNum + day * schedule.flightsPerDay + i}`,
            routeId: route.id,
            aircraftId: selectedAircraft.id,
            departureTime,
            arrivalTime,
            basePrice: Math.round(basePrice),
            businessPrice: Math.round(businessPrice),
            promotionId: day < 7 ? coupons[1].id : null, // NEWYEAR2026 for first week
          },
        });

        // Create seat inventory based on aircraft
        await prisma.seatInventory.createMany({
          data: [
            {
              flightId: flight.id,
              ticketClass: 'ECONOMY',
              availableSeats: selectedAircraft.economySeats,
              bookedSeats: 0,
            },
            {
              flightId: flight.id,
              ticketClass: 'BUSINESS',
              availableSeats: selectedAircraft.businessSeats,
              bookedSeats: 0,
            },
          ],
        });

        flights.push(flight);
      }
    }
  }
  console.log(`✅ Created ${flights.length} flights with seat inventory across ${routes.length} routes`);

  // Create sample bookings
  console.log('📌 Creating sample bookings...');
  const regularUser = users.find(u => u.role === 'USER');
  const adultTicketType = ticketTypes[0]; // ADULT
  
  if (regularUser && flights.length > 0 && ticketTypes.length > 0) {
    // Create 5 sample bookings with different statuses
    const bookingStatuses = ['CONFIRMED', 'PENDING', 'COMPLETED', 'CONFIRMED', 'CONFIRMED'];
    
    for (let i = 0; i < 5; i++) {
      const randomFlight = flights[Math.floor(Math.random() * flights.length)];
      const passengerCount = i + 1;
      const totalAmount = randomFlight.basePrice * passengerCount;
      
      const booking = await prisma.booking.create({
        data: {
          bookingCode: `BK${Date.now()}${i}`,
          userId: regularUser.id,
          flightId: randomFlight.id,
          totalAmount,
          status: bookingStatuses[i],
          contactEmail: regularUser.email,
          contactPhone: regularUser.phoneNumber || '0987654321',
          expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Expires in 24 hours
          passengers: {
            create: Array.from({ length: passengerCount }, (_, j) => ({
              fullName: `Hành khách ${j + 1}`,
              dateOfBirth: new Date('1990-01-01'),
              ticketTypeId: adultTicketType.id,
              ticketClass: j === 0 ? 'BUSINESS' : 'ECONOMY',
              seatNumber: `${String.fromCharCode(65 + j)}${j + 1}`,
              priceAmount: j === 0 ? randomFlight.businessPrice : randomFlight.basePrice,
            }))
          }
        }
      });
      
      // Update seat inventory
      const seatInventory = await prisma.seatInventory.findFirst({
        where: { flightId: randomFlight.id, ticketClass: 'ECONOMY' }
      });
      
      if (seatInventory) {
        await prisma.seatInventory.update({
          where: { id: seatInventory.id },
          data: { bookedSeats: { increment: passengerCount - 1 } }
        });
      }
      
      const businessSeatInventory = await prisma.seatInventory.findFirst({
        where: { flightId: randomFlight.id, ticketClass: 'BUSINESS' }
      });
      
      if (businessSeatInventory && passengerCount > 0) {
        await prisma.seatInventory.update({
          where: { id: businessSeatInventory.id },
          data: { bookedSeats: { increment: 1 } }
        });
      }
    }
    console.log('✅ Created 5 sample bookings');
  }

  console.log('✨ Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
