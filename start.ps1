param([switch]$Scrape)

$root = Split-Path -Parent $MyInvocation.MyCommand.Path
$dbFile = Join-Path (Join-Path $root "db") "movies.db"
$frontend = Join-Path $root "frontend"

if (!(Test-Path $dbFile) -or $Scrape) {
  Write-Host "Scraping movies..." -ForegroundColor Cyan
  Push-Location (Join-Path $root "scraper")
  node index.js
  Pop-Location
}

Write-Host "Starting server at http://localhost:3000" -ForegroundColor Green
Push-Location $frontend
npm run build
node server.js
Pop-Location
