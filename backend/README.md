# Flight Booking System Backend

Backend API cho hệ thống đặt vé máy bay với đầy đủ tính năng theo SRS Enhancement.

## 🚀 Quick Start

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Khởi động MySQL Database

```bash
# Từ thư mục root (DoAn/)
docker-compose up -d
```

### 3. Cấu hình môi trường

```bash
# Copy file .env.example thành .env
cp .env.example .env

# Cập nhật các thông tin cần thiết trong .env
```

### 4. Chạy migrations & seed

```bash
# Generate Prisma Client
npm run db:generate

# Chạy migrations
npm run db:migrate

# Seed dữ liệu mẫu
npm run db:seed
```

### 5. Khởi động server

```bash
# Development mode
npm run dev

# Production mode
npm start
```

Server sẽ chạy tại: `http://localhost:3000`

## 📊 Database Schema

### Core Models
- **User**: Quản lý người dùng (ADMIN, MANAGER, SALES, USER)
- **Airport**: Sân bay
- **Aircraft**: Loại máy bay
- **TicketType**: Loại vé (ADULT, CHILD, INFANT)
- **Route**: Tuyến bay
- **Flight**: Chuyến bay
- **SeatInventory**: Quản lý ghế ngồi
- **Booking**: Đặt vé (hỗ trợ public booking không cần login)
- **BookingPassenger**: Thông tin hành khách
- **Payment**: Thanh toán
- **Coupon**: Mã giảm giá

### SRS Enhancements
- ✅ Multi-role system (ADMIN/MANAGER/SALES/USER)
- ✅ Public booking with bookingCode
- ✅ Ticket type pricing (ADULT 100%, CHILD 75%, INFANT 10%)
- ✅ Route với distance, duration, standardPrice
- ✅ Flight với promotionId và notes
- ✅ Booking rejection tracking

## 🔐 Default Users

| Email | Password | Role |
|-------|----------|------|
| admin@flight.com | admin | ADMIN |
| manager@flight.com | 123 | MANAGER |
| sales@flight.com | 123 | SALES |
| customer@gmail.com | 123 | USER |

## 📝 Scripts Available

```bash
npm run dev          # Start development server with nodemon
npm start            # Start production server
npm run db:generate  # Generate Prisma Client
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with sample data
npm run db:studio    # Open Prisma Studio
npm run db:reset     # Reset database (drop all data)
```

## 🗄️ Database Management

### Prisma Studio
Mở giao diện quản lý database:
```bash
npm run db:studio
```

### Reset Database
```bash
npm run db:reset
```

## 📦 Tech Stack

- **Node.js** + **Express**: Server framework
- **Prisma ORM**: Database ORM
- **MySQL 8**: Database
- **JWT**: Authentication
- **bcrypt**: Password hashing
- **Zod**: Validation
- **Winston**: Logging
- **PDFKit**: PDF generation (for tickets)
- **QRCode**: QR code generation
- **node-cron**: Background jobs

## 🏗️ Project Structure

```
backend/
├── config/           # Database & app configuration
├── controllers/      # Request handlers
├── middleware/       # Auth, validation, error handling
├── routes/           # API routes
├── services/         # Business logic
├── utils/            # Helper functions
├── prisma/
│   ├── schema.prisma # Database schema
│   └── seed.js       # Seed data
├── server.js         # Entry point
├── package.json
└── .env
```

## 🔄 Next Steps

Sau khi hoàn thành Phase 1 (Database), tiếp tục với:
- **Phase 2**: Backend Infrastructure (Express setup, middleware, auth)
- **Phase 3**: Public Booking APIs
- **Phase 4**: Role-based Access Control
- **Phase 5-6**: Sales & Manager Modules
- **Phase 7-11**: Frontend & Testing

Tham khảo chi tiết tại: `plans/06-srs-enhancement-plan.md`
