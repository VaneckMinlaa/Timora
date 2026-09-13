# Scripts

Tous les scripts se lancent depuis la **racine du dépôt** (ils retrouvent le projet tout seuls).

## Services locaux

| Script | Description |
|---|---|
| `start-all-services.bat` / `.sh` | Démarre les 11 microservices (logs dans `Logs/`) |
| `stop-all-services.bat` / `.sh` | Arrête les services |
| `start-eureka-only.bat` / `.sh` | Démarre uniquement Eureka (`:8761`) |
| `status-services.sh` | Affiche l’état des ports / PID |
| `restart-schedule-service.bat` | Relance le schedule-service |

```bash
# Windows
scripts\start-all-services.bat

# Linux / macOS
./scripts/start-all-services.sh
./scripts/status-services.sh
./scripts/stop-all-services.sh
```

Les variables d’environnement sont lues depuis `Config/.env` (copier `env.example` si besoin).

## Base de données

| Script | Description |
|---|---|
| `setup-postgres.sh` | Vérifie PostgreSQL et prépare la connexion |
| `create-databases.sql` | SQL de création des bases |
| `create-databases.ps1` / `.bat` | Exécute le SQL |

## E-mail

| Script | Description |
|---|---|
| `configure-email.ps1` | Configure le SMTP |
| `test-email.ps1` | Envoie un e-mail de test |
