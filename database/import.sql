-- ==========================================
-- Flight Booking System - Complete Import
-- ==========================================
-- Chạy file này để import toàn bộ schema và data vào MySQL
-- 
-- Cách sử dụng:
-- 1. Tạo database:
--    CREATE DATABASE flight_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--
-- 2. Import file này:
--    mysql -u root -p flight_booking < import.sql
--    hoặc trong MySQL:
--    USE flight_booking;
--    SOURCE /path/to/import.sql;
-- ==========================================

USE flight_booking;

-- Import Schema
SOURCE schema.sql;

-- Import Seed Data
SOURCE seed.sql;

-- Verify import
SELECT 'Import completed!' AS status;
SELECT COUNT(*) AS users_count FROM users;
SELECT COUNT(*) AS airports_count FROM airports;
SELECT COUNT(*) AS routes_count FROM routes;
SELECT COUNT(*) AS flights_count FROM flights;
SELECT COUNT(*) AS ticket_types_count FROM ticket_types;
