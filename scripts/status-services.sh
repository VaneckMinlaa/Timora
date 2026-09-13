#!/bin/bash
# ============================================
# Vérification du statut des services
# ============================================

echo "============================================"
echo " Statut des services Spring Boot"
echo "============================================"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Vérifier les processus Java liés aux microservices
echo "[INFO] Processus Spring Boot en cours d'exécution :"
echo ""

java_processes=$(pgrep -f "spring-boot:run" || true)
if [ -z "$java_processes" ]; then
    echo "  Aucun processus Spring Boot trouvé."
else
    ps aux | grep "[s]pring-boot:run" | while read line; do
        pid=$(echo "$line" | awk '{print $2}')
        cmd=$(echo "$line" | awk '{for(i=11;i<=NF;i++) printf "%s ", $i; print ""}')
        # Extraire le nom du service depuis la commande
        service=$(echo "$cmd" | grep -o "timora-[a-z-]*" | head -1)
        echo "  PID: $pid - Service: $service"
    done
fi

echo ""
echo "[INFO] Ports utilisés :"
echo ""

# Liste des ports et services
declare -A ports=(
    ["8761"]="Eureka Server"
    ["8888"]="Config Server"
    ["8080"]="API Gateway"
    ["8081"]="Auth Service"
    ["8082"]="User Service"
    ["8083"]="Room Service"
    ["8084"]="Reservation Service"
    ["8085"]="Schedule Service"
    ["8086"]="Notification Service"
    ["8087"]="Reporting Service"
)

for port in "${!ports[@]}"; do
    if lsof -i :$port > /dev/null 2>&1; then
        echo "  ✓ Port $port : ${ports[$port]} (ACTIF)"
    else
        echo "  ✗ Port $port : ${ports[$port]} (INACTIF)"
    fi
done

echo ""
echo "[INFO] Fichiers PID dans Logs/ :"
if [ -d "Logs" ]; then
    pid_count=$(find Logs -name "*.pid" 2>/dev/null | wc -l)
    if [ "$pid_count" -gt 0 ]; then
        find Logs -name "*.pid" | while read pid_file; do
            pid=$(cat "$pid_file" 2>/dev/null)
            service=$(basename "$(dirname "$pid_file")")
            if ps -p "$pid" > /dev/null 2>&1; then
                echo "  ✓ $service : PID $pid (ACTIF)"
            else
                echo "  ✗ $service : PID $pid (INACTIF - fichier PID obsolète)"
            fi
        done
    else
        echo "  Aucun fichier PID trouvé."
    fi
else
    echo "  Le dossier Logs/ n'existe pas."
fi

echo ""
