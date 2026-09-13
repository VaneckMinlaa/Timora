/**
 * User Models
 * Modèles pour la gestion des utilisateurs
 */

export type UserRole = 'ADMIN' | 'TEACHER';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string | null;
  role: UserRole;
  isActive: boolean;
  department?: string | null;
  schools?: string[];
  profilePicture?: string | null;
  lastLogin?: string | null;
  createdAt: string;
  updatedAt: string;
  status: 'Actif' | 'Inactif';
}

export interface UserProfile extends User {
  // UserProfile est identique à User maintenant car UserResponse inclut tous les champs
}

export type School = 'SJI' | 'SJM' | 'PrepaVogt' | 'CPGE';

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  password?: string; // Optionnel - généré automatiquement et envoyé par email
  phone?: string;
  role?: UserRole;
  department?: string;
  profilePicture?: string;
  schools: School[];
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  department?: string;
  profilePicture?: string;
  schools?: School[];
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface UserFilter {
  role?: UserRole;
  isActive?: boolean;
  search?: string;
}

export interface UserStatistics {
  totalUsers: number;
  activeUsers: number;
  admins: number;
  managers: number;
  regularUsers: number;
}
