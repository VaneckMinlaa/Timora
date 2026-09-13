/**
 * Conflict Models
 * Modèles pour la gestion des conflits d'horaires
 */

export type ConflictType = 
  | 'ROOM_OVERLAP' 
  | 'TEACHER_OVERLAP' 
  | 'STUDENT_GROUP_OVERLAP'
  | 'ROOM_CAPACITY'
  | 'EQUIPMENT_MISSING'
  | 'TEACHER_UNAVAILABLE'
  | 'TIME_OVERFLOW';

export type ConflictStatus = 'PENDING' | 'RESOLVED' | 'IGNORED';
export type ConflictSeverity = 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';

export interface Conflict {
  id: string;
  type: ConflictType;
  severity: ConflictSeverity;
  title: string;
  description: string;
  date?: string; // Format ISO date
  dayOfWeek?: string; // Lundi, Mardi, etc.
  startTime?: string; // HH:mm
  endTime?: string; // HH:mm
  status: ConflictStatus;
  
  // Détails spécifiques selon le type
  roomId?: string;
  roomName?: string;
  teacherId?: string;
  teacherName?: string;
  classeId?: string;
  className?: string;
  affectedCoursIds?: string[];
  
  // Métadonnées
  detectedAt: string;
  updatedAt?: string;
  resolvedAt?: string;
  resolvedBy?: string;
}

export interface ConflictDetails {
  conflict: Conflict;
  affectedCourses: AffectedCourse[];
  suggestedSolutions: Solution[];
}

export interface AffectedCourse {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  roomId?: string;
  roomName?: string;
  startTime: string;
  endTime: string;
  classNames?: string[];
  type: 'COURS_MAGISTRAL' | 'TD' | 'TP' | 'EXAMEN';
}

export interface Solution {
  id: string;
  type: 'CHANGE_ROOM' | 'CHANGE_TIME' | 'SWAP_COURSES' | 'SPLIT_GROUP' | 'CHANGE_TEACHER' | 'CANCEL_COURSE';
  description: string;
  explanation: string;
  priority: number; // 0-100
  
  // Détails de la solution
  changes?: { [key: string]: string };
  
  // Métadonnées
  feasibility: 'HIGH' | 'MEDIUM' | 'LOW';
  impact: string;
}

export interface ResolveConflictRequest {
  resolutionId: string;
  notes?: string;
  resolvedBy?: string;
}

export interface ConflictFilters {
  type?: ConflictType;
  status?: ConflictStatus;
  dateFrom?: string;
  dateTo?: string;
  teacherId?: string;
  roomId?: string;
}

export interface ConflictStats {
  totalConflicts: number;
  pendingConflicts: number;
  resolvedConflicts: number;
  ignoredConflicts: number;
  resolvedThisWeek: number;
  detectedThisWeek: number;
  conflictsByType: { [key: string]: number };
  conflictsBySeverity: { [key: string]: number };
}
