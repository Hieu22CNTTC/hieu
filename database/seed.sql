-- ==========================================
-- Flight Booking System - Seed Data
-- ==========================================

-- ==========================================
-- Ticket Types (SRS Enhancement)
-- ==========================================
INSERT INTO `ticket_types` (`id`, `name`, `pricePercentage`, `minAge`, `maxAge`, `description`, `createdAt`, `updatedAt`) VALUES
('tt_adult_001', 'ADULT', 100, 12, NULL, 'Adult passenger (12+ years old)', NOW(3), NOW(3)),
('tt_child_001', 'CHILD', 75, 2, 11, 'Child passenger (2-11 years old)', NOW(3), NOW(3)),
('tt_infant_001', 'INFANT', 10, 0, 1, 'Infant passenger (0-1 years old)', NOW(3), NOW(3));

-- ==========================================
-- Users (admin password: 'admin', others: '123')
-- ==========================================
INSERT INTO `users` (`id`, `email`, `password`, `fullName`, `phoneNumber`, `role`, `isActive`, `createdAt`, `updatedAt`) VALUES
('user_admin_001', 'admin@flight.com', '$2b$10$iT4tKXXa5UZEkyU894XHseoeQqQBmeHGXRbILgYXVy..k0FEix1zq', 'Admin User', '0901234567', 'ADMIN', TRUE, NOW(3), NOW(3)),
('user_manager_001', 'manager@flight.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Manager User', '0901234568', 'MANAGER', TRUE, NOW(3), NOW(3)),
('user_sales_001', 'sales@flight.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Sales User', '0901234569', 'SALES', TRUE, NOW(3), NOW(3)),
('user_customer_001', 'customer@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Nguyen Van A', '0909123456', 'USER', TRUE, NOW(3), NOW(3)),
('user_customer_002', 'tran.b@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Trần Thị B', '0912345678', 'USER', TRUE, NOW(3), NOW(3)),
('user_customer_003', 'le.c@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Lê Văn C', '0923456789', 'USER', TRUE, NOW(3), NOW(3)),
('user_customer_004', 'pham.d@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Phạm Thị D', '0934567890', 'USER', TRUE, NOW(3), NOW(3)),
('user_customer_005', 'hoang.e@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Hoàng Văn E', '0945678901', 'USER', TRUE, NOW(3), NOW(3)),
('user_customer_006', 'nguyen.f@gmail.com', '$2b$10$Q4xN71zOmFm0Q1q129aJSeWeaPdD5Evf1v004o44KfdnS5c2kSOk6', 'Nguyễn Thị F', '0956789012', 'USER', TRUE, NOW(3), NOW(3));

-- ==========================================
-- Airports
-- ==========================================
INSERT INTO `airports` (`id`, `code`, `name`, `city`, `country`, `timezone`, `createdAt`, `updatedAt`) VALUES
('airport_han_001', 'VN-HAN', 'Noi Bai International Airport', 'Hanoi', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_sgn_001', 'VN-SGN', 'Tan Son Nhat International Airport', 'Ho Chi Minh City', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_dad_001', 'VN-DAD', 'Da Nang International Airport', 'Da Nang', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_cxr_001', 'VN-CXR', 'Cam Ranh International Airport', 'Nha Trang', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3)),
('airport_pqc_001', 'VN-PQC', 'Phu Quoc International Airport', 'Phu Quoc', 'Vietnam', 'Asia/Ho_Chi_Minh', NOW(3), NOW(3));

-- ==========================================
-- Aircraft
-- ==========================================
INSERT INTO `aircraft` (`id`, `model`, `totalSeats`, `businessSeats`, `economySeats`, `createdAt`, `updatedAt`) VALUES
('aircraft_a321_001', 'Airbus A321', 184, 16, 168, NOW(3), NOW(3)),
('aircraft_b787_001', 'Boeing 787-9', 280, 28, 252, NOW(3), NOW(3)),
('aircraft_a350_001', 'Airbus A350-900', 305, 29, 276, NOW(3), NOW(3));

-- ==========================================
-- Routes
-- ==========================================
INSERT INTO `routes` (`id`, `departureId`, `arrivalId`, `distance`, `duration`, `standardPrice`, `isActive`, `createdAt`, `updatedAt`) VALUES
('route_han_sgn', 'airport_han_001', 'airport_sgn_001', 1160, 120, 1500000, TRUE, NOW(3), NOW(3)),
('route_han_dad', 'airport_han_001', 'airport_dad_001', 620, 75, 900000, TRUE, NOW(3), NOW(3)),
('route_han_cxr', 'airport_han_001', 'airport_cxr_001', 980, 105, 1200000, TRUE, NOW(3), NOW(3)),
('route_han_pqc', 'airport_han_001', 'airport_pqc_001', 1420, 135, 1800000, TRUE, NOW(3), NOW(3)),
('route_sgn_han', 'airport_sgn_001', 'airport_han_001', 1160, 120, 1500000, TRUE, NOW(3), NOW(3)),
('route_sgn_dad', 'airport_sgn_001', 'airport_dad_001', 610, 75, 850000, TRUE, NOW(3), NOW(3)),
('route_sgn_pqc', 'airport_sgn_001', 'airport_pqc_001', 300, 50, 700000, TRUE, NOW(3), NOW(3)),
('route_sgn_cxr', 'airport_sgn_001', 'airport_cxr_001', 320, 55, 750000, TRUE, NOW(3), NOW(3)),
('route_dad_han', 'airport_dad_001', 'airport_han_001', 620, 75, 900000, TRUE, NOW(3), NOW(3)),
('route_dad_sgn', 'airport_dad_001', 'airport_sgn_001', 610, 75, 850000, TRUE, NOW(3), NOW(3)),
('route_dad_pqc', 'airport_dad_001', 'airport_pqc_001', 820, 90, 1100000, TRUE, NOW(3), NOW(3)),
('route_cxr_han', 'airport_cxr_001', 'airport_han_001', 980, 105, 1200000, TRUE, NOW(3), NOW(3)),
('route_cxr_sgn', 'airport_cxr_001', 'airport_sgn_001', 320, 55, 750000, TRUE, NOW(3), NOW(3)),
('route_pqc_han', 'airport_pqc_001', 'airport_han_001', 1420, 135, 1800000, TRUE, NOW(3), NOW(3)),
('route_pqc_sgn', 'airport_pqc_001', 'airport_sgn_001', 300, 50, 700000, TRUE, NOW(3), NOW(3));

-- ==========================================
-- Coupons
-- ==========================================
INSERT INTO `coupons` (`id`, `code`, `discountPercent`, `maxDiscount`, `validFrom`, `validTo`, `usageLimit`, `usedCount`, `isActive`, `createdAt`, `updatedAt`) VALUES
('coupon_summer_001', 'SUMMER2026', 15, 300000, '2026-06-01 00:00:00', '2026-08-31 23:59:59', 1000, 0, TRUE, NOW(3), NOW(3)),
('coupon_newyear_001', 'NEWYEAR2026', 20, 500000, '2026-01-01 00:00:00', '2026-02-28 23:59:59', 500, 0, TRUE, NOW(3), NOW(3)),
('coupon_flash_001', 'FLASH50', 50, 1000000, '2026-01-08 00:00:00', '2026-01-15 23:59:59', 100, 0, TRUE, NOW(3), NOW(3)),
('coupon_vip_001', 'VIP100K', 10, 100000, '2026-01-01 00:00:00', '2026-12-31 23:59:59', 2000, 0, TRUE, NOW(3), NOW(3)),
('coupon_danang_001', 'DANANG30', 30, 400000, '2026-01-15 00:00:00', '2026-03-31 23:59:59', 300, 0, TRUE, NOW(3), NOW(3)),
('coupon_phuquoc_001', 'PHUQUOC25', 25, 600000, '2026-02-01 00:00:00', '2026-04-30 23:59:59', 400, 0, TRUE, NOW(3), NOW(3));

-- ==========================================
-- Flights (Sample: 10 flights for HAN-SGN route)
-- ==========================================
INSERT INTO `flights` (`id`, `flightNumber`, `routeId`, `aircraftId`, `departureTime`, `arrivalTime`, `basePrice`, `businessPrice`, `promotionId`, `isActive`, `notes`, `createdAt`, `updatedAt`) VALUES
-- HAN-SGN Route (Day 1-4: Feb 1-4, 2026)
('flight_vn100', 'VN100', 'route_han_sgn', 'aircraft_a321_001', '2026-02-01 06:00:00', '2026-02-01 08:00:00', 1500000, 3000000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn101', 'VN101', 'route_han_sgn', 'aircraft_a321_001', '2026-02-01 12:00:00', '2026-02-01 14:00:00', 1600000, 3200000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn102', 'VN102', 'route_han_sgn', 'aircraft_a321_001', '2026-02-01 18:00:00', '2026-02-01 20:00:00', 1700000, 3400000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn103', 'VN103', 'route_han_sgn', 'aircraft_a321_001', '2026-02-02 06:00:00', '2026-02-02 08:00:00', 1550000, 3100000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn104', 'VN104', 'route_han_sgn', 'aircraft_a321_001', '2026-02-02 12:00:00', '2026-02-02 14:00:00', 1650000, 3300000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn105', 'VN105', 'route_han_sgn', 'aircraft_a321_001', '2026-02-02 18:00:00', '2026-02-02 20:00:00', 1750000, 3500000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn106', 'VN106', 'route_han_sgn', 'aircraft_a321_001', '2026-02-03 06:00:00', '2026-02-03 08:00:00', 1580000, 3160000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn107', 'VN107', 'route_han_sgn', 'aircraft_a321_001', '2026-02-03 12:00:00', '2026-02-03 14:00:00', 1680000, 3360000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn108', 'VN108', 'route_han_sgn', 'aircraft_a321_001', '2026-02-03 18:00:00', '2026-02-03 20:00:00', 1780000, 3560000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn109', 'VN109', 'route_han_sgn', 'aircraft_a321_001', '2026-02-04 06:00:00', '2026-02-04 08:00:00', 1620000, 3240000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- SGN-HAN Route (Return flights)
('flight_vn200', 'VN200', 'route_sgn_han', 'aircraft_b787_001', '2026-02-01 07:00:00', '2026-02-01 09:00:00', 1500000, 3000000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn201', 'VN201', 'route_sgn_han', 'aircraft_b787_001', '2026-02-01 14:00:00', '2026-02-01 16:00:00', 1600000, 3200000, 'coupon_newyear_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn202', 'VN202', 'route_sgn_han', 'aircraft_b787_001', '2026-02-02 08:00:00', '2026-02-02 10:00:00', 1550000, 3100000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn203', 'VN203', 'route_sgn_han', 'aircraft_b787_001', '2026-02-02 16:00:00', '2026-02-02 18:00:00', 1650000, 3300000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- HAN-DAD Route
('flight_vn300', 'VN300', 'route_han_dad', 'aircraft_a321_001', '2026-02-01 06:30:00', '2026-02-01 07:45:00', 900000, 1800000, 'coupon_danang_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn301', 'VN301', 'route_han_dad', 'aircraft_a321_001', '2026-02-01 13:00:00', '2026-02-01 14:15:00', 950000, 1900000, 'coupon_danang_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn302', 'VN302', 'route_han_dad', 'aircraft_a321_001', '2026-02-02 07:00:00', '2026-02-02 08:15:00', 920000, 1840000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn303', 'VN303', 'route_han_dad', 'aircraft_a321_001', '2026-02-02 15:00:00', '2026-02-02 16:15:00', 980000, 1960000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- DAD-SGN Route
('flight_vn400', 'VN400', 'route_dad_sgn', 'aircraft_a321_001', '2026-02-01 09:00:00', '2026-02-01 10:15:00', 850000, 1700000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn401', 'VN401', 'route_dad_sgn', 'aircraft_a321_001', '2026-02-01 16:30:00', '2026-02-01 17:45:00', 880000, 1760000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn402', 'VN402', 'route_dad_sgn', 'aircraft_a321_001', '2026-02-02 10:00:00', '2026-02-02 11:15:00', 860000, 1720000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- SGN-PQC Route
('flight_vn500', 'VN500', 'route_sgn_pqc', 'aircraft_a321_001', '2026-02-01 08:00:00', '2026-02-01 08:50:00', 700000, 1400000, 'coupon_phuquoc_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn501', 'VN501', 'route_sgn_pqc', 'aircraft_a321_001', '2026-02-01 12:30:00', '2026-02-01 13:20:00', 750000, 1500000, 'coupon_phuquoc_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn502', 'VN502', 'route_sgn_pqc', 'aircraft_a321_001', '2026-02-01 17:00:00', '2026-02-01 17:50:00', 800000, 1600000, 'coupon_phuquoc_001', TRUE, NULL, NOW(3), NOW(3)),
('flight_vn503', 'VN503', 'route_sgn_pqc', 'aircraft_a321_001', '2026-02-02 09:00:00', '2026-02-02 09:50:00', 720000, 1440000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- PQC-SGN Route (Return)
('flight_vn600', 'VN600', 'route_pqc_sgn', 'aircraft_a321_001', '2026-02-01 10:00:00', '2026-02-01 10:50:00', 700000, 1400000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn601', 'VN601', 'route_pqc_sgn', 'aircraft_a321_001', '2026-02-01 14:30:00', '2026-02-01 15:20:00', 750000, 1500000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn602', 'VN602', 'route_pqc_sgn', 'aircraft_a321_001', '2026-02-02 11:00:00', '2026-02-02 11:50:00', 720000, 1440000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- HAN-CXR Route
('flight_vn700', 'VN700', 'route_han_cxr', 'aircraft_a350_001', '2026-02-01 07:00:00', '2026-02-01 08:45:00', 1200000, 2400000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn701', 'VN701', 'route_han_cxr', 'aircraft_a350_001', '2026-02-02 08:00:00', '2026-02-02 09:45:00', 1250000, 2500000, NULL, TRUE, NULL, NOW(3), NOW(3)),

-- CXR-HAN Route (Return)
('flight_vn800', 'VN800', 'route_cxr_han', 'aircraft_a350_001', '2026-02-01 10:00:00', '2026-02-01 11:45:00', 1200000, 2400000, NULL, TRUE, NULL, NOW(3), NOW(3)),
('flight_vn801', 'VN801', 'route_cxr_han', 'aircraft_a350_001', '2026-02-02 11:00:00', '2026-02-02 12:45:00', 1250000, 2500000, NULL, TRUE, NULL, NOW(3), NOW(3));

-- ==========================================
-- Seat Inventory (for all flights above)
-- ==========================================
INSERT INTO `seat_inventory` (`id`, `flightId`, `ticketClass`, `availableSeats`, `bookedSeats`, `createdAt`, `updatedAt`) VALUES
-- HAN-SGN Route (VN100-VN109)
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
('seat_vn109_bus', 'flight_vn109', 'BUSINESS', 16, 0, NOW(3), NOW(3)),

-- SGN-HAN Route (VN200-VN203) - Boeing 787
('seat_vn200_eco', 'flight_vn200', 'ECONOMY', 252, 0, NOW(3), NOW(3)),
('seat_vn200_bus', 'flight_vn200', 'BUSINESS', 28, 0, NOW(3), NOW(3)),
('seat_vn201_eco', 'flight_vn201', 'ECONOMY', 252, 0, NOW(3), NOW(3)),
('seat_vn201_bus', 'flight_vn201', 'BUSINESS', 28, 0, NOW(3), NOW(3)),
('seat_vn202_eco', 'flight_vn202', 'ECONOMY', 252, 0, NOW(3), NOW(3)),
('seat_vn202_bus', 'flight_vn202', 'BUSINESS', 28, 0, NOW(3), NOW(3)),
('seat_vn203_eco', 'flight_vn203', 'ECONOMY', 252, 0, NOW(3), NOW(3)),
('seat_vn203_bus', 'flight_vn203', 'BUSINESS', 28, 0, NOW(3), NOW(3)),

-- HAN-DAD Route (VN300-VN303)
('seat_vn300_eco', 'flight_vn300', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn300_bus', 'flight_vn300', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn301_eco', 'flight_vn301', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn301_bus', 'flight_vn301', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn302_eco', 'flight_vn302', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn302_bus', 'flight_vn302', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn303_eco', 'flight_vn303', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn303_bus', 'flight_vn303', 'BUSINESS', 16, 0, NOW(3), NOW(3)),

-- DAD-SGN Route (VN400-VN402)
('seat_vn400_eco', 'flight_vn400', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn400_bus', 'flight_vn400', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn401_eco', 'flight_vn401', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn401_bus', 'flight_vn401', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn402_eco', 'flight_vn402', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn402_bus', 'flight_vn402', 'BUSINESS', 16, 0, NOW(3), NOW(3)),

-- SGN-PQC Route (VN500-VN503)
('seat_vn500_eco', 'flight_vn500', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn500_bus', 'flight_vn500', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn501_eco', 'flight_vn501', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn501_bus', 'flight_vn501', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn502_eco', 'flight_vn502', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn502_bus', 'flight_vn502', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn503_eco', 'flight_vn503', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn503_bus', 'flight_vn503', 'BUSINESS', 16, 0, NOW(3), NOW(3)),

-- PQC-SGN Route (VN600-VN602)
('seat_vn600_eco', 'flight_vn600', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn600_bus', 'flight_vn600', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn601_eco', 'flight_vn601', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn601_bus', 'flight_vn601', 'BUSINESS', 16, 0, NOW(3), NOW(3)),
('seat_vn602_eco', 'flight_vn602', 'ECONOMY', 168, 0, NOW(3), NOW(3)),
('seat_vn602_bus', 'flight_vn602', 'BUSINESS', 16, 0, NOW(3), NOW(3)),

-- HAN-CXR Route (VN700-VN701) - Airbus A350
('seat_vn700_eco', 'flight_vn700', 'ECONOMY', 276, 0, NOW(3), NOW(3)),
('seat_vn700_bus', 'flight_vn700', 'BUSINESS', 29, 0, NOW(3), NOW(3)),
('seat_vn701_eco', 'flight_vn701', 'ECONOMY', 276, 0, NOW(3), NOW(3)),
('seat_vn701_bus', 'flight_vn701', 'BUSINESS', 29, 0, NOW(3), NOW(3)),

-- CXR-HAN Route (VN800-VN801) - Airbus A350
('seat_vn800_eco', 'flight_vn800', 'ECONOMY', 276, 0, NOW(3), NOW(3)),
('seat_vn800_bus', 'flight_vn800', 'BUSINESS', 29, 0, NOW(3), NOW(3)),
('seat_vn801_eco', 'flight_vn801', 'ECONOMY', 276, 0, NOW(3), NOW(3)),
('seat_vn801_bus', 'flight_vn801', 'BUSINESS', 29, 0, NOW(3), NOW(3));
