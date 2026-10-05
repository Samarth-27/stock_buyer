@echo off
title MarketEye — Autonomous Indian Equities Scanner & Swing Trading Terminal
color 0A
cls

echo ======================================================================
echo    MarketEye — High-Speed Autonomous NSE Scanner Terminal
echo ======================================================================
echo.
echo   [1/3] Checking environment...
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed or not in PATH.
    echo Please install Node.js 20+ from https://nodejs.org
    pause
    exit /b 1
)

echo   [2/3] Preparing high-speed local trading engine...
if not exist "node_modules" (
    echo   Installing project dependencies...
    call npm install
)

echo   [3/3] Launching MarketEye Terminal (API + Web Frontend)...
echo.
echo   ------------------------------------------------------------------
echo   * Web Terminal:  http://localhost:5173
echo   * REST API:      http://localhost:3001/api
echo   * WebSocket:     ws://localhost:3001/ws
echo   * Mode:          Angel One SmartAPI Live + Mock Simulation
echo   ------------------------------------------------------------------
echo.
echo   Opening dashboard in your default browser...
start http://localhost:5173

npm run dev
pause
