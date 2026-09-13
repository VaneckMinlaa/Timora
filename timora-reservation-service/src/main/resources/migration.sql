-- Migration script pour ajouter la colonne 'date' à la table 'disponibilites'
-- Ce script doit être exécuté manuellement sur la base de données PostgreSQL
-- Base de données: timora_reservation
-- Table: disponibilites

-- Étape 1: Ajouter la colonne 'date' comme nullable
ALTER TABLE disponibilites 
ADD COLUMN IF NOT EXISTS date DATE;

-- Étape 2: Mettre à jour les données existantes avec une date par défaut
-- On calcule la date du lundi de la semaine courante, puis on ajoute le nombre de jours selon le jour de la semaine
-- Note: PostgreSQL DOW: 0=Dimanche, 1=Lundi, ..., 6=Samedi
UPDATE disponibilites 
SET date = CASE 
    WHEN jour = 'Lundi' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 1)
    WHEN jour = 'Mardi' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 2)
    WHEN jour = 'Mercredi' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 3)
    WHEN jour = 'Jeudi' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 4)
    WHEN jour = 'Vendredi' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 5)
    WHEN jour = 'Samedi' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 6)
    WHEN jour = 'Dimanche' THEN CURRENT_DATE - (EXTRACT(DOW FROM CURRENT_DATE)::INTEGER - 0)
    ELSE CURRENT_DATE
END
WHERE date IS NULL;

-- Si created_at existe et est plus récent, on peut l'utiliser comme date de référence
-- Sinon, on garde la date calculée ci-dessus
UPDATE disponibilites 
SET date = DATE(created_at)
WHERE date IS NULL AND created_at IS NOT NULL;

-- Pour les cas où created_at est NULL, utiliser la date actuelle
UPDATE disponibilites 
SET date = CURRENT_DATE
WHERE date IS NULL;

-- Étape 3: Rendre la colonne NOT NULL maintenant que toutes les données ont une valeur
ALTER TABLE disponibilites 
ALTER COLUMN date SET NOT NULL;

