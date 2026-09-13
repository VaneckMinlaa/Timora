/**
 * Student Service
 * Service pour la gestion des étudiants
 * Port backend: 8082
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Etudiant,
  CreateEtudiantRequest,
  StudentFilter
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class StudentService {
  private apiUrl = '/api/students';

  constructor(private http: HttpClient) {}

  /**
   * Get all students
   * GET /api/students
   */
  getAllStudents(filter?: StudentFilter): Observable<Etudiant[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.filiereId) params = params.set('filiereId', filter.filiereId);
      if (filter.classeId) params = params.set('classeId', filter.classeId);
      if (filter.niveau) params = params.set('niveau', filter.niveau);
      if (filter.search) params = params.set('search', filter.search);
    }

    return this.http.get<Etudiant[]>(this.apiUrl, { params });
  }

  /**
   * Get student by ID
   * GET /api/students/:id
   */
  getStudentById(id: string): Observable<Etudiant> {
    return this.http.get<Etudiant>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create student
   * POST /api/students
   */
  createStudent(data: CreateEtudiantRequest): Observable<Etudiant> {
    return this.http.post<Etudiant>(this.apiUrl, data);
  }

  /**
   * Update student
   * PUT /api/students/:id
   */
  updateStudent(id: string, data: CreateEtudiantRequest): Observable<Etudiant> {
    return this.http.put<Etudiant>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete student
   * DELETE /api/students/:id
   */
  deleteStudent(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Importer des étudiants depuis un fichier Excel
   * POST /api/students/import
   */
  importFromExcel(file: File, filieresMapJson?: string, classesMapJson?: string, ecolesMapJson?: string): Observable<{ message: string; count: number; data: Etudiant[] }> {
    const formData = new FormData();
    formData.append('file', file);
    if (filieresMapJson) formData.append('filieresMap', filieresMapJson);
    if (classesMapJson) formData.append('classesMap', classesMapJson);
    if (ecolesMapJson) formData.append('ecolesMap', ecolesMapJson);
    return this.http.post<{ message: string; count: number; data: Etudiant[] }>(`${this.apiUrl}/import`, formData);
  }
}
