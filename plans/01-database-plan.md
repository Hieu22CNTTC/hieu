# Plan 01: Database Schema & Migrations

## Mục tiêu
Thiết lập database schema hoàn chỉnh với Prisma ORM, tạo migrations và seed data.

## Tech Stack
- MySQL 8
- Prisma ORM
- Docker Compose

---

## 1. Database Models

### 1.1 User Model
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  bookings     Booking[]
}

enum Role {
  USER
  ADMIN
}
```

**Giải thích:**
- `id`: UUID primary key
- `email`: Unique constraint cho login
- `passwordHash`: Lưu bcrypt hash, không lưu plain password
- `role`: Phân quyền USER/ADMIN
- Relations: One-to-many với Bookings

### 1.2 Airport Model
```prisma
model Airport {
  id              String  @id @default(uuid())
  code            String  @unique // IATA code: DAD, HAN, SGN
  name            String
  city            String
  country         String
  routesFrom      Route[] @relation("FromAirport")
  routesTo        Route[] @relation("ToAirport")
}
```

**Giải thích:**
- `code`: IATA airport code (3 letters)
- Self-referential relations cho routes (from/to)

### 1.3 Aircraft Model
```prisma
model Aircraft {
  id          String   @id @default(uuid())
  model       String   // Boeing 787, Airbus A350
  totalSeats  Int
  flights     Flight[]
}
```

### 1.4 Route Model
```prisma
model Route {
  id             String   @id @default(uuid())
  fromAirportId  String
  toAirportId    String
  basePrice      Decimal  @db.Decimal(10, 2)
  fromAirport    Airport  @relation("FromAirport", fields: [fromAirportId], references: [id])
  toAirport      Airport  @relation("ToAirport", fields: [toAirportId], references: [id])
  flights        Flight[]
  
  @@index([fromAirportId, toAirportId])
  @@unique([fromAirportId, toAirportId])
}
```

**Giải thích:**
- Composite index on (fromAirportId, toAirportId) cho query nhanh
- Unique constraint để tránh duplicate routes
- `basePrice`: Giá cơ bản, sẽ nhân với cabin class multiplier

### 1.5 Flight Model
```prisma
model Flight {
  id              String           @id @default(uuid())
  flightNumber    String           @unique
  routeId         String
  aircraftId      String
  departTime      DateTime
  arriveTime      DateTime
  duration        Int              // minutes
  status          FlightStatus     @default(SCHEDULED)
  route           Route            @relation(fields: [routeId], references: [id])
  aircraft        Aircraft         @relation(fields: [aircraftId], references: [id])
  seatInventories SeatInventory[]
  bookings        Booking[]
  
  @@index([departTime])
  @@index([status])
  @@index([routeId])
}

enum FlightStatus {
  SCHEDULED
  DELAYED
  CANCELLED
  COMPLETED
}
```

**Giải thích:**
- `flightNumber`: Unique (e.g., VN123)
- `duration`: Lưu phút để tính thời gian bay
- Indexes on departTime, status cho search queries
- Relations: Many-to-one với Route, Aircraft

### 1.6 SeatInventory Model
```prisma
model SeatInventory {
  id              String     @id @default(uuid())
  flightId        String
  cabinClass      CabinClass
  totalSeats      Int
  remainingSeats  Int
  priceMultiplier Decimal    @db.Decimal(3, 2) // 1.0 for ECONOMY, 1.8 for BUSINESS
  flight          Flight     @relation(fields: [flightId], references: [id])
  
  @@unique([flightId, cabinClass])
  @@index([flightId])
}

enum CabinClass {
  ECONOMY
  BUSINESS
}
```

**Giải thích:**
- Unique constraint (flightId, cabinClass) - mỗi flight chỉ 1 inventory/class
- `remainingSeats`: Giảm khi booking, tăng khi cancel/expire
- `priceMultiplier`: ECONOMY = 1.0, BUSINESS = 1.8

### 1.7 Booking Model
```prisma
model Booking {
  id              String             @id @default(uuid())
  userId          String
  flightId        String
  cabinClass      CabinClass
  passengersCount Int
  contactName     String
  contactPhone    String
  contactEmail    String
  totalAmount     Decimal            @db.Decimal(10, 2)
  couponCode      String?
  discount        Decimal?           @db.Decimal(10, 2)
  status          BookingStatus      @default(PENDING_PAYMENT)
  eTicketCode     String?            @unique
  expiresAt       DateTime
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  user            User               @relation(fields: [userId], references: [id])
  flight          Flight             @relation(fields: [flightId], references: [id])
  passengers      BookingPassenger[]
  payments        Payment[]
  
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@index([flightId])
}

enum BookingStatus {
  PENDING_PAYMENT
  PAID
  CANCELLED
  EXPIRED
}
```

**Giải thích:**
- `expiresAt`: createdAt + 15 minutes
- `eTicketCode`: Generate khi PAID, unique constraint
- `totalAmount`: basePrice * priceMultiplier * passengersCount - discount
- Status flow: PENDING_PAYMENT → PAID hoặc CANCELLED/EXPIRED

### 1.8 BookingPassenger Model
```prisma
model BookingPassenger {
  id         String        @id @default(uuid())
  bookingId  String
  type       PassengerType
  fullName   String
  dob        DateTime
  gender     String
  idNumber   String?
  booking    Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  
  @@index([bookingId])
}

enum PassengerType {
  ADULT
  CHILD
  INFANT
}
```

**Giải thích:**
- Cascade delete khi xoá booking
- `idNumber`: Optional (infant không cần)
- `type`: ADULT (>=12), CHILD (2-11), INFANT (<2)

### 1.9 Payment Model
```prisma
model Payment {
  id              String        @id @default(uuid())
  bookingId       String
  provider        String        @default("MOMO")
  amount          Decimal       @db.Decimal(10, 2)
  orderId         String        @unique
  requestId       String        @unique
  transId         String?
  payType         String?
  status          PaymentStatus @default(PENDING)
  rawResponseJson String?       @db.Text
  createdAt       DateTime      @default(now())
  booking         Booking       @relation(fields: [bookingId], references: [id])
  
  @@index([bookingId])
  @@index([status])
  @@index([orderId])
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
}
```

**Giải thích:**
- `orderId`, `requestId`: Unique cho MoMo
- `transId`: Transaction ID từ MoMo (khi success)
- `rawResponseJson`: Lưu full response để debug
- Multiple payments có thể tồn tại cho 1 booking (retry)

### 1.10 Coupon Model
```prisma
model Coupon {
  id           String       @id @default(uuid())
  code         String       @unique
  discountType DiscountType
  value        Decimal      @db.Decimal(10, 2)
  startAt      DateTime
  endAt        DateTime
  maxUses      Int
  usedCount    Int          @default(0)
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())
  
  @@index([code])
  @@index([isActive])
}

enum DiscountType {
  PERCENT      // Giảm % (value = 10 -> 10%)
  FIXED        // Giảm số tiền cố định (value = 100000 -> 100k VND)
}
```

---

## 2. Complete Prisma Schema

### prisma/schema.prisma
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

// ============ ENUMS ============
enum Role {
  USER
  ADMIN
}

enum FlightStatus {
  SCHEDULED
  DELAYED
  CANCELLED
  COMPLETED
}

enum CabinClass {
  ECONOMY
  BUSINESS
}

enum BookingStatus {
  PENDING_PAYMENT
  PAID
  CANCELLED
  EXPIRED
}

enum PassengerType {
  ADULT
  CHILD
  INFANT
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
}

enum DiscountType {
  PERCENT
  FIXED
}

// ============ MODELS ============
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         Role      @default(USER)
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  bookings     Booking[]

  @@map("users")
}

model Airport {
  id         String  @id @default(uuid())
  code       String  @unique
  name       String
  city       String
  country    String
  routesFrom Route[] @relation("FromAirport")
  routesTo   Route[] @relation("ToAirport")

  @@map("airports")
}

model Aircraft {
  id         String   @id @default(uuid())
  model      String
  totalSeats Int
  flights    Flight[]

  @@map("aircrafts")
}

model Route {
  id            String   @id @default(uuid())
  fromAirportId String
  toAirportId   String
  basePrice     Decimal  @db.Decimal(10, 2)
  fromAirport   Airport  @relation("FromAirport", fields: [fromAirportId], references: [id])
  toAirport     Airport  @relation("ToAirport", fields: [toAirportId], references: [id])
  flights       Flight[]

  @@unique([fromAirportId, toAirportId])
  @@index([fromAirportId, toAirportId])
  @@map("routes")
}

model Flight {
  id              String           @id @default(uuid())
  flightNumber    String           @unique
  routeId         String
  aircraftId      String
  departTime      DateTime
  arriveTime      DateTime
  duration        Int
  status          FlightStatus     @default(SCHEDULED)
  route           Route            @relation(fields: [routeId], references: [id])
  aircraft        Aircraft         @relation(fields: [aircraftId], references: [id])
  seatInventories SeatInventory[]
  bookings        Booking[]

  @@index([departTime])
  @@index([status])
  @@index([routeId])
  @@map("flights")
}

model SeatInventory {
  id              String     @id @default(uuid())
  flightId        String
  cabinClass      CabinClass
  totalSeats      Int
  remainingSeats  Int
  priceMultiplier Decimal    @db.Decimal(3, 2)
  flight          Flight     @relation(fields: [flightId], references: [id])

  @@unique([flightId, cabinClass])
  @@index([flightId])
  @@map("seat_inventories")
}

model Booking {
  id              String             @id @default(uuid())
  userId          String
  flightId        String
  cabinClass      CabinClass
  passengersCount Int
  contactName     String
  contactPhone    String
  contactEmail    String
  totalAmount     Decimal            @db.Decimal(10, 2)
  couponCode      String?
  discount        Decimal?           @db.Decimal(10, 2)
  status          BookingStatus      @default(PENDING_PAYMENT)
  eTicketCode     String?            @unique
  expiresAt       DateTime
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  user            User               @relation(fields: [userId], references: [id])
  flight          Flight             @relation(fields: [flightId], references: [id])
  passengers      BookingPassenger[]
  payments        Payment[]

  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@index([flightId])
  @@map("bookings")
}

model BookingPassenger {
  id        String        @id @default(uuid())
  bookingId String
  type      PassengerType
  fullName  String
  dob       DateTime
  gender    String
  idNumber  String?
  booking   Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)

  @@index([bookingId])
  @@map("booking_passengers")
}

model Payment {
  id              String        @id @default(uuid())
  bookingId       String
  provider        String        @default("MOMO")
  amount          Decimal       @db.Decimal(10, 2)
  orderId         String        @unique
  requestId       String        @unique
  transId         String?
  payType         String?
  status          PaymentStatus @default(PENDING)
  rawResponseJson String?       @db.Text
  createdAt       DateTime      @default(now())
  booking         Booking       @relation(fields: [bookingId], references: [id])

  @@index([bookingId])
  @@index([status])
  @@index([orderId])
  @@map("payments")
}

model Coupon {
  id           String       @id @default(uuid())
  code         String       @unique
  discountType DiscountType
  value        Decimal      @db.Decimal(10, 2)
  startAt      DateTime
  endAt        DateTime
  maxUses      Int
  usedCount    Int          @default(0)
  isActive     Boolean      @default(true)
  createdAt    DateTime     @default(now())

  @@index([code])
  @@index([isActive])
  @@map("coupons")
}
```

---

## 3. Docker Compose Setup

### docker-compose.yml
```yaml
version: '3.8'

services:
  mysql:
    image: mysql:8.0
    container_name: flight_booking_db
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: flight_booking
      MYSQL_USER: flight_user
      MYSQL_PASSWORD: flight_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql
    command: --default-authentication-plugin=mysql_native_password

volumes:
  mysql_data:
```

---

## 4. Seed Data

### prisma/seed.ts

```typescript
import { PrismaClient, Role, CabinClass, FlightStatus } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Create admin user
  const adminPassword = await bcrypt.hash('Admin@123', 10);
  const admin = await prisma.user.create({
    data: {
      email: 'admin@flight.com',
      passwordHash: adminPassword,
      fullName: 'Admin User',
      phone: '0123456789',
      role: Role.ADMIN,
    },
  });
  console.log('✅ Admin user created');

  // 2. Create test user
  const userPassword = await bcrypt.hash('User@123', 10);
  const user = await prisma.user.create({
    data: {
      email: 'user@flight.com',
      passwordHash: userPassword,
      fullName: 'Test User',
      phone: '0987654321',
      role: Role.USER,
    },
  });
  console.log('✅ Test user created');

  // 3. Create airports
  const airports = await Promise.all([
    prisma.airport.create({
      data: { code: 'HAN', name: 'Noi Bai International Airport', city: 'Hanoi', country: 'Vietnam' },
    }),
    prisma.airport.create({
      data: { code: 'SGN', name: 'Tan Son Nhat International Airport', city: 'Ho Chi Minh', country: 'Vietnam' },
    }),
    prisma.airport.create({
      data: { code: 'DAD', name: 'Da Nang International Airport', city: 'Da Nang', country: 'Vietnam' },
    }),
    prisma.airport.create({
      data: { code: 'HPH', name: 'Cat Bi International Airport', city: 'Hai Phong', country: 'Vietnam' },
    }),
    prisma.airport.create({
      data: { code: 'CXR', name: 'Cam Ranh International Airport', city: 'Nha Trang', country: 'Vietnam' },
    }),
  ]);
  console.log('✅ Airports created');

  // 4. Create aircrafts
  const aircrafts = await Promise.all([
    prisma.aircraft.create({ data: { model: 'Airbus A321', totalSeats: 220 } }),
    prisma.aircraft.create({ data: { model: 'Boeing 787', totalSeats: 350 } }),
    prisma.aircraft.create({ data: { model: 'Airbus A350', totalSeats: 300 } }),
  ]);
  console.log('✅ Aircrafts created');

  // 5. Create routes
  const routes = await Promise.all([
    prisma.route.create({
      data: {
        fromAirportId: airports[0].id, // HAN
        toAirportId: airports[1].id,   // SGN
        basePrice: 1500000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[1].id, // SGN
        toAirportId: airports[0].id,   // HAN
        basePrice: 1500000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[0].id, // HAN
        toAirportId: airports[2].id,   // DAD
        basePrice: 1200000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[2].id, // DAD
        toAirportId: airports[0].id,   // HAN
        basePrice: 1200000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[1].id, // SGN
        toAirportId: airports[2].id,   // DAD
        basePrice: 1000000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[2].id, // DAD
        toAirportId: airports[1].id,   // SGN
        basePrice: 1000000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[0].id, // HAN
        toAirportId: airports[4].id,   // CXR
        basePrice: 1800000,
      },
    }),
    prisma.route.create({
      data: {
        fromAirportId: airports[1].id, // SGN
        toAirportId: airports[4].id,   // CXR
        basePrice: 900000,
      },
    }),
  ]);
  console.log('✅ Routes created');

  // 6. Create flights (next 30 days)
  const today = new Date();
  const flights = [];

  for (let i = 1; i <= 30; i++) {
    const departDate = new Date(today);
    departDate.setDate(today.getDate() + i);

    // Morning flight HAN -> SGN
    const morning = new Date(departDate);
    morning.setHours(6, 0, 0, 0);
    const morningArrival = new Date(morning);
    morningArrival.setHours(8, 15, 0, 0);

    const flight1 = await prisma.flight.create({
      data: {
        flightNumber: `VN${100 + i}`,
        routeId: routes[0].id,
        aircraftId: aircrafts[0].id,
        departTime: morning,
        arriveTime: morningArrival,
        duration: 135,
        status: FlightStatus.SCHEDULED,
      },
    });

    await prisma.seatInventory.createMany({
      data: [
        {
          flightId: flight1.id,
          cabinClass: CabinClass.ECONOMY,
          totalSeats: 180,
          remainingSeats: 180,
          priceMultiplier: 1.0,
        },
        {
          flightId: flight1.id,
          cabinClass: CabinClass.BUSINESS,
          totalSeats: 40,
          remainingSeats: 40,
          priceMultiplier: 1.8,
        },
      ],
    });

    // Afternoon flight SGN -> HAN
    const afternoon = new Date(departDate);
    afternoon.setHours(14, 30, 0, 0);
    const afternoonArrival = new Date(afternoon);
    afternoonArrival.setHours(16, 45, 0, 0);

    const flight2 = await prisma.flight.create({
      data: {
        flightNumber: `VN${200 + i}`,
        routeId: routes[1].id,
        aircraftId: aircrafts[1].id,
        departTime: afternoon,
        arriveTime: afternoonArrival,
        duration: 135,
        status: FlightStatus.SCHEDULED,
      },
    });

    await prisma.seatInventory.createMany({
      data: [
        {
          flightId: flight2.id,
          cabinClass: CabinClass.ECONOMY,
          totalSeats: 280,
          remainingSeats: 280,
          priceMultiplier: 1.0,
        },
        {
          flightId: flight2.id,
          cabinClass: CabinClass.BUSINESS,
          totalSeats: 70,
          remainingSeats: 70,
          priceMultiplier: 1.8,
        },
      ],
    });

    // Evening flight HAN -> DAD
    const evening = new Date(departDate);
    evening.setHours(19, 0, 0, 0);
    const eveningArrival = new Date(evening);
    eveningArrival.setHours(20, 20, 0, 0);

    const flight3 = await prisma.flight.create({
      data: {
        flightNumber: `VN${300 + i}`,
        routeId: routes[2].id,
        aircraftId: aircrafts[2].id,
        departTime: evening,
        arriveTime: eveningArrival,
        duration: 80,
        status: FlightStatus.SCHEDULED,
      },
    });

    await prisma.seatInventory.createMany({
      data: [
        {
          flightId: flight3.id,
          cabinClass: CabinClass.ECONOMY,
          totalSeats: 240,
          remainingSeats: 240,
          priceMultiplier: 1.0,
        },
        {
          flightId: flight3.id,
          cabinClass: CabinClass.BUSINESS,
          totalSeats: 60,
          remainingSeats: 60,
          priceMultiplier: 1.8,
        },
      ],
    });

    flights.push(flight1, flight2, flight3);
  }
  console.log(`✅ Created ${flights.length} flights with seat inventories`);

  // 7. Create coupons
  const startDate = new Date();
  const endDate = new Date();
  endDate.setDate(endDate.getDate() + 60);

  await Promise.all([
    prisma.coupon.create({
      data: {
        code: 'NEWYEAR2026',
        discountType: 'PERCENT',
        value: 10,
        startAt: startDate,
        endAt: endDate,
        maxUses: 100,
        usedCount: 0,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'SAVE100K',
        discountType: 'FIXED',
        value: 100000,
        startAt: startDate,
        endAt: endDate,
        maxUses: 50,
        usedCount: 0,
      },
    }),
    prisma.coupon.create({
      data: {
        code: 'WELCOME15',
        discountType: 'PERCENT',
        value: 15,
        startAt: startDate,
        endAt: endDate,
        maxUses: 200,
        usedCount: 0,
      },
    }),
  ]);
  console.log('✅ Coupons created');

  console.log('🎉 Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

### Update package.json (backend)
```json
{
  "prisma": {
    "seed": "tsx prisma/seed.ts"
  }
}
```

---

## 5. Implementation Steps

### Step 1: Setup Prisma
```bash
cd backend
npm install -D prisma
npm install @prisma/client bcrypt
npm install -D @types/bcrypt tsx
npx prisma init
```

### Step 2: Configure .env
```env
DATABASE_URL="mysql://flight_user:flight_password@localhost:3306/flight_booking"
```

### Step 3: Copy schema.prisma
Sao chép toàn bộ schema từ section 2 vào `prisma/schema.prisma`

### Step 4: Start MySQL
```bash
# Từ root directory (DoAn/)
docker-compose up -d
```

### Step 5: Run migrations
```bash
cd backend
npx prisma migrate dev --name init
```

### Step 6: Create seed file
Tạo file `prisma/seed.ts` với nội dung từ section 4

### Step 7: Seed database
```bash
npx prisma db seed
```

### Step 8: Generate Prisma Client
```bash
npx prisma generate
```

### Step 9: Open Prisma Studio (optional)
```bash
npx prisma studio
```

---

## 6. Verification Checklist

- [ ] MySQL container đang chạy (`docker ps`)
- [ ] Database `flight_booking` được tạo
- [ ] Tất cả 11 tables được tạo thành công
- [ ] Foreign keys và indexes hoạt động
- [ ] Seed data đã được populate:
  - [ ] 2 users (admin, test user)
  - [ ] 5 airports
  - [ ] 3 aircrafts
  - [ ] 8 routes
  - [ ] 90 flights (30 days x 3 flights/day)
  - [ ] 180 seat inventories (90 flights x 2 classes)
  - [ ] 3 coupons
- [ ] Prisma Client được generate
- [ ] Có thể query data qua Prisma Studio

---

## 7. Database Relationships Diagram

```
User (1) ──────→ (N) Booking

Airport (1) ──→ (N) Route (from)
Airport (1) ──→ (N) Route (to)

Aircraft (1) ──→ (N) Flight

Route (1) ──────→ (N) Flight

Flight (1) ─────→ (N) SeatInventory
Flight (1) ─────→ (N) Booking

Booking (1) ────→ (N) BookingPassenger
Booking (1) ────→ (N) Payment
```

---

## 8. Common Issues & Solutions

### Issue 1: Connection refused to MySQL
**Triệu chứng**: `Error: P1001: Can't reach database server`

**Giải pháp**:
```bash
# Check container running
docker ps

# Check port 3306 not in use
netstat -ano | findstr :3306

# Restart container
docker-compose restart
```

### Issue 2: Migration failed
**Triệu chứng**: `Migration failed to apply`

**Giải pháp**:
```bash
# Reset database
npx prisma migrate reset

# Or drop and recreate
docker-compose down -v
docker-compose up -d
npx prisma migrate dev
```

### Issue 3: Seed script error
**Triệu chứng**: `Cannot find module 'bcrypt'`

**Giải pháp**:
```bash
npm install bcrypt @types/bcrypt
```

### Issue 4: UUID generation not working
**Triệu chứng**: `Invalid default value for uuid()`

**Giải pháp**: MySQL 8.0+ supports UUID, check version:
```bash
docker exec -it flight_booking_db mysql -u root -p -e "SELECT VERSION();"
```

---

## 9. Data Validation Rules

### Users
- Email: Valid email format, unique
- Password: Minimum 6 characters (enforced in backend)
- Phone: 10 digits, optional

### Airports
- Code: Exactly 3 uppercase letters (IATA)
- Name: Minimum 3 characters

### Routes
- From/To airports: Must be different
- BasePrice: Must be positive
- Unique constraint: (fromAirportId, toAirportId)

### Flights
- FlightNumber: Unique
- DepartTime: Must be in future (enforced in backend)
- ArriveTime: Must be after departTime
- Duration: Positive integer (minutes)

### Bookings
- PassengersCount: Must match passengers array length
- TotalAmount: Calculated = basePrice * multiplier * passengers - discount
- ExpiresAt: createdAt + 15 minutes
- Status transitions:
  - PENDING_PAYMENT → PAID (on successful payment)
  - PENDING_PAYMENT → CANCELLED (user cancel)
  - PENDING_PAYMENT → EXPIRED (after 15 minutes)

### Seat Inventories
- RemainingSeats: 0 ≤ remainingSeats ≤ totalSeats
- Unique: (flightId, cabinClass)

---

## 10. Performance Optimization

### Indexes Created
1. `users.email` - Unique index for login
2. `airports.code` - Unique index for search
3. `routes(fromAirportId, toAirportId)` - Composite index for route search
4. `flights.departTime` - Index for date range queries
5. `flights.status` - Index for filtering
6. `bookings.userId` - Index for user's bookings
7. `bookings.status` - Index for admin filtering
8. `bookings.expiresAt` - Index for expiration cron job

### Query Optimization Tips
- Use `select` to fetch only needed fields
- Use `include` carefully to avoid N+1 queries
- Paginate large result sets
- Use database connection pooling

---

## Next Steps
→ Proceed to **Plan 02: Backend Infrastructure & Auth**
