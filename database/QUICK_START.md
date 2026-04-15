# 🚀 Quick Start - Import Database

## Cách 1: Sử dụng Script Tự Động (Khuyên dùng)

### Windows (PowerShell)
```powershell
cd DoAn
.\database\import.ps1
```

### Linux/Mac (Bash)
```bash
cd DoAn
cat database/import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword
```

---

## Cách 2: Import Thủ Công

### A. Import vào Docker Container (Khuyên dùng)

**Windows PowerShell:**
```powershell
# 1. Đảm bảo container đang chạy
docker ps | findstr flight_booking_db

# 2. Import
Get-Content database\import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword
```

**Linux/Mac:**
```bash
# 1. Đảm bảo container đang chạy
docker ps | grep flight_booking_db

# 2. Import
docker exec -i flight_booking_db mysql -uroot -prootpassword < database/import-docker.sql
```

### B. Import vào MySQL Local

```bash
# 1. Tạo database
mysql -u root -p -e "CREATE DATABASE flight_booking CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# 2. Import schema
mysql -u root -p flight_booking < database/schema.sql

# 3. Import data
mysql -u root -p flight_booking < database/seed.sql
```

### C. Sử dụng MySQL Workbench

1. Mở MySQL Workbench
2. Connect đến MySQL server
   - Docker: `localhost:3307`, user: `root`, password: `rootpassword`
   - Local: `localhost:3306`, user theo cài đặt của bạn
3. File → Run SQL Script
4. Chọn file `database/import-docker.sql`
5. Click **Run**

---

## ✅ Kiểm Tra Import

```sql
-- Connect vào MySQL
docker exec -it flight_booking_db mysql -uroot -prootpassword flight_booking

-- Kiểm tra tables
SHOW TABLES;

-- Kiểm tra số lượng records
SELECT COUNT(*) FROM users;          -- Expected: 4
SELECT COUNT(*) FROM airports;       -- Expected: 5
SELECT COUNT(*) FROM flights;        -- Expected: 10
SELECT COUNT(*) FROM ticket_types;   -- Expected: 3

-- Xem sample users
SELECT email, fullName, role FROM users;

-- Xem sample flights
SELECT flightNumber, departureTime, basePrice FROM flights LIMIT 5;
```

---

## 📊 Database đã bao gồm

### 👥 Users
- `admin@flight.com` - ADMIN (password: `admin`)
- `manager@flight.com` - MANAGER (password: `123`)
- `sales@flight.com` - SALES (password: `123`)
- `customer@gmail.com` - USER (password: `123`)

### ✈️ Airports (5 airports)
- VN-HAN (Hanoi - Noi Bai)
- VN-SGN (Ho Chi Minh - Tan Son Nhat)
- VN-DAD (Da Nang)
- VN-CXR (Nha Trang - Cam Ranh)
- VN-PQC (Phu Quoc)

### 🛫 Flights (10 sample flights)
- Route: Hanoi → Ho Chi Minh
- Dates: Feb 1-4, 2026
- Times: 6:00, 12:00, 18:00 daily

### 🎫 Ticket Types (3 types)
- ADULT - 100% base price (12+ years)
- CHILD - 75% base price (2-11 years)
- INFANT - 10% base price (0-1 years)

### 🎟️ Coupons (3 active coupons)
- `SUMMER2026` - 15% off (max 300k)
- `NEWYEAR2026` - 20% off (max 500k)
- `FLASH50` - 50% off (max 1M)

---

## 🔄 Reset Database

Nếu muốn import lại từ đầu:

```powershell
# Windows
Get-Content database\import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword
```

```bash
# Linux/Mac
docker exec -i flight_booking_db mysql -uroot -prootpassword < database/import-docker.sql
```

File `import-docker.sql` đã bao gồm câu lệnh `DROP DATABASE` nên sẽ xóa và tạo lại database mới.

---

## 🆘 Troubleshooting

### Lỗi: "Container not found"
```bash
docker-compose up -d
```

### Lỗi: "Access denied"
Kiểm tra password trong `.env` và `docker-compose.yml` phải khớp.

### Lỗi: "Database already exists"
File `import-docker.sql` sẽ tự động DROP và CREATE lại database, không cần lo lắng.

### Kiểm tra logs
```bash
docker logs flight_booking_db
```

---

## 📝 Next Steps

Sau khi import xong:

1. ✅ Verify database: `npm run db:studio` (trong thư mục backend)
2. ✅ Update connection string trong `.env`
3. ✅ Start backend server: `npm run dev`
4. ✅ Test API endpoints
