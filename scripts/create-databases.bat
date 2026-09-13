@echo off
REM Script pour créer automatiquement toutes les bases de données Timora
REM Usage: create-databases.bat

echo ========================================
echo   Creation des bases de donnees Timora
echo ========================================
echo.

REM Vérifier si PostgreSQL est accessible
psql --version >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo ERREUR: PostgreSQL n'est pas installe ou n'est pas dans le PATH
    echo.
    echo Verifiez que PostgreSQL est installe et que psql est accessible
    echo.
    pause
    exit /b 1
)

echo [INFO] PostgreSQL detecte
echo.

REM Demander les informations de connexion
set /p PG_USER="Nom d'utilisateur PostgreSQL (par defaut: postgres): "
if "%PG_USER%"=="" set PG_USER=postgres

set /p PG_PASSWORD="Mot de passe PostgreSQL: "

echo.
echo [INFO] Creation des bases de donnees...
echo.

REM Créer les bases de données une par une
echo [1/7] Creation de timora_auth...
psql -U %PG_USER% -c "CREATE DATABASE timora_auth;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_auth cree
) else (
    echo [WARN] timora_auth existe deja ou erreur
)

echo [2/7] Creation de timora_user...
psql -U %PG_USER% -c "CREATE DATABASE timora_user;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_user cree
) else (
    echo [WARN] timora_user existe deja ou erreur
)

echo [3/7] Creation de timora_room...
psql -U %PG_USER% -c "CREATE DATABASE timora_room;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_room cree
) else (
    echo [WARN] timora_room existe deja ou erreur
)

echo [4/7] Creation de timora_reservation...
psql -U %PG_USER% -c "CREATE DATABASE timora_reservation;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_reservation cree
) else (
    echo [WARN] timora_reservation existe deja ou erreur
)

echo [5/7] Creation de timora_schedule...
psql -U %PG_USER% -c "CREATE DATABASE timora_schedule;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_schedule cree
) else (
    echo [WARN] timora_schedule existe deja ou erreur
)

echo [6/7] Creation de timora_notification...
psql -U %PG_USER% -c "CREATE DATABASE timora_notification;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_notification cree
) else (
    echo [WARN] timora_notification existe deja ou erreur
)

echo [7/7] Creation de timora_reporting...
psql -U %PG_USER% -c "CREATE DATABASE timora_reporting;" 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [OK] timora_reporting cree
) else (
    echo [WARN] timora_reporting existe deja ou erreur
)

echo.
echo ========================================
echo   Verification des bases de donnees
echo ========================================
echo.

psql -U %PG_USER% -c "SELECT datname FROM pg_database WHERE datname LIKE 'timora_%' ORDER BY datname;"

echo.
echo ========================================
echo   [OK] Script termine
echo ========================================
echo.
echo Les bases de donnees seront creees automatiquement par Hibernate
echo au demarrage des services (avec ddl-auto: update)
echo.
pause

