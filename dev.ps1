# dev.ps1 - PowerShell script to launch both frontend and backend dev servers

Param(
    [string]$Target = "all"
)

Write-Host "[+] Starting Sponsa Monorepo Development Environment..." -ForegroundColor Cyan

if ($Target -eq "backend" -or $Target -eq "all") {
    Write-Host "[Backend] Starting FastAPI Backend Server on http://localhost:8000..." -ForegroundColor Green
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; if (Test-Path '.\.venv\Scripts\python.exe') { .\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000 } else { python -m uvicorn app.main:app --reload --port 8000 }"
}

if ($Target -eq "frontend" -or $Target -eq "app" -or $Target -eq "all") {
    Write-Host "[Frontend App] Starting Vite App Dev Server on http://localhost:8080..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"
}

if ($Target -eq "landing" -or $Target -eq "all") {
    Write-Host "[Landing Site] Starting Vite Landing Dev Server on http://localhost:3000..." -ForegroundColor Magenta
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd landing; npm run dev"
}

Write-Host "[OK] Dev servers started in separate terminal windows." -ForegroundColor Green

