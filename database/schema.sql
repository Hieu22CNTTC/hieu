-- ==========================================
-- Flight Booking System - Database Schema
-- ==========================================

-- Drop existing tables (in reverse order of dependencies)
DROP TABLE IF EXISTS `booking_passengers`;
DROP TABLE IF EXISTS `payments`;
DROP TABLE IF EXISTS `bookings`;
DROP TABLE IF EXISTS `seat_inventory`;
DROP TABLE IF EXISTS `flights`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `ticket_types`;
DROP TABLE IF EXISTS `aircraft`;
DROP TABLE IF EXISTS `airports`;
DROP TABLE IF EXISTS `coupons`;
DROP TABLE IF EXISTS `users`;

-- ==========================================
-- Table: users
-- ==========================================
CREATE TABLE `users` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `email` VARCHAR(191) NOT NULL UNIQUE,
  `password` VARCHAR(191) NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `phoneNumber` VARCHAR(191),
  `role` ENUM('USER', 'SALES', 'MANAGER', 'ADMIN') NOT NULL DEFAULT 'USER',
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `lastLoginAt` DATETIME(3),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_users_email` (`email`),
  INDEX `idx_users_role` (`role`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: airports
-- ==========================================
CREATE TABLE `airports` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `code` VARCHAR(191) NOT NULL UNIQUE,
  `name` VARCHAR(191) NOT NULL,
  `city` VARCHAR(191) NOT NULL,
  `country` VARCHAR(191) NOT NULL,
  `timezone` VARCHAR(191) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_airports_code` (`code`),
  INDEX `idx_airports_city` (`city`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: aircraft
-- ==========================================
CREATE TABLE `aircraft` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `model` VARCHAR(191) NOT NULL,
  `totalSeats` INT NOT NULL,
  `businessSeats` INT NOT NULL,
  `economySeats` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: ticket_types (SRS Enhancement)
-- ==========================================
CREATE TABLE `ticket_types` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `name` ENUM('ADULT', 'CHILD', 'INFANT') NOT NULL UNIQUE,
  `pricePercentage` DOUBLE NOT NULL,
  `minAge` INT,
  `maxAge` INT,
  `description` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: routes
-- ==========================================
CREATE TABLE `routes` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `departureId` VARCHAR(191) NOT NULL,
  `arrivalId` VARCHAR(191) NOT NULL,
  `distance` INT,
  `duration` INT,
  `standardPrice` DOUBLE,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `unique_route` (`departureId`, `arrivalId`),
  CONSTRAINT `fk_routes_departure` FOREIGN KEY (`departureId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_routes_arrival` FOREIGN KEY (`arrivalId`) REFERENCES `airports`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_routes_departure` (`departureId`),
  INDEX `idx_routes_arrival` (`arrivalId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: coupons
-- ==========================================
CREATE TABLE `coupons` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `code` VARCHAR(191) NOT NULL UNIQUE,
  `discountPercent` DOUBLE NOT NULL,
  `maxDiscount` DOUBLE,
  `validFrom` DATETIME(3) NOT NULL,
  `validTo` DATETIME(3) NOT NULL,
  `usageLimit` INT,
  `usedCount` INT NOT NULL DEFAULT 0,
  `isActive` BOOLEAN NOT NULL DEFAULT TRUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  INDEX `idx_coupons_code` (`code`),
  INDEX `idx_coupons_valid` (`validFrom`, `validTo`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: flights
-- ==========================================
CREATE TABLE `flights` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `flightNumber` VARCHAR(191) NOT NULL UNIQUE,
  `routeId` VARCHAR(191) NOT NULL,
  `aircraftId` VARCHAR(191) NOT NULL,
  `departureTime` DATETIME(3) NOT NULL,
  `arrivalTime` DATETIME(3) NOT NULL,
  `basePrice` DOUBLE NOT NULL,
  `businessPrice` DOUBLE NOT NULL,
  `promotionId` VARCHAR(191),
  `notes` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_flights_route` FOREIGN KEY (`routeId`) REFERENCES `routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_flights_aircraft` FOREIGN KEY (`aircraftId`) REFERENCES `aircraft`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_flights_promotion` FOREIGN KEY (`promotionId`) REFERENCES `coupons`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_flights_number` (`flightNumber`),
  INDEX `idx_flights_route` (`routeId`),
  INDEX `idx_flights_departure_time` (`departureTime`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: seat_inventory
-- ==========================================
CREATE TABLE `seat_inventory` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `flightId` VARCHAR(191) NOT NULL,
  `ticketClass` ENUM('ECONOMY', 'BUSINESS') NOT NULL,
  `availableSeats` INT NOT NULL,
  `bookedSeats` INT NOT NULL DEFAULT 0,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  UNIQUE KEY `unique_flight_class` (`flightId`, `ticketClass`),
  CONSTRAINT `fk_seat_inventory_flight` FOREIGN KEY (`flightId`) REFERENCES `flights`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX `idx_seat_inventory_flight` (`flightId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: bookings (SRS Enhancement)
-- ==========================================
CREATE TABLE `bookings` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `bookingCode` VARCHAR(191) NOT NULL UNIQUE,
  `userId` VARCHAR(191),
  `flightId` VARCHAR(191) NOT NULL,
  `totalAmount` DOUBLE NOT NULL,
  `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED', 'REJECTED', 'COMPLETED') NOT NULL DEFAULT 'PENDING',
  `contactEmail` VARCHAR(191) NOT NULL,
  `contactPhone` VARCHAR(191) NOT NULL,
  `expiresAt` DATETIME(3) NOT NULL,
  `rejectedBy` VARCHAR(191),
  `rejectedAt` DATETIME(3),
  `rejectionReason` TEXT,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_bookings_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT `fk_bookings_flight` FOREIGN KEY (`flightId`) REFERENCES `flights`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_bookings_code` (`bookingCode`),
  INDEX `idx_bookings_user` (`userId`),
  INDEX `idx_bookings_status` (`status`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: booking_passengers (SRS Enhancement)
-- ==========================================
CREATE TABLE `booking_passengers` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `bookingId` VARCHAR(191) NOT NULL,
  `ticketTypeId` VARCHAR(191) NOT NULL,
  `ticketClass` ENUM('ECONOMY', 'BUSINESS') NOT NULL,
  `fullName` VARCHAR(191) NOT NULL,
  `dateOfBirth` DATETIME(3) NOT NULL,
  `calculatedAge` INT,
  `priceAmount` DOUBLE NOT NULL,
  `seatNumber` VARCHAR(191),
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_booking_passengers_booking` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `fk_booking_passengers_ticket_type` FOREIGN KEY (`ticketTypeId`) REFERENCES `ticket_types`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX `idx_booking_passengers_booking` (`bookingId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================
-- Table: payments
-- ==========================================
CREATE TABLE `payments` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `bookingId` VARCHAR(191) NOT NULL,
  `userId` VARCHAR(191),
  `amount` DOUBLE NOT NULL,
  `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') NOT NULL DEFAULT 'PENDING',
  `paymentMethod` VARCHAR(191) NOT NULL DEFAULT 'MoMo',
  `transactionId` VARCHAR(191) UNIQUE,
  `momoRequestId` VARCHAR(191) UNIQUE,
  `momoOrderId` VARCHAR(191),
  `eTicketCode` VARCHAR(191) UNIQUE,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  CONSTRAINT `fk_payments_booking` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT `fk_payments_user` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX `idx_payments_booking` (`bookingId`),
  INDEX `idx_payments_transaction` (`transactionId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
