# ==========================================
# Cập nhật Chuyến Bay - Ngày 01/06/2026
# ==========================================

Write-Host "🔄 Cập nhật chuyến bay sang ngày 01/06/2026..." -ForegroundColor Cyan

# Kiểm tra container có đang chạy không
$containerStatus = docker ps --filter "name=flight_booking_db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "❌ Container 'flight_booking_db' KHÔNG đang chạy!" -ForegroundColor Red
    Write-Host "Chạy lệnh: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Container đang chạy" -ForegroundColor Green

# Import file update
Write-Host "📥 Đang cập nhật dữ liệu chuyến bay..." -ForegroundColor Cyan
Get-Content database/update_flights.sql | docker exec -i flight_booking_db mysql -uroot -proot flight_booking

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✨ Cập nhật thành công!" -ForegroundColor Green
    Write-Host "`n📊 Thông tin cập nhật:" -ForegroundColor Cyan
    Write-Host "- Tất cả chuyến bay đã chuyển sang: 01/06/2026" -ForegroundColor White
    Write-Host "- Coupon áp dụng: SUMMER2026 (15% off, max 300k)" -ForegroundColor White
    Write-Host "- Số lượng chuyến bay: 35 chuyến" -ForegroundColor White
    Write-Host "`n✅ Backend sẽ tự động nhận dữ liệu mới!" -ForegroundColor Green
} else {
    Write-Host "`n❌ Lỗi khi cập nhật!" -ForegroundColor Red
    Write-Host "Kiểm tra lại file update_flights.sql" -ForegroundColor Yellow
}
