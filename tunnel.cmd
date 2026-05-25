@echo off
cd /d "%~dp0"
echo.
echo  Do NOT use: npx expo start --tunnel  (broken ngrok 2.x in Expo)
echo  Using: npm run start:tunnel  (ngrok v3)
echo.
call npm run start:tunnel
