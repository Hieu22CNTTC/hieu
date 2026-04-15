-- ==========================================
-- DATABASE CLEANUP SCRIPT
-- Run this to fix data inconsistencies
-- ==========================================

-- 1. Show current status
SELECT 'BEFORE CLEANUP' as stage;
SELECT status, COUNT(*) as count FROM bookings GROUP BY status;
SELECT status, COUNT(*) as count FROM payments GROUP BY status;

-- 2. Mark old PENDING payments as FAILED (older than 30 minutes)
UPDATE payments 
SET status = 'FAILED', 
    updatedAt = NOW()
WHERE status = 'PENDING' 
AND createdAt < DATE_SUB(NOW(), INTERVAL 30 MINUTE);

-- 3. Keep only the latest payment per booking
-- First, create a temp table with IDs to keep
CREATE TEMPORARY TABLE payments_to_keep AS
SELECT MAX(id) as id 
FROM payments 
GROUP BY bookingId;

-- Delete duplicate payments (keep latest)
DELETE FROM payments 
WHERE id NOT IN (SELECT id FROM payments_to_keep);

DROP TEMPORARY TABLE payments_to_keep;

-- 4. Update booking status based on payment status
UPDATE bookings b
LEFT JOIN (
    SELECT bookingId, status
    FROM payments
    WHERE id IN (
        SELECT MAX(id) FROM payments GROUP BY bookingId
    )
) p ON b.id = p.bookingId
SET b.status = CASE
    WHEN p.status = 'SUCCESS' THEN 'CONFIRMED'
    WHEN p.status = 'FAILED' AND b.status = 'PENDING' THEN 'CANCELLED'
    WHEN b.expiresAt < NOW() AND b.status = 'PENDING' THEN 'CANCELLED'
    ELSE b.status
END,
b.updatedAt = NOW();

-- 5. Cancel expired bookings without payments
UPDATE bookings 
SET status = 'CANCELLED',
    updatedAt = NOW()
WHERE status = 'PENDING' 
AND expiresAt < NOW()
AND id NOT IN (SELECT bookingId FROM payments WHERE status = 'SUCCESS');

-- 6. Show results
SELECT 'AFTER CLEANUP' as stage;
SELECT status, COUNT(*) as count FROM bookings GROUP BY status;
SELECT status, COUNT(*) as count FROM payments GROUP BY status;

-- 7. Show booking details
SELECT 
    b.bookingCode,
    b.status as booking_status,
    b.totalAmount,
    p.status as payment_status,
    p.paymentMethod,
    p.createdAt as payment_date
FROM bookings b
LEFT JOIN payments p ON b.id = p.bookingId
ORDER BY b.createdAt DESC;
