-- Script de création de la base de données pour AuthService
-- Exécutez ce script en tant qu'utilisateur postgres ou superutilisateur

-- Créer la base de données si elle n'existe pas
CREATE DATABASE timora_auth
    WITH 
    OWNER = postgres
    ENCODING = 'UTF8'
    LC_COLLATE = 'French_France.1252'
    LC_CTYPE = 'French_France.1252'
    TABLESPACE = pg_default
    CONNECTION LIMIT = -1;

-- Commentaire sur la base de données
COMMENT ON DATABASE timora_auth IS 'Base de données pour le service d''authentification Timora';

