/**
 * Auth Models
 * Modèles pour l'authentification JWT
 */

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePhoto?: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RefreshTokenResponse {
  token: string;
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface RegisterResponse {
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  createdAt: string;
}

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  profilePhoto?: string;
  createdAt: string;
  updatedAt: string;
  isActive?: boolean;
}

export interface TokenPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  iat: number;
  exp: number;
}
