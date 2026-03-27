@echo off
setlocal

REM Launch PowerShell script with relaxed policy for this process only
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0run-local.ps1"
if errorlevel 1 (
  echo.
  echo Setup failed. See messages above.
  echo Press any key to exit...
  pause >nul
  exit /b 1
)

echo.
echo All good. Press any key to close this window...
pause >nul
