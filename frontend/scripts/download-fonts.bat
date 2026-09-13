@echo off
echo ========================================
echo Telechargement des polices pour mode hors ligne
echo ========================================
echo.

cd /d "%~dp0\.."

if not exist "node_modules" (
    echo Installation des dependances npm...
    call npm install
    echo.
)

echo Execution du script Node.js...
node scripts/download-fonts.js

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ========================================
    echo Telechargement termine avec succes!
    echo ========================================
    echo.
    echo Les polices sont maintenant disponibles localement.
    echo L'application peut fonctionner sans connexion internet.
) else (
    echo.
    echo ========================================
    echo Erreur lors du telechargement
    echo ========================================
    echo.
    echo Veuillez telecharger manuellement les polices:
    echo 1. Inter: https://fonts.google.com/specimen/Inter
    echo 2. Material Symbols: https://fonts.google.com/icons
    echo.
    echo Consultez SETUP-OFFLINE.md pour plus de details.
)

pause

