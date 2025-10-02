@echo off
echo Starting Amazon Seller Portal (Web Browser Mode)...
echo.
start /min cmd /c "npm run dev"
timeout /t 5 /nobreak > nul
start http://localhost:5173
echo.
echo Amazon Seller Portal is now running in your browser!
echo Close this window to stop the application.
echo.
pause
