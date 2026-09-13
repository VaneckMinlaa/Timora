/**
 * Course Models
 * Modèles pour la gestion des cours
 */

import { TypeCours } from './schedule.model';

export interface Course {
  idCours: string;
  nom: string;
  type: TypeCours;
  enseignantId: string;
  salleId?: string;
  emploiDuTempsId?: string;
  ueIds?: string[];
  classeIds?: string[];
  filiereId?: string;
  filiereNom?: string;
  niveau?: string;
  credits?: number;
  volumeTotal?: number;
  volumeRestant?: number;
  semestre?: string;
  jourSemaine?: string;
  heureDebut?: string;
  heureFin?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateCourseRequest {
  nom: string;
  type: TypeCours;
  enseignantId: string;
  salleId?: string;
  ueIds?: string[];
  classeIds?: string[];
  filiereId?: string;
  niveau?: string;
  credits?: number;
  ecoleId?: string;
  jourSemaine?: string;
  heureDebut?: string;
  heureFin?: string;
  dateDebut?: string;
  dateFin?: string;
  estRecurrent?: boolean;
  nombreOccurrences?: number;
  estSpecial?: boolean;
  description?: string;
  semestre?: string;
  volumeTotal?: number;
  volumeRestant?: number;
}

export interface UpdateCourseRequest {
  nom?: string;
  type?: TypeCours;
  enseignantId?: string;
  salleId?: string;
  ueIds?: string[];
  classeIds?: string[];
  credits?: number;
  volumeTotal?: number;
  volumeRestant?: number;
}

export interface CourseWithDetails extends Course {
  enseignantNom?: string;
  enseignantEmail?: string;
  salleNom?: string;
  filiereNom?: string;
  niveauNom?: string;
  ueCodes?: string[];
}

export interface Filiere {
  idFiliere: string;
  nom: string;
  description?: string;
  ecoleId: string;
}

export interface Classe {
  idClasse: string;
  nom: string;
  effectif: number;
  filiereId: string;
  ecoleId: string;
  niveau: string;
}

export interface UE {
  idUE: string;
  codeUE: string;
  nomUE: string;
  description?: string;
  nombreCredit?: number;
  semestre?: string;
  filiereId: string;
}

export interface Ecole {
  idEcole: string;
  nomEcole: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateEcoleRequest {
  nomEcole: string;
}
