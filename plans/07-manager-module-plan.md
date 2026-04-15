# Plan 07: Manager Module

## Mục tiêu
Implement các API cho MANAGER role để quản lý flights, routes, và ticket types. Manager có quyền cao hơn SALES nhưng thấp hơn ADMIN - tập trung vào quản lý nghiệp vụ vận hành chuyến bay.

## Tech Stack
- Express.js + Prisma ORM
- Role-based access control (MANAGER)
- Joi/Express-validator cho validation
- MySQL transactions cho data consistency

---

## 1. Role Hierarchy
```
USER < SALES < MANAGER < ADMIN
```

**MANAGER Permissions:**
- ✅ Quản lý Routes (xem, tạo, sửa, xóa)
- ✅ Quản lý Flights (xem, tạo, sửa, xóa)
- ✅ Quản lý Ticket Types (xem, tạo, sửa)
- ✅ Quản lý Seat Inventory cho flights
- ✅ Xem statistics & reports
- ❌ Không thể quản lý Users, Airports, Aircraft (chỉ ADMIN)

---

## 2. Database Schema Reference

### Route Model
```prisma
model Route {
  id              String    @id @default(cuid())
  departureId     String    // Foreign key to Airport
  arrivalId       String    // Foreign key to Airport
  distance        Int?      // in kilometers
  duration        Int?      // in minutes
  standardPrice   Float?    // base price for route (ADULT ECONOMY price)
  isActive        Boolean   @default(true)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  departure       Airport   @relation("DepartureAirport", fields: [departureId], references: [id])
  arrival         Airport   @relation("ArrivalAirport", fields: [arrivalId], references: [id])
  flights         Flight[]
}
```

### Flight Model
```prisma
model Flight {
  id                String    @id @default(cuid())
  flightNumber      String    @unique
  routeId           String
  aircraftId        String
  departureTime     DateTime
  arrivalTime       DateTime
  basePrice         Float     // ADULT ECONOMY base price for this flight
  businessPrice     Float     // ADULT BUSINESS price
  promotionId       String?
  notes             String?   @db.Text
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt

  route             Route     @relation(fields: [routeId], references: [id])
  aircraft          Aircraft  @relation(fields: [aircraftId], references: [id])
  promotion         Coupon?   @relation(fields: [promotionId], references: [id])
  seatInventory     SeatInventory[]
  bookings          Booking[]
}
```

### TicketType Model
```prisma
model TicketType {
  id              String          @id @default(cuid())
  name            TicketTypeName  @unique // ADULT, CHILD, INFANT
  pricePercentage Float           // ADULT: 100, CHILD: 75, INFANT: 10
  minAge          Int?            // ADULT: 12+, CHILD: 2-11, INFANT: 0-1
  maxAge          Int?
  description     String?         @db.Text
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  bookingPassengers BookingPassenger[]
}
```

---

## 3. API Endpoints

### 3.1 Routes Management

#### GET /api/manager/routes
Get all routes with filters and pagination

**Query Params:**
- `departureId` (optional): Filter by departure airport
- `arrivalId` (optional): Filter by arrival airport
- `isActive` (optional): Filter by active status
- `page` (default: 1): Page number
- `limit` (default: 20): Items per page
- `sortBy` (default: 'createdAt'): Sort field
- `sortOrder` (default: 'desc'): Sort direction

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "id": "clxxx",
        "departure": {
          "id": "clxxx",
          "code": "HAN",
          "name": "Noi Bai International Airport",
          "city": "Hanoi"
        },
        "arrival": {
          "id": "clyyy",
          "code": "SGN",
          "name": "Tan Son Nhat International Airport",
          "city": "Ho Chi Minh City"
        },
        "distance": 1160,
        "duration": 120,
        "standardPrice": 1500000,
        "isActive": true,
        "flightCount": 25,
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

#### GET /api/manager/routes/:id
Get route details by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "departure": {
      "id": "clxxx",
      "code": "HAN",
      "name": "Noi Bai International Airport",
      "city": "Hanoi",
      "country": "Vietnam"
    },
    "arrival": {
      "id": "clyyy",
      "code": "SGN",
      "name": "Tan Son Nhat International Airport",
      "city": "Ho Chi Minh City",
      "country": "Vietnam"
    },
    "distance": 1160,
    "duration": 120,
    "standardPrice": 1500000,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "flights": [
      {
        "id": "clzzz",
        "flightNumber": "VN101",
        "departureTime": "2024-01-15T06:00:00.000Z",
        "arrivalTime": "2024-01-15T08:00:00.000Z",
        "basePrice": 1600000,
        "status": "SCHEDULED"
      }
    ]
  }
}
```

#### POST /api/manager/routes
Create new route

**Request Body:**
```json
{
  "departureId": "clxxx",
  "arrivalId": "clyyy",
  "distance": 1160,
  "duration": 120,
  "standardPrice": 1500000
}
```

**Validation Rules:**
- `departureId`: Required, valid airport ID
- `arrivalId`: Required, valid airport ID, must be different from departureId
- `distance`: Optional, positive integer (km)
- `duration`: Optional, positive integer (minutes)
- `standardPrice`: Optional, positive float

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "departure": { "code": "HAN", "name": "..." },
    "arrival": { "code": "SGN", "name": "..." },
    "distance": 1160,
    "duration": 120,
    "standardPrice": 1500000,
    "isActive": true,
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Route created successfully"
}
```

#### PUT /api/manager/routes/:id
Update route

**Request Body:**
```json
{
  "distance": 1170,
  "duration": 125,
  "standardPrice": 1550000,
  "isActive": true
}
```

**Validation Rules:**
- All fields optional
- Cannot update departureId or arrivalId (must delete and recreate)
- Cannot deactivate route if it has active flights

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "departure": { "code": "HAN", "name": "..." },
    "arrival": { "code": "SGN", "name": "..." },
    "distance": 1170,
    "duration": 125,
    "standardPrice": 1550000,
    "isActive": true,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Route updated successfully"
}
```

#### DELETE /api/manager/routes/:id
Delete route

**Validation:**
- Cannot delete route with existing flights
- Or: Soft delete by setting isActive = false

**Response:**
```json
{
  "success": true,
  "message": "Route deleted successfully"
}
```

---

### 3.2 Flights Management

#### GET /api/manager/flights
Get all flights with filters and pagination

**Query Params:**
- `routeId` (optional): Filter by route
- `aircraftId` (optional): Filter by aircraft
- `flightNumber` (optional): Search by flight number
- `startDate` (optional): Filter by departure date from
- `endDate` (optional): Filter by departure date to
- `page` (default: 1)
- `limit` (default: 20)
- `sortBy` (default: 'departureTime')
- `sortOrder` (default: 'asc')

**Response:**
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "id": "clxxx",
        "flightNumber": "VN101",
        "route": {
          "id": "clyyy",
          "departure": { "code": "HAN", "city": "Hanoi" },
          "arrival": { "code": "SGN", "city": "Ho Chi Minh City" }
        },
        "aircraft": {
          "id": "clzzz",
          "model": "Airbus A321",
          "totalSeats": 220
        },
        "departureTime": "2024-01-15T06:00:00.000Z",
        "arrivalTime": "2024-01-15T08:00:00.000Z",
        "basePrice": 1600000,
        "businessPrice": 3500000,
        "availableSeats": {
          "economy": 150,
          "business": 20
        },
        "totalBookings": 50,
        "promotion": {
          "id": "clppp",
          "code": "SUMMER2024",
          "discount": 10
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 150,
      "totalPages": 8
    }
  }
}
```

#### GET /api/manager/flights/:id
Get flight details by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "flightNumber": "VN101",
    "route": {
      "id": "clyyy",
      "departure": {
        "id": "cldep",
        "code": "HAN",
        "name": "Noi Bai International Airport",
        "city": "Hanoi"
      },
      "arrival": {
        "id": "clarr",
        "code": "SGN",
        "name": "Tan Son Nhat International Airport",
        "city": "Ho Chi Minh City"
      },
      "distance": 1160,
      "duration": 120
    },
    "aircraft": {
      "id": "clzzz",
      "model": "Airbus A321",
      "totalSeats": 220,
      "businessSeats": 20,
      "economySeats": 200
    },
    "departureTime": "2024-01-15T06:00:00.000Z",
    "arrivalTime": "2024-01-15T08:00:00.000Z",
    "basePrice": 1600000,
    "businessPrice": 3500000,
    "notes": "Flight operated by Vietnam Airlines",
    "seatInventory": [
      {
        "id": "clseat1",
        "ticketClass": "ECONOMY",
        "totalSeats": 200,
        "availableSeats": 150,
        "soldSeats": 50
      },
      {
        "id": "clseat2",
        "ticketClass": "BUSINESS",
        "totalSeats": 20,
        "availableSeats": 20,
        "soldSeats": 0
      }
    ],
    "bookings": [
      {
        "id": "clbook1",
        "bookingCode": "BK123456",
        "status": "CONFIRMED",
        "passengerCount": 2,
        "totalPrice": 3200000
      }
    ],
    "promotion": {
      "id": "clprom",
      "code": "SUMMER2024",
      "discount": 10,
      "description": "Summer sale"
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/manager/flights
Create new flight

**Request Body:**
```json
{
  "flightNumber": "VN101",
  "routeId": "clxxx",
  "aircraftId": "clyyy",
  "departureTime": "2024-01-15T06:00:00.000Z",
  "arrivalTime": "2024-01-15T08:00:00.000Z",
  "basePrice": 1600000,
  "businessPrice": 3500000,
  "promotionId": "clzzz",
  "notes": "Regular scheduled flight"
}
```

**Validation Rules:**
- `flightNumber`: Required, unique, format: 2 letters + 3-4 digits (VN101)
- `routeId`: Required, valid route ID
- `aircraftId`: Required, valid aircraft ID
- `departureTime`: Required, future date
- `arrivalTime`: Required, after departureTime
- `basePrice`: Required, positive float (ADULT ECONOMY price)
- `businessPrice`: Required, positive float, >= basePrice
- `promotionId`: Optional, valid coupon ID
- `notes`: Optional, max 500 chars

**Business Logic:**
- Auto-create SeatInventory records based on aircraft seats
- Check no overlapping flights for same aircraft
- Validate arrival time matches route duration

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clnew",
    "flightNumber": "VN101",
    "route": { /* ... */ },
    "aircraft": { /* ... */ },
    "departureTime": "2024-01-15T06:00:00.000Z",
    "arrivalTime": "2024-01-15T08:00:00.000Z",
    "basePrice": 1600000,
    "businessPrice": 3500000,
    "seatInventory": [
      {
        "ticketClass": "ECONOMY",
        "totalSeats": 200,
        "availableSeats": 200
      },
      {
        "ticketClass": "BUSINESS",
        "totalSeats": 20,
        "availableSeats": 20
      }
    ],
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Flight created successfully"
}
```

#### PUT /api/manager/flights/:id
Update flight

**Request Body:**
```json
{
  "departureTime": "2024-01-15T07:00:00.000Z",
  "arrivalTime": "2024-01-15T09:00:00.000Z",
  "basePrice": 1700000,
  "businessPrice": 3600000,
  "notes": "Updated departure time"
}
```

**Validation Rules:**
- Cannot update flightNumber, routeId, aircraftId (key fields)
- Cannot update if flight has confirmed bookings (unless price decrease)
- departureTime must be future date
- arrivalTime must be after departureTime

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "flightNumber": "VN101",
    "departureTime": "2024-01-15T07:00:00.000Z",
    "arrivalTime": "2024-01-15T09:00:00.000Z",
    "basePrice": 1700000,
    "businessPrice": 3600000,
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Flight updated successfully"
}
```

#### DELETE /api/manager/flights/:id
Delete/Cancel flight

**Validation:**
- Cannot delete flight with confirmed bookings
- Must cancel all pending bookings first
- Or: Only allow if departure time > 24 hours

**Response:**
```json
{
  "success": true,
  "message": "Flight deleted successfully"
}
```

---

### 3.3 Ticket Types Management

#### GET /api/manager/ticket-types
Get all ticket types

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "clxxx",
      "name": "ADULT",
      "pricePercentage": 100,
      "minAge": 12,
      "maxAge": null,
      "description": "Adult passengers (12 years and above)",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "clyyy",
      "name": "CHILD",
      "pricePercentage": 75,
      "minAge": 2,
      "maxAge": 11,
      "description": "Child passengers (2-11 years)",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    },
    {
      "id": "clzzz",
      "name": "INFANT",
      "pricePercentage": 10,
      "minAge": 0,
      "maxAge": 1,
      "description": "Infant passengers (0-1 years, no seat)",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

#### GET /api/manager/ticket-types/:id
Get ticket type by ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "name": "ADULT",
    "pricePercentage": 100,
    "minAge": 12,
    "maxAge": null,
    "description": "Adult passengers (12 years and above)",
    "usageStats": {
      "totalBookings": 15000,
      "totalRevenue": 45000000000
    },
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

#### POST /api/manager/ticket-types
Create new ticket type (ADMIN only - optional for MANAGER)

**Request Body:**
```json
{
  "name": "STUDENT",
  "pricePercentage": 85,
  "minAge": 15,
  "maxAge": 25,
  "description": "Student passengers with valid ID"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clnew",
    "name": "STUDENT",
    "pricePercentage": 85,
    "minAge": 15,
    "maxAge": 25,
    "description": "Student passengers with valid ID",
    "createdAt": "2024-01-01T00:00:00.000Z"
  },
  "message": "Ticket type created successfully"
}
```

#### PUT /api/manager/ticket-types/:id
Update ticket type

**Request Body:**
```json
{
  "pricePercentage": 80,
  "description": "Updated description"
}
```

**Validation Rules:**
- Cannot change `name` (ENUM constraint)
- pricePercentage must be between 0-100
- Cannot change if in use by existing bookings (or require confirmation)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "clxxx",
    "name": "CHILD",
    "pricePercentage": 80,
    "minAge": 2,
    "maxAge": 11,
    "description": "Updated description",
    "updatedAt": "2024-01-02T00:00:00.000Z"
  },
  "message": "Ticket type updated successfully"
}
```

---

### 3.4 Seat Inventory Management

#### GET /api/manager/flights/:flightId/seats
Get seat inventory for a flight

**Response:**
```json
{
  "success": true,
  "data": {
    "flightId": "clxxx",
    "flightNumber": "VN101",
    "aircraft": {
      "model": "Airbus A321",
      "totalSeats": 220
    },
    "inventory": [
      {
        "id": "clseat1",
        "ticketClass": "ECONOMY",
        "totalSeats": 200,
        "availableSeats": 150,
        "soldSeats": 50,
        "utilizationRate": 25
      },
      {
        "id": "clseat2",
        "ticketClass": "BUSINESS",
        "totalSeats": 20,
        "availableSeats": 20,
        "soldSeats": 0,
        "utilizationRate": 0
      }
    ]
  }
}
```

#### PUT /api/manager/flights/:flightId/seats
Update seat inventory (manual adjustment)

**Request Body:**
```json
{
  "inventory": [
    {
      "ticketClass": "ECONOMY",
      "availableSeats": 180
    },
    {
      "ticketClass": "BUSINESS",
      "availableSeats": 15
    }
  ]
}
```

**Validation:**
- Cannot reduce below already sold seats
- Total cannot exceed aircraft capacity

**Response:**
```json
{
  "success": true,
  "data": {
    "flightId": "clxxx",
    "inventory": [
      {
        "ticketClass": "ECONOMY",
        "totalSeats": 200,
        "availableSeats": 180,
        "soldSeats": 50
      },
      {
        "ticketClass": "BUSINESS",
        "totalSeats": 20,
        "availableSeats": 15,
        "soldSeats": 0
      }
    ]
  },
  "message": "Seat inventory updated successfully"
}
```

---

### 3.5 Statistics & Reports

#### GET /api/manager/statistics/routes
Get route performance statistics

**Query Params:**
- `startDate`: Filter from date
- `endDate`: Filter to date
- `routeId`: Specific route (optional)

**Response:**
```json
{
  "success": true,
  "data": {
    "routes": [
      {
        "routeId": "clxxx",
        "departure": "HAN",
        "arrival": "SGN",
        "totalFlights": 120,
        "totalBookings": 5400,
        "totalRevenue": 8640000000,
        "avgOccupancyRate": 75,
        "avgPrice": 1600000
      }
    ],
    "summary": {
      "totalRoutes": 15,
      "totalFlights": 1800,
      "totalRevenue": 129600000000,
      "avgOccupancyRate": 72
    }
  }
}
```

#### GET /api/manager/statistics/flights
Get flight statistics

**Query Params:**
- `startDate`: Filter from date
- `endDate`: Filter to date
- `routeId`: Filter by route
- `groupBy`: 'day' | 'week' | 'month'

**Response:**
```json
{
  "success": true,
  "data": {
    "flights": [
      {
        "date": "2024-01-15",
        "totalFlights": 25,
        "totalBookings": 1125,
        "totalRevenue": 1800000000,
        "avgOccupancyRate": 75,
        "cancelledFlights": 1
      }
    ],
    "summary": {
      "totalFlights": 1800,
      "totalBookings": 81000,
      "totalRevenue": 129600000000,
      "avgOccupancyRate": 75,
      "bestPerformingFlight": "VN101"
    }
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
      "field": "departureTime",
      "message": "Departure time must be in the future"
    }
  ]
}
```

#### 403 Forbidden
```json
{
  "success": false,
  "error": "Manager access required"
}
```

#### 404 Not Found
```json
{
  "success": false,
  "error": "Route not found"
}
```

#### 409 Conflict
```json
{
  "success": false,
  "error": "Flight number already exists",
  "details": {
    "flightNumber": "VN101",
    "existingFlightId": "clxxx"
  }
}
```

#### 422 Unprocessable Entity
```json
{
  "success": false,
  "error": "Cannot delete route with active flights",
  "details": {
    "activeFlightsCount": 5
  }
}
```

---

## 5. Implementation Steps

### Step 1: Create Validators
- [x] Create `validators/managerValidator.js`
- [x] Route validation schemas
- [x] Flight validation schemas
- [x] Ticket type validation schemas

### Step 2: Create Controller
- [x] Create `controllers/managerController.js`
- [x] Implement route CRUD operations
- [x] Implement flight CRUD operations
- [x] Implement ticket type CRUD operations
- [x] Implement seat inventory operations
- [x] Implement statistics endpoints

### Step 3: Create Routes
- [x] Create `routes/managerRoutes.js`
- [x] Apply authentication middleware
- [x] Apply requireManager middleware
- [x] Apply validation middleware
- [x] Register all endpoints

### Step 4: Register Routes
- [x] Update `server.js` to include manager routes
- [x] Add route prefix `/api/manager`

### Step 5: Testing
- [ ] Test all CRUD operations
- [ ] Test role-based access control
- [ ] Test validation rules
- [ ] Test error handling
- [ ] Test statistics endpoints

---

## 6. Security Considerations

1. **Role Check**: Always verify user role is MANAGER or higher
2. **Input Validation**: Strict validation for all inputs
3. **Business Rules**: Enforce business constraints (no delete with bookings, etc.)
4. **Audit Log**: Log all manager operations for tracking
5. **Rate Limiting**: Apply rate limits to prevent abuse

---

## 7. Testing Checklist

### Routes Management
- [ ] Create route successfully
- [ ] Prevent duplicate routes (same departure-arrival)
- [ ] Update route successfully
- [ ] Prevent deactivating route with active flights
- [ ] Delete route without flights
- [ ] Get routes with filters
- [ ] Get route details

### Flights Management
- [ ] Create flight successfully
- [ ] Auto-create seat inventory
- [ ] Prevent duplicate flight numbers
- [ ] Prevent overlapping aircraft schedules
- [ ] Update flight successfully
- [ ] Prevent updates with confirmed bookings
- [ ] Delete flight without bookings
- [ ] Get flights with filters
- [ ] Get flight details

### Ticket Types Management
- [ ] Get all ticket types
- [ ] Get ticket type details
- [ ] Update ticket type successfully
- [ ] Prevent invalid price percentages

### Statistics
- [ ] Get route statistics
- [ ] Get flight statistics
- [ ] Filter by date range
- [ ] Group by time periods

---

## 8. Future Enhancements

1. **Bulk Operations**
   - Bulk create flights from schedule template
   - Bulk update prices

2. **Advanced Analytics**
   - Demand forecasting
   - Price optimization suggestions
   - Route profitability analysis

3. **Schedule Management**
   - Recurring flight schedules
   - Seasonal schedule templates

4. **Aircraft Optimization**
   - Aircraft utilization reports
   - Maintenance schedule integration

---

## Notes
- Manager module focuses on operational management
- All operations should be audited
- Consider adding approval workflow for critical operations
- Implement soft delete where appropriate
- Cache statistics for performance
