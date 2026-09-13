#!/bin/bash
# ============================================
# Démarrage de Eureka Server uniquement
# ============================================

set -e

echo "============================================"
echo " Démarrage de Eureka Server"
echo "============================================"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Détecter la commande Maven
MAVEN_CMD=""
if [ -f "mvnw" ]; then
    MAVEN_CMD="./mvnw"
elif [ -f "Documentation/mvnw" ]; then
    MAVEN_CMD="./Documentation/mvnw"
else
    if command -v mvn &> /dev/null; then
        MAVEN_CMD="mvn"
    else
        echo "[ERROR] Maven introuvable !"
        echo "[INFO] Installez Maven avec: sudo apt-get install maven"
        exit 1
    fi
fi

echo "[INFO] Compilation et démarrage de Eureka Server..."
echo "[INFO] Cette opération peut prendre 1-2 minutes la première fois..."
echo ""

# Compiler d'abord pour voir les erreurs
echo "[INFO] Compilation en cours..."
$MAVEN_CMD clean compile -pl timora-eureka-server -DskipTests
if [ $? -ne 0 ]; then
    echo "[ERROR] Erreur lors de la compilation !"
    echo "[INFO] Vérifiez les erreurs ci-dessus"
    exit 1
fi

echo ""
echo "[INFO] Construction du JAR..."
$MAVEN_CMD package -pl timora-eureka-server -DskipTests
if [ $? -ne 0 ]; then
    echo "[ERROR] Erreur lors de la construction du JAR !"
    exit 1
fi

echo ""
echo "[INFO] Démarrage de Eureka Server sur le port 8761..."
echo "[INFO] Attendez 30-60 secondes que le service démarre complètement"
echo "[INFO] Puis ouvrez: http://localhost:8761"
echo "[INFO] Appuyez sur Ctrl+C pour arrêter le service"
echo ""

# Démarrer avec le JAR compilé
cd timora-eureka-server
java -jar target/timora-eureka-server-0.0.1-SNAPSHOT.jar
cd ..
