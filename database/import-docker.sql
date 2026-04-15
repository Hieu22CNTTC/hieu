-- ==========================================
-- Import Script for Docker Container
-- ==========================================
-- Run this inside the MySQL container:
-- docker exec -i flight_booking_db mysql -uroot -prootpassword flight_booking < database/import-docker.sql
-- ==========================================

-- Drop and recreate database
DROP DATABASE IF EXISTS flight_booking;
CREATE DATABASE flight_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE flight_booking;

-- ==========================================
-- SCHEMA
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

-- Table: users
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

-- Table: airports
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

-- Table: aircraft
CREATE TABLE `aircraft` (
  `id` VARCHAR(191) NOT NULL PRIMARY KEY,
  `model` VARCHAR(191) NOT NULL,
  `totalSeats` INT NOT NULL,
  `businessSeats` INT NOT NULL,
  `economySeats` INT NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: ticket_types
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

-- Table: routes
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

-- Table: coupons
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

-- Table: flights
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

-- Table: seat_inventory
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

-- Table: bookings
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

-- Table: booking_passengers
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

-- Table: payments
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

-- ==========================================
-- SEED DATA
-- ==========================================

-- Ticket Types
INSERT INTO `ticket_types` VALUES
('tt_adult_001', 'ADULT', 100, 12, NULL, 'Adult passenger (12+ years old)', NOW(3), NOW(3)),
('tt_child_001', 'CHILD', 75, 2, 11, 'Child passenger (2-11 years old)', NOW(3), NOW(3)),
('tt_infant_001', 'INFANT', 10, 0, 1, 'Infant passenger (0-1 years old)', NOW(3), NOW(3));

-- Users (admin password: 'admin', others: '123')
INSERT INTO `users` VALUES
('user_admin_001', 'admin@flight.com', '$2b$10$iT4tKXXa5UZEkyU894XHseoeQqQBmeHGXRbILgYXVy..k0FEix1zq', 'Admin User', '0901234567', 'ADMIN', TRUE, NULL, NOW(3), NOW(3)),
('user_manager_001', 'manager@flight.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Manager User', '0901234568', 'MANAGER', TRUE, NULL, NOW(3), NOW(3)),
('user_sales_001', 'sales@flight.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Sales User', '0901234569', 'SALES', TRUE, NULL, NOW(3), NOW(3)),
('user_customer_001', 'customer@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Nguyen Van A', '0909123456', 'USER', TRUE, NULL, NOW(3), NOW(3));

-- Airports
INSERT INTO `airports` VALUES
('airport_han_001', 'VN-HAN', 'Noi Bai International Airport', 'Hanoi', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_sgn_001', 'VN-SGN', 'Tan Son Nhat International Airport', 'Ho Chi Minh City', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_dad_001', 'VN-DAD', 'Da Nang International Airport', 'Da Nang', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_cxr_001', 'VN-CXR', 'Cam Ranh International Airport', 'Nha Trang', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_pqc_001', 'VN-PQC', 'Phu Quoc International Airport', 'Phu Quoc', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3));

-- Aircraft
INSERT INTO `aircraft` VALUES
('aircraft_a321_001', 'Airbus A321', 184, 16, 168, NOW(3), NOW(3)),
('aircraft_b787_001', 'Boeing 787-9', 280, 28, 252, NOW(3), NOW(3)),
('aircraft_a350_001', 'Airbus A350-900', 305, 29, 276, NOW(3), NOW(3));

-- Routes
INSERT INTO `routes` VALUES
('route_han_sgn', 'airport_han_001', 'airport_sgn_001', 1160, 120, 1500000, TRUE, NOW(3), NOW(3)),
('route_han_dad', 'airport_han_001', 'airport_dad_001', 620, 75, 900000, TRUE, NOW(3), NOW(3)),
('route_han_cxr', 'airport_han_001', 'airport_cxr_001', 980, 105, 1200000, TRUE, NOW(3), NOW(3)),
('route_sgn_han', 'airport_sgn_001', 'airport_han_001', 1160, 120, 1500000, TRUE, NOW(3), NOW(3)),
('route_sgn_dad', 'airport_sgn_001', 'airport_dad_001', 610, 75, 850000, TRUE, NOW(3), NOW(3)),
('route_sgn_pqc', 'airport_sgn_001', 'airport_pqc_001', 300, 50, 700000, TRUE, NOW(3), NOW(3));

-- Coupons
INSERT INTO `coupons` VALUES
('coupon_summer_001', 'SUMMER2026', 15, 300000, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 1000, 0, TRUE, NOW(3), NOW(3)),
('coupon_newyear_001', 'NEWYEAR2026', 20, 500000, '2026-01-01 00:00:00', '2026-02-28 23:59:59', 500, 0, TRUE, NOW(3), NOW(3)),
('coupon_flash_001', 'FLASH50', 50, 1000000, '2026-01-08 00:00:00', '2026-01-15 23:59:59', 100, 0, TRUE, NOW(3), NOW(3));

-- Flights (10 sample flights)
INSERT INTO `flights` VALUES
('flight_vn100', 'VN100', 'route_han_sgn', 'aircraft_a321_001', '2026-02-01 06:00:00', '2026-02-01 08:00:00', 1500000, 3000000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn101', 'VN101', 'route_han_sgn', 'aircraft_a321_001', '2026-02-01 12:00:00', '2026-02-01 14:00:00', 1600000, 3200000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn102', 'VN102', 'route_han_sgn', 'aircraft_a321_001', '2026-02-01 18:00:00', '2026-02-01 20:00:00', 1700000, 3400000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn103', 'VN103', 'route_han_sgn', 'aircraft_a321_001', '2026-02-02 06:00:00', '2026-02-02 08:00:00', 1550000, 3100000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn104', 'VN104', 'route_han_sgn', 'aircraft_a321_001', '2026-02-02 12:00:00', '2026-02-02 14:00:00', 1650000, 3300000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn105', 'VN105', 'route_han_sgn', 'aircraft_a321_001', '2026-02-02 18:00:00', '2026-02-02 20:00:00', 1750000, 3500000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn106', 'VN106', 'route_han_sgn', 'aircraft_a321_001', '2026-02-03 06:00:00', '2026-02-03 08:00:00', 1580000, 3160000, 'coupon_newyear_001', NULL, NOW(3), NOW(3)),
('flight_vn107', 'VN107', 'route_han_sgn', 'aircraft_a321_001', '2026-02-03 12:00:00', '2026-02-03 14:00:00', 1680000, 3360000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn108', 'VN108', 'route_han_sgn', 'aircraft_a321_001', '2026-02-03 18:00:00', '2026-02-03 20:00:00', 1780000, 3560000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn109', 'VN109', 'route_han_sgn', 'aircraft_a321_001', '2026-02-04 06:00:00', '2026-02-04 08:00:00', 1620000, 3240000, NULL, NULL, NOW(3), NOW(3));

-- Seat Inventory
INSERT INTO `seat_inventory` VALUES
('seat_vn100_eco', 'flight_vn100', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn100_bus', 'flight_vn100', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn101_eco', 'flight_vn101', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn101_bus', 'flight_vn101', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn102_eco', 'flight_vn102', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn102_bus', 'flight_vn102', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn103_eco', 'flight_vn103', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn103_bus', 'flight_vn103', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn104_eco', 'flight_vn104', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn104_bus', 'flight_vn104', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn105_eco', 'flight_vn105', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn105_bus', 'flight_vn105', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn106_eco', 'flight_vn106', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn106_bus', 'flight_vn106', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn107_eco', 'flight_vn107', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn107_bus', 'flight_vn107', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn108_eco', 'flight_vn108', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn108_bus', 'flight_vn108', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn109_eco', 'flight_vn109', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn109_bus', 'flight_vn109', 'BUSINESS', 16, 0, NOW(3), NOW(3));

-- Verify
SELECT '✅ Import completed successfully!' AS status;
SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS airports_count FROM airports;
SELECT COUNT(*) AS routes_count FROM routes;
SELECT COUNT(*) AS flights_count FROM flights;
SELECT COUNT(*) AS ticket_types_count FROM ticket_types;
SELECT COUNT(*) AS seat_inventory_count FROM seat_inventory;
