@echo off
echo.
echo  ======================================
echo    Helionyx Business Center - DEV MODE
echo    Server: http://localhost:3000
echo    Frontend: http://localhost:5173
echo  ======================================
echo.

:: Check for concurrently
npm list concurrently >nul 2>&1
if errorlevel 1 (
  echo Installing dev tools...
  npm install concurrently --save-dev
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
    echo Created .env — edit it to add your database URL and API keys
  )
)

echo.
echo Open http://localhost:5173 in your browser (hot reload enabled)
echo Press Ctrl+C to stop
echo.
npx concurrently --names "SERVER,CLIENT" --prefix-colors "cyan,magenta" "node server/index.js" "npm run dev --prefix client"
