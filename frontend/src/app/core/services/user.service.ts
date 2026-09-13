/**
 * User Service
 * Service pour la gestion des utilisateurs
 * Port backend: 8082
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  User,
  UserProfile,
  CreateUserRequest,
  UpdateUserRequest,
  ChangePasswordRequest,
  UserFilter,
  UserStatistics
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  constructor(private http: HttpClient) {}

  /**
   * Get all users
   * GET /api/users
   */
  getAllUsers(filter?: UserFilter): Observable<User[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.role) params = params.set('role', filter.role);
      if (filter.isActive !== undefined) params = params.set('active', filter.isActive.toString());
      if (filter.search) params = params.set('search', filter.search);
    }

    return this.http.get<User[]>(this.apiUrl, { params });
  }

  /**
   * Get user by ID
   * GET /api/users/:id
   */
  getUserById(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create user
   * POST /api/users
   */
  createUser(data: CreateUserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, data);
  }

  /**
   * Update user
   * PUT /api/users/:id
   */
  updateUser(id: string, data: UpdateUserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete user
   * DELETE /api/users/:id
   */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Change user password
   * PATCH /api/users/:id/password
   */
  changePassword(id: string, data: ChangePasswordRequest): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/password`, data);
  }

  /**
   * Get user profile
   * GET /api/users/:id/profile
   */
  getUserProfile(id: string): Observable<UserProfile> {
    return this.http.get<UserProfile>(`${this.apiUrl}/${id}/profile`);
  }

  /**
   * Update user profile
   * PUT /api/users/:id/profile
   */
  updateUserProfile(id: string, data: UpdateUserRequest): Observable<UserProfile> {
    return this.http.put<UserProfile>(`${this.apiUrl}/${id}/profile`, data);
  }

  /**
   * Search users
   * GET /api/users/search
   */
  searchUsers(query: string): Observable<User[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<User[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Get users by role
   * GET /api/users/role/:role
   */
  getUsersByRole(role: string): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/role/${role}`);
  }

  /**
   * Get user statistics
   * GET /api/users/statistics
   */
  getUserStatistics(): Observable<UserStatistics> {
    return this.http.get<UserStatistics>(`${this.apiUrl}/statistics`);
  }

  /**
   * Activate user
   * PATCH /api/users/:id/activate
   */
  activateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/activate`, {});
  }

  /**
   * Deactivate user
   * PATCH /api/users/:id/deactivate
   */
  deactivateUser(id: string): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/deactivate`, {});
  }
}
