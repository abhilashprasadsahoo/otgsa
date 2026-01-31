@echo off
setlocal

echo ===================================================
echo   ODISSITECH ATTENDANCE SYSTEM - LAUNCHER
echo ===================================================

:: 1. Check for Node.js
echo.
echo [1/4] Checking for Node.js...
node -v >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is NOT installed or not in your PATH.
    echo.
    echo Please install Node.js from: https://nodejs.org/
    echo After installing, restart this script.
    echo.
    pause
    exit /b
)
echo Node.js is available.

:: 2. Setup Server
echo.
echo [2/4] Setting up Server...
cd server
if not exist node_modules (
    echo Installing server dependencies...
    call npm install
    echo Initializing database...
    call npx prisma generate
    call npx prisma db push
) else (
    echo Server dependencies already installed.
)

:: 3. Setup Client
echo.
echo [3/4] Setting up Client...
cd ../client
if not exist node_modules (
    echo Installing client dependencies...
    call npm install
) else (
    echo Client dependencies already installed.
)

:: 4. Launching
echo.
echo [4/4] Launching System...
echo.
echo Starting Backend Server (Port 5000)...
start "ODISSITECH Server" cmd /k "cd ../server && npm start"

echo Starting Frontend Client...
start "ODISSITECH Client" cmd /k "npm run dev"

echo.
echo ===================================================
echo   SYSTEM STARTED SUCCESSFULLY!
echo ===================================================
echo   Frontend: http://localhost:5173
echo   Server:   http://localhost:5000
echo.
echo   Admin Login: admin@odissitech.com / admin123
echo ===================================================
pause
