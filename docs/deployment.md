# Guide de Déploiement Timora sur VPS

Ce guide explique comment déployer l'application Timora sur votre serveur VPS en utilisant Docker.

## Prérequis

1.  **Serveur VPS** (Debian/Ubuntu recommandé) avec au moins 4 Go de RAM (8 Go conseillés pour tous les microservices).
2.  **Docker et Docker Compose** installés sur le serveur.
3.  Un nom de domaine pointant vers l'adresse IP de votre serveur.

## Étape 1 : Préparation sur le VPS

Connectez-vous à votre VPS et clonez le dépôt :

```bash
git clone <url-du-depot>
cd Timora
```

## Étape 2 : Configuration

Créez le fichier `.env` à partir de l'exemple :

```bash
cp env.example .env
```

Éditez le fichier `.env` pour définir vos mots de passe et configurations (Mail, etc.) :

```bash
nano .env
```

> [!IMPORTANT]
> Assurez-vous que `POSTGRES_PASSWORD` est sécurisé. Le profil `SPRING_PROFILES_ACTIVE=docker` est déjà configuré dans le `docker-compose.yml`.

## Étape 3 : Lancement

Lancez la construction et le démarrage de tous les services :

```bash
docker-compose up -d --build
```

Cette opération peut prendre plusieurs minutes la première fois car elle build chaque microservice et le frontend.

## Étape 4 : Vérification

Vous pouvez vérifier l'état des conteneurs :

```bash
docker-compose ps
```

Accédez aux dashboards :
- **Frontend** : `http://votre-ip` ou `http://votre-domaine`
- **Eureka (Discovery)** : `http://votre-ip:8761`
- **Gateway (API)** : `http://votre-ip:8080`

## Étape 5 : SSL avec Let's Encrypt (Optionnel mais recommandé)

Si vous avez un domaine, installez Certbot pour sécuriser l'accès :

```bash
sudo apt-get update
sudo apt-get install certbot python3-certbot-nginx
```

Puis configurez Nginx sur le VPS (en dehors de Docker) pour agir comme reverse proxy vers le port 80 du conteneur `timora-frontend`.

---

## Maintenance

- **Voir les logs** : `docker-compose logs -f [service_name]`
- **Redémarrer un service** : `docker-compose restart [service_name]`
- **Mettre à jour** : 
  ```bash
  git pull
  docker-compose up -d --build
  ```

## Structure des Ports en Production
- `80` : Frontend & API Proxy (vers Gateway)
- `8080` : API Gateway
- `8761` : Eureka Dashboard
- `5432` : PostgreSQL (Interne uniquement recommandé)
- `15672` : RabbitMQ Management
