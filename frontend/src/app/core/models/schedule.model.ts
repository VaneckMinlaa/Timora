/**
 * Schedule Models
 * Modèles pour la gestion des horaires
 */

export interface Schedule {
  id: string;
  roomId: string;
  dayOfWeek: number; // 0=Sunday, 1=Monday, ..., 6=Saturday
  openingTime: string; // HH:mm format
  closingTime: string; // HH:mm format
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduleRequest {
  roomId: string;
  dayOfWeek: number;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

export interface UpdateScheduleRequest {
  openingTime?: string;
  closingTime?: string;
  isActive?: boolean;
}

export interface RoomSchedule {
  roomId: string;
  schedules: Schedule[];
}

export interface AvailableSlot {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export interface DaySchedule {
  dayOfWeek: number;
  dayName: string;
  openingTime: string;
  closingTime: string;
  isActive: boolean;
}

/**
 * EmploiDuTemps Model
 * Modèle pour la gestion des emplois du temps des enseignants
 */
export type StatutEmp = 'PROVISOIRE' | 'VALIDE' | 'ARCHIVE';

export interface EmploiDuTemps {
  id: string;
  semaine: number;
  dateDebut: string; // Format ISO date
  dateFin: string; // Format ISO date
  statut: StatutEmp;
  enseignantId: string; // Référence à l'enseignant
  createdAt?: string;
  updatedAt?: string;
}

export interface EmploiDuTempsWithCours extends EmploiDuTemps {
  cours?: CoursEDT[]; // Liste des cours dans l'EDT
  disponibilites?: DisponibiliteEDT[]; // Liste des disponibilités
}

/**
 * Cours Model pour l'EDT
 */
export interface CoursEDT {
  idCours: string;
  type: TypeCours;
  nom?: string;
  enseignantId: string;
  salleId?: string;
  classeIds?: string[];
  ueIds?: string[];
  jourSemaine: string; 
  heureDebut: string; 
  heureFin: string; 
}

export type TypeCours = 'COURS_MAGISTRAL' | 'TD' | 'TP' | 'EXAMEN';
export type Semestre = 'SEMESTRE_1' | 'SEMESTRE_2';

/**
 * Disponibilite Model pour l'EDT
 */
export interface DisponibiliteEDT {
  idDisponibilite: string;
  jour: string;
  heureDebut: string;
  heureFin: string;
}
