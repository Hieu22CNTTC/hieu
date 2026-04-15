# Database SQL Files

Thư mục này chứa các file SQL để import trực tiếp vào MySQL mà không cần dùng Prisma.

## 📁 Files

| File | Mô tả |
|------|-------|
| **import-docker.sql** | ⭐ **File chính** - Import toàn bộ vào Docker container (schema + data) |
| **schema.sql** | Chỉ tạo tables với đầy đủ constraints |
| **seed.sql** | Chỉ insert dữ liệu mẫu |
| **import.sql** | Import cho MySQL local (SOURCE command) |
| **import.ps1** | Script PowerShell tự động import |
| **QUICK_START.md** | Hướng dẫn chi tiết các cách import |

## 🚀 Quick Start (Windows)

```powershell
# Đảm bảo container đang chạy
docker-compose up -d

# Import database
.\database\import.ps1
```

## 🚀 Quick Start (Linux/Mac)

```bash
# Đảm bảo container đang chạy
docker-compose up -d

# Import database
cat database/import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword
```

## 📖 Chi tiết

Xem [QUICK_START.md](QUICK_START.md) để biết thêm các cách import khác (MySQL Workbench, local MySQL, etc.)

## 🗄️ Database Structure

### Tables Created (11 tables)

1. **users** - Người dùng (ADMIN, MANAGER, SALES, USER)
2. **airports** - Sân bay (5 airports)
3. **aircraft** - Loại máy bay (3 types)
4. **ticket_types** - Loại vé (ADULT, CHILD, INFANT) ⭐ SRS Enhancement
5. **routes** - Tuyến bay (6 routes)
6. **coupons** - Mã giảm giá (3 coupons)
7. **flights** - Chuyến bay (10 sample flights)
8. **seat_inventory** - Quản lý ghế
9. **bookings** - Đặt vé (hỗ trợ public booking) ⭐ SRS Enhancement
10. **booking_passengers** - Hành khách ⭐ SRS Enhancement
11. **payments** - Thanh toán

## 📊 Sample Data

## 🔐 Passwords

- **admin@flight.com**: password `admin`
- **manager@flight.com**: password `123`
- **sales@flight.com**: password `123`
- **customer@gmail.com**: password `123`

### Airports
- VN-HAN (Hanoi)
- VN-SGN (Ho Chi Minh)
- VN-DAD (Da Nang)
- VN-CXR (Nha Trang)
- VN-PQC (Phu Quoc)

### Flights
- 10 chuyến bay mẫu (HAN → SGN)
- Feb 1-4, 2026
- 3 chuyến/ngày (6:00, 12:00, 18:00)

## ✅ Verify Import

```sql
docker exec -it flight_booking_db mysql -uroot -prootpassword flight_booking

-- Kiểm tra
SELECT COUNT(*) FROM users;          -- Expected: 4
SELECT COUNT(*) FROM airports;       -- Expected: 5
SELECT COUNT(*) FROM flights;        -- Expected: 10
SELECT COUNT(*) FROM ticket_types;   -- Expected: 3

-- Xem users
SELECT email, fullName, role FROM users;
```

## 🔄 Reset Database

```powershell
# Windows
.\database\import.ps1
```

```bash
# Linux/Mac  
cat database/import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword
```
