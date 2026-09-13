/**
 * Course Service
 * Service pour la gestion des cours
 * Port backend: 8085
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Course,
  CreateCourseRequest,
  UpdateCourseRequest,
  CourseWithDetails,
  Filiere,
  Classe,
  UE,
  Ecole,
  CreateEcoleRequest
} from '../models/course.model';

@Injectable({
  providedIn: 'root'
})
export class CourseService {
  private apiUrl = '/api/schedules/cours';

  constructor(private http: HttpClient) {}

  /**
   * Get all courses
   * GET /api/schedules/cours
   */
  getAllCourses(): Observable<Course[]> {
    return this.http.get<Course[]>(this.apiUrl);
  }

  /**
   * Get course by ID
   * GET /api/schedules/cours/{id}
   */
  getCourseById(id: string): Observable<Course> {
    return this.http.get<Course>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create a new course
   * POST /api/schedules/cours
   */
  createCourse(request: CreateCourseRequest): Observable<Course> {
    return this.http.post<Course>(this.apiUrl, request);
  }

  /**
   * Update a course
   * PUT /api/schedules/cours/{id}
   */
  updateCourse(id: string, request: UpdateCourseRequest): Observable<Course> {
    return this.http.put<Course>(`${this.apiUrl}/${id}`, request);
  }

  /**
   * Delete a course
   * DELETE /api/schedules/cours/{id}
   */
  deleteCourse(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get courses by teacher
   * GET /api/schedules/cours/enseignant/{enseignantId}
   */
  getCoursesByTeacher(enseignantId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/enseignant/${enseignantId}`);
  }

  /**
   * Get courses by class
   * GET /api/schedules/cours/classe/{classeId}
   */
  getCoursesByClass(classeId: string): Observable<Course[]> {
    return this.http.get<Course[]>(`${this.apiUrl}/classe/${classeId}`);
  }

  /**
   * Get all filieres
   * GET /api/schedules/filieres
   */
  getAllFilieres(): Observable<Filiere[]> {
    return this.http.get<Filiere[]>('/api/schedules/filieres');
  }

  /**
   * Get classes by filiere
   * GET /api/schedules/filieres/{filiereId}/classes
   */
  getClassesByFiliere(filiereId: string): Observable<Classe[]> {
    return this.http.get<Classe[]>(`/api/schedules/filieres/${filiereId}/classes`);
  }

  /**
   * Get all classes
   * GET /api/schedules/filieres/classes
   */
  getAllClasses(): Observable<Classe[]> {
    return this.http.get<Classe[]>('/api/schedules/filieres/classes');
  }

  /**
   * Get UEs by filiere
   * GET /api/schedules/filieres/{filiereId}/ues
   */
  getUEsByFiliere(filiereId: string): Observable<UE[]> {
    return this.http.get<UE[]>(`/api/schedules/filieres/${filiereId}/ues`);
  }

  /**
   * Get all UEs
   * GET /api/schedules/ues
   */
  getAllUEs(): Observable<UE[]> {
    return this.http.get<UE[]>('/api/schedules/ues');
  }

  /**
   * Get UE by code
   * GET /api/schedules/ues/code/{codeUE}
   */
  getUEByCode(codeUE: string): Observable<UE> {
    return this.http.get<UE>(`/api/schedules/ues/code/${codeUE}`);
  }

  /**
   * Create a new filiere
   * POST /api/schedules/filieres
   */
  createFiliere(request: { nom: string; description?: string; ecoleId?: string }): Observable<Filiere> {
    return this.http.post<Filiere>('/api/schedules/filieres', request);
  }

  /**
   * Create a new UE
   * POST /api/schedules/ues
   */
  createUE(request: { codeUE: string; nomUE: string; description?: string; nombreCredit: number; filiereId: string; semestre: string }): Observable<UE> {
    return this.http.post<UE>('/api/schedules/ues', request);
  }

  /**
   * Create a new classe (groupe d'étudiants)
   * POST /api/schedules/filieres/{filiereId}/classes
   */
  createClasse(filiereId: string, request: { nom: string; effectif: number; ecoleId: string; niveau: string }): Observable<Classe> {
    return this.http.post<Classe>(`/api/schedules/filieres/${filiereId}/classes`, request);
  }

  /**
   * Get all ecoles
   * GET /api/schedules/ecoles
   */
  getAllEcoles(): Observable<Ecole[]> {
    return this.http.get<Ecole[]>('/api/schedules/ecoles');
  }

  /**
   * Get ecole by ID
   * GET /api/schedules/ecoles/{id}
   */
  getEcoleById(id: string): Observable<Ecole> {
    return this.http.get<Ecole>(`/api/schedules/ecoles/${id}`);
  }

  /**
   * Create a new ecole
   * POST /api/schedules/ecoles
   */
  createEcole(request: CreateEcoleRequest): Observable<Ecole> {
    return this.http.post<Ecole>('/api/schedules/ecoles', request);
  }

  /**
   * Update an ecole
   * PUT /api/schedules/ecoles/{id}
   */
  updateEcole(id: string, request: CreateEcoleRequest): Observable<Ecole> {
    return this.http.put<Ecole>(`/api/schedules/ecoles/${id}`, request);
  }

  /**
   * Delete an ecole
   * DELETE /api/schedules/ecoles/{id}
   */
  deleteEcole(id: string): Observable<void> {
    return this.http.delete<void>(`/api/schedules/ecoles/${id}`);
  }

  /**
   * Delete a filiere
   */
  deleteFiliere(id: string): Observable<void> {
    return this.http.delete<void>(`/api/schedules/filieres/${id}`);
  }

  /**
   * Delete a UE
   */
  deleteUE(id: string): Observable<void> {
    return this.http.delete<void>(`/api/schedules/ues/${id}`);
  }

  /**
   * Update a filiere
   * PUT /api/schedules/filieres/{id}
   */
  updateFiliere(id: string, request: { nom: string; description?: string; ecoleId?: string }): Observable<Filiere> {
    return this.http.put<Filiere>(`/api/schedules/filieres/${id}`, request);
  }

  /**
   * Update a UE
   * PUT /api/schedules/ues/{id}
   */
  updateUE(id: string, request: { codeUE: string; nomUE: string; description?: string; nombreCredit: number; filiereId: string; semestre: string }): Observable<UE> {
    return this.http.put<UE>(`/api/schedules/ues/${id}`, request);
  }

  /**
   * Update a classe
   * PUT /api/schedules/filieres/classes/{id}
   */
  updateClasse(id: string, request: { nom: string; effectif: number; ecoleId: string; niveau: string; filiereId?: string }): Observable<Classe> {
    return this.http.put<Classe>(`/api/schedules/filieres/classes/${id}`, request);
  }

  /**
   * Delete a classe
   * DELETE /api/schedules/filieres/classes/{id}
   */
  deleteClasse(id: string): Observable<void> {
    return this.http.delete<void>(`/api/schedules/filieres/classes/${id}`);
  }
}
