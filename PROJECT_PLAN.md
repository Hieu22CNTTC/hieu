# Flight Booking System - Project Plan

## 1. TỔNG QUAN DỰ ÁN

**Mục tiêu**: Xây dựng hệ thống đặt vé máy bay full-stack với nghiệp vụ tương tự Vietnam Airlines

**Thời gian ước tính**: 3-4 tuần

**Công nghệ chính**:
- Backend: Node.js (Express) + MySQL 8 + Prisma ORM
- Frontend: React + Vite + TailwindCSS
- Payment: MoMo Gateway (Sandbox)

---

## 2. KIẾN TRÚC HỆ THỐNG

### 2.1 Cấu trúc thư mục
```
DoAn/
├── README.md
├── docker-compose.yml
├── backend/
│   ├── package.json
│   ├── .env.example
│   ├── prisma/
│   │   ├── schema.prisma
│   │   ├── seed.ts
│   │   └── migrations/
│   └── src/
│       ├── server.ts
│       ├── app.ts
│       ├── config/
│       │   ├── database.ts
│       │   ├── logger.ts
│       │   └── swagger.ts
│       ├── middlewares/
│       │   ├── auth.ts
│       │   ├── roleCheck.ts
│       │   ├── validate.ts
│       │   └── errorHandler.ts
│       ├── routes/
│       │   ├── auth.routes.ts
│       │   ├── search.routes.ts
│       │   ├── booking.routes.ts
│       │   ├── payment.routes.ts
│       │   └── admin.routes.ts
│       ├── controllers/
│       │   ├── authController.ts
│       │   ├── searchController.ts
│       │   ├── bookingController.ts
│       │   ├── paymentController.ts
│       │   └── adminController.ts
│       ├── services/
│       │   ├── authService.ts
│       │   ├── bookingService.ts
│       │   ├── momoService.ts
│       │   ├── seatInventoryService.ts
│       │   └── statsService.ts
│       ├── utils/
│       │   ├── jwt.ts
│       │   ├── crypto.ts
│       │   └── constants.ts
│       ├── jobs/
│       │   └── bookingExpiration.ts
│       ├── validations/
│       │   ├── authSchema.ts
│       │   ├── bookingSchema.ts
│       │   └── adminSchema.ts
│       └── types/
│           └── index.ts
└── frontend/
    ├── package.json
    ├── .env.example
    ├── index.html
    ├── tailwind.config.js
    ├── vite.config.ts
    └── src/
        ├── main.tsx
        ├── App.tsx
        ├── routes/
        │   ├── index.tsx
        │   ├── ProtectedRoute.tsx
        │   └── AdminRoute.tsx
        ├── pages/
        │   ├── Home.tsx
        │   ├── FlightResults.tsx
        │   ├── FlightDetail.tsx
        │   ├── Checkout.tsx
        │   ├── PaymentStatus.tsx
        │   ├── Login.tsx
        │   ├── Register.tsx
        │   ├── Profile.tsx
        │   ├── MyBookings.tsx
        │   ├── BookingDetail.tsx
        │   └── admin/
        │       ├── Dashboard.tsx
        │       ├── Airports.tsx
        │       ├── Routes.tsx
        │       ├── Flights.tsx
        │       ├── Aircrafts.tsx
        │       ├── SeatInventories.tsx
        │       ├── Coupons.tsx
        │       └── Bookings.tsx
        ├── components/
        │   ├── common/
        │   │   ├── Navbar.tsx
        │   │   ├── Footer.tsx
        │   │   └── Loader.tsx
        │   ├── flight/
        │   │   ├── SearchForm.tsx
        │   │   ├── FlightCard.tsx
        │   │   └── FlightFilters.tsx
        │   └── booking/
        │       ├── PassengerForm.tsx
        │       └── BookingCard.tsx
        ├── store/
        │   ├── authStore.ts
        │   ├── searchStore.ts
        │   └── bookingStore.ts
        ├── api/
        │   ├── axiosClient.ts
        │   ├── authApi.ts
        │   ├── flightApi.ts
        │   ├── bookingApi.ts
        │   └── adminApi.ts
        └── utils/
            ├── formatters.ts
            └── validators.ts
```

---

## 3. DATABASE SCHEMA (Prisma)

### 3.1 Models chính

```prisma
// Users
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

// Airports
model Airport {
  id              String  @id @default(uuid())
  code            String  @unique // DAD, HAN, SGN
  name            String
  city            String
  country         String
  routesFrom      Route[] @relation("FromAirport")
  routesTo        Route[] @relation("ToAirport")
}

// Aircrafts
model Aircraft {
  id          String   @id @default(uuid())
  model       String   // Boeing 787, Airbus A350
  totalSeats  Int
  flights     Flight[]
}

// Routes
model Route {
  id             String   @id @default(uuid())
  fromAirportId  String
  toAirportId    String
  basePrice      Decimal  @db.Decimal(10, 2)
  fromAirport    Airport  @relation("FromAirport", fields: [fromAirportId])
  toAirport      Airport  @relation("ToAirport", fields: [toAirportId])
  flights        Flight[]
  
  @@index([fromAirportId, toAirportId])
}

// Flights
model Flight {
  id              String           @id @default(uuid())
  flightNumber    String           @unique
  routeId         String
  aircraftId      String
  departTime      DateTime
  arriveTime      DateTime
  duration        Int              // minutes
  status          FlightStatus     @default(SCHEDULED)
  route           Route            @relation(fields: [routeId])
  aircraft        Aircraft         @relation(fields: [aircraftId])
  seatInventories SeatInventory[]
  bookings        Booking[]
  
  @@index([departTime])
  @@index([status])
}

enum FlightStatus {
  SCHEDULED
  DELAYED
  CANCELLED
  COMPLETED
}

// Seat Inventories
model SeatInventory {
  id             String      @id @default(uuid())
  flightId       String
  cabinClass     CabinClass
  totalSeats     Int
  remainingSeats Int
  priceMultiplier Decimal    @db.Decimal(3, 2) // 1.0 for ECONOMY, 1.8 for BUSINESS
  flight         Flight      @relation(fields: [flightId])
  
  @@unique([flightId, cabinClass])
}

enum CabinClass {
  ECONOMY
  BUSINESS
}

// Bookings
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
  status          BookingStatus      @default(PENDING_PAYMENT)
  eTicketCode     String?            @unique
  expiresAt       DateTime
  createdAt       DateTime           @default(now())
  updatedAt       DateTime           @updatedAt
  user            User               @relation(fields: [userId])
  flight          Flight             @relation(fields: [flightId])
  passengers      BookingPassenger[]
  payments        Payment[]
  
  @@index([userId])
  @@index([status])
  @@index([expiresAt])
}

enum BookingStatus {
  PENDING_PAYMENT
  PAID
  CANCELLED
  EXPIRED
}

// Booking Passengers
model BookingPassenger {
  id         String          @id @default(uuid())
  bookingId  String
  type       PassengerType
  fullName   String
  dob        DateTime
  gender     String
  idNumber   String?
  booking    Booking         @relation(fields: [bookingId])
}

enum PassengerType {
  ADULT
  CHILD
  INFANT
}

// Payments
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
  booking         Booking       @relation(fields: [bookingId])
  
  @@index([bookingId])
  @@index([status])
}

enum PaymentStatus {
  PENDING
  SUCCESS
  FAILED
  CANCELLED
}

// Coupons
model Coupon {
  id           String       @id @default(uuid())
  code         String       @unique
  discountType DiscountType
  value        Decimal      @db.Decimal(10, 2)
  startAt      DateTime
  endAt        DateTime
  maxUses      Int
  usedCount    Int          @default(0)
  createdAt    DateTime     @default(now())
}

enum DiscountType {
  PERCENT
  FIXED
}
```

### 3.2 Seed Data
- 5 airports: HAN (Nội Bài), SGN (Tân Sơn Nhất), DAD (Đà Nẵng), HPH (Cát Bi), CXR (Cam Ranh)
- 3 aircrafts: Airbus A321, Boeing 787, Airbus A350
- 10 routes phổ biến
- 20+ flights trong 30 ngày tới
- Seat inventories tương ứng
- 2-3 coupons test
- Admin account: admin@flight.com / admin123
- User test: hieu123@flight.com / hieu123

---

## 4. API ENDPOINTS

### 4.1 Authentication
```
POST   /api/auth/register       - Đăng ký user mới
POST   /api/auth/login          - Đăng nhập
POST   /api/auth/refresh        - Refresh access token
GET    /api/auth/me             - Lấy thông tin user hiện tại
```

### 4.2 Search & Booking
```
GET    /api/search/flights      - Tìm chuyến bay
GET    /api/flights/:id         - Chi tiết chuyến bay

POST   /api/bookings            - Tạo booking mới
GET    /api/bookings/my         - Lấy bookings của user
GET    /api/bookings/:id        - Chi tiết booking
PATCH  /api/bookings/:id/cancel - Huỷ booking
```

### 4.3 Payment (MoMo)
```
POST   /api/payments/momo/create        - Tạo payment order
POST   /api/payments/momo/ipn           - MoMo callback (IPN)
GET    /api/payments/momo/return        - Return URL từ MoMo
GET    /api/payments/:bookingId/status  - Check payment status
```

### 4.4 Admin CRUD
```
# Airports
GET    /api/admin/airports
POST   /api/admin/airports
PUT    /api/admin/airports/:id
DELETE /api/admin/airports/:id

# Routes (tương tự cho aircrafts, flights, seat-inventories, coupons)
GET    /api/admin/routes
POST   /api/admin/routes
PUT    /api/admin/routes/:id
DELETE /api/admin/routes/:id

# Bookings Management
GET    /api/admin/bookings
GET    /api/admin/bookings/:id
PATCH  /api/admin/bookings/:id/status

# Statistics
GET    /api/admin/stats/dashboard       - Tổng quan
GET    /api/admin/stats/revenue         - Doanh thu theo ngày/tháng
GET    /api/admin/stats/top-routes      - Top routes phổ biến
```

---

## 5. BUSINESS RULES & WORKFLOWS

### 5.1 Booking Flow
1. User search flights (fromAirport, toAirport, departDate, passengers)
2. System query flights có remainingSeats >= passengersCount
3. User chọn flight + cabinClass
4. User nhập passenger info (adult/child/infant)
5. System tính totalAmount:
   ```
   basePrice * priceMultiplier * passengersCount - couponDiscount
   ```
6. System tạo Booking (status = PENDING_PAYMENT, expiresAt = now + 15min)
7. System giảm remainingSeats trong seat_inventories
8. Return booking với payment button

### 5.2 Payment Flow (MoMo)
1. User click "Thanh toán MoMo"
2. Backend call MoMo createPayment API:
   - Generate orderId, requestId (unique)
   - Calculate HMAC SHA256 signature
   - Receive payUrl / qrCodeUrl
3. Frontend redirect user to payUrl
4. User thanh toán trên MoMo
5. MoMo gửi IPN callback về notifyUrl:
   - Verify signature
   - If success: Update booking = PAID, generate eTicketCode
   - If failed: Keep PENDING or set CANCELLED
6. MoMo redirect về returnUrl
7. Frontend hiển thị payment result

### 5.3 Auto Expiration
- Cron job chạy mỗi 1 phút
- Query bookings có status = PENDING_PAYMENT và expiresAt < now
- Set status = EXPIRED
- Restore remainingSeats trong seat_inventories

### 5.4 eTicket Generation
- Format: `VN{flightNumber}{bookingId-short}{random}`
- Example: `VNVN123ABC456XYZ`
- Unique constraint trong DB

---

## 6. MOMO INTEGRATION DETAILS

### 6.1 Environment Variables
```env
MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_IPN_URL=https://yourdomain.com/api/payments/momo/ipn
MOMO_RETURN_URL=http://localhost:5173/payment/status
```

### 6.2 Create Payment Request
```typescript
interface MoMoCreatePaymentRequest {
  partnerCode: string;
  accessKey: string;
  requestId: string;
  amount: string;
  orderId: string;
  orderInfo: string;
  redirectUrl: string;
  ipnUrl: string;
  requestType: 'captureWallet';
  extraData: string; // base64 encoded
  signature: string; // HMAC SHA256
}
```

### 6.3 Signature Calculation
```typescript
const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`;

const signature = crypto
  .createHmac('sha256', secretKey)
  .update(rawSignature)
  .digest('hex');
```

### 6.4 IPN Verification
```typescript
const rawSignature = `accessKey=${accessKey}&amount=${amount}&extraData=${extraData}&message=${message}&orderId=${orderId}&orderInfo=${orderInfo}&orderType=${orderType}&partnerCode=${partnerCode}&payType=${payType}&requestId=${requestId}&responseTime=${responseTime}&resultCode=${resultCode}&transId=${transId}`;

const signature = crypto
  .createHmac('sha256', secretKey)
  .update(rawSignature)
  .digest('hex');

if (signature !== receivedSignature) {
  // Invalid signature
}

if (resultCode === 0) {
  // Payment success
} else {
  // Payment failed
}
```

---

## 7. FRONTEND FEATURES

### 7.1 User Features
- **Home**: Search form với date picker, airport select, passenger count
- **Flight Results**: List flights, filters (price, time), sort
- **Checkout**: Multi-step form (passengers → contact → review)
- **Payment**: MoMo redirect handling
- **My Bookings**: List all bookings, filter by status
- **Booking Detail**: Show eTicket khi PAID

### 7.2 Admin Features
- **Dashboard**: Revenue charts, booking stats, top routes
- **CRUD Tables**: DataTable với pagination, search, filters
- **Booking Management**: View details, update status, refund flag

### 7.3 State Management (Zustand)
```typescript
// authStore
interface AuthStore {
  user: User | null;
  token: string | null;
  login: (email, password) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// searchStore
interface SearchStore {
  searchParams: SearchParams;
  flights: Flight[];
  setSearchParams: (params) => void;
  searchFlights: () => Promise<void>;
}

// bookingStore
interface BookingStore {
  currentBooking: Booking | null;
  myBookings: Booking[];
  createBooking: (data) => Promise<Booking>;
  getMyBookings: () => Promise<void>;
}
```

---

## 8. DEPLOYMENT & SETUP

### 8.1 Prerequisites
- Node.js 18+
- Docker & Docker Compose
- MoMo test account (sandbox)

### 8.2 Setup Steps
```bash
# 1. Clone repo
git clone <repo-url>
cd DoAn

# 2. Start MySQL
docker-compose up -d

# 3. Backend setup
cd backend
npm install
cp .env.example .env
# Edit .env with your config

# 4. Run migrations & seed
npx prisma migrate dev
npx prisma db seed

# 5. Start backend
npm run dev

# 6. Frontend setup (new terminal)
cd frontend
npm install
cp .env.example .env
# Edit .env

# 7. Start frontend
npm run dev
```

### 8.3 Environment Variables

**Backend (.env)**
```env
DATABASE_URL="mysql://root:password@localhost:3306/flight_booking"
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-refresh-secret
JWT_EXPIRES_IN=1h
JWT_REFRESH_EXPIRES_IN=7d

MOMO_PARTNER_CODE=MOMOBKUN20180529
MOMO_ACCESS_KEY=klm05TvNBzhg7h7j
MOMO_SECRET_KEY=at67qH6mk8w5Y1nAyMoYKMWACiEi2bsa
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_IPN_URL=http://localhost:3000/api/payments/momo/ipn
MOMO_RETURN_URL=http://localhost:5173/payment/status

PORT=3000
NODE_ENV=development
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 9. TESTING PLAN

### 9.1 Unit Tests (Backend)
- Auth service: register, login, token validation
- Booking service: create, calculate price, validate seats
- MoMo service: signature generation, IPN handling
- Seat inventory: decrease/restore seats

### 9.2 Integration Tests
- Full booking flow: search → book → pay
- Admin CRUD operations
- Payment callback handling

### 9.3 E2E Tests (Cypress - optional)
- User journey: register → search → book → pay → view ticket
- Admin journey: login → manage flights → view bookings

---

## 10. TIMELINE & MILESTONES

### Week 1: Foundation
- ✅ Project setup & structure
- ✅ Database schema & migrations
- ✅ Backend infrastructure (Express, middleware)
- ✅ Auth module (register, login, JWT)

### Week 2: Core Features
- ✅ Flight search & booking
- ✅ Seat inventory management
- ✅ MoMo payment integration
- ✅ Booking expiration cron

### Week 3: Admin & Frontend
- ✅ Admin CRUD APIs
- ✅ Frontend setup & routing
- ✅ User pages (search, booking, payment)
- ✅ Admin dashboard

### Week 4: Polish & Deploy
- ✅ Swagger documentation
- ✅ Testing
- ✅ Bug fixes
- ✅ Deployment guides

---

## 11. NOTES & BEST PRACTICES

### 11.1 Security
- Always hash passwords with bcrypt (saltRounds=10)
- Validate all inputs with Zod
- Verify MoMo signatures on IPN
- Use HTTPS in production
- Implement rate limiting (express-rate-limit)

### 11.2 Performance
- Index frequently queried fields (departTime, status, userId)
- Use connection pooling in Prisma
- Cache airport/aircraft data
- Paginate large lists

### 11.3 Error Handling
- Centralized error handler middleware
- Log all errors with Winston
- Return consistent error format:
  ```json
  {
    "success": false,
    "message": "Error message",
    "errors": []
  }
  ```

### 11.4 Code Quality
- TypeScript strict mode
- ESLint + Prettier
- Commit conventions (Conventional Commits)
- Code review before merge

---

## 12. FUTURE ENHANCEMENTS

- Round-trip flight booking
- Multi-city flights
- Seat selection (seat map)
- Baggage options
- Meal preferences
- Email notifications (booking confirmation, reminder)
- SMS OTP for verification
- Social login (Google, Facebook)
- Mobile app (React Native)
- Multi-language support
- Currency conversion
- Loyalty program / Frequent flyer
- Real-time flight status updates
- Check-in online
- Boarding pass generation (PDF/QR code)

---

## 13. REFERENCES

- [MoMo API Documentation](https://developers.momo.vn/)
- [Prisma Docs](https://www.prisma.io/docs/)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-performance.html)
- [React Router v6](https://reactrouter.com/)
- [TailwindCSS](https://tailwindcss.com/)
- [Zustand](https://docs.pmnd.rs/zustand/)

---

**Tác giả**: Senior Full-Stack Engineer
**Ngày tạo**: January 7, 2026
**Version**: 1.0
