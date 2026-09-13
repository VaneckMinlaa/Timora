/**
 * Room Service
 * Service pour la gestion des salles
 * Port backend: 8083
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { Room, CreateRoomRequest, UpdateRoomRequest, RoomFilter, RoomAvailabilitySlot } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RoomService {
  private apiUrl = '/api/rooms';

  constructor(private http: HttpClient) {}

  /**
   * Mapper les données backend vers frontend
   */
  private mapBackendToFrontend(backendRoom: any): Room {
    if (!backendRoom) {
      return {
        id: '',
        idSalle: '',
        name: '',
        nomsalle: '',
        description: '',
        capacity: 0,
        capacite: 0,
        typeSalle: 'COURS',
        ecole: '',
        amenities: [],
        isAvailable: true,
        createdAt: undefined,
        updatedAt: undefined
      };
    }

    // Convertir les dates LocalDateTime en string ISO si nécessaire
    let createdAt: string | undefined = undefined;
    let updatedAt: string | undefined = undefined;

    if (backendRoom.createdAt) {
      if (typeof backendRoom.createdAt === 'string') {
        createdAt = backendRoom.createdAt;
      } else if (backendRoom.createdAt.date && backendRoom.createdAt.time) {
        // Format LocalDateTime sérialisé par Jackson : { "date": "2026-01-10", "time": "20:30:43.123" }
        const timeStr = backendRoom.createdAt.time.split('.')[0]; // Enlever les millisecondes si présentes
        createdAt = `${backendRoom.createdAt.date}T${timeStr}`;
      } else if (backendRoom.createdAt.toString) {
        // Si c'est un objet Date ou similaire
        try {
          createdAt = new Date(backendRoom.createdAt).toISOString();
        } catch (e) {
          console.warn('Erreur lors de la conversion de createdAt:', e);
        }
      }
    }

    if (backendRoom.updatedAt) {
      if (typeof backendRoom.updatedAt === 'string') {
        updatedAt = backendRoom.updatedAt;
      } else if (backendRoom.updatedAt.date && backendRoom.updatedAt.time) {
        const timeStr = backendRoom.updatedAt.time.split('.')[0];
        updatedAt = `${backendRoom.updatedAt.date}T${timeStr}`;
      } else if (backendRoom.updatedAt.toString) {
        try {
          updatedAt = new Date(backendRoom.updatedAt).toISOString();
        } catch (e) {
          console.warn('Erreur lors de la conversion de updatedAt:', e);
        }
      }
    }

    const mappedRoom: Room = {
      id: backendRoom.idSalle || backendRoom.id || '',
      idSalle: backendRoom.idSalle || '',
      name: backendRoom.nomsalle || backendRoom.name || '',
      nomsalle: backendRoom.nomsalle || '',
      description: backendRoom.description || '',
      capacity: backendRoom.capacite !== undefined ? backendRoom.capacite : (backendRoom.capacity !== undefined ? backendRoom.capacity : 0),
      capacite: backendRoom.capacite,
      typeSalle: backendRoom.typeSalle || 'COURS',
      ecole: backendRoom.ecole || '',
      amenities: backendRoom.amenities || [],
      isAvailable: backendRoom.isAvailable !== undefined ? backendRoom.isAvailable : true,
      createdAt: createdAt,
      updatedAt: updatedAt
    };

    return mappedRoom;
  }

  /**
   * Get all rooms
   * GET /api/rooms
   */
  getAllRooms(filter?: RoomFilter): Observable<Room[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.capacity) params = params.set('capacity', filter.capacity.toString());
      if (filter.ecole) params = params.set('ecole', filter.ecole);
      if (filter.amenities) params = params.set('amenities', filter.amenities.join(','));
      if (filter.isAvailable !== undefined) params = params.set('available', filter.isAvailable.toString());
    }

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map(rooms => {
        console.log('Données brutes reçues du backend:', rooms);
        const mappedRooms = rooms.map(room => this.mapBackendToFrontend(room));
        console.log('Données mappées pour le frontend:', mappedRooms);
        return mappedRooms;
      })
    );
  }

  /**
   * Get room by ID
   * GET /api/rooms/:id
   */
  getRoomById(id: string): Observable<Room> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(room => this.mapBackendToFrontend(room))
    );
  }

  /**
   * Create room
   * POST /api/rooms
   */
  createRoom(data: CreateRoomRequest): Observable<Room> {
    // Mapper les champs frontend vers les champs backend
    // Le backend attend: nomsalle, capacite, typeSalle
    const name = (data.name || '').trim();
    const capacity = data.capacity || 0;
    const typeSalle = data.typeSalle || 'COURS';

    // Validation : s'assurer que les champs requis ne sont pas vides
    if (!name || name.length === 0) {
      throw new Error('Le nom de la salle est obligatoire');
    }
    if (!capacity || capacity <= 0) {
      throw new Error('La capacité doit être supérieure à 0');
    }
    if (!typeSalle) {
      throw new Error('Le type de salle est obligatoire');
    }

    const backendData = {
      nomsalle: name,
      capacite: capacity,
      typeSalle: typeSalle,
      ecole: (data as any).ecole
    };

    console.log('Envoi des données au backend:', backendData);

    return this.http.post<any>(this.apiUrl, backendData).pipe(
      map(room => this.mapBackendToFrontend(room))
    );
  }

  /**
   * Update room
   * PUT /api/rooms/:id
   */
  updateRoom(id: string, data: UpdateRoomRequest): Observable<Room> {
    // Mapper les champs frontend vers les champs backend
    const backendData: any = {};

    if (data.name !== undefined) {
      backendData.nomsalle = data.name.trim();
    }
    if (data.capacity !== undefined) {
      backendData.capacite = data.capacity;
    }
    if (data.typeSalle !== undefined) {
      backendData.typeSalle = data.typeSalle;
    }
    if (data.ecole !== undefined) {
      backendData.ecole = data.ecole;
    }

    return this.http.put<any>(`${this.apiUrl}/${id}`, backendData).pipe(
      map(room => this.mapBackendToFrontend(room))
    );
  }

  /**
   * Delete room
   * DELETE /api/rooms/:id
   */
  deleteRoom(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Search rooms
   * GET /api/rooms/search
   */
  searchRooms(query: string): Observable<Room[]> {
    const params = new HttpParams().set('query', query);
    return this.http.get<any[]>(`${this.apiUrl}/search`, { params }).pipe(
      map(rooms => rooms.map(room => this.mapBackendToFrontend(room)))
    );
  }

  /**
   * Get room availability
   * GET /api/rooms/:id/availability
   */
  getRoomAvailability(roomId: string, date: string): Observable<RoomAvailabilitySlot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<RoomAvailabilitySlot[]>(`${this.apiUrl}/${roomId}/availability`, { params });
  }

  /**
   * Get rooms by school
   * GET /api/rooms/ecole/:ecole
   */
  getRoomsBySchool(ecole: string): Observable<Room[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ecole/${ecole}`).pipe(
      map(rooms => rooms.map(room => this.mapBackendToFrontend(room)))
    );
  }

  /**
   * Get available rooms for time slot
   * GET /api/rooms/available
   */
  getAvailableRooms(startDate: string, endDate: string, capacity?: number): Observable<Room[]> {
    let params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    if (capacity) {
      params = params.set('capacity', capacity.toString());
    }

    return this.http.get<any[]>(`${this.apiUrl}/available`, { params }).pipe(
      map(rooms => rooms.map(room => this.mapBackendToFrontend(room)))
    );
  }

  /**
   * Importer des salles depuis un fichier Excel
   * POST /api/rooms/import
   */
  importFromExcel(file: File): Observable<{ message: string; count: number; data: Room[] }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ message: string; count: number; data: any[] }>(`${this.apiUrl}/import`, formData).pipe(
      map(res => ({
        message: res.message,
        count: res.count,
        data: res.data.map(r => this.mapBackendToFrontend(r))
      }))
    );
  }
}
