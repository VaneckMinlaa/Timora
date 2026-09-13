/**
 * Equipement Service
 * Service pour la gestion des équipements
 * Port backend: 8083 (Room Service)
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Equipement,
  CreateEquipementRequest,
  UpdateEquipementRequest,
  EquipementFilter,
  EtatEquipement
} from '../models/equipement.model';

@Injectable({
  providedIn: 'root'
})
export class EquipementService {
  private apiUrl = '/api/equipements';

  constructor(private http: HttpClient) {}

  /**
   * Récupérer tous les équipements
   * GET /api/equipements
   */
  getAllEquipements(filter?: EquipementFilter): Observable<Equipement[]> {
    let params = new HttpParams();
    
    if (filter) {
      if (filter.statut) params = params.set('statut', filter.statut);
      if (filter.salleId) params = params.set('salleId', filter.salleId);
      if (filter.nom) params = params.set('nom', filter.nom);
    }
    
    return this.http.get<Equipement[]>(this.apiUrl, { params });
  }

  /**
   * Récupérer un équipement par son ID
   * GET /api/equipements/{id}
   */
  getEquipementById(id: string): Observable<Equipement> {
    return this.http.get<Equipement>(`${this.apiUrl}/${id}`);
  }

  /**
   * Créer un équipement
   * POST /api/equipements
   */
  createEquipement(data: CreateEquipementRequest): Observable<Equipement> {
    return this.http.post<Equipement>(this.apiUrl, data);
  }

  /**
   * Mettre à jour un équipement
   * PUT /api/equipements/{id}
   */
  updateEquipement(id: string, data: UpdateEquipementRequest): Observable<Equipement> {
    return this.http.put<Equipement>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Supprimer un équipement
   * DELETE /api/equipements/{id}
   */
  deleteEquipement(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Récupérer tous les équipements d'une salle
   * GET /api/equipements/salle/{salleId}
   */
  getEquipementsBySalleId(salleId: string): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(`${this.apiUrl}/salle/${salleId}`);
  }

  /**
   * Récupérer tous les équipements disponibles d'une salle
   * GET /api/equipements/salle/{salleId}/disponibles
   */
  getAvailableEquipementsBySalleId(salleId: string): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(`${this.apiUrl}/salle/${salleId}/disponibles`);
  }

  /**
   * Récupérer tous les équipements par statut
   * GET /api/equipements/statut/{statut}
   */
  getEquipementsByStatut(statut: EtatEquipement): Observable<Equipement[]> {
    return this.http.get<Equipement[]>(`${this.apiUrl}/statut/${statut}`);
  }

  /**
   * Rechercher des équipements par nom
   * GET /api/equipements/search?nom={nom}
   */
  searchEquipementsByNom(nom: string): Observable<Equipement[]> {
    const params = new HttpParams().set('nom', nom);
    return this.http.get<Equipement[]>(`${this.apiUrl}/search`, { params });
  }

  /**
   * Réserver un équipement
   * PATCH /api/equipements/{id}/reserver
   */
  reserverEquipement(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/reserver`, {});
  }

  /**
   * Libérer un équipement
   * PATCH /api/equipements/{id}/liberer
   */
  libererEquipement(id: string): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/${id}/liberer`, {});
  }

  /**
   * Importer des équipements depuis un fichier Excel
   * POST /api/equipements/import
   */
  importFromExcel(file: File): Observable<{ message: string; count: number; data: Equipement[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; count: number; data: Equipement[] }>(`${this.apiUrl}/import`, formData);
  }
}
