#!/bin/bash
# ============================================
# Vérification et configuration de PostgreSQL pour Timora
# ============================================

set -e

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT_DIR"

echo "============================================"
echo " Vérification PostgreSQL pour Timora"
echo "============================================"
echo ""

# Charger Config/.env si présent
if [ -f "Config/.env" ]; then
    set -a
    source Config/.env
    set +a
    PG_USER="${POSTGRES_USER:-postgres}"
    PG_PASSWORD="${POSTGRES_PASSWORD:-root}"
else
    PG_USER="postgres"
    PG_PASSWORD="root"
    echo "[INFO] Config/.env non trouvé, utilisation postgres/root"
    echo ""
fi

# Vérifier si PostgreSQL est installé
if ! command -v psql &> /dev/null; then
    echo "[ERROR] PostgreSQL (client psql) n'est pas installé."
    echo ""
    echo "Installation sur Ubuntu :"
    echo "  sudo apt-get update"
    echo "  sudo apt-get install postgresql postgresql-contrib"
    echo ""
    echo "Puis définir le mot de passe pour l'utilisateur postgres :"
    echo "  sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'root';\""
    echo ""
    exit 1
fi

# Vérifier si le service PostgreSQL tourne (socket Unix ou TCP)
if ! pg_isready -h localhost -p "${POSTGRES_PORT:-5432}" &> /dev/null && ! pg_isready &> /dev/null; then
    echo "[WARN] PostgreSQL ne répond pas."
    echo ""
    echo "Démarrer PostgreSQL :"
    echo "  sudo systemctl start postgresql"
    echo "  sudo systemctl enable postgresql   # au démarrage"
    echo ""
    read -p "Voulez-vous tenter de démarrer le service maintenant ? (o/N) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[oOyY]$ ]]; then
        sudo systemctl start postgresql || true
        sleep 2
    else
        exit 1
    fi
fi

# Fonction : créer les bases via la commande fournie (soit psql avec PGPASSWORD, soit sudo -u postgres psql)
run_psql_admin() {
    local cmd="$1"
    shift
    for db in timora_auth timora_user timora_room timora_reservation timora_schedule timora_notification timora_reporting; do
        if $cmd -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$db'" 2>/dev/null | grep -q 1; then
            echo "  [OK] $db existe déjà"
        else
            echo "  [INFO] Création de $db..."
            $cmd -d postgres -c "CREATE DATABASE $db;" 2>/dev/null || true
            echo "  [OK] $db créée"
        fi
    done
}

# 1) Tester d'abord la connexion TCP avec mot de passe (celle utilisée par les microservices)
export PGPASSWORD="$PG_PASSWORD"
if psql -h localhost -p "${POSTGRES_PORT:-5432}" -U "$PG_USER" -d postgres -c "SELECT 1" &> /dev/null; then
    unset PGPASSWORD
    echo "[OK] PostgreSQL est accessible (localhost, utilisateur: $PG_USER)."
    echo ""
    echo "[INFO] Vérification des bases de données..."
    export PGPASSWORD="$PG_PASSWORD"
    run_psql_admin "psql -h localhost -p ${POSTGRES_PORT:-5432} -U $PG_USER"
    unset PGPASSWORD
else
    unset PGPASSWORD
    # 2) Connexion TCP échouée : tenter en "peer" (sans mot de passe, utilisateur système postgres)
    if sudo -u postgres psql -d postgres -tAc "SELECT 1" &> /dev/null; then
        echo "[INFO] Connexion en mode peer (sudo) réussie. Configuration du mot de passe et des bases..."
        echo ""
        # Définir le mot de passe pour les connexions TCP
        sudo -u postgres psql -d postgres -c "ALTER USER postgres PASSWORD '$PG_PASSWORD';" 2>/dev/null || true
        echo "[INFO] Vérification des bases de données..."
        run_psql_admin "sudo -u postgres psql"
        echo ""
        # Revérifier la connexion TCP (nécessaire pour les microservices)
        export PGPASSWORD="$PG_PASSWORD"
        if psql -h localhost -p "${POSTGRES_PORT:-5432}" -U "$PG_USER" -d postgres -c "SELECT 1" &> /dev/null; then
            unset PGPASSWORD
            echo "[OK] PostgreSQL est maintenant accessible depuis localhost avec le mot de passe."
        else
            unset PGPASSWORD
            echo "[WARN] Le mot de passe a été défini et les bases créées, mais la connexion via localhost échoue encore."
            echo ""
            echo "Sur Ubuntu, autorisez l'authentification par mot de passe pour localhost :"
            echo "  1. Trouver pg_hba.conf :"
            echo "     sudo -u postgres psql -t -P pager=off -c 'SHOW hba_file;'"
            echo "  2. Ajouter ou modifier une ligne pour 127.0.0.1 :"
            echo "     host    all    all    127.0.0.1/32    scram-sha-256"
            echo "  3. Redémarrer PostgreSQL :"
            echo "     sudo systemctl restart postgresql"
            echo ""
            echo "Puis relancez : ./scripts/setup-postgres.sh"
            exit 1
        fi
    else
        echo "[ERROR] Connexion à PostgreSQL échouée (utilisateur: $PG_USER)"
        echo ""
        echo "Causes possibles :"
        echo "  1. Mot de passe incorrect. Définir le mot de passe :"
        echo "     sudo -u postgres psql -c \"ALTER USER postgres PASSWORD 'root';\""
        echo ""
        echo "  2. Ou créer Config/.env avec le bon mot de passe :"
        echo "     cp env.example Config/.env"
        echo "     # Éditer Config/.env et mettre POSTGRES_PASSWORD=votre_mot_de_passe"
        echo ""
        echo "  3. Vérifier pg_hba.conf pour autoriser l'authentification par mot de passe"
        echo "     (méthode 'md5' ou 'scram-sha-256' pour host 127.0.0.1)"
        exit 1
    fi
fi

echo ""
echo "============================================"
echo "[SUCCESS] PostgreSQL est prêt pour Timora"
echo "============================================"
echo ""
echo "Vous pouvez lancer les microservices :"
echo "  ./scripts/start-all-services.sh"
echo ""
