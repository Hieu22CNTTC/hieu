# Flight Booking - Deploy Len EC2 (Da Co San EC2)

Tai lieu nay la checklist trien khai tu A-Z cho truong hop:
- EC2 Linux da tao san
- Backend + Database chay tren EC2
- Frontend build static va upload len S3

## 1) Tong quan kien truc

- Backend Node.js/Express: chay tren EC2, port noi bo `3000`
- Database SQL Server: chay tren EC2 (hoac EC2 DB rieng)
- Reverse proxy Nginx: expose HTTPS cong cong
- Frontend: `npm run build` va deploy len S3 (khuyen nghi qua CloudFront)

## 2) Chuan bi tren EC2

SSH vao EC2:

```bash
ssh -i <your-key>.pem ubuntu@<EC2_PUBLIC_IP>
```

Cap nhat he thong:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl unzip nginx
```

## 3) Cai Node.js va PM2

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v

sudo npm i -g pm2
```

## 4) Cai SQL Server tren Ubuntu (neu DB cung EC2)

Neu ban da co SQL Server o noi khac thi bo qua muc nay va dung `DATABASE_URL` toi host do.

```bash
curl https://packages.microsoft.com/keys/microsoft.asc | sudo apt-key add -
sudo add-apt-repository "$(curl https://packages.microsoft.com/config/ubuntu/22.04/mssql-server-2022.list)"
sudo apt update
sudo apt install -y mssql-server
sudo /opt/mssql/bin/mssql-conf setup
sudo systemctl enable mssql-server --now
sudo systemctl status mssql-server --no-pager
```

Tao database:

```bash
/opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -P '<SA_PASSWORD>' -C -Q "CREATE DATABASE flight_booking;"
```

## 5) Clone source va cai backend

```bash
cd /var/www
sudo git clone <your-repo-url> flight-booking
sudo chown -R $USER:$USER /var/www/flight-booking

cd /var/www/flight-booking/backend
npm ci
```

## 6) Tao file .env cho production

```bash
cp .env.example .env
nano .env
```

Mau bien moi truong can chinh:

```env
NODE_ENV=production
PORT=3000

DATABASE_URL="sqlserver://127.0.0.1:1433;database=flight_booking;user=sa;password=<SA_PASSWORD>;encrypt=true;trustServerCertificate=true"

JWT_SECRET=<STRONG_SECRET>
JWT_REFRESH_SECRET=<STRONG_REFRESH_SECRET>

# Frontend domain (S3/CloudFront)
FRONTEND_URL=https://<frontend-domain>

# Backend public domain
BACKEND_URL=https://<api-domain>

# MoMo
MOMO_PARTNER_CODE=<...>
MOMO_ACCESS_KEY=<...>
MOMO_SECRET_KEY=<...>
MOMO_ENDPOINT=https://payment.momo.vn/v2/gateway/api/create
MOMO_REDIRECT_URL=https://<frontend-domain>/payment/callback
MOMO_IPN_URL=https://<api-domain>/api/payments/ipn
MOMO_REQUEST_TYPE=captureWallet

# Email (Gmail App Password hoac SMTP khac)
EMAIL_USER=<email>
EMAIL_PASSWORD=<app-password>

# Crawl jobs
CRAWL_JOB_ENABLED=true
CRAWL_JOB_SCHEDULE=0 */8 * * *
EXPIRED_FLIGHT_CLEANUP_ENABLED=true
EXPIRED_FLIGHT_CLEANUP_SCHEDULE=15 */8 * * *
```

## 7) Khoi tao DB schema + seed

```bash
cd /var/www/flight-booking/backend
npm run db:setup:server
```

Script tren se:
- `prisma generate`
- `prisma migrate deploy`
- seed lan dau neu DB rong

Luu y: can commit day du `backend/prisma/migrations/` len git. Neu server khong co migration SQL da generate, `prisma migrate deploy` se khong tao bang du lieu du schema Prisma da ton tai trong repo.

## 8) Chay backend bang PM2

```bash
cd /var/www/flight-booking/backend
pm2 start server.js --name flight-backend
pm2 save
pm2 startup
```

Kiem tra:

```bash
pm2 status
curl http://127.0.0.1:3000/health
```

## 9) Cau hinh Nginx reverse proxy

Tao file site:

```bash
sudo nano /etc/nginx/sites-available/flight-backend
```

Noi dung:

```nginx
server {
	listen 80;
	server_name <api-domain>;

	location / {
		proxy_pass http://127.0.0.1:3000;
		proxy_http_version 1.1;
		proxy_set_header Upgrade $http_upgrade;
		proxy_set_header Connection 'upgrade';
		proxy_set_header Host $host;
		proxy_set_header X-Real-IP $remote_addr;
		proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
		proxy_set_header X-Forwarded-Proto $scheme;
	}
}
```

Enable site:

```bash
sudo ln -s /etc/nginx/sites-available/flight-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 10) Bat HTTPS bang Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <api-domain>
```

## 11) Deploy frontend len S3

Chay tren may local/CI:

```bash
cd frontend
npm ci
npm run build
aws s3 sync dist/ s3://<frontend-bucket> --delete
```

Neu dung CloudFront, tao invalidation sau khi deploy:

```bash
aws cloudfront create-invalidation --distribution-id <DIST_ID> --paths "/*"
```

## 12) Security Group can mo

- Inbound 22: SSH (IP cua ban)
- Inbound 80/443: public
- Khong mo 3000 public (chi localhost qua Nginx)
- SQL Server 1433: chi mo noi bo (neu can)

## 13) Lenh deploy cap nhat (lan sau)

```bash
cd /var/www/flight-booking
git pull

cd backend
npm ci
npm run db:deploy
pm2 restart flight-backend
pm2 logs flight-backend --lines 100
```

## 14) Checklist verify sau deploy

- `pm2 status` la `online`
- `curl https://<api-domain>/health` tra `success: true`
- Frontend S3/CloudFront load duoc
- Tao payment MoMo test thanh cong
- Flow quen mat khau gui email thanh cong

## 15) Xu ly loi nhanh

- Loi ket noi DB: check `DATABASE_URL`, check service SQL Server `systemctl status mssql-server`
- Loi CORS: check `FRONTEND_URL` trong `.env`
- MoMo callback khong ve: check `MOMO_IPN_URL` phai la HTTPS public
- Email khong gui: check `EMAIL_USER`, `EMAIL_PASSWORD`, log PM2

