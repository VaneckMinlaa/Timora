@echo off
set "ROOT=%~dp0.."
cd /d "%ROOT%"
echo Redemarrage du service Schedule...
echo.

REM Arreter le service
echo Arret du service...
taskkill /F /FI "WINDOWTITLE eq timora-schedule-service*" 2>nul
timeout /t 2 /nobreak >nul

REM Demarrer le service
echo Demarrage du service...
start "timora-schedule-service" cmd /k "cd /d %ROOT%\timora-schedule-service && %ROOT%\mvnw.cmd spring-boot:run"

echo.
echo Service Schedule redémarre...
echo Attendez quelques secondes pour que le service soit pret.
pause
