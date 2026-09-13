-- Script SQL pour créer toutes les bases de données Timora
-- Exécuter avec: psql -U postgres -f scripts/create-databases.sql

-- Créer la base de données pour Auth Service
CREATE DATABASE timora_auth;

-- Créer la base de données pour User Service
CREATE DATABASE timora_user;

-- Créer la base de données pour Room Service
CREATE DATABASE timora_room;

-- Créer la base de données pour Reservation Service
CREATE DATABASE timora_reservation;

-- Créer la base de données pour Schedule Service
CREATE DATABASE timora_schedule;

-- Créer la base de données pour Notification Service
CREATE DATABASE timora_notification;

-- Créer la base de données pour Reporting Service
CREATE DATABASE timora_reporting;

-- Afficher toutes les bases créées
SELECT datname FROM pg_database WHERE datname LIKE 'timora_%';

