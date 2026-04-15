# Flight Booking System - Hệ Thống Đặt Vé Máy Bay

Hệ thống đặt vé máy bay full-stack với đầy đủ tính năng theo mô hình Vietnam Airlines, bổ sung các yêu cầu từ SRS Document.

## 🚀 Recent Updates (April 15, 2026) - Vercel Deployment Ready!

### ✈️ Vercel Deployment Support (⭐ NEW)
**Deploy to Vercel in 5 minutes!**

**Features:**
- ✅ Frontend deployment to Vercel (auto-deploy from GitHub)
- ✅ Backend deployment options (Railway, Render, DigitalOcean)
- ✅ Environment variable management
- ✅ Auto-scaling & CDN
- ✅ Zero-downtime deployments
- ✅ Production ready configuration

**Quick Start:**
```bash
# Frontend to Vercel (5 min)
vercel --prod

# Backend to Railway (10 min)
# See RAILWAY_DEPLOYMENT.md for details

# Update API URL in Vercel
# Set VITE_API_URL environment variable
```

**Documentation:**
- [Vercel Quick Start Guide](VERCEL_QUICK_START.md) ⭐ Start here!
- [Complete Vercel Deployment Guide](VERCEL_DEPLOYMENT.md)
- [Railway Backend Deployment](RAILWAY_DEPLOYMENT.md)

**Configuration Files:**
- `vercel.json` - Vercel build configuration
- `.vercelignore` - Files to exclude from deployment
- `frontend/vite.config.js` - Updated with API URL support
- `frontend/.env.example` - Environment variables example

**MoMo API v3 Upgrade (April 15, 2026):**
- ✅ MoMo v3 API support with userInfo, storeName, referenceId
- ✅ Enhanced payment tracking with promotion details
- ✅ 100% backward compatible
- ✅ See [MOMO_V3_UPGRADE_SUMMARY.md](MOMO_V3_UPGRADE_SUMMARY.md)

---

## 📋 Recent Updates (January 12, 2026)

### 🔐 Admin Approval Password Reset Flow
**Luồng đặt lại mật khẩu với xác nhận admin 2 bước:**

```
User Request → Admin Email Notification → Admin Approval → User Reset Email → Password Changed
```

**Features:**
- ✅ User nhập email → Gửi thông báo đến admin (duongtrunghieu3004@gmail.com)
- ✅ Admin nhận email với thông tin user + nút "Chấp nhận"
- ✅ Admin click → System tự động gửi reset link cho user
- ✅ HTML email templates (gradient red cho admin, gradient blue cho user)
- ✅ Token security: Approval (30 min) + Reset (15 min), single-use, SHA-256 hashing
- ✅ Email enumeration prevention
- ✅ Comprehensive documentation (400+ lines)

**Files Updated:**
- `backend/utils/emailService.js` - Added `sendAdminNotificationEmail()`
- `backend/controllers/authController.js` - Updated `forgotPassword()`, added `approvePasswordReset()`
- `backend/routes/authRoutes.js` - Added `GET /api/auth/approve-reset/:token`
- `backend/ADMIN_APPROVAL_IMPLEMENTATION.md` - Complete implementation guide
- `backend/ADMIN_APPROVAL_FLOW.md` - Detailed flow documentation

**Documentation:**
- [Admin Approval Implementation Guide](backend/ADMIN_APPROVAL_IMPLEMENTATION.md)
- [Admin Approval Flow Details](backend/ADMIN_APPROVAL_FLOW.md)
- [Email Service Configuration](backend/EMAIL_CONFIG.md)

---

## �🎯 Tính năng chính

### ⭐ Core Features
- ✈️ Tìm kiếm chuyến bay (theo tuyến, ngày, loại vé)
- 🎫 Đặt vé trực tuyến (hỗ trợ đặt không cần đăng nhập)
- 💳 Thanh toán qua MoMo Payment Gateway (Sandbox)
- 🎟️ Mã giảm giá (Coupons/Promotions)
- 📧 Email xác nhận booking
- 🔍 Tra cứu vé theo mã booking
- 🔐 Đăng ký & Đăng nhập tài khoản
- 🔑 **Quên mật khẩu với Admin Approval** (⭐ MỚI)
  - User nhập email → Email gửi đến Admin
  - Admin kiểm tra & chấp nhận qua email
  - System tự động gửi reset link cho user
  - Security: 2-step verification, token expiration
- 👤 Quản lý profile & đổi mật khẩu
- 📧 **Email Service** - Gmail SMTP với App Password authentication
  - Nodemailer + Gmail SMTP
  - HTML email templates (responsive)
  - Admin notification email (gradient red)
  - User reset password email (gradient blue)

### ⭐ SRS Enhancement Features
- 👥 **Multi-role System**: ADMIN, MANAGER, SALES, USER
- 🎫 **Ticket Types**: ADULT (100%), CHILD (75%), INFANT (10%)
- 📋 **Public Booking**: Đặt vé không cần đăng nhập, chỉ cần email/phone
- 🔑 **Booking Code**: Tra cứu và quản lý booking bằng mã unique
- 💼 **Sales Management**: Sales có thể reject booking với lý do
- 📊 **Manager Dashboard**: Quản lý routes, flights, ticket types
- 👤 **User Management**: Admin quản lý users với multi-role
- 📄 **PDF Ticket Export**: Download vé điện tử dạng PDF
- 📈 **Reporting**: Export báo cáo Excel
- ⏱️ **Session Timeout**: 30 phút tự động logout

## 🛠️ Công nghệ sử dụng

### Backend
- **Runtime**: Node.js + Express.js
- **Database**: MySQL 8 (Docker)
- **ORM**: Prisma
- **Authentication**: JWT (Access + Refresh Token)
- **Password**: bcrypt
- **Validation**: Zod
- **Logging**: Winston
- **Payment**: MoMo Sandbox
- **Email**: Nodemailer (Gmail SMTP)
- **PDF**: PDFKit + QRCode
- **Cron**: node-cron (auto-expire bookings)

### Frontend (Coming in Phase 7-11)
- **Framework**: React 18 + Vite
- **Language**: TypeScript
- **Routing**: React Router v6
- **State**: Zustand
- **Styling**: TailwindCSS + daisyUI
- **Forms**: React Hook Form + Zod
- **HTTP**: Axios

## 📁 Cấu trúc dự án

```
DoAn/
├── database/              # SQL files để import trực tiếp vào MySQL
│   ├── schema.sql         # Database schema
│   ├── seed.sql           # Sample data
│   ├── import-docker.sql  # ⭐ Import toàn bộ (khuyên dùng)
│   ├── import.ps1         # Script tự động import
│   ├── QUICK_START.md     # Hướng dẫn chi tiết
│   └── README.md
├── backend/               # Node.js Backend API
│   ├── prisma/           # Prisma schema & migrations
│   ├── config/           # Database & app config
│   ├── controllers/      # Request handlers
│   ├── middleware/       # Auth, validation, error handling
│   ├── routes/           # API routes
│   ├── utils/            # Helper functions
│   ├── server.js         # Entry point
│   ├── .env.example      # Environment variables template
│   ├── .env              # Current configuration (local)
│   ├── package.json      # Dependencies
│   └── README.md
├── frontend/             # React Frontend + Vite
│   ├── src/              # React source code
│   ├── vite.config.js    # ⭐ Updated: API URL configuration
│   ├── .env.example      # Environment variables template
│   ├── package.json      # Dependencies
│   └── README.md
├── plans/                # Project planning documents
│   ├── PROJECT_PLAN.md           # Master plan
│   ├── 01-database-plan.md       # Phase 1: Database
│   ├── 02-backend-infrastructure-plan.md
│   ├── 03-booking-payment-plan.md
│   ├── 04-admin-apis-plan.md
│   ├── 05-frontend-setup-plan.md
│   └── 06-srs-enhancement-plan.md
├── vercel.json           # ⭐ Vercel configuration (frontend)
├── .vercelignore         # ⭐ Files to exclude from Vercel
├── VERCEL_QUICK_START.md # ⭐ Quick start guide for Vercel (5 min)
├── VERCEL_DEPLOYMENT.md  # ⭐ Complete Vercel deployment guide
├── RAILWAY_DEPLOYMENT.md # ⭐ Backend deployment to Railway (10 min)
├── MOMO_V3_UPGRADE_SUMMARY.md # ⭐ MoMo API v3 upgrade
├── docker-compose.yml    # MySQL Docker setup
└── README.md             # This file
```

## 🚀 Cài đặt & Chạy dự án

### Yêu cầu
- **Node.js** >= 18.x
- **Docker Desktop** (để chạy MySQL)
- **npm** hoặc **yarn**

### Bước 1: Clone & Install

```bash
# Clone repository
git clone <repository-url>
cd DoAn

# Install backend dependencies
cd backend
npm install
```

### Bước 2: Khởi động Database

**Option A: Sử dụng Prisma (Khuyên dùng cho development)**

```bash
# Từ thư mục DoAn/
docker-compose up -d

# Từ thư mục backend/
npm run db:generate    # Generate Prisma Client
npm run db:migrate     # Run migrations
npm run db:seed        # Seed sample data
```

**Option B: Import SQL trực tiếp (Nhanh hơn) ⭐**

```powershell
# Windows PowerShell - Từ thư mục DoAn/
docker-compose up -d
.\database\import.ps1
```

```bash
# Linux/Mac - Từ thư mục DoAn/
docker-compose up -d
cat database/import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword
```

### Bước 3: Cấu hình môi trường

```bash
# Từ thư mục backend/
cp .env.example .env

# Cập nhật .env nếu cần (đã có sẵn config mặc định)
```

### Bước 4: Khởi động Backend

```bash
# Từ thư mục backend/
npm run dev    # Development mode với nodemon
# hoặc
npm start      # Production mode
```

Server sẽ chạy tại: **http://localhost:3000**

### Bước 5: Kiểm tra Database

```bash
# Mở Prisma Studio
cd backend
npm run db:studio
```

Prisma Studio sẽ mở tại: **http://localhost:5555**

## 🔐 Tài khoản mặc định

| Email | Password | Role | Quyền |
|-------|----------|------|-------|
| admin@flight.com | admin | ADMIN | Full access |
| manager@flight.com | 123 | MANAGER | Manage routes, flights, ticket types |
| sales@flight.com | 123 | SALES | Manage bookings, reject bookings |
| customer@gmail.com | 123 | USER | Book flights, view bookings |

## 📊 Sample Data

Sau khi seed/import, database sẽ có:
- ✅ 4 users (mỗi role 1 user)
- ✅ 5 airports (HAN, SGN, DAD, CXR, PQC)
- ✅ 6 routes (HAN↔SGN, HAN→DAD, HAN→CXR, SGN→DAD, SGN→PQC)
- ✅ 10 flights mẫu (tuyến HAN→SGN, ngày 1-4/2/2026)
- ✅ 3 ticket types (ADULT, CHILD, INFANT)
- ✅ 3 coupons (SUMMER2026, NEWYEAR2026, FLASH50)
- ✅ 20 seat inventory records (10 flights × 2 classes)

## 📖 Documentation

- **Project Planning**: Xem thư mục `plans/`
  - [PROJECT_PLAN.md](plans/PROJECT_PLAN.md) - Master plan overview
  - [06-srs-enhancement-plan.md](plans/06-srs-enhancement-plan.md) - ⭐ SRS requirements chi tiết
- **Database**: Xem thư mục `database/`
  - [database/README.md](database/README.md) - Database overview
  - [database/QUICK_START.md](database/QUICK_START.md) - Import instructions
- **Backend**: Xem [backend/README.md](backend/README.md)
- **Email Service**: ⭐ **MỚI**
  - [backend/EMAIL_CONFIG.md](backend/EMAIL_CONFIG.md) - Hướng dẫn cấu hình Gmail SMTP
  - [backend/EMAIL_IMPLEMENTATION.md](backend/EMAIL_IMPLEMENTATION.md) - Chi tiết implementation
  - [backend/ADMIN_APPROVAL_FLOW.md](backend/ADMIN_APPROVAL_FLOW.md) - Luồng xác nhận admin
  - [backend/ADMIN_APPROVAL_IMPLEMENTATION.md](backend/ADMIN_APPROVAL_IMPLEMENTATION.md) - Hướng dẫn đầy đủ

## 🧪 Testing

```bash
# Kiểm tra database
docker exec flight_booking_db mysql -uroot -prootpassword -e "USE flight_booking; SHOW TABLES;"

# Xem users
docker exec flight_booking_db mysql -uroot -prootpassword -e "USE flight_booking; SELECT email, role FROM users;"

# Xem flights
docker exec flight_booking_db mysql -uroot -prootpassword -e "USE flight_booking; SELECT flightNumber, departureTime, basePrice FROM flights LIMIT 5;"
```

## 📝 API Endpoints

### 🌐 Public APIs (No Authentication)

#### Flights & Airports
```
GET    /api/public/flights              - Tìm kiếm chuyến bay
GET    /api/public/flights/:id          - Chi tiết chuyến bay
GET    /api/public/airports             - Danh sách sân bay
GET    /api/public/routes               - Danh sách tuyến bay
```

#### Bookings (Public)
```
POST   /api/public/bookings             - Tạo booking (không cần login)
GET    /api/public/bookings/:bookingCode - Tra cứu booking theo mã
GET    /api/public/bookings/:bookingCode/ticket - Download PDF ticket
```

#### Promotions
```
GET    /api/public/promotions           - Danh sách khuyến mãi
POST   /api/public/validate-coupon      - Kiểm tra mã giảm giá
```

### 🔐 Authentication APIs

```
POST   /api/auth/register               - Đăng ký tài khoản mới
POST   /api/auth/login                  - Đăng nhập
POST   /api/auth/logout                 - Đăng xuất (requires auth)
POST   /api/auth/refresh                - Refresh access token
GET    /api/auth/me                     - Lấy thông tin user hiện tại
POST   /api/auth/forgot-password        - ⭐ Yêu cầu reset mật khẩu (gửi email cho admin)
GET    /api/auth/approve-reset/:token   - ⭐ Admin chấp nhận reset (từ email)
POST   /api/auth/reset-password         - ⭐ User đặt lại mật khẩu với token
```

#### 🔑 Forgot Password Flow với Admin Approval:
```
[1] User nhập email → POST /api/auth/forgot-password
    ↓
[2] 📧 Email gửi đến ADMIN (duongtrunghieu3004@gmail.com)
    Subject: "🔐 Yêu cầu đặt lại mật khẩu - Cần xác nhận"
    Content: Thông tin user + Nút "✅ Chấp nhận & Gửi link reset"
    ↓
[3] Admin mở Gmail → Kiểm tra thông tin → Click nút
    ↓
[4] Browser mở: GET /api/auth/approve-reset/{token}
    ↓
[5] 📧 Email tự động gửi đến User
    Subject: "Đặt lại mật khẩu - TrungHieuFlight"
    Content: Link reset password (expires 15 phút)
    ↓
[6] User click link → Frontend: /reset-password?token=xxx
    ↓
[7] User nhập mật khẩu mới → POST /api/auth/reset-password
    ↓
[8] ✅ Mật khẩu đã được đặt lại
```

**Tokens Security:**
- **Approval Token**: 30 phút (cho admin kiểm tra)
- **Reset Token**: 15 phút (cho user đặt lại)
- SHA-256 hashing, single-use, in-memory storage
1. User nhập email tại `/forgot-password`
2. API gửi reset token (expires 15 phút)
3. User click link trong email: `/reset-password?token=xxx`
4. User nhập mật khẩu mới
5. API cập nhật mật khẩu và xóa token

### 💳 Payment APIs

```
POST   /api/payments/momo               - Tạo thanh toán MoMo
POST   /api/payments/momo/callback      - IPN callback từ MoMo
GET    /api/payments/momo/return        - Return URL sau thanh toán
GET    /api/payments/:bookingId/status  - Kiểm tra trạng thái thanh toán
```

### 👤 User APIs (Requires Authentication)

```
GET    /api/users/profile               - Xem profile
PUT    /api/users/profile               - Cập nhật profile
PUT    /api/users/password              - Đổi mật khẩu
GET    /api/users/bookings              - Danh sách bookings của user
GET    /api/users/bookings/:id          - Chi tiết booking
PUT    /api/users/bookings/:id/cancel   - Hủy booking (chỉ PENDING)
```

### 💼 Sales APIs (Role: SALES, MANAGER, ADMIN)

```
GET    /api/sales/bookings              - Danh sách tất cả bookings
GET    /api/sales/bookings/:id          - Chi tiết booking
PUT    /api/sales/bookings/:id/confirm  - Xác nhận booking
PUT    /api/sales/bookings/:id/reject   - Từ chối booking (+ lý do)
PUT    /api/sales/bookings/:id/complete - Hoàn thành booking
GET    /api/sales/statistics            - Thống kê sales
```

### 📊 Manager APIs (Role: MANAGER, ADMIN)

```
# Airports Management
GET    /api/manager/airports            - Danh sách airports
POST   /api/manager/airports            - Tạo airport mới
PUT    /api/manager/airports/:id        - Cập nhật airport
DELETE /api/manager/airports/:id        - Xóa airport

# Routes Management
GET    /api/manager/routes              - Danh sách routes
POST   /api/manager/routes              - Tạo route mới
PUT    /api/manager/routes/:id          - Cập nhật route
DELETE /api/manager/routes/:id          - Xóa route

# Flights Management
GET    /api/manager/flights             - Danh sách flights
POST   /api/manager/flights             - Tạo flight mới
PUT    /api/manager/flights/:id         - Cập nhật flight
DELETE /api/manager/flights/:id         - Xóa flight
PUT    /api/manager/flights/:id/toggle  - Bật/tắt flight

# Ticket Types
GET    /api/manager/ticket-types        - Danh sách loại vé
POST   /api/manager/ticket-types        - Tạo loại vé mới
PUT    /api/manager/ticket-types/:id    - Cập nhật loại vé
DELETE /api/manager/ticket-types/:id    - Xóa loại vé

# Reports
GET    /api/manager/reports/revenue     - Báo cáo doanh thu
GET    /api/manager/reports/bookings    - Báo cáo đặt vé
GET    /api/manager/reports/flights     - Báo cáo chuyến bay
```

### 👑 Admin APIs (Role: ADMIN)

```
# Users Management
GET    /api/admin/users                 - Danh sách users
GET    /api/admin/users/:id             - Chi tiết user
POST   /api/admin/users                 - Tạo user mới
PUT    /api/admin/users/:id             - Cập nhật user
PUT    /api/admin/users/:id/role        - Đổi role user
PUT    /api/admin/users/:id/toggle      - Bật/tắt user
DELETE /api/admin/users/:id             - Xóa user

# Coupons Management
GET    /api/admin/coupons               - Danh sách coupons
POST   /api/admin/coupons               - Tạo coupon mới
PUT    /api/admin/coupons/:id           - Cập nhật coupon
DELETE /api/admin/coupons/:id           - Xóa coupon
PUT    /api/admin/coupons/:id/toggle    - Bật/tắt coupon

# Dashboard & Statistics
GET    /api/admin/dashboard             - Overview dashboard
GET    /api/admin/statistics/revenue    - Thống kê doanh thu
GET    /api/admin/statistics/users      - Thống kê users
GET    /api/admin/statistics/bookings   - Thống kê bookings
```

### 📋 Request/Response Examples

#### Register
```json
POST /api/auth/register
{
  "email": "user@example.com",
  "password": "Password123",
  "fullName": "Nguyen Van A",
  "phoneNumber": "0912345678"
}

Response: 201 Created
{
  "success": true,
  "message": "Registration successful",
  "data": {
    "user": { "id": "xxx", "email": "...", "fullName": "...", "role": "USER" },
    "accessToken": "eyJhbGc...",
    "refreshToken": "eyJhbGc..."
  }
}
```

#### Forgot Password (với Admin Approval)
```json
POST /api/auth/forgot-password
{
  "email": "user@example.com"
}

Response: 200 OK (Always returns success để tránh email enumeration)
{
  "success": true,
  "message": "Yêu cầu đặt lại mật khẩu đã được gửi đến quản trị viên. Bạn sẽ nhận được email xác nhận sau khi admin kiểm tra."
}

// Backend behavior:
// 1. Check email trong database
// 2. Generate approval token (30 phút)
// 3. 📧 Gửi email đến ADMIN: duongtrunghieu3004@gmail.com
// 4. Admin nhận email với nút "Chấp nhận"
// 5. Admin click → GET /api/auth/approve-reset/{token}
// 6. Backend gửi email reset đến user
```

#### Admin Approve Reset (từ email)
```http
GET /api/auth/approve-reset/{approvalToken}

Response: HTML Page
✅ Success: "Đã chấp nhận! Email đặt lại mật khẩu đã được gửi đến: user@example.com"
❌ Error: "Link không hợp lệ" hoặc "Link đã hết hạn (30 phút)"
```

#### Reset Password
```json
POST /api/auth/reset-password
{
  "token": "abc123...",
  "newPassword": "NewPassword123"
}

Response: 200 OK
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập bằng mật khẩu mới."
}
```

---

## � Admin Approval Password Reset Flow (⭐ NEW)

### 📋 Overview

Hệ thống đặt lại mật khẩu với **xác minh 2 bước bởi admin** để tăng cường bảo mật:

```
User Request → Admin Notification → Admin Approval → User Reset
```

### 🔄 Detailed Flow

#### Step 1: User Request
```
1. User vào: http://localhost:5173/forgot-password
2. Nhập email: uyenminh@gmail.com
3. Click "Gửi link đặt lại mật khẩu"
4. API: POST /api/auth/forgot-password
5. Response: "Yêu cầu đã được gửi đến quản trị viên..."
```

#### Step 2: Admin Notification Email
```
📧 Email gửi đến: duongtrunghieu3004@gmail.com
From: TrungHieuFlight System
Subject: 🔐 Yêu cầu đặt lại mật khẩu - Cần xác nhận

╔═══════════════════════════════════════╗
║  🔐 XÁC NHẬN YÊU CẦU                ║  ← Gradient red
║  Đặt lại mật khẩu cho người dùng     ║
╠═══════════════════════════════════════╣
║  📋 THÔNG TIN NGƯỜI DÙNG             ║
║  ┌────────────────────────────────┐  ║
║  │ Họ tên:  Uyên Minh            │  ║
║  │ Email:   uyenminh@gmail.com   │  ║
║  │ Thời gian: 12/01/2026 20:00   │  ║
║  └────────────────────────────────┘  ║
║                                       ║
║  ┌───────────────────────────────┐   ║
║  │ ✅ Chấp nhận & Gửi link reset │   ║ ← Click here!
║  └───────────────────────────────┘   ║
║                                       ║
║  ⚠️ Link có hiệu lực 30 phút         ║
╚═══════════════════════════════════════╝

Token: Approval token (30 minutes expiry)
```

#### Step 3: Admin Approval
```
1. Admin mở Gmail: duongtrunghieu3004@gmail.com
2. Đọc thông tin user và xác minh
3. Click nút "✅ Chấp nhận & Gửi link reset"
4. Browser mở: http://localhost:3000/api/auth/approve-reset/{token}
5. Backend xử lý:
   - Verify approval token
   - Generate reset token (15 phút)
   - Gửi email reset đến user
6. Hiển thị trang HTML: "✅ Đã chấp nhận!"
```

#### Step 4: User Reset Email
```
📧 Email gửi đến: uyenminh@gmail.com (user)
From: TrungHieuFlight
Subject: Đặt lại mật khẩu - TrungHieuFlight

╔═══════════════════════════════════════╗
║  ✈️ TRUNG HIEU FLIGHT               ║  ← Gradient blue
║  Đặt lại mật khẩu                    ║
╠═══════════════════════════════════════╣
║  Yêu cầu của bạn đã được chấp nhận   ║
║                                       ║
║  ┌───────────────────────────────┐   ║
║  │   Đặt lại mật khẩu           │   ║ ← Click here!
║  └───────────────────────────────┘   ║
║                                       ║
║  Link: http://localhost:5173/        ║
║        reset-password?token=xxx       ║
║                                       ║
║  ⚠️ Link có hiệu lực 15 phút         ║
║  ⚠️ Chỉ sử dụng được 1 lần           ║
╚═══════════════════════════════════════╝

Token: Reset token (15 minutes expiry, single-use)
```

#### Step 5: User Reset Password
```
1. User mở email → Click "Đặt lại mật khẩu"
2. Browser redirect: http://localhost:5173/reset-password?token=xxx
3. User nhập:
   - Mật khẩu mới: NewPassword123
   - Xác nhận: NewPassword123
4. Click "Đặt lại mật khẩu"
5. API: POST /api/auth/reset-password
6. ✅ Success: "Mật khẩu đã được đặt lại thành công"
7. User login với mật khẩu mới
```

### 🔐 Security Features

#### Token Management
```javascript
// Approval Token (Admin)
{
  type: "crypto.randomBytes(32).toString('hex')",
  hash: "SHA-256",
  storage: "In-memory Map (approvalTokens)",
  expiry: "30 minutes",
  singleUse: "Deleted after approval"
}

// Reset Token (User)
{
  type: "crypto.randomBytes(32).toString('hex')",
  hash: "SHA-256", 
  storage: "In-memory Map (resetTokens)",
  expiry: "15 minutes",
  singleUse: "Deleted after password reset"
}
```

#### Email Enumeration Prevention
```javascript
// Always return success message
// Không tiết lộ email có tồn tại hay không
if (!user || !user.isActive) {
  return res.json({
    success: true,
    message: "Yêu cầu đã được gửi đến quản trị viên..."
  });
}
```

#### Admin-Only Access
- Admin email: **duongtrunghieu3004@gmail.com** (hardcoded)
- Approval link: Chỉ admin có (qua email)
- No authentication required (security by obscurity)
- Cryptographically secure tokens

### 📊 HTML Response Pages

Backend trả về HTML pages cho admin approval:

#### ✅ Success Page
```html
Icon: ✅ (64px green checkmark)
Title: "Đã chấp nhận!"
Message: "Email đặt lại mật khẩu đã được gửi đến: uyenminh@gmail.com"
Note: "Link reset có hiệu lực trong 15 phút và chỉ sử dụng được 1 lần"
```

#### ❌ Error Pages

**Invalid Token:**
```html
Icon: ❌ Red X
Title: "Link không hợp lệ"
Message: "Link xác nhận này không tồn tại hoặc đã hết hạn (30 phút)"
```

**Expired Token:**
```html
Icon: ⏳ Hourglass
Title: "Link đã hết hạn"
Message: "Link xác nhận này đã hết hạn (30 phút)"
```

**Email Send Error:**
```html
Icon: ❌ Red X
Title: "Lỗi gửi email"
Message: "Không thể gửi email đặt lại mật khẩu cho người dùng"
```

### 🧪 Testing Admin Approval Flow

#### Method 1: Frontend UI (Recommended)
```bash
# Terminal 1: Start Backend
cd backend
npm run dev

# Terminal 2: Start Frontend
cd frontend
npm run dev

# Browser Testing:
1. Vào: http://localhost:5173/forgot-password
2. Nhập email: uyenminh@gmail.com
3. Click "Gửi link đặt lại mật khẩu"
4. Check message: "Yêu cầu đã được gửi đến quản trị viên..."
5. Mở Gmail: duongtrunghieu3004@gmail.com
6. Tìm email từ "TrungHieuFlight System"
7. Click nút "✅ Chấp nhận & Gửi link reset"
8. Verify success page: "Đã chấp nhận!"
9. Mở Gmail user: uyenminh@gmail.com
10. Click "Đặt lại mật khẩu"
11. Nhập mật khẩu mới → Submit
12. ✅ Login với mật khẩu mới
```

#### Method 2: API Direct (For Testing)
```bash
# Step 1: User Request
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email":"uyenminh@gmail.com"}'

# Response:
{
  "success": true,
  "message": "Yêu cầu đặt lại mật khẩu đã được gửi đến quản trị viên..."
}

# Step 2: Check Admin Email
# Mở Gmail: duongtrunghieu3004@gmail.com
# Copy approval token từ link trong email

# Step 3: Admin Approve (Browser)
# http://localhost:3000/api/auth/approve-reset/{APPROVAL_TOKEN}
# Should see success page: "✅ Đã chấp nhận!"

# Step 4: Check User Email
# Mở Gmail của user
# Copy reset token từ link

# Step 5: Reset Password
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{"token":"{RESET_TOKEN}","newPassword":"NewPassword123"}'

# Response:
{
  "success": true,
  "message": "Mật khẩu đã được đặt lại thành công"
}
```

### 📝 Backend Logs

#### Successful Flow
```
[info]: Admin notification sent for password reset request from: uyenminh@gmail.com
[info]: Password reset email sent to uyenminh@gmail.com after admin approval
[info]: Password reset successful for user: {userId}
```

#### Error Logs
```
[warn]: Password reset requested for non-existent/inactive email: fake@email.com
[error]: Failed to send admin notification: {error details}
[error]: Failed to send reset email after approval: {error details}
```

### 🚨 Troubleshooting

#### Admin không nhận email
```
Kiểm tra:
1. Backend logs: "Admin notification sent..."
2. EMAIL_USER và EMAIL_PASSWORD trong .env
3. Gmail spam folder
4. Email service is ready: Check startup logs

Giải pháp:
- Verify EMAIL_USER = duongtrunghieu3004@gmail.com
- Verify EMAIL_PASSWORD là App Password (16 ký tự)
- Check backend logs để debug
- Test với email khác
```

#### Link approve không hoạt động
```
Lỗi: "Link không hợp lệ" hoặc "Link đã hết hạn"

Nguyên nhân:
- Token đã expire (30 phút)
- Token đã được sử dụng rồi
- Backend restart (in-memory tokens bị mất)

Giải pháp:
- User gửi lại yêu cầu reset
- Admin click link ngay lập tức
- Production: Dùng Redis thay vì in-memory
```

#### User không nhận email reset
```
Kiểm tra:
1. Admin đã click approve chưa?
2. Backend logs: "Password reset email sent to..."
3. User spam folder
4. Email service configuration

Giải pháp:
- Đảm bảo admin đã click approve
- Check backend logs
- User check spam folder
- Verify email service working
```

### 📖 Documentation

Chi tiết đầy đủ xem:
- [backend/ADMIN_APPROVAL_IMPLEMENTATION.md](backend/ADMIN_APPROVAL_IMPLEMENTATION.md) - Complete guide
- [backend/ADMIN_APPROVAL_FLOW.md](backend/ADMIN_APPROVAL_FLOW.md) - Flow details
- [backend/EMAIL_CONFIG.md](backend/EMAIL_CONFIG.md) - Gmail SMTP setup
- [backend/EMAIL_IMPLEMENTATION.md](backend/EMAIL_IMPLEMENTATION.md) - Email service

---

## �📧 Email Service Configuration

### ⚙️ Setup Gmail SMTP

Hệ thống sử dụng **Gmail SMTP** để gửi email. Yêu cầu **App Password** (không phải mật khẩu Gmail thường).

#### Bước 1: Enable 2-Step Verification
```
1. Vào: https://myaccount.google.com/security
2. Tìm "2-Step Verification"
3. Click "Get Started" và làm theo hướng dẫn
```

#### Bước 2: Create App Password
```
1. Vào: https://myaccount.google.com/apppasswords
2. Select app: Mail
3. Select device: Other (Custom name)
4. Nhập: "TrungHieuFlight"
5. Click "Generate"
6. Copy 16-digit password (xxxx xxxx xxxx xxxx)
```

#### Bước 3: Update .env
```env
# Email Configuration (Gmail)
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-digit-app-password  # Không có dấu cách
BACKEND_URL=http://localhost:3000
FRONTEND_URL=http://localhost:5173
```

#### Bước 4: Restart Backend
```bash
# Backend sẽ tự restart (nodemon)
# Hoặc restart thủ công:
npm run dev
```

#### Bước 5: Verify
```bash
# Check backend logs khi start:
# ✅ Email service is ready
# 📧 Sending emails from: your-email@gmail.com

# Nếu chưa config:
# ⚠️ Email service not configured
# ⚠️ Please set EMAIL_USER and EMAIL_PASSWORD in .env
```

### 📧 Email Templates

**Email 1: Admin Notification**
- **To**: duongtrunghieu3004@gmail.com (hardcoded)
- **Subject**: 🔐 Yêu cầu đặt lại mật khẩu - Cần xác nhận
- **Content**: 
  - Thông tin user (Họ tên, Email, Thời gian)
  - Nút "✅ Chấp nhận & Gửi link reset" (green button)
  - Link có hiệu lực 30 phút
- **Template**: Gradient red header, responsive HTML

**Email 2: User Reset Password**
- **To**: Email của user
- **Subject**: Đặt lại mật khẩu - TrungHieuFlight
- **Content**:
  - Nút "Đặt lại mật khẩu" (blue button)
  - Link có hiệu lực 15 phút
  - Warning: Single-use token
- **Template**: Gradient blue header, responsive HTML

### 🐛 Troubleshooting Email

**Admin không nhận email:**
```
Check:
1. EMAIL_USER và EMAIL_PASSWORD đúng trong .env
2. App Password (16 ký tự), không phải password thường
3. Backend logs: "Admin notification sent..."
4. Gmail spam folder

Fix:
- Restart backend: npm run dev
- Check .env format (no quotes for password)
- Verify 2-Step Verification enabled
```

**User không nhận email reset:**
```
Check:
1. Admin đã click approve chưa?
2. Backend logs: "Password reset email sent to..."
3. User spam folder
4. Token chưa expired (15 phút)

Fix:
- Admin check Gmail inbox
- User check spam folder
- Request lại nếu token expired
```

**Link approve không hoạt động:**
```
Error: "Link không hợp lệ"
Causes:
- Token đã hết hạn (30 phút)
- Token đã được sử dụng
- Backend restart (in-memory tokens mất)

Fix:
- User gửi lại request forgot-password
- Admin click link mới ngay lập tức
- Production: Dùng Redis thay vì in-memory
```

### 📚 Email Documentation

Chi tiết đầy đủ trong:
- [backend/EMAIL_CONFIG.md](backend/EMAIL_CONFIG.md) - Setup guide
- [backend/EMAIL_IMPLEMENTATION.md](backend/EMAIL_IMPLEMENTATION.md) - Technical details
- [backend/ADMIN_APPROVAL_FLOW.md](backend/ADMIN_APPROVAL_FLOW.md) - Flow diagram
- [backend/ADMIN_APPROVAL_IMPLEMENTATION.md](backend/ADMIN_APPROVAL_IMPLEMENTATION.md) - Complete guide

---

## 🗓️ Development Timeline

- ✅ **Phase 1**: Database Schema & Setup - **COMPLETED**
- ✅ **Phase 2**: Backend Infrastructure - **COMPLETED**
- ✅ **Phase 3**: Public Booking APIs - **COMPLETED**
- ✅ **Phase 4**: Role-based Access Control - **COMPLETED**
- ✅ **Phase 5-6**: Sales & Manager Modules - **COMPLETED**
- ✅ **Phase 7**: Frontend Setup (React + Vite) - **COMPLETED**
- ✅ **Payment Integration**: MoMo Gateway - **COMPLETED**
- ✅ **Email Service**: Gmail SMTP with App Password - **COMPLETED ⭐ NEW**
- ✅ **Admin Approval Flow**: Password reset với xác nhận admin - **COMPLETED ⭐ NEW**
- 🔄 **Phase 8-11**: Frontend Pages & Polish - **IN PROGRESS**

**Status**: Production Ready - All core features implemented!

### ⭐ Latest Updates (January 2026)

**Email Service Implementation:**
- ✅ Nodemailer integration với Gmail SMTP
- ✅ HTML email templates (responsive design)
- ✅ App Password authentication
- ✅ Startup email verification
- ✅ Error handling và logging

**Admin Approval Flow:**
- ✅ 2-step password reset process
- ✅ Admin notification email (30 phút expiry)
- ✅ User reset email (15 phút expiry)
- ✅ HTML success/error pages
- ✅ Token security (SHA-256, single-use)
- ✅ Complete documentation (4 MD files)

---

## 🔧 Troubleshooting & Common Issues

### ❌ Đăng ký không được

**Triệu chứng**: Register form submit nhưng không có phản hồi hoặc báo lỗi validator

**Nguyên nhân & Giải pháp**:

1. **Backend chưa chạy**
   ```bash
   cd backend
   npm run dev
   ```
   Kiểm tra: `http://localhost:3000/health` phải trả về OK

2. **Frontend gọi sai URL**
   - Kiểm tra `frontend/src/utils/api.js`
   - baseURL phải là `http://localhost:3000/api`

3. **Validator yêu cầu sai**
   - Validator hiện tại yêu cầu: `email`, `password`, `fullName`, `phoneNumber`
   - Password phải **ít nhất 6 ký tự** (HTML5 validation + backend check)
   - Phone phải **10-11 chữ số** (HTML5 pattern validation)
   - Frontend đã có validation hints: 
     - Password field hiển thị "Tối thiểu 6 ký tự"
     - Phone field có pattern `[0-9]{10,11}` với helper text "10-11 chữ số"

4. **CORS Error**
   - Backend phải enable CORS cho `http://localhost:5173` hoặc `http://localhost:5174`
   - Kiểm tra `backend/server.js` có `cors()` middleware

**✅ Cải tiến mới nhất (2026-01-11)**:
- ✅ Thêm HTML5 validation attributes (`minLength`, `pattern`) vào form
- ✅ Thêm helper text hiển thị requirements trước khi submit
- ✅ Browser tự động validate trước khi gửi request (giảm load API)

**🔍 Cách debug lỗi đăng ký trên Frontend**:
1. Mở trình duyệt: `http://localhost:5173/register`
2. Nhấn F12 → Tab **Console** để xem JavaScript errors
3. Tab **Network** → Filter "Fetch/XHR" → Tìm request `/auth/register`
4. Click vào request → Tab **Response** để xem lỗi cụ thể từ backend
5. Các lỗi thường gặp:
   - `Email already exists` → Email đã được đăng ký
   - `Password must be at least 6 characters` → Password quá ngắn
   - `Phone number must be 10-11 digits` → SĐT không đúng format
   - `Failed to fetch` → Backend chưa chạy (check http://localhost:3000/health)

**Test Registration qua API**:
```powershell
$body = @{
  email = "test@example.com"
  password = "Test@123456"
  fullName = "Test User"
  phoneNumber = "0912345678"
} | ConvertTo-Json

Invoke-RestMethod -Uri 'http://localhost:3000/api/auth/register' -Method POST -Body $body -ContentType 'application/json'
```

### 🔑 Quên mật khẩu không hoạt động

**Lưu ý**: Hiện tại sử dụng in-memory store (Map) cho reset tokens

**Development Mode**:
- API trả về reset token trong response (chỉ development)
- Link reset hiển thị trong hộp vàng trên trang
- Token hết hạn sau 15 phút

**⚠️ Tại sao không thấy link reset?**
1. **Email không tồn tại trong hệ thống** → Backend không trả về link (security feature)
   - Kiểm tra email đã đăng ký: `docker exec flight_booking_db mysql -uroot -proot flight_booking -e "SELECT email FROM users;"`
   - Hoặc sử dụng email test: `test2177@gmail.com`, `testuser123@gmail.com`

2. **Rate limiter đang block** → Đợi 1 phút rồi thử lại

3. **Frontend chưa refresh** → Hard refresh (Ctrl + F5)

**Cách sử dụng**:
1. Mở: http://localhost:5173/forgot-password
2. Nhập email **đã tồn tại** trong database
3. Nhấn "Gửi link đặt lại mật khẩu"
4. Link reset sẽ hiển thị trong hộp vàng (nếu email hợp lệ)
5. Click vào link hoặc copy URL
6. Nhập mật khẩu mới (tối thiểu 6 ký tự)

**Production Mode** (Cần implement):
- Thêm email service (NodeMailer, SendGrid, ...)
- Gửi reset link qua email
- Ẩn token khỏi response

### 💳 Thanh toán MoMo lỗi

**Các lỗi thường gặp**:

1. **"Failed to create MoMo payment"**
   - Kiểm tra `.env`: `MOMO_PARTNER_CODE`, `MOMO_ACCESS_KEY`, `MOMO_SECRET_KEY`
   - Xác nhận dùng MoMo Sandbox credentials

2. **404 sau khi thanh toán**
   - Kiểm tra `MOMO_REDIRECT_URL` trong `.env` phải là `http://localhost:3000/api/payments/momo/return`
   - Route `/payment/callback` phải có trong `frontend/src/App.jsx`

3. **Dashboard chưa cập nhật status**
   - IPN callback phải cập nhật cả `payment.status` và `booking.status`
   - Kiểm tra `paymentController.js` - `handleMoMoCallback()` và `handleMoMoReturn()`

4. **Duplicate payments**
   - Hệ thống đã có duplicate prevention (check trong 5 phút)
   - Nếu user spam click, sẽ reject payment mới

### ✈️ Admin không thêm được chuyến bay

**Triệu chứng**: Click "Thêm chuyến bay" → Điền form → Submit → Lỗi "Không thể lưu chuyến bay"

**Nguyên nhân & Giải pháp**:

1. **Thiếu trường businessPrice** ⭐ (Đã fix 2026-01-11)
   - Backend validator yêu cầu `basePrice` và `businessPrice` đều bắt buộc
   - Frontend cũ chỉ có trường `Giá cơ bản`, thiếu `Giá thương gia`
   - **✅ Đã sửa**: Thêm input "Giá thương gia" vào form
   - Công thức mặc định: Giá thương gia = Giá cơ bản × 1.5

2. **Thời gian hạ cánh < Thời gian khởi hành** ⭐ (Đã fix 2026-01-11)
   - Validator kiểm tra `arrivalTime > departureTime`
   - **✅ Đã sửa**: Thêm validation check trước khi submit
   - Hiển thị lỗi: "Thời gian hạ cánh phải sau thời gian khởi hành"

3. **Số 0 đầu bị mất khi nhập giá** (VD: 0165000 → 165000) ⭐ (Đã fix 2026-01-11)
   - HTML `<input type="number">` tự động bỏ số 0 đầu
   - **✅ Đã sửa**: Đổi sang `type="text"` với `inputMode="numeric"` và `pattern="[0-9]*"`
   - Giữ nguyên leading zeros nếu cần, parse thành số khi submit

4. **Thời gian trong quá khứ**
   - Validator yêu cầu `departureTime > now` (phải là tương lai)
   - Chọn ngày giờ trong tương lai khi test

5. **routeId hoặc aircraftId không tồn tại**
   - Kiểm tra dropdown "Tuyến bay" và "Máy bay" có dữ liệu
   - Nếu trống: Cần seed data hoặc thêm routes/aircrafts trước

**✅ Cải tiến mới nhất (2026-01-11)**:
- ✅ Thêm trường "Giá thương gia" vào form flight
- ✅ Validate thời gian hạ cánh > khởi hành trước khi submit
- ✅ Đổi input number → text để giữ leading zeros (0165000)
- ✅ Auto-calculate businessPrice = basePrice × 1.5 nếu không nhập
- ✅ Đổi input cho số ghế máy bay sang text để giữ format

**Cách test thêm chuyến bay**:
```plaintext
1. Login admin: admin@admin.com / Admin@123456
2. Tab "Chuyến bay" → Click "Thêm chuyến bay"
3. Điền form:
   - Số hiệu: VN3004
   - Tuyến bay: HAN → SGN
   - Máy bay: Boeing 787
   - Giá cơ bản: 1650000 (có thể nhập 0165000 nếu muốn)
   - Giá thương gia: 2475000 (hoặc để trống tự tính = 1650000 × 1.5)
   - Khởi hành: 01/02/2026 16:35
   - Hạ cánh: 01/02/2026 18:35 (phải > khởi hành!)
   - Trạng thái: SCHEDULED
4. Click "Thêm"
```

### 🗄️ Database Issues

### 🗄️ Database Issues

#### Database Connection Error
```bash
# Kiểm tra container
docker ps | findstr flight_booking_db

# Restart container
docker-compose restart

# Xem logs
docker logs flight_booking_db
```

#### Port 3307 bị chiếm
Đổi port trong `docker-compose.yml` và `.env`

#### Prisma Migration Error
```bash
# Reset database
npm run db:reset

# Hoặc import lại SQL
.\database\import.ps1  # Windows
```

#### Duplicate payments trong database
```sql
-- Cleanup script đã có sẵn trong database/cleanup.sql
-- Chạy cleanup để xóa duplicates và sync status
docker exec -i flight_booking_db mysql -uroot -proot flight_booking < database/cleanup.sql
```

### 🚪 Port Issues

**Backend port 3000 đã được dùng**:
```powershell
# Windows - Kill process trên port 3000
$port = Get-NetTCPConnection -LocalPort 3000 | Select-Object -ExpandProperty OwningProcess
Stop-Process -Id $port -Force
```

**Frontend port 5173 đã được dùng**:
- Vite tự động chọn port khác (5174, 5175, ...)
- Hoặc kill process: `taskkill /F /IM node.exe`

### 🔐 Authentication Issues

**Token expired / Invalid token**:
- Access token hết hạn sau 1 giờ
- Use refresh token để lấy access token mới
- Frontend tự động xử lý qua `api.js` interceptor

**"Account is inactive"**:
- Admin có thể toggle user active/inactive
- Contact admin để activate lại account

---

## 📚 Tài liệu bổ sung

### File Documents đã tạo

**Deployment & Setup:**
- ✅ `DEPLOYMENT-SUCCESS.md` - Hướng dẫn deploy production
- ✅ `DOCKER-DEPLOYMENT.md` - Deploy với Docker
- ✅ `SETUP-GUIDE.md` - Hướng dẫn setup môi trường

**Email Service:** ⭐ **MỚI**
- ✅ `backend/EMAIL_CONFIG.md` - Hướng dẫn cấu hình Gmail SMTP (280 dòng)
- ✅ `backend/EMAIL_IMPLEMENTATION.md` - Technical implementation details
- ✅ `backend/ADMIN_APPROVAL_FLOW.md` - Luồng xác nhận admin chi tiết (300+ dòng)
- ✅ `backend/ADMIN_APPROVAL_IMPLEMENTATION.md` - Complete testing guide (400+ dòng)

**System Maintenance:**
- ✅ `SYSTEM_CONSISTENCY_CHECK.md` - Báo cáo kiểm tra hệ thống
- ✅ `FIX_COMPLETED.md` - Tổng hợp các fix và maintenance
- ✅ `backend/FIXES_SUMMARY.md` - Tóm tắt các vấn đề đã sửa
- ✅ `database/cleanup.sql` - Script cleanup database

### Maintenance Scripts

**Weekly Cleanup (Khuyên chạy hàng tuần)**:
```sql
-- Mark old PENDING payments as FAILED (>30 phút)
UPDATE payments 
SET status = 'FAILED' 
WHERE status = 'PENDING' 
  AND createdAt < DATE_SUB(NOW(), INTERVAL 30 MINUTE);

-- Cancel expired bookings without successful payment
UPDATE bookings b
LEFT JOIN payments p ON b.id = p.bookingId AND p.status = 'SUCCESS'
SET b.status = 'CANCELLED'
WHERE b.status = 'PENDING'
  AND b.createdAt < DATE_SUB(NOW(), INTERVAL 24 HOUR)
  AND p.id IS NULL;
```

**Monitor Queries**:
```sql
-- Check for duplicate payments
SELECT bookingId, COUNT(*) as payment_count
FROM payments
GROUP BY bookingId
HAVING payment_count > 1;

-- Check booking status mismatch
SELECT b.id, b.bookingCode, b.status as booking_status, p.status as payment_status
FROM bookings b
LEFT JOIN payments p ON b.id = p.bookingId
WHERE b.status != 'CANCELLED' AND (
  (p.status = 'SUCCESS' AND b.status != 'CONFIRMED') OR
  (p.status = 'FAILED' AND b.status = 'PENDING')
);
```

---

## 🎓 Hướng dẫn sử dụng cho User

### 1. Đăng ký tài khoản
1. Truy cập `http://localhost:5173/register` (hoặc 5174)
2. Điền thông tin:
   - **Họ tên**: Tối thiểu 2 ký tự
   - **Email**: Email hợp lệ (unique)
   - **Số điện thoại**: 10-11 chữ số
   - **Mật khẩu**: Tối thiểu 6 ký tự
3. Click "Đăng ký"
4. Tự động chuyển đến trang login

### 2. Đăng nhập
1. Truy cập `http://localhost:5173/login`
2. Nhập email và password
3. Click "Đăng nhập"
4. Redirect theo role:
   - **USER**: Trang chủ
   - **SALES**: Booking Management
   - **MANAGER**: Booking Management
   - **ADMIN**: Admin Dashboard

### 3. Quên mật khẩu (Admin Approval Flow) ⭐ **CẬP NHẬT MỚI**
1. Tại trang login, click "Quên mật khẩu?"
2. Nhập email đã đăng ký
3. Click "Gửi link đặt lại mật khẩu"
4. **Thông báo**: "Yêu cầu đã gửi đến quản trị viên..."
5. **Admin nhận email** tại: duongtrunghieu3004@gmail.com
   - Subject: "🔐 Yêu cầu đặt lại mật khẩu"
   - Thông tin: Họ tên, Email user, Thời gian
   - Nút: "✅ Chấp nhận & Gửi link reset"
6. Admin kiểm tra và click nút chấp nhận
7. **User nhận email** với link reset password
   - Subject: "Đặt lại mật khẩu - TrungHieuFlight"
   - Link có hiệu lực 15 phút
8. User click link → Chuyển đến trang reset-password
9. Nhập mật khẩu mới (2 lần)
10. Click "Đặt lại mật khẩu"
11. ✅ Hoàn tất! Login với mật khẩu mới

**Lưu ý:**
- Approval token (admin): 30 phút
- Reset token (user): 15 phút
- Mỗi token chỉ dùng 1 lần
- Email được gửi qua Gmail SMTP

### 4. Đặt vé (Không cần login)
1. Trang chủ: Chọn điểm đi, điểm đến, ngày
2. Click "Tìm kiếm chuyến bay"
3. Chọn chuyến bay phù hợp
4. Điền thông tin hành khách
5. Nhập mã giảm giá (nếu có)
6. Click "Đặt vé"
7. Thanh toán qua MoMo
8. Nhận mã booking qua email

### 5. Tra cứu vé
1. Truy cập `/track-booking`
2. Nhập mã booking
3. Xem thông tin chi tiết
4. Download vé PDF (nếu đã thanh toán)

### 6. Quản lý vé (Cần login)
1. Login và vào Dashboard
2. Xem danh sách vé đã đặt
3. Hủy vé (chỉ vé PENDING)
4. Download vé PDF

---

## 🛠️ Hướng dẫn cho Developer

### Thêm API Endpoint mới

1. **Tạo Controller**:
```javascript
// backend/controllers/myController.js
export const myFunction = asyncHandler(async (req, res) => {
  // Your logic here
  res.json({ success: true, data: {} });
});
```

2. **Tạo Validator**:
```javascript
// backend/validators/myValidator.js
export const mySchema = {
  body: z.object({
    field: z.string().min(1)
  })
};
```

3. **Tạo Route**:
```javascript
// backend/routes/myRoutes.js
import { myFunction } from '../controllers/myController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import validate from '../middleware/validate.js';
import { mySchema } from '../validators/myValidator.js';

router.post('/my-endpoint', 
  authenticate,  // Nếu cần auth
  authorize(['ADMIN']),  // Nếu cần role
  validate(mySchema),  // Nếu cần validation
  myFunction
);
```

4. **Register Route trong server.js**:
```javascript
import myRoutes from './routes/myRoutes.js';
app.use('/api/my', myRoutes);
```

### Thêm Frontend Page mới

1. **Tạo Page Component**:
```jsx
// frontend/src/pages/MyPage.jsx
export default function MyPage() {
  return <div>My Page</div>;
}
```

2. **Thêm Route vào App.jsx**:
```jsx
import MyPage from './pages/MyPage';

<Route path="my-page" element={<MyPage />} />
```

3. **Call API**:
```jsx
import api from '../utils/api';

const fetchData = async () => {
  const { data } = await api.get('/my-endpoint');
  console.log(data);
};
```

---

## 🌐 Deployment Guides (⭐ NEW - April 15, 2026)

### Quick Deployment to Production

Your app is **production-ready** and can be deployed to Vercel + Railway in **15 minutes**!

#### 🚀 Deploy Frontend (5 minutes)
```bash
npm install -g vercel
vercel --prod
```
- Auto-deploy from GitHub
- Global CDN
- Free tier available
- Domain: `your-app.vercel.app`

#### 🛠️ Deploy Backend (10 minutes)
```bash
# Use Railway (recommended)
# 1. Go to https://railway.app
# 2. Connect GitHub repo
# 3. Add MySQL service
# 4. Set environment variables
# 5. Deploy automatically
```

### Deployment Options

| Platform | Frontend | Backend | Database | Cost | Link |
|----------|----------|---------|----------|------|------|
| **Vercel** | ✅ Recommended | ❌ Not ideal | N/A | Free | [Vercel Docs](https://vercel.com) |
| **Railway** | ✅ OK | ✅ Recommended | ✅ MySQL | Free tier | [Railway Docs](https://railway.app) |
| **Render** | ✅ OK | ✅ Good | ✅ Postgres | Free tier | [Render Docs](https://render.com) |
| **DigitalOcean** | ✅ | ✅ | ✅ | $5-20/mo | [DO Docs](https://digitalocean.com) |

### 📚 Complete Deployment Documentation

**Start here:**
1. [VERCEL_QUICK_START.md](VERCEL_QUICK_START.md) - 5 minute setup guide
2. [RAILWAY_DEPLOYMENT.md](RAILWAY_DEPLOYMENT.md) - Step-by-step Railway setup
3. [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md) - Complete guide with all options

**Key Configuration Files:**
- `vercel.json` - Frontend build configuration
- `.vercelignore` - Files to exclude
- `frontend/.env.example` - Frontend environment variables
- `backend/.env.example` - Backend environment variables

### Deploy Checklist

**Frontend (Vercel):**
```
✅ Push code to GitHub
✅ Create Vercel account (vercel.com)
✅ Connect GitHub repo
✅ Set VITE_API_URL environment variable
✅ Deploy with "vercel --prod"
✅ Test at your-app.vercel.app
```

**Backend (Railway):**
```
✅ Create Railway account (railway.app)
✅ Connect GitHub repo
✅ Select "backend" folder
✅ Add MySQL service
✅ Set all environment variables
✅ Deploy (auto-triggers)
✅ Copy API URL
✅ Update VITE_API_URL in Vercel
```

### Test Production Deployment

```bash
# Test frontend loads
curl https://your-app.vercel.app

# Test backend API
curl https://your-api.railway.app/api/public/flights

# Test in browser
# 1. Visit https://your-app.vercel.app
# 2. Check Console for errors
# 3. Try creating a booking
# 4. Complete payment flow
```

---

## 🚀 Production Deployment

### Environment Variables (Production)

```env
# Database
DATABASE_URL="mysql://user:pass@host:3306/dbname"

# JWT
JWT_SECRET="very-strong-secret-key-here"
JWT_REFRESH_SECRET="another-strong-secret-key"

# MoMo (Production credentials)
MOMO_PARTNER_CODE="your-prod-partner-code"
MOMO_ACCESS_KEY="your-prod-access-key"
MOMO_SECRET_KEY="your-prod-secret-key"
MOMO_ENDPOINT="https://payment.momo.vn/v2/gateway/api/create"
MOMO_REDIRECT_URL="https://yourdomain.com/api/payments/momo/return"
MOMO_IPN_URL="https://yourdomain.com/api/payments/momo/callback"

# Email Configuration ⭐ **MỚI**
# Gmail SMTP với App Password (khuyên dùng)
EMAIL_USER="your-email@gmail.com"
EMAIL_PASSWORD="your-16-digit-app-password"  # Từ https://myaccount.google.com/apppasswords

# Hoặc dùng SendGrid/AWS SES cho production scale
# EMAIL_PROVIDER="sendgrid"
# SENDGRID_API_KEY="your-sendgrid-api-key"
# SENDGRID_FROM_EMAIL="noreply@yourdomain.com"

# URLs
BACKEND_URL="https://api.yourdomain.com"
FRONTEND_URL="https://yourdomain.com"

# Node Environment
NODE_ENV="production"
PORT=3000
```

### Email Service Production Setup ⭐ **MỚI**

**Option 1: Gmail (Small scale, <500 emails/day)**
```
✅ Ưu điểm:
- Free
- Setup nhanh (5 phút)
- Dùng email cá nhân/công ty

❌ Nhược điểm:
- Giới hạn: 500 emails/day (free), 2000/day (Workspace)
- Có thể bị Gmail filter
- Không phù hợp scale lớn

Khuyên dùng cho: Development, Testing, Small projects
```

**Option 2: SendGrid (Recommended for production)**
```
✅ Ưu điểm:
- 100 emails/day free
- 25,000 emails/month ($15/month)
- Email tracking, analytics
- High deliverability
- Professional templates

Setup:
1. Signup: https://sendgrid.com
2. Verify domain
3. Create API Key
4. Update .env:
   EMAIL_PROVIDER="sendgrid"
   SENDGRID_API_KEY="SG.xxx"
   SENDGRID_FROM_EMAIL="noreply@yourdomain.com"
```

**Option 3: AWS SES (Best for scale)**
```
✅ Ưu điểm:
- $0.10/1000 emails (rất rẻ)
- Unlimited scale
- High deliverability
- AWS integration

Setup:
1. AWS Console → SES
2. Verify domain/email
3. Request production access
4. Get SMTP credentials
5. Update .env với SMTP settings
```

**Production Checklist - Email:**
- [ ] Verify domain (SPF, DKIM, DMARC records)
- [ ] Use custom domain email (not @gmail.com)
- [ ] Setup email templates in database
- [ ] Add email logs/monitoring
- [ ] Rate limiting per email address
- [ ] Unsubscribe link (nếu marketing)
- [ ] Bounce/complaint handling
- [ ] Test deliverability với mail-tester.com

### Security Checklist

**Authentication & Authorization:**
- [ ] Đổi tất cả default passwords
- [ ] Set strong JWT secrets (min 32 characters)
- [ ] JWT expiry: Access 15min, Refresh 7 days
- [ ] Secure cookie settings (httpOnly, secure, sameSite)

**Email Security:** ⭐ **MỚI**
- [ ] Sử dụng App Password (không phải password thường)
- [ ] Email enumeration prevention (always return success)
- [ ] Token expiration: Approval 30min, Reset 15min
- [ ] Single-use tokens (delete after use)
- [ ] SHA-256 token hashing
- [ ] Rate limiting per email address

**Network & Infrastructure:**
- [ ] Enable HTTPS (SSL certificate)
- [ ] Configure CORS properly (whitelist domains)
- [ ] Rate limiting: 500 requests/15min (global)
- [ ] Helmet.js for security headers
- [ ] Hide stack traces trong production

**Data Security:**
- [ ] Input sanitization (Zod validation)
- [ ] SQL injection prevention (Prisma ORM)
- [ ] XSS prevention (React auto-escapes)
- [ ] CSRF protection (SameSite cookies)
- [ ] Password hashing (bcrypt, cost 10)

**Operations:**
- [ ] Environment variables không commit vào git
- [ ] Database backups định kỳ (daily)
- [ ] Error logs monitoring (Winston)
- [ ] Email delivery monitoring
- [ ] Token storage: Redis thay vì in-memory (production)

---

## 👥 Team

- **Developer**: [Your Name]
- **Course**: Lập Trình Với AI - Iviettech

## 📄 License

This project is for educational purposes.

## 🙏 Acknowledgments

- Vietnam Airlines (UI/UX inspiration)
- MoMo Payment Gateway (Sandbox)
- Prisma ORM Documentation
- React + Vite Documentation
