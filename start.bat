@echo off
REM Chabokan S3 Manager - Quick Start Script for Windows

echo.
echo Starting Chabokan S3 Manager...
echo.

REM Check if Node.js is installed
where node >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
where npm >nul 2>nul
if %ERRORLEVEL% NEQ 0 (
    echo npm is not installed!
    pause
    exit /b 1
)

echo Node.js is installed
echo npm is installed
echo.

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    echo.
)

REM Start the application
echo Launching application...
call npm start

