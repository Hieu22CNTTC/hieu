# Plan 06: SRS Enhancement - Public Booking & Advanced Features

## Mục tiêu
Bổ sung các tính năng từ SRS document vào hệ thống Flight Booking hiện có, bao gồm: public booking (không cần login), check booking by code, ticket types, multi-role system, reporting, và PDF ticket export.

## Nguyên tắc
- ✅ Giữ nguyên cấu trúc backend/frontend hiện tại
- ✅ Không phá vỡ API đã có
- ✅ Giữ MoMo sandbox payment
- ✅ Thêm API mới theo module
- ✅ Bổ sung migration schema Prisma
- ✅ Role-based access control rõ ràng

---

## 1. TỔNG QUAN KIẾN TRÚC

### 1.1 Role System (Updated)
```
Roles:
├── ADMIN      - Toàn quyền (user management, all modules)
├── MANAGER    - Cấu hình hệ thống (airports, routes, flights, ticket types, promotions)
├── SALES      - Quản lý booking (search, view, reject bookings)
└── USER       - Customer (giữ nguyên, optional login)
```

### 1.2 Module Architecture
```
Flight Booking System
├── Public Module (No Auth Required)
│   ├── Flight Search
│   ├── Create Booking (without login)
│   ├── Check Booking by Code
│   ├── View Promotions
│   └── Download Ticket PDF
│
├── Customer Module (Optional Auth)
│   ├── My Bookings
│   ├── Profile
│   └── Payment History
│
├── Sales Module (SALES role)
│   ├── Search All Bookings
│   ├── View Booking Details
│   ├── Reject Booking
│   └── Sales Dashboard
│
├── Manager Module (MANAGER role)
│   ├── Ticket Type Management
│   ├── Route & Flight Management
│   ├── Promotion Management
│   └── System Configuration
│
└── Admin Module (ADMIN role)
    ├── User Management
    ├── Report Generation
    ├── Revenue Statistics
    └── All Manager permissions
```

---

## 2. DATABASE SCHEMA UPDATES

### 2.1 Updated Enums
```prisma
enum Role {
  USER
  SALES
  MANAGER
  ADMIN
}

enum BookingStatus {
  PENDING_PAYMENT
  PAID
  CANCELLED
  EXPIRED
  REJECTED    // New: rejected by SALES
}

enum PassengerType {
  ADULT
  CHILD
  INFANT
}
```

### 2.2 New Model: TicketType
```prisma
model TicketType {
  id              String   @id @default(uuid())
  name            String   @unique // ADULT, CHILD, INFANT
  pricePercentage Decimal  @db.Decimal(5, 2) // 100.00, 75.00, 10.00
  minAge          Int      // 12, 2, 0
  maxAge          Int?     // null, 11, 1
  description     String?
  isActive        Boolean  @default(true)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@map("ticket_types")
}
```

### 2.3 Updated Models

#### Booking (Updated)
```prisma
model Booking {
  id              String             @id @default(uuid())
  bookingCode     String             @unique @default(cuid()) // New: unique booking code
  userId          String?            // Now optional (public booking)
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
  rejectedBy      String?            // New: userId of SALES who rejected
  rejectedAt      DateTime?          // New
  rejectedReason  String?            // New
  expiresAt       DateTime
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  user            User?              @relation(fields: [userId], references: [id]) // Optional
  flight          Flight             @relation(fields: [flightId], references: [id])
  passengers      BookingPassenger[]
  payments        Payment[]

  @@index([bookingCode])
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
  @@index([flightId])
  @@index([contactEmail])
  @@map("bookings")
}
```

#### BookingPassenger (Updated)
```prisma
model BookingPassenger {
  id            String        @id @default(uuid())
  bookingId     String
  type          PassengerType
  ticketTypeId  String?       // New: link to TicketType
  fullName      String
  dob           DateTime
  gender        String
  idNumber      String?
  calculatedAge Int           // New: age at booking time
  priceAmount   Decimal       @db.Decimal(10, 2) // New: price for this passenger
  booking       Booking       @relation(fields: [bookingId], references: [id], onDelete: Cascade)
  ticketType    TicketType?   @relation(fields: [ticketTypeId], references: [id])

  @@index([bookingId])
  @@map("booking_passengers")
}
```

#### Route (Updated)
```prisma
model Route {
  id            String   @id @default(uuid())
  fromAirportId String
  toAirportId   String
  basePrice     Decimal  @db.Decimal(10, 2)
  distance      Int?     // New: distance in km
  duration      Int?     // New: standard duration in minutes
  standardPrice Decimal? @db.Decimal(10, 2) // New: standard/reference price
  isActive      Boolean  @default(true) // New
  fromAirport   Airport  @relation("FromAirport", fields: [fromAirportId], references: [id])
  toAirport     Airport  @relation("ToAirport", fields: [toAirportId], references: [id])
  flights       Flight[]

  @@unique([fromAirportId, toAirportId])
  @@index([fromAirportId, toAirportId])
  @@map("routes")
}
```

#### Flight (Updated)
```prisma
model Flight {
  id              String           @id @default(uuid())
  flightNumber    String           @unique
  routeId         String
  aircraftId      String
  departTime      DateTime
  arriveTime      DateTime
  duration        Int
  status          FlightStatus     @default(SCHEDULED)
  promotionId     String?          // New: linked promotion
  notes           String?          @db.Text // New
  route           Route            @relation(fields: [routeId], references: [id])
  aircraft        Aircraft         @relation(fields: [aircraftId], references: [id])
  promotion       Coupon?          @relation(fields: [promotionId], references: [id]) // New
  seatInventories SeatInventory[]
  bookings        Booking[]

  @@index([departTime])
  @@index([status])
  @@index([routeId])
  @@index([promotionId])
  @@map("flights")
}
```

#### Coupon (Updated - now called Promotion)
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
  description  String?      @db.Text // New
  minAmount    Decimal?     @db.Decimal(10, 2) // New: minimum booking amount
  createdAt    DateTime     @default(now())
  flights      Flight[]     // New: promotions can be linked to flights

  @@index([code])
  @@index([isActive])
  @@map("coupons")
}
```

#### User (Updated)
```prisma
model User {
  id           String    @id @default(uuid())
  email        String    @unique
  passwordHash String
  fullName     String
  phone        String?
  role         Role      @default(USER)
  isActive     Boolean   @default(true) // New
  lastLoginAt  DateTime? // New
  createdAt    DateTime  @default(now())
  updatedAt    DateTime  @updatedAt
  bookings     Booking[]

  @@index([role])
  @@index([isActive])
  @@map("users")
}
```

### 2.4 Migration Script
```typescript
// prisma/migrations/xxx_srs_enhancements/migration.sql
-- Add new roles
ALTER TABLE `users` MODIFY COLUMN `role` ENUM('USER', 'SALES', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'USER';

-- Add new booking status
ALTER TABLE `bookings` MODIFY COLUMN `status` ENUM('PENDING_PAYMENT', 'PAID', 'CANCELLED', 'EXPIRED', 'REJECTED') NOT NULL DEFAULT 'PENDING_PAYMENT';

-- Add booking code
ALTER TABLE `bookings` ADD COLUMN `bookingCode` VARCHAR(191) NOT NULL;
ALTER TABLE `bookings` ADD UNIQUE INDEX `bookings_bookingCode_key`(`bookingCode`);
ALTER TABLE `bookings` ADD INDEX `bookings_bookingCode_idx`(`bookingCode`);

-- Make userId optional
ALTER TABLE `bookings` MODIFY COLUMN `userId` VARCHAR(191) NULL;

-- Add rejection fields
ALTER TABLE `bookings` ADD COLUMN `rejectedBy` VARCHAR(191) NULL;
ALTER TABLE `bookings` ADD COLUMN `rejectedAt` DATETIME(3) NULL;
ALTER TABLE `bookings` ADD COLUMN `rejectedReason` TEXT NULL;

-- Add user tracking fields
ALTER TABLE `users` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE `users` ADD COLUMN `lastLoginAt` DATETIME(3) NULL;

-- Add route fields
ALTER TABLE `routes` ADD COLUMN `distance` INT NULL;
ALTER TABLE `routes` ADD COLUMN `duration` INT NULL;
ALTER TABLE `routes` ADD COLUMN `standardPrice` DECIMAL(10, 2) NULL;
ALTER TABLE `routes` ADD COLUMN `isActive` BOOLEAN NOT NULL DEFAULT true;

-- Add flight fields
ALTER TABLE `flights` ADD COLUMN `promotionId` VARCHAR(191) NULL;
ALTER TABLE `flights` ADD COLUMN `notes` TEXT NULL;

-- Add coupon/promotion fields
ALTER TABLE `coupons` ADD COLUMN `description` TEXT NULL;
ALTER TABLE `coupons` ADD COLUMN `minAmount` DECIMAL(10, 2) NULL;

-- Add passenger fields
ALTER TABLE `booking_passengers` ADD COLUMN `ticketTypeId` VARCHAR(191) NULL;
ALTER TABLE `booking_passengers` ADD COLUMN `calculatedAge` INT NOT NULL DEFAULT 0;
ALTER TABLE `booking_passengers` ADD COLUMN `priceAmount` DECIMAL(10, 2) NOT NULL DEFAULT 0;

-- Create ticket_types table
CREATE TABLE `ticket_types` (
  `id` VARCHAR(191) NOT NULL,
  `name` VARCHAR(191) NOT NULL,
  `pricePercentage` DECIMAL(5, 2) NOT NULL,
  `minAge` INT NOT NULL,
  `maxAge` INT NULL,
  `description` VARCHAR(191) NULL,
  `isActive` BOOLEAN NOT NULL DEFAULT true,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE INDEX `ticket_types_name_key`(`name`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

---

## 3. API SPECIFICATIONS

### 3.1 Public APIs (No Auth Required)

#### GET /api/public/flights/search
Query flights (existing, keep as is)

#### POST /api/public/bookings
Create booking without login
```json
Request:
{
  "flightId": "uuid",
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
  "contactEmail": "email@example.com",
  "couponCode": "NEWYEAR2026"
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingCode": "BK12345678",
    "status": "PENDING_PAYMENT",
    "totalAmount": 3000000,
    "expiresAt": "2026-01-08T10:45:00Z",
    "flight": {...},
    "passengers": [...]
  }
}
```

#### GET /api/public/bookings/:bookingCode
Check booking by code
```json
Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "bookingCode": "BK12345678",
    "status": "PAID",
    "eTicketCode": "VN12345678ABC",
    "contactName": "Nguyen Van A",
    "contactEmail": "email@example.com",
    "contactPhone": "0123456789",
    "totalAmount": 3000000,
    "createdAt": "2026-01-08T10:30:00Z",
    "flight": {
      "flightNumber": "VN101",
      "departTime": "2026-02-01T06:00:00Z",
      "arriveTime": "2026-02-01T08:15:00Z",
      "route": {
        "from": { "code": "HAN", "name": "Noi Bai", "city": "Hanoi" },
        "to": { "code": "SGN", "name": "Tan Son Nhat", "city": "Ho Chi Minh" }
      }
    },
    "passengers": [
      {
        "type": "ADULT",
        "fullName": "Nguyen Van A",
        "dob": "1990-01-01",
        "gender": "MALE",
        "priceAmount": 3000000
      }
    ]
  }
}
```

#### GET /api/public/bookings/:bookingCode/ticket
Download ticket PDF (only if status = PAID)
```
Response: application/pdf
Content-Disposition: attachment; filename="ticket_BK12345678.pdf"
```

#### GET /api/public/promotions
View active promotions
```json
Response:
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "code": "NEWYEAR2026",
      "description": "New Year Discount 10%",
      "discountType": "PERCENT",
      "value": 10,
      "startAt": "2026-01-01",
      "endAt": "2026-02-28",
      "minAmount": 1000000,
      "remainingUses": 85
    }
  ]
}
```

#### POST /api/public/payments/momo/create
Create MoMo payment (update to accept bookingCode)
```json
Request:
{
  "bookingCode": "BK12345678"
}
```

### 3.2 Customer APIs (Optional Auth)
Keep existing:
- GET /api/bookings/my
- GET /api/bookings/:id
- PATCH /api/bookings/:id/cancel

### 3.3 Sales APIs (SALES role required)

#### GET /api/sales/bookings
Search all bookings with filters
```
Query params:
- bookingCode?: string
- contactName?: string
- contactEmail?: string
- flightNumber?: string
- status?: BookingStatus
- fromDate?: string (YYYY-MM-DD)
- toDate?: string (YYYY-MM-DD)
- page?: number
- limit?: number

Response:
{
  "success": true,
  "data": [...bookings],
  "pagination": {
    "total": 100,
    "page": 1,
    "limit": 20,
    "totalPages": 5
  }
}
```

#### GET /api/sales/bookings/:id
Get booking detail (any booking, not just own)

#### PATCH /api/sales/bookings/:id/reject
Reject booking
```json
Request:
{
  "reason": "Customer request / Invalid information / etc."
}

Response:
{
  "success": true,
  "data": {
    "id": "uuid",
    "status": "REJECTED",
    "rejectedBy": "sales-user-id",
    "rejectedAt": "2026-01-08T10:00:00Z",
    "rejectedReason": "Customer request"
  }
}
```

#### GET /api/sales/dashboard
Sales dashboard statistics
```json
Response:
{
  "success": true,
  "data": {
    "todayBookings": 15,
    "todayRevenue": 45000000,
    "pendingPayments": 8,
    "recentBookings": [...]
  }
}
```

### 3.4 Manager APIs (MANAGER role required)

#### Ticket Type CRUD
```
GET    /api/manager/ticket-types
POST   /api/manager/ticket-types
PUT    /api/manager/ticket-types/:id
DELETE /api/manager/ticket-types/:id
```

Example POST:
```json
Request:
{
  "name": "ADULT",
  "pricePercentage": 100,
  "minAge": 12,
  "maxAge": null,
  "description": "Adult passenger (12+ years)"
}
```

#### Route Management (enhanced)
Keep existing + add fields:
```json
POST /api/manager/routes
{
  "fromAirportId": "uuid",
  "toAirportId": "uuid",
  "basePrice": 1500000,
  "distance": 1200,
  "duration": 135,
  "standardPrice": 1800000
}
```

#### Flight Management (enhanced)
```json
POST /api/manager/flights
{
  "flightNumber": "VN101",
  "routeId": "uuid",
  "aircraftId": "uuid",
  "departTime": "2026-02-01T06:00:00Z",
  "arriveTime": "2026-02-01T08:15:00Z",
  "promotionId": "uuid", // optional
  "notes": "Holiday flight"
}
```

#### Promotion Management (enhanced)
```json
POST /api/manager/promotions
{
  "code": "SUMMER2026",
  "discountType": "PERCENT",
  "value": 15,
  "startAt": "2026-06-01",
  "endAt": "2026-08-31",
  "maxUses": 500,
  "description": "Summer vacation discount",
  "minAmount": 2000000
}
```

### 3.5 Admin APIs (ADMIN role required)

#### User Management
```
GET    /api/admin/users
POST   /api/admin/users
PUT    /api/admin/users/:id
DELETE /api/admin/users/:id
PATCH  /api/admin/users/:id/toggle-active
```

Example POST:
```json
{
  "email": "sales@flight.com",
  "password": "Password@123",
  "fullName": "Sales User",
  "phone": "0123456789",
  "role": "SALES"
}
```

#### Reports
```
GET /api/admin/reports/bookings
Query params:
- fromDate: string (YYYY-MM-DD)
- toDate: string (YYYY-MM-DD)
- status?: BookingStatus
- export?: 'excel' | 'pdf'

Response (JSON):
{
  "success": true,
  "data": {
    "bookings": [...],
    "summary": {
      "totalBookings": 150,
      "totalRevenue": 450000000,
      "byStatus": {
        "PAID": 120,
        "PENDING_PAYMENT": 15,
        "CANCELLED": 10,
        "EXPIRED": 5
      },
      "byFlight": [
        { "flightNumber": "VN101", "bookings": 25, "revenue": 75000000 }
      ],
      "byRoute": [
        { "route": "HAN-SGN", "bookings": 50, "revenue": 150000000 }
      ]
    }
  }
}

Response (Excel/PDF):
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="bookings_report_2026-01-08.xlsx"
```

```
GET /api/admin/reports/revenue
Query params:
- fromDate: string
- toDate: string
- groupBy: 'day' | 'week' | 'month'

Response:
{
  "success": true,
  "data": {
    "chartData": [
      { "date": "2026-01-01", "revenue": 12000000, "bookings": 8 },
      { "date": "2026-01-02", "revenue": 15000000, "bookings": 10 }
    ],
    "total": {
      "revenue": 450000000,
      "bookings": 150
    }
  }
}
```

---

## 4. ROLE-BASED ACCESS CONTROL

### 4.1 Permission Matrix
```
Module/Feature              | USER | SALES | MANAGER | ADMIN
----------------------------|------|-------|---------|-------
Flight Search               |  ✓   |   ✓   |    ✓    |   ✓
Create Booking (Public)     |  ✓   |   ✓   |    ✓    |   ✓
Check Booking by Code       |  ✓   |   ✓   |    ✓    |   ✓
View Promotions             |  ✓   |   ✓   |    ✓    |   ✓
Download Ticket PDF         |  ✓   |   ✓   |    ✓    |   ✓
My Bookings (if logged in)  |  ✓   |   -   |    -    |   -
Search All Bookings         |  -   |   ✓   |    ✓    |   ✓
Reject Booking              |  -   |   ✓   |    ✓    |   ✓
Sales Dashboard             |  -   |   ✓   |    ✓    |   ✓
Ticket Type Management      |  -   |   -   |    ✓    |   ✓
Route/Flight Management     |  -   |   -   |    ✓    |   ✓
Promotion Management        |  -   |   -   |    ✓    |   ✓
User Management             |  -   |   -   |    -    |   ✓
Reports                     |  -   |   -   |    -    |   ✓
```

### 4.2 Middleware Implementation
```typescript
// src/middlewares/roleCheck.ts (updated)

export const requireSales = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (!['SALES', 'MANAGER', 'ADMIN'].includes(req.user.role)) {
    return next(new AppError('Sales access required', 403));
  }
  next();
};

export const requireManager = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(new AppError('Authentication required', 401));
  }
  if (!['MANAGER', 'ADMIN'].includes(req.user.role)) {
    return next(new AppError('Manager access required', 403));
  }
  next();
};

export const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
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

## 5. BOOKING FLOW UPDATES

### 5.1 Public Booking Flow (No Login)
```
1. Customer searches flights
2. Customer selects flight
3. Customer enters passenger info + contact info
4. System calculates price based on ticket types:
   - Adult (>=12): 100% of base price * cabin multiplier
   - Child (2-11): 75% of base price * cabin multiplier
   - Infant (<2): 10% of base price * cabin multiplier
5. System checks promotion (auto-apply if flight has promotionId)
6. System generates unique bookingCode (e.g., BK12345678)
7. System creates Booking (userId = null)
8. System returns bookingCode to customer
9. Customer uses bookingCode to:
   - Check booking status
   - Pay via MoMo
   - Download ticket (if paid)
```

### 5.2 Ticket Price Calculation Logic
```typescript
function calculateBookingPrice(params: {
  basePrice: number;
  cabinMultiplier: number;
  passengers: Array<{ dob: string; type: PassengerType }>;
  promotion?: Coupon;
  ticketTypes: TicketType[];
}): {
  totalAmount: number;
  discount: number;
  passengerPrices: Array<{ passengerId: number; amount: number }>;
} {
  let subtotal = 0;
  const passengerPrices = [];

  for (const passenger of params.passengers) {
    const age = calculateAge(passenger.dob);
    const ticketType = findTicketTypeByAge(age, params.ticketTypes);
    
    const passengerPrice = 
      params.basePrice * 
      params.cabinMultiplier * 
      (ticketType.pricePercentage / 100);
    
    subtotal += passengerPrice;
    passengerPrices.push({ 
      passengerId: passenger.id,
      amount: passengerPrice 
    });
  }

  let discount = 0;
  if (params.promotion) {
    if (params.promotion.discountType === 'PERCENT') {
      discount = (subtotal * params.promotion.value) / 100;
    } else {
      discount = params.promotion.value;
    }
  }

  return {
    totalAmount: subtotal - discount,
    discount,
    passengerPrices,
  };
}
```

---

## 6. PDF TICKET EXPORT

### 6.1 Library: PDFKit
```bash
npm install pdfkit
npm install -D @types/pdfkit
```

### 6.2 Ticket Template Structure
```
+------------------------------------+
|  VIETNAM AIRLINES ETICKET          |
+------------------------------------+
|                                    |
|  Booking Code: BK12345678          |
|  eTicket Code: VN12345678ABC       |
|                                    |
|  FLIGHT INFORMATION                |
|  Flight: VN101                     |
|  From: HAN - Noi Bai (Hanoi)       |
|  To: SGN - Tan Son Nhat (HCM)      |
|  Date: 01 Feb 2026                 |
|  Departure: 06:00                  |
|  Arrival: 08:15                    |
|  Cabin: ECONOMY                    |
|                                    |
|  PASSENGER INFORMATION             |
|  1. Nguyen Van A (ADULT)           |
|     DOB: 01/01/1990                |
|     Price: 3,000,000 VND           |
|                                    |
|  CONTACT INFORMATION               |
|  Name: Nguyen Van A                |
|  Email: email@example.com          |
|  Phone: 0123456789                 |
|                                    |
|  PAYMENT SUMMARY                   |
|  Subtotal: 3,000,000 VND           |
|  Discount: -300,000 VND            |
|  Total Paid: 2,700,000 VND         |
|                                    |
|  QR Code: [QR with booking code]   |
|                                    |
|  Generated: 08 Jan 2026 10:30      |
+------------------------------------+
```

### 6.3 Implementation
```typescript
// src/services/pdfService.ts
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

export class PDFService {
  async generateTicketPDF(booking: Booking): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4' });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('VIETNAM AIRLINES', { align: 'center' });
      doc.fontSize(16).text('ELECTRONIC TICKET', { align: 'center' });
      doc.moveDown();

      // Booking Info
      doc.fontSize(12);
      doc.text(`Booking Code: ${booking.bookingCode}`);
      doc.text(`eTicket Code: ${booking.eTicketCode}`);
      doc.moveDown();

      // Flight Info
      doc.fontSize(14).text('FLIGHT INFORMATION');
      doc.fontSize(12);
      doc.text(`Flight: ${booking.flight.flightNumber}`);
      // ... add more fields

      // Passengers
      doc.fontSize(14).text('PASSENGER INFORMATION');
      booking.passengers.forEach((p, i) => {
        doc.text(`${i + 1}. ${p.fullName} (${p.type})`);
        doc.text(`   DOB: ${formatDate(p.dob)}`);
        doc.text(`   Price: ${formatCurrency(p.priceAmount)}`);
      });

      // QR Code
      const qrDataURL = await QRCode.toDataURL(booking.bookingCode);
      doc.image(qrDataURL, { width: 100 });

      doc.end();
    });
  }
}
```

---

## 7. EXCEL EXPORT

### 7.1 Library: ExcelJS
```bash
npm install exceljs
npm install -D @types/exceljs
```

### 7.2 Report Structure
```
Sheet: Bookings Report
Columns:
- Booking Code
- Flight Number
- Route
- Departure Date
- Customer Name
- Email
- Phone
- Passengers Count
- Total Amount
- Status
- Created At
- Payment Date

Sheet: Summary
- Total Bookings
- Total Revenue
- By Status (chart/table)
- By Route (chart/table)
- By Flight (chart/table)
```

### 7.3 Implementation
```typescript
// src/services/excelService.ts
import ExcelJS from 'exceljs';

export class ExcelService {
  async generateBookingsReport(params: {
    bookings: Booking[];
    summary: ReportSummary;
  }): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    
    // Sheet 1: Bookings
    const bookingsSheet = workbook.addWorksheet('Bookings');
    bookingsSheet.columns = [
      { header: 'Booking Code', key: 'bookingCode', width: 15 },
      { header: 'Flight Number', key: 'flightNumber', width: 15 },
      { header: 'Route', key: 'route', width: 20 },
      { header: 'Departure', key: 'departTime', width: 20 },
      { header: 'Customer', key: 'customerName', width: 25 },
      { header: 'Email', key: 'email', width: 30 },
      { header: 'Phone', key: 'phone', width: 15 },
      { header: 'Passengers', key: 'passengers', width: 12 },
      { header: 'Amount', key: 'amount', width: 15 },
      { header: 'Status', key: 'status', width: 15 },
      { header: 'Created', key: 'createdAt', width: 20 },
    ];

    params.bookings.forEach(booking => {
      bookingsSheet.addRow({
        bookingCode: booking.bookingCode,
        flightNumber: booking.flight.flightNumber,
        route: `${booking.flight.route.fromAirport.code}-${booking.flight.route.toAirport.code}`,
        departTime: booking.flight.departTime,
        customerName: booking.contactName,
        email: booking.contactEmail,
        phone: booking.contactPhone,
        passengers: booking.passengersCount,
        amount: booking.totalAmount,
        status: booking.status,
        createdAt: booking.createdAt,
      });
    });

    // Sheet 2: Summary
    const summarySheet = workbook.addWorksheet('Summary');
    summarySheet.addRow(['Total Bookings', params.summary.totalBookings]);
    summarySheet.addRow(['Total Revenue', params.summary.totalRevenue]);
    // ... add more summary data

    return await workbook.xlsx.writeBuffer() as Buffer;
  }
}
```

---

## 8. SESSION TIMEOUT

### 8.1 JWT Configuration Update
```typescript
// .env
JWT_EXPIRES_IN=30m          # Changed from 1h to 30 minutes
JWT_REFRESH_EXPIRES_IN=7d   # Keep refresh token long
```

### 8.2 Frontend Implementation
```typescript
// src/utils/sessionTimeout.ts
let inactivityTimer: NodeJS.Timeout;

export function setupSessionTimeout() {
  const TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const resetTimer = () => {
    clearTimeout(inactivityTimer);
    inactivityTimer = setTimeout(() => {
      // Logout user
      useAuthStore.getState().logout();
      window.location.href = '/login?timeout=true';
    }, TIMEOUT);
  };

  // Reset timer on user activity
  ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
    document.addEventListener(event, resetTimer, true);
  });

  resetTimer();
}
```

---

## 9. FRONTEND UPDATES

### 9.1 New Pages

#### Public Pages
- `/check-booking` - Check booking by code form
- `/booking/:bookingCode` - Booking detail (public view)
- `/promotions` - View active promotions

#### Sales Pages (Protected - SALES role)
- `/sales/dashboard` - Sales dashboard
- `/sales/bookings` - Search & manage all bookings
- `/sales/bookings/:id` - Booking detail with reject option

#### Manager Pages (Protected - MANAGER role)
- `/manager/ticket-types` - CRUD ticket types
- `/manager/routes` - Enhanced route management
- `/manager/flights` - Enhanced flight management
- `/manager/promotions` - Promotion management

#### Admin Pages (Protected - ADMIN role)
- `/admin/users` - User management
- `/admin/reports` - Report generation
- `/admin/reports/bookings` - Bookings report
- `/admin/reports/revenue` - Revenue report

### 9.2 Navigation Updates
```tsx
// src/components/common/Navbar.tsx

Public Links:
- Home
- Search Flights
- Check Booking
- Promotions
- Login/Register

Authenticated USER:
- My Bookings
- Profile
- Logout

Authenticated SALES:
- Sales Dashboard
- Manage Bookings
- Logout

Authenticated MANAGER:
- Manager Dashboard
- Ticket Types
- Routes & Flights
- Promotions
- Logout

Authenticated ADMIN:
- Admin Dashboard
- Users
- Reports
- All Manager Links
- Logout
```

### 9.3 Route Protection
```tsx
// src/routes/index.tsx
<Routes>
  {/* Public */}
  <Route path="/" element={<Home />} />
  <Route path="/search" element={<FlightResults />} />
  <Route path="/check-booking" element={<CheckBooking />} />
  <Route path="/booking/:code" element={<PublicBookingDetail />} />
  <Route path="/promotions" element={<Promotions />} />
  <Route path="/login" element={<Login />} />

  {/* Protected - USER */}
  <Route element={<ProtectedRoute />}>
    <Route path="/my-bookings" element={<MyBookings />} />
    <Route path="/profile" element={<Profile />} />
  </Route>

  {/* Protected - SALES */}
  <Route element={<RoleRoute allowedRoles={['SALES', 'MANAGER', 'ADMIN']} />}>
    <Route path="/sales/dashboard" element={<SalesDashboard />} />
    <Route path="/sales/bookings" element={<SalesBookings />} />
  </Route>

  {/* Protected - MANAGER */}
  <Route element={<RoleRoute allowedRoles={['MANAGER', 'ADMIN']} />}>
    <Route path="/manager/ticket-types" element={<TicketTypes />} />
    <Route path="/manager/routes" element={<Routes />} />
  </Route>

  {/* Protected - ADMIN */}
  <Route element={<AdminRoute />}>
    <Route path="/admin/users" element={<UserManagement />} />
    <Route path="/admin/reports" element={<Reports />} />
  </Route>
</Routes>
```

---

## 10. IMPLEMENTATION TASKS

### Phase 1: Database & Core APIs (2-3 days)
- [ ] Update Prisma schema với tất cả changes
- [ ] Tạo migration script
- [ ] Update seed data với ticket types
- [ ] Run migration & seed
- [ ] Test database structure

### Phase 2: Public Booking APIs (2 days)
- [ ] Update booking service để support userId optional
- [ ] Generate bookingCode (cuid/nanoid)
- [ ] Implement check booking by code API
- [ ] Implement ticket PDF generation service
- [ ] Implement public promotions API
- [ ] Update MoMo payment to use bookingCode
- [ ] Test public booking flow

### Phase 3: Role-Based Access (1 day)
- [ ] Update auth middleware với new roles
- [ ] Implement requireSales, requireManager middleware
- [ ] Update existing protected routes
- [ ] Test role permissions

### Phase 4: Sales Module (2 days)
- [ ] Implement sales booking search API
- [ ] Implement reject booking API
- [ ] Implement sales dashboard API
- [ ] Update booking service với rejection logic
- [ ] Test sales features

### Phase 5: Manager Module (2-3 days)
- [ ] Implement TicketType CRUD APIs
- [ ] Update route/flight services với new fields
- [ ] Update promotion service
- [ ] Implement ticket type integration in booking
- [ ] Test manager features

### Phase 6: Admin Module (2 days)
- [ ] Implement user management APIs
- [ ] Implement report APIs
- [ ] Implement Excel export service
- [ ] Test admin features

### Phase 7: Frontend - Public (2-3 days)
- [ ] Update booking flow (no login required)
- [ ] Create check booking page
- [ ] Create public booking detail page
- [ ] Create promotions page
- [ ] Implement PDF download
- [ ] Test public booking flow

### Phase 8: Frontend - Sales (2 days)
- [ ] Create sales dashboard
- [ ] Create sales booking management page
- [ ] Implement reject booking UI
- [ ] Test sales workflow

### Phase 9: Frontend - Manager (2-3 days)
- [ ] Create ticket type management page
- [ ] Update route/flight forms với new fields
- [ ] Update promotion management
- [ ] Test manager workflow

### Phase 10: Frontend - Admin (2 days)
- [ ] Create user management page
- [ ] Create report pages
- [ ] Implement Excel export button
- [ ] Test admin workflow

### Phase 11: Session & Polish (1-2 days)
- [ ] Implement 30-minute session timeout
- [ ] Update navigation theo roles
- [ ] Polish UI/UX
- [ ] Final testing
- [ ] Update documentation

**Total Estimated Time: 18-23 days**

---

## 11. TESTING CHECKLIST

### Public Booking Flow
- [ ] Can search flights without login
- [ ] Can create booking without login
- [ ] Receive unique bookingCode
- [ ] Can check booking by code
- [ ] Can download PDF ticket (if paid)
- [ ] Can view active promotions
- [ ] Promotion auto-applies correctly
- [ ] Ticket prices calculated correctly by age

### Sales Features
- [ ] Sales can search all bookings
- [ ] Sales can view any booking detail
- [ ] Sales can reject bookings
- [ ] Rejected bookings restore seat inventory
- [ ] Sales dashboard shows correct stats

### Manager Features
- [ ] Manager can CRUD ticket types
- [ ] Manager can manage routes/flights with new fields
- [ ] Manager can manage promotions
- [ ] Ticket types integrate correctly in booking

### Admin Features
- [ ] Admin can manage users (CRUD)
- [ ] Admin can assign roles
- [ ] Admin can generate reports
- [ ] Excel export works correctly
- [ ] PDF export works correctly
- [ ] Reports show correct statistics

### Security
- [ ] Public APIs work without auth
- [ ] Protected APIs require auth
- [ ] Role-based access enforced
- [ ] Session timeout after 30 minutes
- [ ] Cannot access other role's features

---

## Next Steps
1. Review this plan với team
2. Confirm requirements match SRS
3. Start Phase 1: Database & Core APIs
4. Daily standup để track progress
5. Test after mỗi phase complete

---

**Created**: January 8, 2026
**Version**: 1.0
**Status**: Ready for Implementation
