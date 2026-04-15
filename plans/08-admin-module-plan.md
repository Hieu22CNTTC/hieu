# Plan 08: Admin Module

## Mục tiêu
Implement các API cho ADMIN role để quản lý toàn bộ hệ thống: airports, aircraft, coupons, users, và dashboard statistics. ADMIN có quyền cao nhất trong hệ thống.

## Tech Stack
- Express.js + Prisma ORM
- Role-based access control (ADMIN)
- Joi validation
- Advanced statistics and reporting
- MySQL transactions

---

## 1. Role Hierarchy
```
USER < SALES < MANAGER < ADMIN
```

**ADMIN Permissions:**
- ✅ Quản lý Airports (xem, tạo, sửa, xóa)
- ✅ Quản lý Aircraft (xem, tạo, sửa, xóa)
- ✅ Quản lý Coupons (xem, tạo, sửa, xóa, kích hoạt/vô hiệu hóa)
- ✅ Quản lý Users (xem, cập nhật role, kích hoạt/vô hiệu hóa)
- ✅ Xem toàn bộ Bookings và Payments
- ✅ Dashboard với statistics tổng quan
- ✅ Có thể làm mọi thứ mà SALES và MANAGER làm được

---

## 2. Database Schema Reference

### Airport Model
```prisma
model Airport {
  id            String    @id @default(cuid())
  code          String    @unique // VN-HAN, VN-SGN, VN-DAD
  name          String
  city          String
  country       String
  timezone      String    @default("Asia/Ho_Chi_Minh")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  departureRoutes Route[] @relation("DepartureAirport")
  arrivalRoutes   Route[] @relation("ArrivalAirport")
}
```

### Aircraft Model
```prisma
model Aircraft {
  id            String    @id @default(cuid())
  model         String    // A321, Boeing 787
  totalSeats    Int
  businessSeats Int
  economySeats  Int
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  flights       Flight[]
}
```

### Coupon Model
```prisma
model Coupon {
  id              String    @id @default(cuid())
  code            String    @unique
  description     String?   @db.Text
  discount        Float     // percentage (e.g., 10 = 10%)
  minPurchase     Float?    // minimum booking amount
  maxDiscount     Float?    // maximum discount amount
  validFrom       DateTime
  validUntil      DateTime
  usageLimit      Int?      // null = unlimited
  usedCount       Int       @default(0)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  flights         Flight[]  @relation("FlightPromotion")
}
```

### User Model
```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String
  fullName      String
  phoneNumber   String?
  role          Role      @default(USER)
  isActive      Boolean   @default(true)
  lastLoginAt   DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  bookings      Booking[]
  payments      Payment[]
}

enum Role {
  USER
  SALES
  MANAGER
  ADMIN
}
```

---

## 3. API Endpoints

### 3.1 Airports Management

#### GET /api/admin/airports
Get all airports with filters and pagination

**Query Params:**
- `city` (optional): Filter by city
- `country` (optional): Filter by country
- `search` (optional): Search in code or name
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `sortBy` (default: 'createdAt'): Sort field
- `sortOrder` (default: 'desc'): Sort direction

**Response:**
```json
{
  "success": true,
  "data": {
    "airports": [
      {
        "id": "clxxx",
        "code": "HAN",
        "name": "Noi Bai International Airport",
        "city": "Hanoi",
        "country": "Vietnam",
        "timezone": "Asia/Ho_Chi_Minh",
        "routeCount": 15,
        "flightCount": 120,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 50,
      "totalPages": 3
    }
  }
}
```

#### GET /api/admin/airports/:id
Get airport details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "code": "HAN",
    "name": "Noi Bai International Airport",
    "city": "Hanoi",
    "country": "Vietnam",
    "timezone": "Asia/Ho_Chi_Minh",
    "departureRoutes": [
      {
        "id": "clyyy",
        "arrival": {
          "code": "SGN",
          "name": "Tan Son Nhat International Airport"
        },
        "flightCount": 25
      }
    ],
    "arrivalRoutes": [
      {
        "id": "clzzz",
        "departure": {
          "code": "SGN",
          "name": "Tan Son Nhat International Airport"
        },
        "flightCount": 28
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/admin/airports
Create new airport

**Request Body:**
```json
{
  "code": "HAN",
  "name": "Noi Bai International Airport",
  "city": "Hanoi",
  "country": "Vietnam",
  "timezone": "Asia/Ho_Chi_Minh"
}
```

**Validation Rules:**
- `code`: Required, uppercase, 3 characters
- `name`: Required, min 3 characters
- `city`: Required, min 2 characters
- `country`: Required, min 2 characters
- `timezone`: Optional, valid IANA timezone

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clnew",
    "code": "HAN",
    "name": "Noi Bai International Airport",
    "city": "Hanoi",
    "country": "Vietnam",
    "timezone": "Asia/Ho_Chi_Minh",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Airport created successfully"
}
```

#### PUT /api/admin/airports/:id
Update airport

**Request Body:**
```json
{
  "name": "Noi Bai International Airport - Terminal 2",
  "timezone": "Asia/Bangkok"
}
```

**Validation Rules:**
- All fields optional
- Cannot change code (immutable)
- Name must be min 3 characters if provided

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "code": "HAN",
    "name": "Noi Bai International Airport - Terminal 2",
    "city": "Hanoi",
    "country": "Vietnam",
    "timezone": "Asia/Bangkok",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Airport updated successfully"
}
```

#### DELETE /api/admin/airports/:id
Delete airport

**Validation:**
- Cannot delete if airport has routes
- Or: Soft delete by removing from active use

**Response:**
```json
{
  "success": true,
  "message": "Airport deleted successfully"
}
```

---

### 3.2 Aircraft Management

#### GET /api/admin/aircraft
Get all aircraft with pagination

**Query Params:**
- `model` (optional): Filter by model
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: 'createdAt')
- `sortOrder` (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "aircraft": [
      {
        "id": "clxxx",
        "model": "Airbus A321",
        "totalSeats": 220,
        "businessSeats": 20,
        "economySeats": 200,
        "flightCount": 45,
        "utilizationRate": 75.5,
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 10,
      "totalPages": 1
    }
  }
}
```

#### GET /api/admin/aircraft/:id
Get aircraft details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "model": "Airbus A321",
    "totalSeats": 220,
    "businessSeats": 20,
    "economySeats": 200,
    "flights": [
      {
        "id": "clflt1",
        "flightNumber": "VN101",
        "route": {
          "departure": { "code": "HAN" },
          "arrival": { "code": "SGN" }
        },
        "departureTime": "2024-01-15T06:00:00.000Z"
      }
    ],
    "statistics": {
      "totalFlights": 120,
      "totalRevenue": 2400000000,
      "avgOccupancyRate": 78.5
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/admin/aircraft
Create new aircraft

**Request Body:**
```json
{
  "model": "Airbus A321",
  "totalSeats": 220,
  "businessSeats": 20,
  "economySeats": 200
}
```

**Validation Rules:**
- `model`: Required, min 3 characters
- `totalSeats`: Required, positive integer
- `businessSeats`: Required, positive integer
- `economySeats`: Required, positive integer
- `totalSeats` must equal `businessSeats + economySeats`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clnew",
    "model": "Airbus A321",
    "totalSeats": 220,
    "businessSeats": 20,
    "economySeats": 200,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Aircraft created successfully"
}
```

#### PUT /api/admin/aircraft/:id
Update aircraft

**Request Body:**
```json
{
  "model": "Airbus A321neo",
  "businessSeats": 24,
  "economySeats": 196
}
```

**Validation Rules:**
- All fields optional
- If updating seat numbers, totalSeats = businessSeats + economySeats
- Cannot reduce seats if aircraft has future flights with higher bookings

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "model": "Airbus A321neo",
    "totalSeats": 220,
    "businessSeats": 24,
    "economySeats": 196,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Aircraft updated successfully"
}
```

#### DELETE /api/admin/aircraft/:id
Delete aircraft

**Validation:**
- Cannot delete if aircraft has future flights
- Can only delete if all associated flights are in the past

**Response:**
```json
{
  "success": true,
  "message": "Aircraft deleted successfully"
}
```

---

### 3.3 Coupons Management

#### GET /api/admin/coupons
Get all coupons with filters

**Query Params:**
- `isActive` (optional): Filter by active status
- `code` (optional): Search by code
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: 'createdAt')
- `sortOrder` (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "clxxx",
        "code": "SUMMER2024",
        "description": "Summer sale - 10% off",
        "discount": 10,
        "minPurchase": 500000,
        "maxDiscount": 200000,
        "validFrom": "2024-06-01T00:00:00.000Z",
        "validUntil": "2024-08-31T23:59:59.000Z",
        "usageLimit": 1000,
        "usedCount": 245,
        "isActive": true,
        "flightCount": 15,
        "createdAt": "2024-05-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 25,
      "totalPages": 2
    }
  }
}
```

#### GET /api/admin/coupons/:id
Get coupon details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "code": "SUMMER2024",
    "description": "Summer sale - 10% off all flights",
    "discount": 10,
    "minPurchase": 500000,
    "maxDiscount": 200000,
    "validFrom": "2024-06-01T00:00:00.000Z",
    "validUntil": "2024-08-31T23:59:59.000Z",
    "usageLimit": 1000,
    "usedCount": 245,
    "isActive": true,
    "flights": [
      {
        "id": "clflt1",
        "flightNumber": "VN101",
        "route": {
          "departure": { "code": "HAN" },
          "arrival": { "code": "SGN" }
        }
      }
    ],
    "statistics": {
      "totalRevenue": 450000000,
      "totalDiscount": 45000000,
      "avgDiscountPerUse": 183673
    },
    "createdAt": "2024-05-01T00:00:00.000Z",
    "updatedAt": "2024-05-01T00:00:00.000Z"
  }
}
```

#### POST /api/admin/coupons
Create new coupon

**Request Body:**
```json
{
  "code": "SUMMER2024",
  "description": "Summer sale - 10% off all flights",
  "discount": 10,
  "minPurchase": 500000,
  "maxDiscount": 200000,
  "validFrom": "2024-06-01T00:00:00.000Z",
  "validUntil": "2024-08-31T23:59:59.000Z",
  "usageLimit": 1000,
  "isActive": true
}
```

**Validation Rules:**
- `code`: Required, uppercase, unique, 4-20 characters
- `discount`: Required, between 1-100 (percentage)
- `minPurchase`: Optional, positive number
- `maxDiscount`: Optional, positive number
- `validFrom`: Required, valid date
- `validUntil`: Required, must be after validFrom
- `usageLimit`: Optional, positive integer, null = unlimited
- `isActive`: Optional, default true

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clnew",
    "code": "SUMMER2024",
    "description": "Summer sale - 10% off all flights",
    "discount": 10,
    "minPurchase": 500000,
    "maxDiscount": 200000,
    "validFrom": "2024-06-01T00:00:00.000Z",
    "validUntil": "2024-08-31T23:59:59.000Z",
    "usageLimit": 1000,
    "usedCount": 0,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Coupon created successfully"
}
```

#### PUT /api/admin/coupons/:id
Update coupon

**Request Body:**
```json
{
  "discount": 15,
  "validUntil": "2024-09-30T23:59:59.000Z",
  "usageLimit": 1500,
  "isActive": true
}
```

**Validation Rules:**
- All fields optional
- Cannot change code (immutable)
- validUntil must be after validFrom
- Cannot decrease usageLimit below usedCount

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "code": "SUMMER2024",
    "discount": 15,
    "validUntil": "2024-09-30T23:59:59.000Z",
    "usageLimit": 1500,
    "isActive": true,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Coupon updated successfully"
}
```

#### DELETE /api/admin/coupons/:id
Delete coupon

**Validation:**
- Can delete even if used (keeps historical data)
- Or: Soft delete by setting isActive = false

**Response:**
```json
{
  "success": true,
  "message": "Coupon deleted successfully"
}
```

#### PATCH /api/admin/coupons/:id/toggle
Toggle coupon active status

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "code": "SUMMER2024",
    "isActive": false
  },
  "message": "Coupon deactivated successfully"
}
```

---

### 3.4 Users Management

#### GET /api/admin/users
Get all users with filters

**Query Params:**
- `role` (optional): Filter by role (USER, SALES, MANAGER, ADMIN)
- `isActive` (optional): Filter by active status
- `search` (optional): Search in email or fullName
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: 'createdAt')
- `sortOrder` (default: 'desc')

**Response:**
```json
{
  "success": true,
  "data": {
    "users": [
      {
        "id": "clxxx",
        "email": "user@example.com",
        "fullName": "Nguyen Van A",
        "phoneNumber": "0987654321",
        "role": "USER",
        "isActive": true,
        "lastLoginAt": "2024-01-09T10:30:00.000Z",
        "bookingCount": 5,
        "totalSpent": 7500000,
        "createdAt": "2023-06-01T00:00:00.000Z"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 1500,
      "totalPages": 75
    }
  }
}
```

#### GET /api/admin/users/:id
Get user details

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "phoneNumber": "0987654321",
    "role": "USER",
    "isActive": true,
    "lastLoginAt": "2024-01-09T10:30:00.000Z",
    "bookings": [
      {
        "id": "clbook1",
        "bookingCode": "BK123456",
        "flight": {
          "flightNumber": "VN101"
        },
        "status": "CONFIRMED",
        "totalPrice": 1600000,
        "createdAt": "2024-01-05T00:00:00.000Z"
      }
    ],
    "statistics": {
      "totalBookings": 5,
      "totalSpent": 7500000,
      "cancelledBookings": 1,
      "completedBookings": 4
    },
    "createdAt": "2023-06-01T00:00:00.000Z",
    "updatedAt": "2024-01-09T10:30:00.000Z"
  }
}
```

#### PUT /api/admin/users/:id/role
Update user role

**Request Body:**
```json
{
  "role": "SALES"
}
```

**Validation Rules:**
- `role`: Required, one of: USER, SALES, MANAGER, ADMIN
- Cannot change own role
- Only ADMIN can set ADMIN role

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "email": "user@example.com",
    "fullName": "Nguyen Van A",
    "role": "SALES",
    "updatedAt": "2024-01-09T00:00:00.000Z"
  },
  "message": "User role updated successfully"
}
```

#### PATCH /api/admin/users/:id/toggle
Toggle user active status

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "email": "user@example.com",
    "isActive": false
  },
  "message": "User deactivated successfully"
}
```

---

### 3.5 System Statistics & Dashboard

#### GET /api/admin/dashboard
Get dashboard overview

**Response:**
```json
{
  "success": true,
  "data": {
    "overview": {
      "totalUsers": 1500,
      "totalBookings": 5400,
      "totalRevenue": 86400000000,
      "totalFlights": 1800
    },
    "today": {
      "newUsers": 25,
      "newBookings": 120,
      "revenue": 192000000,
      "scheduledFlights": 45
    },
    "thisMonth": {
      "newUsers": 450,
      "newBookings": 2400,
      "revenue": 38400000000,
      "avgBookingValue": 1600000
    },
    "recentBookings": [
      {
        "id": "clbook1",
        "bookingCode": "BK123456",
        "user": {
          "fullName": "Nguyen Van A"
        },
        "flight": {
          "flightNumber": "VN101"
        },
        "totalPrice": 1600000,
        "status": "CONFIRMED",
        "createdAt": "2024-01-09T10:00:00.000Z"
      }
    ],
    "topRoutes": [
      {
        "route": "HAN - SGN",
        "bookings": 850,
        "revenue": 1360000000
      }
    ]
  }
}
```

#### GET /api/admin/statistics/revenue
Get revenue statistics

**Query Params:**
- `startDate`: Required, ISO date
- `endDate`: Required, ISO date
- `groupBy`: 'day' | 'week' | 'month' (default: 'day')

**Response:**
```json
{
  "success": true,
  "data": {
    "revenue": [
      {
        "date": "2024-01-01",
        "totalRevenue": 192000000,
        "totalBookings": 120,
        "avgBookingValue": 1600000,
        "totalPassengers": 240
      }
    ],
    "summary": {
      "totalRevenue": 5760000000,
      "totalBookings": 3600,
      "avgDailyRevenue": 192000000,
      "growthRate": 12.5
    }
  }
}
```

#### GET /api/admin/statistics/bookings
Get booking statistics

**Query Params:**
- `startDate`: Required
- `endDate`: Required
- `groupBy`: 'status' | 'route' | 'time'

**Response:**
```json
{
  "success": true,
  "data": {
    "byStatus": {
      "CONFIRMED": 3200,
      "PENDING": 250,
      "CANCELLED": 150,
      "COMPLETED": 2800
    },
    "byRoute": [
      {
        "route": "HAN - SGN",
        "bookings": 850,
        "revenue": 1360000000,
        "avgOccupancy": 78
      }
    ],
    "byTime": [
      {
        "hour": 6,
        "bookings": 450,
        "revenue": 720000000
      }
    ]
  }
}
```

#### GET /api/admin/statistics/users
Get user statistics

**Response:**
```json
{
  "success": true,
  "data": {
    "total": 1500,
    "byRole": {
      "USER": 1450,
      "SALES": 30,
      "MANAGER": 15,
      "ADMIN": 5
    },
    "active": 1420,
    "inactive": 80,
    "newThisMonth": 450,
    "topUsers": [
      {
        "id": "clxxx",
        "fullName": "Nguyen Van A",
        "totalBookings": 25,
        "totalSpent": 40000000
      }
    ]
  }
}
```

---

## 4. Error Handling

### Common Error Codes

#### 400 Bad Request
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "code",
      "message": "Airport code must be exactly 3 characters"
    }
  ]
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Admin access required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Airport not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "Airport code already exists",
  "details": {
    "code": "HAN",
    "existingId": "clxxx"
  }
}
```

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": "Cannot delete airport with existing routes",
  "details": {
    "routeCount": 15
  }
}
```

---

## 5. Implementation Steps

### Step 1: Create Validators
- [x] Create `validators/adminValidator.js`
- [x] Airport validation schemas
- [x] Aircraft validation schemas
- [x] Coupon validation schemas
- [x] User validation schemas
- [x] Statistics validation schemas

### Step 2: Create Controller
- [x] Create `controllers/adminController.js`
- [x] Implement airport CRUD
- [x] Implement aircraft CRUD
- [x] Implement coupon CRUD
- [x] Implement user management
- [x] Implement dashboard statistics
- [x] Implement advanced statistics

### Step 3: Create Routes
- [x] Create `routes/adminRoutes.js`
- [x] Apply authentication middleware
- [x] Apply requireAdmin middleware
- [x] Apply validation middleware
- [x] Register all endpoints

### Step 4: Register Routes
- [x] Update `server.js` to include admin routes
- [x] Add route prefix `/api/admin`

### Step 5: Testing
- [ ] Test all CRUD operations
- [ ] Test role-based access control
- [ ] Test validation rules
- [ ] Test error handling
- [ ] Test statistics endpoints
- [ ] Test dashboard performance

---

## 6. Security Considerations

1. **Role Check**: Only ADMIN can access these endpoints
2. **Self-Protection**: Cannot change own role or deactivate self
3. **Input Validation**: Strict validation for all inputs
4. **Business Rules**: Enforce constraints (no delete with dependencies)
5. **Audit Log**: Log all admin operations
6. **Rate Limiting**: Apply stricter rate limits for admin endpoints
7. **Password Reset**: Admins can reset user passwords (future)

---

## 7. Testing Checklist

### Airports Management
- [ ] Create airport successfully
- [ ] Prevent duplicate airport codes
- [ ] Update airport successfully
- [ ] Delete airport without routes
- [ ] Prevent deleting airport with routes
- [ ] Get airports with filters
- [ ] Search airports by name/code

### Aircraft Management
- [ ] Create aircraft successfully
- [ ] Validate seat calculations
- [ ] Update aircraft successfully
- [ ] Delete aircraft without future flights
- [ ] Prevent deleting aircraft with future flights
- [ ] Get aircraft with statistics

### Coupons Management
- [ ] Create coupon successfully
- [ ] Prevent duplicate coupon codes
- [ ] Update coupon successfully
- [ ] Toggle coupon status
- [ ] Validate date ranges
- [ ] Track usage counts
- [ ] Calculate discount statistics

### Users Management
- [ ] Get users with filters
- [ ] Update user role
- [ ] Toggle user status
- [ ] Get user booking history
- [ ] View user statistics
- [ ] Search users

### Dashboard & Statistics
- [ ] Get dashboard overview
- [ ] Get revenue statistics
- [ ] Get booking statistics
- [ ] Get user statistics
- [ ] Filter by date range
- [ ] Group by time periods
- [ ] Calculate growth rates

---

## 8. Performance Optimization

### Caching Strategy
1. **Airport/Aircraft Data**: Cache for 1 hour (rarely changes)
2. **Dashboard Stats**: Cache for 5 minutes
3. **User Counts**: Cache for 10 minutes
4. **Revenue Reports**: Cache for 30 minutes

### Query Optimization
1. Use Prisma's `select` to fetch only needed fields
2. Implement pagination for all list endpoints
3. Use database indexes on frequently queried fields
4. Aggregate statistics at database level
5. Use connection pooling

### Response Time Targets
- List operations: < 200ms
- Detail operations: < 100ms
- Create/Update: < 300ms
- Dashboard: < 500ms
- Statistics: < 1000ms

---

## 9. Future Enhancements

### Phase 7.1 - Advanced Analytics
- [ ] Revenue forecasting
- [ ] User behavior analytics
- [ ] Route profitability analysis
- [ ] Seasonal trend analysis
- [ ] A/B testing for pricing

### Phase 7.2 - Automation
- [ ] Auto-deactivate expired coupons
- [ ] Email notifications for admins
- [ ] Scheduled reports
- [ ] Alert system for anomalies
- [ ] Backup automation

### Phase 7.3 - Enhanced Management
- [ ] Bulk operations (CSV import/export)
- [ ] Advanced search with filters
- [ ] Activity audit log viewer
- [ ] Role permission customization
- [ ] Multi-admin approval workflow

---

## 10. Notes

### Important Considerations
1. **Data Integrity**: All operations must maintain referential integrity
2. **Audit Trail**: Every admin action should be logged
3. **Performance**: Statistics queries can be expensive, use caching
4. **Security**: Admin endpoints are most sensitive, extra validation needed
5. **Scalability**: Design for growth, use pagination everywhere

### Known Limitations
- Statistics endpoints can be slow with large datasets
- No real-time updates (requires WebSocket/SSE in future)
- No multi-admin concurrent editing protection
- Limited to single organization (no multi-tenancy)

---

## Conclusion

Phase 7 Admin Module provides **complete system management** with:
- ✅ Airports, Aircraft, Coupons CRUD
- ✅ User management and role assignment
- ✅ Comprehensive dashboard
- ✅ Advanced statistics and reports
- ✅ Full audit logging
- ✅ Production-ready security

**Next Steps**: Implement all controllers, test thoroughly, and integrate with frontend admin dashboard.

---

**Status**: ⏳ **IN PROGRESS**  
**Target**: Production Ready
