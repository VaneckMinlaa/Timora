@echo off
REM ============================================
REM Arrêt de tous les services Spring Boot
REM ============================================

echo ============================================
echo  Arrêt de tous les services Spring Boot
echo ============================================
echo.

echo [INFO] Arrêt de tous les processus Java...
taskkill /F /IM java.exe 2>nul
if errorlevel 1 (
    echo [INFO] Aucun processus Java en cours d'execution.
) else (
    echo [SUCCESS] Tous les services Spring Boot ont ete arretes.
)

echo.
exit /b 0

