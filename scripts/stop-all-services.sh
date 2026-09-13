#!/bin/bash
# ============================================
# Arrêt de tous les services Spring Boot
# ============================================

echo "============================================"
echo " Arrêt de tous les services Spring Boot"
echo "============================================"
echo ""

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

# Arrêter les processus via les fichiers PID si disponibles
if [ -d "Logs" ]; then
    echo "[INFO] Arrêt des services via les fichiers PID..."
    for pid_file in Logs/*/*.pid; do
        if [ -f "$pid_file" ]; then
            pid=$(cat "$pid_file")
            if ps -p "$pid" > /dev/null 2>&1; then
                echo "[INFO] Arrêt du processus $pid..."
                kill "$pid" 2>/dev/null || true
            fi
            rm -f "$pid_file"
        fi
    done
    echo ""
fi

# Arrêter tous les processus Java liés aux microservices
echo "[INFO] Arrêt de tous les processus Java Spring Boot..."
pkill -f "spring-boot:run" 2>/dev/null || true

# Attendre un peu pour que les processus se terminent
sleep 2

# Forcer l'arrêt si nécessaire
if pgrep -f "spring-boot:run" > /dev/null; then
    echo "[INFO] Arrêt forcé des processus restants..."
    pkill -9 -f "spring-boot:run" 2>/dev/null || true
fi

# Vérifier s'il reste des processus Java
if pgrep -f "timora" > /dev/null; then
    echo "[INFO] Arrêt des processus Timora restants..."
    pkill -f "timora" 2>/dev/null || true
    sleep 1
    pkill -9 -f "timora" 2>/dev/null || true
fi

# Afficher le résultat
if pgrep -f "spring-boot:run" > /dev/null || pgrep -f "timora" > /dev/null; then
    echo "[WARN] Certains processus peuvent encore être en cours d'exécution."
    echo "[INFO] Vérifiez avec: ps aux | grep java"
else
    echo "[SUCCESS] Tous les services Spring Boot ont été arrêtés."
fi

echo ""
echo "[INFO] Pour vérifier les processus restants: ps aux | grep java"
echo ""
