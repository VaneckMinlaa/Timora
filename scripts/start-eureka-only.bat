@echo off
REM ============================================
REM Démarrage de Eureka Server uniquement
REM ============================================

echo ============================================
echo  Demarrage de Eureka Server
echo ============================================
echo.

set "ROOT=%~dp0.."
cd /d "%ROOT%"

REM Détecter la commande Maven
set "MAVEN_CMD="
if exist "mvnw.cmd" (
    set "MAVEN_CMD=mvnw.cmd"
) else if exist "Documentation\mvnw.cmd" (
    set "MAVEN_CMD=Documentation\mvnw.cmd"
) else (
    where mvn.cmd >nul 2>&1
    if errorlevel 1 (
        where mvn >nul 2>&1
        if errorlevel 1 (
            echo [ERROR] Maven introuvable !
            exit /b 1
        ) else (
            set "MAVEN_CMD=mvn"
        )
    ) else (
        set "MAVEN_CMD=mvn.cmd"
    )
)

echo [INFO] Compilation et demarrage de Eureka Server...
echo [INFO] Cette operation peut prendre 1-2 minutes la premiere fois...
echo.

REM Compiler d'abord pour voir les erreurs
echo [INFO] Compilation en cours...
%MAVEN_CMD% clean compile -pl timora-eureka-server -DskipTests
if errorlevel 1 (
    echo [ERROR] Erreur lors de la compilation !
    echo [INFO] Verifiez les erreurs ci-dessus
    pause
    exit /b 1
)

echo.
echo [INFO] Construction du JAR...
%MAVEN_CMD% package -pl timora-eureka-server -DskipTests
if errorlevel 1 (
    echo [ERROR] Erreur lors de la construction du JAR !
    pause
    exit /b 1
)

echo.
echo [INFO] Demarrage de Eureka Server sur le port 8761...
echo [INFO] Attendez 30-60 secondes que le service demarre completement
echo [INFO] Puis ouvrez: http://localhost:8761
echo [INFO] Appuyez sur Ctrl+C pour arreter le service
echo.

REM Démarrer avec le JAR compilé
cd timora-eureka-server
java -jar target\timora-eureka-server-0.0.1-SNAPSHOT.jar
cd ..

pause

