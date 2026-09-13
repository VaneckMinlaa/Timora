/**
 * Reservation Models
 * Modèles pour la gestion des réservations
 */

export type ReservationStatus = 'EN_ATTENTE' | 'CONFIRME' | 'ANNULEE' | 'CONFLIT';

export interface Reservation {
  // Champs du backend
  idDemandeReservation?: string;
  id?: string; // Alias pour compatibilité (requis pour certaines opérations)
  salleId?: string; // ID de la salle du backend
  roomId?: string; // Alias pour compatibilité (requis pour certaines opérations)
  utilisateurId?: string; // ID utilisateur du backend
  userId?: string; // Alias pour compatibilité (requis pour certaines opérations)
  date?: string; // Date de la réservation (format YYYY-MM-DD)
  heureDebut?: string; // Heure de début (format HH:mm)
  heureFin?: string; // Heure de fin (format HH:mm)
  startDateTime?: string; // Alias pour compatibilité (construit à partir de date + heureDebut)
  endDateTime?: string; // Alias pour compatibilité (construit à partir de date + heureFin)
  statut?: ReservationStatus; // Statut du backend
  status?: ReservationStatus; // Alias pour compatibilité (requis pour certaines opérations)
  coursId?: string;
  evenementId?: string;
  purpose?: string; // Requis pour certaines opérations
  numberOfParticipants?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  
  // Champs additionnels/Informationnels
  salleNom?: string;
  utilisateurNom?: string;
  coursNom?: string;
  evenementNom?: string;
  
  equipementId?: string; // ID de l'équipement
  equipementNom?: string; // Nom de l'équipement
}

export interface CreateReservationRequest {
  roomId?: string; // Optionnel - si non fourni, assignation automatique
  startDateTime: string;
  endDateTime: string;
  purpose: string;
  numberOfParticipants: number;
  typeCours?: string; // Type de cours (COURS_MAGISTRAL, TD, TP, EXAMEN) - requis pour assignation automatique
  notes?: string;
  equipementId?: string; // Optionnel - si une réservation d'équipement est incluse
}

export interface UpdateReservationRequest {
  startDateTime?: string;
  endDateTime?: string;
  purpose?: string;
  numberOfParticipants?: number;
  notes?: string;
  status?: ReservationStatus;
  equipementId?: string;
}

export interface ReservationFilter {
  status?: ReservationStatus;
  roomId?: string;
  equipementId?: string;
  userId?: string;
  startDate?: string;
  endDate?: string;
}

export interface ReservationWithRoom extends Reservation {
  room?: {
    name: string;
    ecole: string;
    capacity: number;
  };
}

export interface ReservationWithUser extends Reservation {
  user?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

/**
 * Disponibilite Model
 * Modèle pour la gestion des disponibilités des enseignants
 * Selon le diagramme UML : Utilisateur 1 -- +ensdispense -- 1..* Disponibilite
 */
export interface Disponibilite {
  idDisponibilite: string;
  jour: string; // Jour de la semaine (Lundi, Mardi, etc.) - pour compatibilité
  date: string; // Date précise de la disponibilité (format YYYY-MM-DD)
  heureDebut: string; // Format HH:mm
  heureFin: string; // Format HH:mm
  utilisateurId?: string; // Référence à l'utilisateur (enseignant)
  emploiDuTempsId?: string; // Référence optionnelle à EmploiDuTemps
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateDisponibiliteRequest {
  jour: string; // Jour de la semaine (Lundi, Mardi, etc.) - pour compatibilité
  date: string; // Date précise de la disponibilité (format YYYY-MM-DD)
  heureDebut: string;
  heureFin: string;
  utilisateurId?: string;
  emploiDuTempsId?: string;
}

export interface UpdateDisponibiliteRequest {
  jour?: string;
  heureDebut?: string;
  heureFin?: string;
}

/**
 * Room Suggestion Model
 * Modèle pour les suggestions de salles automatiques
 */
export interface RoomSuggestion {
  roomId: string;
  roomName: string;
  roomType: string;
  capacity: number;
  suitable: boolean;
}

/**
 * Room Availability Model
 * Modèle pour la disponibilité en temps réel d'une salle
 */
export interface RoomAvailability {
  roomId: string;
  roomName: string;
  available: boolean;
  date: string;
  startTime: string;
  endTime: string;
  conflicts?: ReservationConflict[];
  lastUpdated?: number;
}

/**
 * Reservation Conflict Model
 * Modèle pour représenter un conflit de réservation
 */
export interface ReservationConflict {
  reservationId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: string;
  purpose?: string;
}
