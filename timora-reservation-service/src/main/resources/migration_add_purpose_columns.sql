-- Migration script pour ajouter les colonnes 'purpose', 'numberOfParticipants', et 'notes' à la table 'demandes_reservation'
-- Ce script doit être exécuté manuellement sur la base de données PostgreSQL
-- Base de données: timora_reservation
-- Table: demandes_reservation

-- Étape 1: Ajouter la colonne 'purpose' comme nullable
ALTER TABLE demandes_reservation 
ADD COLUMN IF NOT EXISTS purpose VARCHAR(500);

-- Étape 2: Ajouter la colonne 'number_of_participants' comme nullable
ALTER TABLE demandes_reservation 
ADD COLUMN IF NOT EXISTS number_of_participants INTEGER;

-- Étape 3: Ajouter la colonne 'notes' comme nullable
ALTER TABLE demandes_reservation 
ADD COLUMN IF NOT EXISTS notes VARCHAR(1000);

-- Note: Ces colonnes sont nullable car elles sont optionnelles pour les réservations existantes
-- Les nouvelles réservations pourront inclure ces informations
