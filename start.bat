@echo off
echo.
echo  ======================================
echo    Helionyx Business Center v2.0
echo  ======================================
echo.

:: Check Node
node --version >nul 2>&1
if errorlevel 1 (
  echo ERROR: Node.js is not installed.
  echo Download it from: https://nodejs.org
  pause & exit /b 1
)

:: Install server deps if needed
if not exist "node_modules" (
  echo Installing server dependencies...
  npm install
)

:: Install client deps if needed
if not exist "client\node_modules" (
  echo Installing client dependencies...
  cd client && npm install && cd ..
)

:: Copy .env if missing
if not exist ".env" (
  if exist ".env.example" (
    copy .env.example .env >nul
    echo Created .env from .env.example
    echo IMPORTANT: Edit .env to add your database and API keys
  )
)

echo.
echo Starting server on http://localhost:3000
echo Press Ctrl+C to stop
echo.
node server/index.js
