/**
 * Conflict Service
 * Service pour la gestion des conflits d'horaires
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Conflict,
  ConflictDetails,
  ConflictFilters,
  ResolveConflictRequest,
  ConflictStats
} from '../models/conflict.model';

@Injectable({
  providedIn: 'root'
})
export class ConflictService {
  // Utiliser le proxy Angular qui redirige vers le service schedule
  private apiUrl = '/api/conflicts';

  constructor(private http: HttpClient) {}

  /**
   * Get all conflicts with optional filters
   */
  getAllConflicts(filters?: ConflictFilters): Observable<Conflict[]> {
    let params = new HttpParams();
    
    if (filters) {
      if (filters.type) params = params.set('type', filters.type);
      if (filters.status) params = params.set('status', filters.status);
    }
    
    return this.http.get<Conflict[]>(this.apiUrl, { params });
  }

  /**
   * Get conflict details by ID
   */
  getConflictById(id: string): Observable<ConflictDetails> {
    return this.http.get<ConflictDetails>(`${this.apiUrl}/${id}`);
  }

  /**
   * Resolve a conflict
   */
  resolveConflict(conflictId: string, request: ResolveConflictRequest): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${conflictId}/resolve`, request);
  }

  /**
   * Ignore a conflict
   */
  ignoreConflict(id: string, reason?: string): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${id}/ignore`, { reason });
  }

  /**
   * Detect conflicts
   */
  detectConflicts(): Observable<Conflict[]> {
    return this.http.post<Conflict[]>(`${this.apiUrl}/detect`, {});
  }

  /**
   * Auto-resolve all conflicts
   */
  autoResolveAll(): Observable<{ resolved: number; failed: number }> {
    return this.http.post<{ resolved: number; failed: number }>(`${this.apiUrl}/auto-resolve-all`, {});
  }

  /**
   * Get conflict statistics
   */
  getConflictStats(): Observable<ConflictStats> {
    return this.http.get<ConflictStats>(`${this.apiUrl}/stats`);
  }
}
