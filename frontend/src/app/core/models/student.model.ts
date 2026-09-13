/**
 * Student Models
 * Modèles pour la gestion des étudiants
 */

export interface Etudiant {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  filiereId?: string;
  niveau?: string;
  ecoleId?: string;
  classeId?: string;
  ueIds?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateEtudiantRequest {
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  filiereId?: string;
  niveau?: string;
  ecoleId?: string;
  classeId?: string;
  ueIds?: string[];
}

export interface StudentFilter {
  search?: string;
  filiereId?: string;
  classeId?: string;
  niveau?: string;
}
