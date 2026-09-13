/**
 * Room Models
 * Modèles pour la gestion des salles
 */

export type TypeSalle = 'AMPHI' | 'TD' | 'LABORATOIRE' | 'COURS';

export interface Room {
  idSalle?: string; // ID du backend
  id?: string; // Alias pour compatibilité (requis pour certaines opérations)
  nomsalle?: string; // Nom du backend
  name?: string; // Alias pour compatibilité (requis pour certaines opérations)
  description?: string;
  capacite?: number; // Capacité du backend
  capacity?: number; // Alias pour compatibilité (requis pour certaines opérations)
  typeSalle?: TypeSalle; // Type de salle du backend
  ecole?: string;
  amenities?: string[];
  isAvailable?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateRoomRequest {
  name: string;
  description?: string;
  capacity: number;
  ecole?: string;
  amenities?: string[];
  typeSalle?: TypeSalle; // Type de salle requis par le backend
}

export interface UpdateRoomRequest {
  name?: string;
  description?: string;
  capacity?: number;
  ecole?: string;
  amenities?: string[];
  isAvailable?: boolean;
  typeSalle?: TypeSalle; // Type de salle pour le backend
}

export interface RoomFilter {
  capacity?: number;
  ecole?: string;
  amenities?: string[];
  isAvailable?: boolean;
}

export interface RoomAvailabilitySlot {
  roomId: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}
