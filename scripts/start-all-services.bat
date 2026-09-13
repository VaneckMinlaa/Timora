@echo off
setlocal enabledelayedexpansion
REM ============================================
REM Démarrage de TOUS les microservices avec logs
REM ============================================
REM Ce script démarre tous les microservices Spring Boot
REM et redirige les logs de chaque service vers le dossier Logs
REM

echo ============================================
echo  Demarrage de tous les microservices
echo ============================================
echo.

set "ROOT=%~dp0.."
cd /d "%ROOT%"

REM Charger les variables d'environnement depuis Config/.env
if exist "Config\.env" (
    echo [INFO] Chargement des variables d'environnement depuis Config\.env...
    for /f "usebackq tokens=1,* delims==" %%a in ("Config\.env") do (
        set "line=%%a"
        if not "!line!"=="" (
            if not "!line:~0,1!"=="#" (
                set "var_name=%%a"
                set "var_value=%%b"
                set "var_name=!var_name: =!"
                set "var_value=!var_value: =!"
                if not "!var_name!"=="" (
                    set "!var_name!=!var_value!"
                )
            )
        )
    )
    echo [OK] Variables d'environnement chargees
    echo.
) else (
    echo [WARN] Fichier Config\.env introuvable. Utilisation des variables systeme.
    echo.
)

REM Créer le dossier Logs s'il n'existe pas
if not exist "Logs" (
    echo [INFO] Creation du dossier Logs...
    mkdir Logs
)

REM Créer les sous-dossiers pour chaque service
if not exist "Logs\eureka-server" mkdir "Logs\eureka-server"
if not exist "Logs\config-server" mkdir "Logs\config-server"
if not exist "Logs\gateway" mkdir "Logs\gateway"
if not exist "Logs\auth-service" mkdir "Logs\auth-service"
if not exist "Logs\user-service" mkdir "Logs\user-service"
if not exist "Logs\notification-service" mkdir "Logs\notification-service"
if not exist "Logs\room-service" mkdir "Logs\room-service"
if not exist "Logs\reservation-service" mkdir "Logs\reservation-service"
if not exist "Logs\schedule-service" mkdir "Logs\schedule-service"
if not exist "Logs\reporting-service" mkdir "Logs\reporting-service"
if not exist "Logs\integration-service" mkdir "Logs\integration-service"

echo [INFO] Demarrage des services dans l'ordre...
echo [INFO] Les logs seront sauvegardes dans le dossier Logs\
echo.

REM Vérifier si mvnw existe, sinon utiliser mvn
if exist "mvnw.cmd" (
    set MVN_CMD=mvnw.cmd
) else if exist "mvnw" (
    set MVN_CMD=mvnw
) else (
    set MVN_CMD=mvn
    echo [INFO] Utilisation de Maven system (mvn)
)

REM 1. Eureka Server (doit démarrer en premier)
echo [1/11] Demarrage de Eureka Server (port 8761)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-eureka-server -Dserver.port=8761 > Logs\eureka-server\eureka-server.log 2>&1"
timeout /t 15 /nobreak >nul
echo [OK] Eureka Server demarre

REM 2. Config Server (optionnel, peut être ignoré si non utilisé)
echo [2/11] Demarrage de Config Server (port 8888)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-config-server > Logs\config-server\config-server.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Config Server demarre

REM 3. Gateway (dépend de Eureka)
echo [3/11] Demarrage de API Gateway (port 8080)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-gateway > Logs\gateway\gateway.log 2>&1"
timeout /t 10 /nobreak >nul
echo [OK] API Gateway demarre

REM 4. Auth Service (dépend de Eureka et User Service)
echo [4/11] Demarrage de Auth Service (port 8081)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-auth-service > Logs\auth-service\auth-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Auth Service demarre

REM 5. User Service (dépend de Eureka)
echo [5/11] Demarrage de User Service (port 8082)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-user-service > Logs\user-service\user-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] User Service demarre

REM 6. Notification Service (dépend de Eureka)
echo [6/11] Demarrage de Notification Service (port 8086)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-notification-service > Logs\notification-service\notification-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Notification Service demarre

REM 7. Room Service (dépend de Eureka)
echo [7/11] Demarrage de Room Service (port 8083)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-room-service > Logs\room-service\room-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Room Service demarre

REM 8. Reservation Service (dépend de Eureka et Room Service)
echo [8/11] Demarrage de Reservation Service (port 8084)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-reservation-service > Logs\reservation-service\reservation-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Reservation Service demarre

REM 9. Schedule Service (dépend de Eureka)
echo [9/11] Demarrage de Schedule Service (port 8085)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-schedule-service > Logs\schedule-service\schedule-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Schedule Service demarre

REM 10. Reporting Service (dépend de Eureka)
echo [10/11] Demarrage de Reporting Service (port 8087)...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-reporting-service > Logs\reporting-service\reporting-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Reporting Service demarre

REM 11. Integration Service (dépend de Eureka)
echo [11/11] Demarrage de Integration Service...
start /b cmd /c "cd /d %ROOT% && %MVN_CMD% spring-boot:run -pl timora-integration-service > Logs\integration-service\integration-service.log 2>&1"
timeout /t 5 /nobreak >nul
echo [OK] Integration Service demarre

echo.
echo ============================================
echo [SUCCESS] Tous les services sont en cours de demarrage
echo ============================================
echo.
echo [INFO] Services disponibles :
echo   - Eureka Dashboard:    http://localhost:8761
echo   - API Gateway:         http://localhost:8080
echo   - Auth Service:        http://localhost:8081
echo   - User Service:        http://localhost:8082
echo   - Room Service:        http://localhost:8083
echo   - Reservation Service: http://localhost:8084
echo   - Schedule Service:    http://localhost:8085
echo   - Notification Service: http://localhost:8086
echo   - Reporting Service:   http://localhost:8087
echo.
echo [INFO] Logs disponibles dans :
echo   - Logs\eureka-server\eureka-server.log
echo   - Logs\config-server\config-server.log
echo   - Logs\gateway\gateway.log
echo   - Logs\auth-service\auth-service.log
echo   - Logs\user-service\user-service.log
echo   - Logs\notification-service\notification-service.log
echo   - Logs\room-service\room-service.log
echo   - Logs\reservation-service\reservation-service.log
echo   - Logs\schedule-service\schedule-service.log
echo   - Logs\reporting-service\reporting-service.log
echo   - Logs\integration-service\integration-service.log
echo.
echo [INFO] Chaque service s'execute en arriere-plan
echo [INFO] Pour arreter tous les services, executez: scripts\stop-all-services.bat
echo.
pause

