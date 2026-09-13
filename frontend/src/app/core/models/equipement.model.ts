/**
 * Equipement Models
 * Modèles pour la gestion des équipements
 */

export type EtatEquipement = 'DISPONIBLE' | 'DEFECTUEUX' | 'EN_COUR_D_UTILISATION' | 'EN_MAINTENANCE';

export interface Equipement {
  idEquip: string;
  nom: string;
  categorie: string; // Type/Catégorie de l'équipement
  statut: EtatEquipement;
  salleId?: string;
  salleNom?: string; // Nom de la salle (pour affichage)
  createdAt: string;
  updatedAt: string;
}

export interface CreateEquipementRequest {
  nom: string;
  categorie: string;
  statut: EtatEquipement;
  salleId?: string;
}

export interface UpdateEquipementRequest {
  nom?: string;
  categorie?: string;
  statut?: EtatEquipement;
  salleId?: string;
}

export interface EquipementFilter {
  statut?: EtatEquipement;
  salleId?: string;
  nom?: string;
  categorie?: string;
}
