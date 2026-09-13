#!/bin/bash
# ============================================
# Démarrage de TOUS les microservices avec logs
# ============================================
# Ce script démarre tous les microservices Spring Boot
# et redirige les logs de chaque service vers le dossier Logs

set -e

echo " Démarrage de tous les microservices"
echo ""

# Aller à la racine du projet
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Charger les variables d'environnement depuis Config/.env
if [ -f "Config/.env" ]; then
    echo "[INFO] Chargement des variables d'environnement depuis Config/.env..."
    set -a
    source Config/.env
    set +a
    echo "[OK] Variables d'environnement chargées"
    echo ""
else
    if [ -f "env.example" ]; then
        echo "[INFO] Création de Config/.env à partir de env.example..."
        mkdir -p Config
        cp env.example Config/.env
        echo "[WARN] Éditez Config/.env pour adapter POSTGRES_PASSWORD à votre PostgreSQL."
        echo ""
        set -a
        source Config/.env
        set +a
    else
        echo "[WARN] Fichier Config/.env introuvable. Utilisation des variables système."
        echo ""
    fi
fi

# Exporter les identifiants PostgreSQL pour Spring Boot (chaque service garde sa propre URL de DB)
export SPRING_DATASOURCE_USERNAME="${POSTGRES_USER:-postgres}"
export SPRING_DATASOURCE_PASSWORD="${POSTGRES_PASSWORD:-root}"

# Créer le dossier Logs s'il n'existe pas
mkdir -p Logs

# Créer les sous-dossiers pour chaque service (utiliser les noms des modules Maven)
mkdir -p Logs/timora-eureka-server
mkdir -p Logs/timora-config-server
mkdir -p Logs/timora-gateway
mkdir -p Logs/timora-auth-service
mkdir -p Logs/timora-user-service
mkdir -p Logs/timora-notification-service
mkdir -p Logs/timora-room-service
mkdir -p Logs/timora-reservation-service
mkdir -p Logs/timora-schedule-service
mkdir -p Logs/timora-reporting-service
mkdir -p Logs/timora-integration-service

# Rappel PostgreSQL (les services qui utilisent une DB en ont besoin)
if ! command -v pg_isready &> /dev/null; then
    echo "[INFO] PostgreSQL non détecté. Les services avec base de données peuvent échouer."
    echo "[INFO] Pour configurer PostgreSQL : ./scripts/setup-postgres.sh"
    echo ""
else
    if ! pg_isready -h localhost -p "${POSTGRES_PORT:-5432}" -q 2>/dev/null; then
        echo "[WARN] PostgreSQL ne répond pas. Les services avec base de données peuvent échouer."
        echo "[INFO] Exécutez : ./scripts/setup-postgres.sh"
        echo ""
    fi
fi

echo "[INFO] Démarrage des services dans l'ordre..."
echo "[INFO] Les logs seront sauvegardés dans le dossier Logs/"
echo ""

# Vérifier si mvnw existe, sinon utiliser mvn
if [ -f "mvnw" ]; then
    MVN_CMD="./mvnw"
elif [ -f "mvnw.cmd" ]; then
    MVN_CMD="./mvnw.cmd"
else
    MVN_CMD="mvn"
    echo "[INFO] Utilisation de Maven système (mvn)"
fi

# Vérifier que Maven est disponible
if ! command -v mvn &> /dev/null && [ ! -f "mvnw" ]; then
    echo "[ERROR] Maven n'est pas installé et mvnw n'existe pas !"
    echo "[INFO] Installez Maven avec: sudo apt-get install maven"
    exit 1
fi

# Fonction pour démarrer un service en arrière-plan
start_service() {
    local service_name=$1
    local service_module=$2
    local port=$3
    local wait_time=$4
    
    # Créer le dossier de logs s'il n'existe pas
    mkdir -p "Logs/$service_module"
    
    echo "[$service_name] Démarrage de $service_name (port $port)..."
    nohup $MVN_CMD spring-boot:run -pl $service_module > "Logs/$service_module/$service_module.log" 2>&1 &
    local pid=$!
    echo $pid > "Logs/$service_module/$service_module.pid"
    echo "[INFO] PID: $pid"
    sleep $wait_time
    echo "[OK] $service_name démarré"
}

# 1. Eureka Server (doit démarrer en premier)
echo "[1/11] Démarrage de Eureka Server (port 8761)..."
start_service "Eureka Server" "timora-eureka-server" "8761" 15

# 2. Config Server (optionnel, peut être ignoré si non utilisé)
echo "[2/11] Démarrage de Config Server (port 8888)..."
start_service "Config Server" "timora-config-server" "8888" 5

# 3. Gateway (dépend de Eureka)
echo "[3/11] Démarrage de API Gateway (port 8080)..."
start_service "API Gateway" "timora-gateway" "8080" 10

# 4. Auth Service (dépend de Eureka et User Service)
echo "[4/11] Démarrage de Auth Service (port 8081)..."
start_service "Auth Service" "timora-auth-service" "8081" 5

# 5. User Service (dépend de Eureka)
echo "[5/11] Démarrage de User Service (port 8082)..."
start_service "User Service" "timora-user-service" "8082" 5

# 6. Notification Service (dépend de Eureka)
echo "[6/11] Démarrage de Notification Service (port 8086)..."
start_service "Notification Service" "timora-notification-service" "8086" 5

# 7. Room Service (dépend de Eureka)
echo "[7/11] Démarrage de Room Service (port 8083)..."
start_service "Room Service" "timora-room-service" "8083" 5

# 8. Reservation Service (dépend de Eureka et Room Service)
echo "[8/11] Démarrage de Reservation Service (port 8084)..."
start_service "Reservation Service" "timora-reservation-service" "8084" 5

# 9. Schedule Service (dépend de Eureka)
echo "[9/11] Démarrage de Schedule Service (port 8085)..."
start_service "Schedule Service" "timora-schedule-service" "8085" 5

# 10. Reporting Service (dépend de Eureka)
echo "[10/11] Démarrage de Reporting Service (port 8087)..."
start_service "Reporting Service" "timora-reporting-service" "8087" 5

# 11. Integration Service (dépend de Eureka)
echo "[11/11] Démarrage de Integration Service..."
start_service "Integration Service" "timora-integration-service" "" 5

echo ""
echo "[SUCCESS] Tous les services sont en cours de démarrage"
echo ""
echo "[INFO] Services disponibles :"
echo "  - Eureka Dashboard:    http://localhost:8761"
echo "  - API Gateway:         http://localhost:8080"
echo "  - Auth Service:        http://localhost:8081"
echo "  - User Service:        http://localhost:8082"
echo "  - Room Service:        http://localhost:8083"
echo "  - Reservation Service: http://localhost:8084"
echo "  - Schedule Service:    http://localhost:8085"
echo "  - Notification Service: http://localhost:8086"
echo "  - Reporting Service:   http://localhost:8087"
echo ""
echo "[INFO] Logs disponibles dans :"
echo "  - Logs/timora-eureka-server/timora-eureka-server.log"
echo "  - Logs/timora-config-server/timora-config-server.log"
echo "  - Logs/timora-gateway/timora-gateway.log"
echo "  - Logs/timora-auth-service/timora-auth-service.log"
echo "  - Logs/timora-user-service/timora-user-service.log"
echo "  - Logs/timora-notification-service/timora-notification-service.log"
echo "  - Logs/timora-room-service/timora-room-service.log"
echo "  - Logs/timora-reservation-service/timora-reservation-service.log"
echo "  - Logs/timora-schedule-service/timora-schedule-service.log"
echo "  - Logs/timora-reporting-service/timora-reporting-service.log"
echo "  - Logs/timora-integration-service/timora-integration-service.log"
echo ""
echo "[INFO] Pour arrêter tous les services, exécutez: ./scripts/stop-all-services.sh"
echo "[INFO] Pour voir les processus en cours: ps aux | grep java"
echo ""
