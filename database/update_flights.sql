-- ==========================================
-- Update Flight Dates to June 1, 2026
-- ==========================================

-- Disable foreign key checks temporarily
SET FOREIGN_KEY_CHECKS = 0;

-- Delete existing flight data (respects dependencies)
DELETE FROM seat_inventory;
DELETE FROM flights;

-- Re-enable foreign key checks
SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================
-- Insert Updated Flights (June 1, 2026)
-- ==========================================
INSERT INTO `flights` (`id`, `flightNumber`, `routeId`, `aircraftId`, `departureTime`, `arrivalTime`, `basePrice`, `businessPrice`, `promotionId`, `notes`, `createdAt`, `updatedAt`) VALUES
-- HAN-SGN Route (Day 1: Jun 1, 2026)
('flight_vn100', 'VN100', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 06:00:00', '2026-06-01 08:00:00', 1500000, 3000000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn101', 'VN101', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 12:00:00', '2026-06-01 14:00:00', 1600000, 3200000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn102', 'VN102', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 18:00:00', '2026-06-01 20:00:00', 1700000, 3400000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn103', 'VN103', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 06:00:00', '2026-06-01 08:00:00', 1550000, 3100000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn104', 'VN104', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 12:00:00', '2026-06-01 14:00:00', 1650000, 3300000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn105', 'VN105', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 18:00:00', '2026-06-01 20:00:00', 1750000, 3500000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn106', 'VN106', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 06:00:00', '2026-06-01 08:00:00', 1580000, 3160000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn107', 'VN107', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 12:00:00', '2026-06-01 14:00:00', 1680000, 3360000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn108', 'VN108', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 18:00:00', '2026-06-01 20:00:00', 1780000, 3560000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn109', 'VN109', 'route_han_sgn', 'aircraft_a321_001', '2026-06-01 06:00:00', '2026-06-01 08:00:00', 1620000, 3240000, NULL, NULL, NOW(3), NOW(3)),

-- SGN-HAN Route (Return flights)
('flight_vn200', 'VN200', 'route_sgn_han', 'aircraft_b787_001', '2026-06-01 07:00:00', '2026-06-01 09:00:00', 1500000, 3000000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn201', 'VN201', 'route_sgn_han', 'aircraft_b787_001', '2026-06-01 14:00:00', '2026-06-01 16:00:00', 1600000, 3200000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn202', 'VN202', 'route_sgn_han', 'aircraft_b787_001', '2026-06-01 08:00:00', '2026-06-01 10:00:00', 1550000, 3100000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn203', 'VN203', 'route_sgn_han', 'aircraft_b787_001', '2026-06-01 16:00:00', '2026-06-01 18:00:00', 1650000, 3300000, NULL, NULL, NOW(3), NOW(3)),

-- HAN-DAD Route
('flight_vn300', 'VN300', 'route_han_dad', 'aircraft_a321_001', '2026-06-01 06:30:00', '2026-06-01 07:45:00', 900000, 1800000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn301', 'VN301', 'route_han_dad', 'aircraft_a321_001', '2026-06-01 13:00:00', '2026-06-01 14:15:00', 950000, 1900000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn302', 'VN302', 'route_han_dad', 'aircraft_a321_001', '2026-06-01 07:00:00', '2026-06-01 08:15:00', 920000, 1840000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn303', 'VN303', 'route_han_dad', 'aircraft_a321_001', '2026-06-01 15:00:00', '2026-06-01 16:15:00', 980000, 1960000, NULL, NULL, NOW(3), NOW(3)),

-- DAD-SGN Route
('flight_vn400', 'VN400', 'route_dad_sgn', 'aircraft_a321_001', '2026-06-01 09:00:00', '2026-06-01 10:15:00', 850000, 1700000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn401', 'VN401', 'route_dad_sgn', 'aircraft_a321_001', '2026-06-01 16:30:00', '2026-06-01 17:45:00', 880000, 1760000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn402', 'VN402', 'route_dad_sgn', 'aircraft_a321_001', '2026-06-01 10:00:00', '2026-06-01 11:15:00', 860000, 1720000, NULL, NULL, NOW(3), NOW(3)),

-- SGN-PQC Route
('flight_vn500', 'VN500', 'route_sgn_pqc', 'aircraft_a321_001', '2026-06-01 08:00:00', '2026-06-01 08:50:00', 700000, 1400000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn501', 'VN501', 'route_sgn_pqc', 'aircraft_a321_001', '2026-06-01 12:30:00', '2026-06-01 13:20:00', 750000, 1500000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn502', 'VN502', 'route_sgn_pqc', 'aircraft_a321_001', '2026-06-01 17:00:00', '2026-06-01 17:50:00', 800000, 1600000, 'coupon_summer_001', NULL, NOW(3), NOW(3)),
('flight_vn503', 'VN503', 'route_sgn_pqc', 'aircraft_a321_001', '2026-06-01 09:00:00', '2026-06-01 09:50:00', 720000, 1440000, NULL, NULL, NOW(3), NOW(3)),

-- PQC-SGN Route (Return)
('flight_vn600', 'VN600', 'route_pqc_sgn', 'aircraft_a321_001', '2026-06-01 10:00:00', '2026-06-01 10:50:00', 700000, 1400000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn601', 'VN601', 'route_pqc_sgn', 'aircraft_a321_001', '2026-06-01 14:30:00', '2026-06-01 15:20:00', 750000, 1500000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn602', 'VN602', 'route_pqc_sgn', 'aircraft_a321_001', '2026-06-01 11:00:00', '2026-06-01 11:50:00', 720000, 1440000, NULL, NULL, NOW(3), NOW(3)),

-- HAN-CXR Route
('flight_vn700', 'VN700', 'route_han_cxr', 'aircraft_a350_001', '2026-06-01 07:00:00', '2026-06-01 08:45:00', 1200000, 2400000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn701', 'VN701', 'route_han_cxr', 'aircraft_a350_001', '2026-06-01 08:00:00', '2026-06-01 09:45:00', 1250000, 2500000, NULL, NULL, NOW(3), NOW(3)),

-- CXR-HAN Route (Return)
('flight_vn800', 'VN800', 'route_cxr_han', 'aircraft_a350_001', '2026-06-01 10:00:00', '2026-06-01 11:45:00', 1200000, 2400000, NULL, NULL, NOW(3), NOW(3)),
('flight_vn801', 'VN801', 'route_cxr_han', 'aircraft_a350_001', '2026-06-01 11:00:00', '2026-06-01 12:45:00', 1250000, 2500000, NULL, NULL, NOW(3), NOW(3));

-- ==========================================
-- Re-insert Seat Inventory
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
