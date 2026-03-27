$ErrorActionPreference = "Stop"

function Fail($msg) {
  Write-Host ""
  Write-Host "ERROR: $msg" -ForegroundColor Red
  exit 1
}

function HasCommand($name) {
  return $null -ne (Get-Command $name -ErrorAction SilentlyContinue)
}

# Move to repo root (one level up from scripts\)
$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..")
Set-Location $repoRoot

Write-Host ""
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Xaris - Student Lifecycle & Academic Tracker" -ForegroundColor Cyan
Write-Host "  Setting up and starting the app..." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Check for Node.js
if (-not (HasCommand "node")) {
  Fail "Node.js is not installed.`nPlease install Node 20 or newer from https://nodejs.org/ and try again."
}

# Check for npm
if (-not (HasCommand "npm")) {
  Fail "npm is missing. Please reinstall Node.js (it includes npm) and try again."
}

Write-Host "Node version: $((node -v).Trim())"
Write-Host ""

# Create a minimal .env if one doesn't exist yet
if (-not (Test-Path ".env")) {
  if (Test-Path ".env.example") {
    Copy-Item ".env.example" ".env"
    Write-Host "Created .env from .env.example"
  } else {
    "# Created automatically by scripts\run-local.ps1" | Out-File -Encoding utf8 ".env"
    Write-Host "Created minimal .env"
  }
  Write-Host ""
}

# Step 1 – Install dependencies
Write-Host "Step 1/4 - Installing dependencies..." -ForegroundColor Yellow
npm install
Write-Host ""

# Step 2 – Generate Prisma client
Write-Host "Step 2/4 - Generating Prisma client..." -ForegroundColor Yellow
npm run db:generate
Write-Host ""

# Step 3 – Run database migrations
Write-Host "Step 3/4 - Running database migrations..." -ForegroundColor Yellow
npm run db:migrate
Write-Host ""

# Step 4 – Seed sample data (only if seed file exists)
$seedFile = Join-Path "prisma" "seed.ts"
if (Test-Path $seedFile) {
  Write-Host "Step 4/4 - Seeding sample data..." -ForegroundColor Yellow
  npm run seed
} else {
  Write-Host "Step 4/4 - Seed skipped ($seedFile not found)." -ForegroundColor DarkGray
}
Write-Host ""

# Start the app
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host "  Starting the app..." -ForegroundColor Cyan
Write-Host "  When ready, open: http://localhost:3000" -ForegroundColor Cyan
Write-Host "  Press Ctrl+C to stop the server." -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""
npm run dev
