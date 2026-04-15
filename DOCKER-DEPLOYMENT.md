# Flight Booking System - Docker Deployment Guide

Hướng dẫn triển khai hệ thống đặt vé máy bay sử dụng Docker và Docker Compose.

---

## 📋 Yêu cầu hệ thống

- **Docker**: >= 20.10
- **Docker Compose**: >= 2.0
- **RAM**: >= 4GB
- **Disk**: >= 10GB free space
- **OS**: Windows 10/11, macOS, Linux

---

## 🏗️ Kiến trúc hệ thống

```
┌─────────────────────────────────────────────────────┐
│                   Docker Network                    │
│                                                     │
│  ┌─────────────┐   ┌──────────────┐  ┌───────────┐  │
│  │   Frontend  │   │   Backend    │  │   MySQL   │  │
│  │   (Nginx)   │◄──┤   (Node.js)  │◄─┤   (8.0)   │  │
│  │   Port 80   │   │   Port 3000  │  │ Port 3306 │  │
│  └─────────────┘   └──────────────┘  └───────────┘  │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🚀 Triển khai nhanh (Quick Start)

### 1. Clone hoặc chuẩn bị dự án

```bash
cd LapTrinhVoiAI_Iviettech/DoAn
```

### 2. Cấu hình môi trường

Tạo file `.env` trong thư mục `backend/`:

```bash
# Backend environment
NODE_ENV=production
PORT=3000

# Database
DATABASE_URL=mysql://root:root@mysql:3306/flight_booking

# JWT
JWT_SECRET=your_super_secret_jwt_key_change_in_production
JWT_REFRESH_SECRET=your_super_secret_refresh_key_change_in_production
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# MoMo Payment (Sandbox)
MOMO_PARTNER_CODE=YOUR_PARTNER_CODE
MOMO_ACCESS_KEY=YOUR_ACCESS_KEY
MOMO_SECRET_KEY=YOUR_SECRET_KEY
MOMO_ENDPOINT=https://test-payment.momo.vn/v2/gateway/api/create
MOMO_RETURN_URL=http://localhost/payment/return
MOMO_IPN_URL=http://localhost/api/payments/momo/callback
```

### 3. Build và khởi động containers

```powershell
# Build tất cả images
docker-compose build

# Khởi động tất cả services
docker-compose up -d

# Xem logs
docker-compose logs -f
```

### 4. Kiểm tra hệ thống

- **Frontend**: http://localhost
- **Backend API**: http://localhost:3000/api
- **Health Check**: http://localhost:3000/health

---

## 📦 Chi tiết các Services

### 1. MySQL Database

**Container**: `flight_booking_db`  
**Port**: 3306  
**Credentials**:
- Root: `root` / `root`
- User: `flight_user` / `flight_password`

**Features**:
- Auto-initialize database schema
- Auto-seed sample data
- Health check enabled
- Persistent volume storage

### 2. Backend API

**Container**: `flight_booking_backend`  
**Port**: 3000  
**Framework**: Node.js + Express + Prisma

**Features**:
- Auto-run Prisma migrations
- Generate Prisma client
- Winston logging
- JWT authentication
- MoMo payment integration

**Endpoints**:
- `/api` - API info
- `/health` - Health check
- `/api/auth/*` - Authentication
- `/api/public/*` - Public APIs
- `/api/bookings/*` - Booking APIs
- `/api/users/*` - User management
- `/api/sales/*` - Sales operations
- `/api/manager/*` - Manager operations
- `/api/admin/*` - Admin operations

### 3. Frontend

**Container**: `flight_booking_frontend`  
**Port**: 80  
**Framework**: React + Vite + TailwindCSS + daisyUI

**Features**:
- Nginx server
- React Router for SPA
- API proxy to backend
- Static asset caching
- Gzip compression

---

## 🛠️ Các lệnh Docker hữu ích

### Quản lý Containers

```powershell
# Xem trạng thái containers
docker-compose ps

# Dừng tất cả containers
docker-compose stop

# Khởi động lại containers
docker-compose restart

# Dừng và xóa containers
docker-compose down

# Dừng và xóa kể cả volumes
docker-compose down -v
```

### Xem Logs

```powershell
# Logs tất cả services
docker-compose logs -f

# Logs một service cụ thể
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# Logs 100 dòng cuối
docker-compose logs --tail=100 backend
```

### Truy cập Container

```powershell
# Vào backend container
docker exec -it flight_booking_backend sh

# Vào MySQL container
docker exec -it flight_booking_db mysql -u root -proot flight_booking

# Vào frontend container
docker exec -it flight_booking_frontend sh
```

### Database Operations

```powershell
# Chạy Prisma migrations
docker exec -it flight_booking_backend npx prisma migrate deploy

# Seed database
docker exec -it flight_booking_backend npm run db:seed

# Prisma Studio (Database GUI)
docker exec -it flight_booking_backend npx prisma studio

# Reset database
docker exec -it flight_booking_backend npx prisma migrate reset
```

### Rebuild Services

```powershell
# Rebuild tất cả
docker-compose build --no-cache

# Rebuild một service
docker-compose build --no-cache backend

# Rebuild và restart
docker-compose up -d --build
```

---

## 🐛 Troubleshooting

### 1. Backend không kết nối được Database

```powershell
# Kiểm tra MySQL đã ready chưa
docker-compose logs mysql | Select-String "ready for connections"

# Kiểm tra connection từ backend
docker exec -it flight_booking_backend sh
ping mysql
```

**Giải pháp**: Đợi MySQL health check pass (có thể mất 30-60s)

### 2. Port đã được sử dụng

```powershell
# Kiểm tra process đang dùng port
Get-Process | Where-Object {$_.ProcessName -eq "node"} | Stop-Process -Force

# Hoặc thay đổi port trong docker-compose.yml
ports:
  - "8080:80"  # Frontend
  - "3001:3000"  # Backend
```

### 3. Prisma migration fails

```powershell
# Xóa và tạo lại database
docker exec -it flight_booking_db mysql -u root -proot -e "DROP DATABASE IF EXISTS flight_booking; CREATE DATABASE flight_booking;"

# Chạy migration lại
docker exec -it flight_booking_backend npx prisma migrate deploy
```

### 4. Frontend không gọi được Backend API

Kiểm tra nginx configuration trong `frontend/nginx.conf`:

```nginx
location /api {
    proxy_pass http://backend:3000;
    # ... other settings
}
```

### 5. Xem chi tiết lỗi

```powershell
# Backend logs
docker exec -it flight_booking_backend cat logs/error.log

# MySQL logs
docker-compose logs mysql | Select-String "ERROR"

# Container stats
docker stats
```

---

## 🔄 Update và Maintenance

### Update Code

```powershell
# Pull latest code
git pull origin main

# Rebuild và restart
docker-compose up -d --build
```

### Backup Database

```powershell
# Export database
docker exec flight_booking_db mysqldump -u root -proot flight_booking > backup_$(Get-Date -Format 'yyyyMMdd_HHmmss').sql

# Restore database
Get-Content backup.sql | docker exec -i flight_booking_db mysql -u root -proot flight_booking
```

### Clean Up

```powershell
# Xóa unused images
docker image prune -a

# Xóa unused volumes
docker volume prune

# Xóa unused networks
docker network prune

# Xóa tất cả (NGUY HIỂM!)
docker system prune -a --volumes
```

---

## 📊 Monitoring

### Health Checks

```powershell
# Backend health
curl http://localhost:3000/health

# Database health
docker exec flight_booking_db mysqladmin ping -h localhost -u root -proot

# Frontend
curl http://localhost
```

### Resource Usage

```powershell
# Container stats
docker stats

# Disk usage
docker system df
```

---

## 🔒 Security Considerations

### Production Checklist

- [ ] Thay đổi `JWT_SECRET` và `JWT_REFRESH_SECRET`
- [ ] Thay đổi MySQL root password
- [ ] Sử dụng MoMo Production credentials
- [ ] Enable HTTPS với SSL certificate
- [ ] Thêm rate limiting
- [ ] Cấu hình firewall
- [ ] Backup database định kỳ
- [ ] Set `NODE_ENV=production`
- [ ] Disable Prisma Studio trên production
- [ ] Xem xét sử dụng Docker secrets

### Environment Variables Security

Sử dụng Docker secrets thay vì environment variables:

```yaml
secrets:
  jwt_secret:
    file: ./secrets/jwt_secret.txt
  
services:
  backend:
    secrets:
      - jwt_secret
```

---

## 🌐 Deployment to Cloud

### AWS EC2

```bash
# Install Docker
sudo yum update -y
sudo yum install docker -y
sudo service docker start

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Deploy
cd /path/to/project
docker-compose up -d
```

### DigitalOcean

Use Docker Droplet hoặc App Platform với Dockerfile

### Heroku

Sử dụng `heroku.yml` configuration

---

## 📞 Support

Nếu gặp vấn đề, kiểm tra:

1. **Logs**: `docker-compose logs -f`
2. **Container status**: `docker-compose ps`
3. **Network**: `docker network inspect doan_flight-network`
4. **Volumes**: `docker volume ls`

---

## 📝 Notes

- Backend tự động chạy migrations khi khởi động
- Database data được lưu trong Docker volume `mysql_data`
- Frontend sử dụng nginx để serve React SPA
- Tất cả containers kết nối qua `flight-network`
- Health checks đảm bảo startup order đúng

---

**Happy Deploying! 🚀**
