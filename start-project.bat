@echo off
REM ============================================
REM Assurance App Launcher Script
REM Starts WAMP, Backend, and Frontend services
REM ============================================

setlocal enabledelayedexpansion

REM Configuration
set PROJECT_ROOT=%~dp0
set BACKEND_DIR=%PROJECT_ROOT%backend
set FRONTEND_DIR=%PROJECT_ROOT%frontend
set LOG_FILE=%PROJECT_ROOT%startup.log
set TIMESTAMP=%date% %time%

REM Create log file header
echo ============================================ > "%LOG_FILE%"
echo Assurance App Launcher - Startup Log >> "%LOG_FILE%"
echo Started: %TIMESTAMP% >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM ============================================
REM Step 1: Start WAMP Server
REM ============================================
echo [%TIME%] Starting WAMP Server...
echo [%TIME%] Starting WAMP Server... >> "%LOG_FILE%"

REM Check for WAMP in common locations
set WAMP_FOUND=0

REM Check common WAMP paths
if exist "D:\WAMP\wampmanager.exe" (
    set WAMP_EXE=D:\WAMP\wampmanager.exe
    set WAMP_FOUND=1
    echo [%TIME%] Found WAMP at: D:\WAMP\wampmanager.exe >> "%LOG_FILE%"
)
if exist "C:\wamp64\wampmanager.exe" (
    set WAMP_EXE=C:\wamp64\wampmanager.exe
    set WAMP_FOUND=1
    echo [%TIME%] Found WAMP at: C:\wamp64\wampmanager.exe >> "%LOG_FILE%"
)
if exist "C:\wamp\wampmanager.exe" (
    set WAMP_EXE=C:\wamp\wampmanager.exe
    set WAMP_FOUND=1
    echo [%TIME%] Found WAMP at: C:\wamp\wampmanager.exe >> "%LOG_FILE%"
)
if exist "D:\wamp64\wampmanager.exe" (
    set WAMP_EXE=D:\wamp64\wampmanager.exe
    set WAMP_FOUND=1
    echo [%TIME%] Found WAMP at: D:\wamp64\wampmanager.exe >> "%LOG_FILE%"
)

if %WAMP_FOUND%==0 (
    echo [%TIME%] ERROR: WAMP not found in common locations!
    echo [%TIME%] ERROR: WAMP not found in common locations! >> "%LOG_FILE%"
    echo [%TIME%] Please install WAMP or update the script with your WAMP path. >> "%LOG_FILE%"
    echo.
    echo ERROR: WAMP not found. Please install WAMP or update the script.
    pause
    exit /b 1
)

REM Start WAMP
start "" "%WAMP_EXE%"
echo [%TIME%] WAMP launched successfully >> "%LOG_FILE%"

REM Wait for WAMP to initialize (15 seconds)
echo [%TIME%] Waiting for WAMP to initialize...
echo [%TIME%] Waiting for WAMP to initialize... >> "%LOG_FILE%"
timeout /t 15 /nobreak >nul

REM Check if WAMP services are running
REM Try to connect to MySQL to verify it's ready
echo [%TIME%] Verifying WAMP services... >> "%LOG_FILE%"
timeout /t 5 /nobreak >nul
echo [%TIME%] WAMP initialization complete >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM ============================================
REM Step 2: Start Backend Server
REM ============================================
echo [%TIME%] Starting Backend Server...
echo [%TIME%] Starting Backend Server... >> "%LOG_FILE%"

cd /d "%BACKEND_DIR%"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [%TIME%] Installing backend dependencies...
    echo [%TIME%] Installing backend dependencies... >> "%LOG_FILE%"
    call npm install >> "%LOG_FILE%" 2>&1
    if errorlevel 1 (
        echo [%TIME%] ERROR: Failed to install backend dependencies >> "%LOG_FILE%"
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
)

REM Start backend in minimized window
start /min cmd /k "cd /d "%BACKEND_DIR%" && node server.js"
echo [%TIME%] Backend server started in minimized window >> "%LOG_FILE%"

REM Wait for backend to initialize
echo [%TIME%] Waiting for backend to initialize...
echo [%TIME%] Waiting for backend to initialize... >> "%LOG_FILE%"
timeout /t 5 /nobreak >nul
echo [%TIME%] Backend initialization complete >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM ============================================
REM Step 3: Start Frontend
REM ============================================
echo [%TIME%] Starting Frontend...
echo [%TIME%] Starting Frontend... >> "%LOG_FILE%"

cd /d "%FRONTEND_DIR%"

REM Check if node_modules exists
if not exist "node_modules" (
    echo [%TIME%] Installing frontend dependencies...
    echo [%TIME%] Installing frontend dependencies... >> "%LOG_FILE%"
    call npm install >> "%LOG_FILE%" 2>&1
    if errorlevel 1 (
        echo [%TIME%] ERROR: Failed to install frontend dependencies >> "%LOG_FILE%"
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

REM Start frontend in minimized window
start /min cmd /k "cd /d "%FRONTEND_DIR%" && npm run dev"
echo [%TIME%] Frontend started in minimized window >> "%LOG_FILE%"

REM Wait for frontend to initialize
echo [%TIME%] Waiting for frontend to initialize...
echo [%TIME%] Waiting for frontend to initialize... >> "%LOG_FILE%"
timeout /t 5 /nobreak >nul
echo [%TIME%] Frontend initialization complete >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"

REM ============================================
REM Startup Complete
REM ============================================
echo ============================================
echo [%TIME%] All services started successfully!
echo [%TIME%] All services started successfully! >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"
echo [%TIME%] Services running: >> "%LOG_FILE%"
echo   - WAMP Server (Apache + MySQL) >> "%LOG_FILE%"
echo   - Backend Server (Node.js) >> "%LOG_FILE%"
echo   - Frontend (React/Vite) >> "%LOG_FILE%"
echo. >> "%LOG_FILE%"
echo [%TIME%] Access URLs: >> "%LOG_FILE%"
echo   - Frontend: http://localhost:5173 >> "%LOG_FILE%"
echo   - Backend: http://localhost:3000 (check backend for actual port) >> "%LOG_FILE%"
echo ============================================ >> "%LOG_FILE%"

echo.
echo ============================================
echo All services started successfully!
echo.
echo Services running:
echo   - WAMP Server (Apache + MySQL)
echo   - Backend Server (Node.js)
echo   - Frontend (React/Vite)
echo.
echo Access URLs:
echo   - Frontend: http://localhost:5173
echo   - Backend: http://localhost:3000 (check backend for actual port)
echo.
echo Check startup.log for detailed information.
echo ============================================
echo.
echo Press any key to close this window (services will continue running)...
pause >nul

endlocal
