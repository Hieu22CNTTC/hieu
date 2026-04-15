# ==========================================
# Quick Import Script for Windows (PowerShell)
# ==========================================

Write-Host "🚀 Importing Flight Booking Database..." -ForegroundColor Cyan

# Check if container is running
$containerStatus = docker ps --filter "name=flight_booking_db" --format "{{.Status}}"
if (-not $containerStatus) {
    Write-Host "❌ Container 'flight_booking_db' is not running!" -ForegroundColor Red
    Write-Host "Run: docker-compose up -d" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Container is running" -ForegroundColor Green

# Import database
Write-Host "📥 Importing schema and data..." -ForegroundColor Cyan
Get-Content database/import-docker.sql | docker exec -i flight_booking_db mysql -uroot -prootpassword

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✨ Import completed successfully!" -ForegroundColor Green
    Write-Host "`n📊 Database Statistics:" -ForegroundColor Cyan
    Write-Host "- 4 users (admin, manager, sales, customer)" -ForegroundColor White
    Write-Host "- 5 airports (HAN, SGN, DAD, CXR, PQC)" -ForegroundColor White
    Write-Host "- 6 routes" -ForegroundColor White
    Write-Host "- 10 sample flights" -ForegroundColor White
    Write-Host "- 3 ticket types (ADULT, CHILD, INFANT)" -ForegroundColor White
    Write-Host "- 3 coupons" -ForegroundColor White
    Write-Host "`n🔐 Login credentials:" -ForegroundColor Cyan
    Write-Host "- admin@flight.com (password: admin)" -ForegroundColor Yellow
    Write-Host "- manager@flight.com (password: 123)" -ForegroundColor Yellow
    Write-Host "- sales@flight.com (password: 123)" -ForegroundColor Yellow
    Write-Host "- customer@gmail.com (password: 123)" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Import failed!" -ForegroundColor Red
    exit 1
}
