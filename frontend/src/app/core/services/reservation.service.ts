/**
 * Reservation Service
 * Service pour la gestion des réservations
 * Port backend: 8084
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map, catchError, throwError, of } from 'rxjs';
import {
  Reservation,
  CreateReservationRequest,
  UpdateReservationRequest,
  ReservationFilter,
  ReservationWithRoom,
  Disponibilite,
  CreateDisponibiliteRequest,
  UpdateDisponibiliteRequest,
  RoomSuggestion,
  RoomAvailability
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ReservationService {
  private apiUrl = '/api/reservations';

  constructor(private http: HttpClient) {}

  /**
   * Mapper les données backend vers frontend
   */
  private mapBackendToFrontend(backendReservation: any): Reservation {
    if (!backendReservation) {
      console.warn('mapBackendToFrontend: backendReservation is null or undefined');
      return {} as Reservation;
    }

    console.log('mapBackendToFrontend - Données brutes du backend:', JSON.stringify(backendReservation, null, 2));

    // Le backend renvoie: idDemandeReservation, salleId, utilisateurId, date, heureDebut, heureFin, statut
    // LocalDate est sérialisé comme "YYYY-MM-DD" (ex: "2026-01-10")
    // LocalTime est sérialisé comme "HH:mm:ss" (ex: "08:00:00")
    // StatutReservation (enum) est sérialisé comme string (ex: "EN_ATTENTE", "CONFIRME")

    const dateStr = backendReservation.date ? backendReservation.date.toString().trim() : null;
    const heureDebutStr = backendReservation.heureDebut ? backendReservation.heureDebut.toString().trim() : null;
    const heureFinStr = backendReservation.heureFin ? backendReservation.heureFin.toString().trim() : null;
    const statutStr = backendReservation.statut ? backendReservation.statut.toString().trim() : null;

    console.log('Parsing:', { dateStr, heureDebutStr, heureFinStr, statutStr });

    // Construire startDateTime et endDateTime à partir de date + heure
    let startDateTime: string | undefined = undefined;
    let endDateTime: string | undefined = undefined;

    if (dateStr && heureDebutStr) {
      // LocalTime peut être "HH:mm:ss" ou "HH:mm" selon la configuration Jackson
      // Extraire seulement HH:mm et ajouter :00 pour créer un format ISO valide
      const timeParts = heureDebutStr.split(':');
      if (timeParts.length >= 2) {
        const hours = timeParts[0].padStart(2, '0');
        const minutes = timeParts[1].padStart(2, '0');
        startDateTime = `${dateStr}T${hours}:${minutes}:00`;
      }
    }

    if (dateStr && heureFinStr) {
      const timeParts = heureFinStr.split(':');
      if (timeParts.length >= 2) {
        const hours = timeParts[0].padStart(2, '0');
        const minutes = timeParts[1].padStart(2, '0');
        endDateTime = `${dateStr}T${hours}:${minutes}:00`;
      }
    }

    // Si startDateTime/endDateTime existent déjà (format ISO complet), les utiliser
    if (backendReservation.startDateTime && !startDateTime) {
      startDateTime = backendReservation.startDateTime;
    }
    if (backendReservation.endDateTime && !endDateTime) {
      endDateTime = backendReservation.endDateTime;
    }

    const reservation: Reservation = {
      // Champs backend (format original)
      idDemandeReservation: backendReservation.idDemandeReservation,
      salleId: backendReservation.salleId,
      utilisateurId: backendReservation.utilisateurId,
      date: dateStr || undefined,
      heureDebut: heureDebutStr || undefined,
      heureFin: heureFinStr || undefined,
      statut: statutStr as any || undefined,

      // Aliases frontend
      id: backendReservation.idDemandeReservation || backendReservation.id,
      roomId: backendReservation.salleId || backendReservation.roomId,
      userId: backendReservation.utilisateurId || backendReservation.userId,
      status: (statutStr || backendReservation.status) as any,

      // Dates/heures combinées
      startDateTime: startDateTime,
      endDateTime: endDateTime,

      // Champs additionnels
      purpose: backendReservation.purpose || undefined,
      numberOfParticipants: backendReservation.numberOfParticipants || undefined,
      notes: backendReservation.notes || undefined,
      salleNom: backendReservation.salleNom || undefined,
      utilisateurNom: backendReservation.utilisateurNom || undefined,
      coursId: backendReservation.coursId || undefined,
      coursNom: backendReservation.coursNom || undefined,
      evenementId: backendReservation.evenementId || undefined,
      evenementNom: backendReservation.evenementNom || undefined,
      equipementId: backendReservation.equipementId || undefined,
      equipementNom: backendReservation.equipementNom || undefined,
      createdAt: backendReservation.createdAt ? backendReservation.createdAt.toString() : undefined,
      updatedAt: backendReservation.updatedAt ? backendReservation.updatedAt.toString() : undefined
    };

    console.log('mapBackendToFrontend - Réservation mappée:', JSON.stringify(reservation, null, 2));

    return reservation;
  }

  /**
   * Get all reservations
   * GET /api/reservations
   * Note: Le backend n'accepte pas de paramètres pour cet endpoint
   * Pour filtrer, utilisez getUserReservations() ou getReservationsByDateRange()
   */
  getAllReservations(filter?: ReservationFilter): Observable<Reservation[]> {
    // Le backend GET /api/reservations n'accepte pas de paramètres
    // Si un filtre est fourni, on ignore les paramètres et on retourne toutes les réservations
    // Le filtrage sera fait côté frontend
    console.log('Chargement de toutes les réservations (filtrage côté frontend si nécessaire)');
    return this.http.get<any[]>(this.apiUrl).pipe(
      map(reservations => {
        console.log('Réservations reçues du backend:', reservations);
        return reservations.map(r => this.mapBackendToFrontend(r));
      }),
      catchError(error => {
        console.error('Erreur lors du chargement des réservations:', error);
        if (error.status === 404) {
          console.warn('Endpoint GET /api/reservations non trouvé (404). Vérifiez que le service de réservation est démarré et accessible via la gateway.');
          // Retourner un tableau vide au lieu de lever une erreur pour éviter de bloquer l'application
          return of([]);
        }
        // Pour les autres erreurs, retourner un tableau vide également pour éviter de bloquer l'application
        console.error('Erreur lors du chargement des réservations:', error);
        return of([]);
      })
    );
  }

  /**
   * Get reservation by ID
   * GET /api/reservations/:id
   */
  getReservationById(id: string): Observable<ReservationWithRoom> {
    return this.http.get<any>(`${this.apiUrl}/${id}`).pipe(
      map(response => {
        const reservation = this.mapBackendToFrontend(response);
        return {
          ...reservation,
          room: response.room || undefined
        } as ReservationWithRoom;
      })
    );
  }

  /**
   * Create reservation
   * POST /api/reservations
   * Le backend attend: salleId, utilisateurId, date (LocalDate), heureDebut (LocalTime), heureFin (LocalTime)
   */
  createReservation(data: CreateReservationRequest): Observable<Reservation> {
    // Obtenir l'ID utilisateur depuis les données étendues
    const utilisateurId = (data as any).utilisateurId || (data as any).userId || '';

    if (!utilisateurId || utilisateurId.trim() === '') {
      throw new Error('L\'ID utilisateur est obligatoire pour créer une réservation');
    }

    if (!data.startDateTime || !data.endDateTime) {
      throw new Error('Les dates de début et de fin sont obligatoires');
    }

    // Parser les dates ISO (format: YYYY-MM-DDTHH:mm:ss ou YYYY-MM-DDTHH:mm)
    // Utiliser une approche plus robuste pour éviter les problèmes de fuseau horaire
    let dateStr = '';
    let heureDebut = '';
    let heureFin = '';

    // Formater la date : YYYY-MM-DDTHH:mm -> date séparée et heure séparée
    const startParts = data.startDateTime.trim().split('T');
    const endParts = data.endDateTime.trim().split('T');

    if (startParts.length < 2 || endParts.length < 2) {
      throw new Error('Format de date/heure invalide. Format attendu: YYYY-MM-DDTHH:mm');
    }

    // Extraire la date (YYYY-MM-DD)
    dateStr = startParts[0].trim();
    if (!dateStr || !/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      throw new Error('Format de date invalide. Format attendu: YYYY-MM-DD');
    }

    // Valider que la date n'est pas passée
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const reservationDate = new Date(dateStr + 'T00:00:00');
    reservationDate.setHours(0, 0, 0, 0);

    if (reservationDate < today) {
      throw new Error('Impossible de réserver une salle à une date déjà passée');
    }

    // Extraire l'heure HH:mm (enlever les secondes si présentes)
    const startTimeStr = startParts[1].split(':');
    const endTimeStr = endParts[1].split(':');

    if (startTimeStr.length < 2 || endTimeStr.length < 2) {
      throw new Error('Format d\'heure invalide. Format attendu: HH:mm');
    }

    heureDebut = `${startTimeStr[0].padStart(2, '0')}:${startTimeStr[1].padStart(2, '0')}`;
    heureFin = `${endTimeStr[0].padStart(2, '0')}:${endTimeStr[1].padStart(2, '0')}`;

    // Valider que l'heure de fin est après l'heure de début
    const [startHour, startMin] = heureDebut.split(':').map(Number);
    const [endHour, endMin] = heureFin.split(':').map(Number);
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;

    if (endMinutes <= startMinutes) {
      throw new Error('L\'heure de fin doit être supérieure à l\'heure de début');
    }

    const backendData: any = {
      utilisateurId: utilisateurId.trim(),
      date: dateStr,
      heureDebut: heureDebut,
      heureFin: heureFin
    };

    // Ajouter salleId seulement si fourni (sinon assignation automatique)
    if (data.roomId && data.roomId.trim()) {
      backendData.salleId = data.roomId.trim();
    }

    // Ajouter les champs optionnels si présents
    if (data.purpose && data.purpose.trim()) {
      backendData.purpose = data.purpose.trim();
    }
    if (data.numberOfParticipants !== undefined && data.numberOfParticipants > 0) {
      backendData.numberOfParticipants = data.numberOfParticipants;
    }
    if (data.typeCours && data.typeCours.trim()) {
      backendData.typeCours = data.typeCours.trim();
    }
    if (data.notes && data.notes.trim()) {
      backendData.notes = data.notes.trim();
    }
    if (data.equipementId && data.equipementId.trim()) {
      backendData.equipementId = data.equipementId.trim();
    }
    if ((data as any).equipementNom && (data as any).equipementNom.trim()) {
      backendData.equipementNom = (data as any).equipementNom.trim();
    }

    console.log('Envoi de la réservation au backend:', JSON.stringify(backendData, null, 2));

    return this.http.post<any>(this.apiUrl, backendData).pipe(
      map(response => {
        console.log('Réponse du backend:', response);
        return this.mapBackendToFrontend(response);
      }),
      catchError(error => {
        console.error('Erreur détaillée lors de la création de réservation:', error);
        let errorMessage = 'Impossible de créer la réservation. Veuillez réessayer.';

        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 404) {
          errorMessage = 'La salle sélectionnée n\'existe pas. Veuillez sélectionner une autre salle.';
        } else if (error.status === 400) {
          if (error.error?.errors) {
            // Erreurs de validation Jakarta
            const validationErrors = error.error.errors.map((e: any) => e.defaultMessage || e.message).join(', ');
            errorMessage = `Erreurs de validation: ${validationErrors}`;
          } else {
            errorMessage = error.error?.message || 'Les données fournies sont invalides. Veuillez vérifier vos saisies.';
          }
        } else if (error.status === 409) {
          errorMessage = 'Un conflit de réservation existe déjà pour cette salle à cette date et heure.';
        } else if (error.message) {
          errorMessage = error.message;
        }

        return throwError(() => new Error(errorMessage));
      })
    );
  }

  /**
   * Update reservation
   * PUT /api/reservations/:id
   */
  updateReservation(id: string, data: UpdateReservationRequest): Observable<Reservation> {
    return this.http.put<Reservation>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Cancel reservation
   * PATCH /api/reservations/:id/cancel
   */
  cancelReservation(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/cancel`, {});
  }

  /**
   * Confirm reservation
   * PATCH /api/reservations/:id/confirm
   */
  confirmReservation(id: string): Observable<Reservation> {
    return this.http.patch<Reservation>(`${this.apiUrl}/${id}/confirm`, {});
  }

  /**
   * Delete reservation
   * DELETE /api/reservations/:id
   */
  deleteReservation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get user reservations
   * GET /api/reservations/user/:userId
   */
  getUserReservations(userId: string): Observable<ReservationWithRoom[]> {
    return this.http.get<any[]>(`${this.apiUrl}/user/${userId}`).pipe(
      map(reservations => reservations.map(r => {
        const reservation = this.mapBackendToFrontend(r);
        return {
          ...reservation,
          room: r.room || undefined
        } as ReservationWithRoom;
      }))
    );
  }

  /**
   * Get room reservations
   * GET /api/reservations/room/:roomId
   */
  getRoomReservations(roomId: string, startDate?: string, endDate?: string): Observable<Reservation[]> {
    let params = new HttpParams();
    if (startDate) params = params.set('startDate', startDate);
    if (endDate) params = params.set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl}/room/${roomId}`, { params }).pipe(
      map(reservations => reservations.map(r => this.mapBackendToFrontend(r)))
    );
  }

  /**
   * Check if room is available
   * GET /api/reservations/check-availability
   */
  checkAvailability(roomId: string, startDateTime: string, endDateTime: string): Observable<boolean> {
    // Extraire date, startTime, endTime du format datetime
    const [date, startTime] = startDateTime.split('T');
    const [, endTime] = endDateTime.split('T');

    const params = new HttpParams()
      .set('roomId', roomId)
      .set('date', date)
      .set('startTime', startTime.substring(0, 5)) // HH:mm
      .set('endTime', endTime.substring(0, 5)); // HH:mm

    return this.http.get<{available: boolean}>(`${this.apiUrl}/check-availability`, { params }).pipe(
      map(response => response.available)
    );
  }

  /**
   * Suggest rooms automatically based on course type and number of participants
   * GET /api/reservations/suggest-rooms?typeCours=xxx&numberOfParticipants=xxx&date=xxx&startTime=xxx&endTime=xxx
   */
  suggestRooms(
    typeCours: string,
    numberOfParticipants: number,
    date: string,
    startTime: string,
    endTime: string
  ): Observable<RoomSuggestion[]> {
    const params = new HttpParams()
      .set('typeCours', typeCours)
      .set('numberOfParticipants', numberOfParticipants.toString())
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);

    return this.http.get<RoomSuggestion[]>(`${this.apiUrl}/suggest-rooms`, { params });
  }

  /**
   * Get real-time availability of a room
   * GET /api/reservations/realtime-availability?roomId=xxx&date=xxx&startTime=xxx&endTime=xxx
   */
  getRealTimeAvailability(
    roomId: string,
    date: string,
    startTime: string,
    endTime: string
  ): Observable<RoomAvailability> {
    const params = new HttpParams()
      .set('roomId', roomId)
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);

    return this.http.get<RoomAvailability>(`${this.apiUrl}/realtime-availability`, { params });
  }

  /**
   * Get real-time availability of all rooms
   * GET /api/reservations/realtime-availability/all?date=xxx&startTime=xxx&endTime=xxx
   */
  getAllRoomsRealTimeAvailability(
    date: string,
    startTime: string,
    endTime: string
  ): Observable<RoomAvailability[]> {
    const params = new HttpParams()
      .set('date', date)
      .set('startTime', startTime)
      .set('endTime', endTime);

    return this.http.get<RoomAvailability[]>(`${this.apiUrl}/realtime-availability/all`, { params });
  }

  /**
   * Get reservations by date range
   * GET /api/reservations/date-range
   */
  getReservationsByDateRange(startDate: string, endDate: string): Observable<Reservation[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);

    return this.http.get<any[]>(`${this.apiUrl}/date-range`, { params }).pipe(
      map(reservations => reservations.map(r => this.mapBackendToFrontend(r)))
    );
  }

  /**
   * ============================================
   * DISPONIBILITE METHODS
   * Selon le diagramme UML : Utilisateur 1 -- +ensdispense -- 1..* Disponibilite
   * ============================================
   */

  /**
   * Get all disponibilités for a user (teacher)
   * GET /api/disponibilites/user/:userId
   */
  getUserDisponibilites(userId: string): Observable<Disponibilite[]> {
    return this.http.get<Disponibilite[]>(`${this.apiUrl}/disponibilites/user/${userId}`);
  }

  /**
   * Get disponibilité by ID
   * GET /api/disponibilites/:id
   */
  getDisponibiliteById(id: string): Observable<Disponibilite> {
    // Ne pas appeler le backend pour les disponibilités mockées (créées côté frontend)
    if (id && id.startsWith('mock-')) {
      return throwError(() => new Error('Disponibilité temporaire non sauvegardée'));
    }
    return this.http.get<Disponibilite>(`${this.apiUrl}/disponibilites/${id}`);
  }

  /**
   * Create disponibilité
   * POST /api/disponibilites
   * Méthode selon UML : +creerDispo(jour: DateTime, heureDebut: DateTime, heureFin: DateTime)
   */
  createDisponibilite(data: CreateDisponibiliteRequest): Observable<Disponibilite> {
    return this.http.post<Disponibilite>(`${this.apiUrl}/disponibilites`, data);
  }

  /**
   * Update disponibilité
   * PUT /api/disponibilites/:id
   * Méthode selon UML : +modifierDispo()
   */
  updateDisponibilite(id: string, data: UpdateDisponibiliteRequest): Observable<Disponibilite> {
    // Ne pas appeler le backend pour les disponibilités mockées (créées côté frontend)
    if (id && id.startsWith('mock-')) {
      return throwError(() => new Error('Impossible de mettre à jour une disponibilité temporaire. Veuillez d\'abord créer la disponibilité.'));
    }
    return this.http.put<Disponibilite>(`${this.apiUrl}/disponibilites/${id}`, data);
  }

  /**
   * Delete disponibilité
   * DELETE /api/disponibilites/:id
   */
  deleteDisponibilite(id: string): Observable<void> {
    // Ne pas appeler le backend pour les disponibilités mockées (créées côté frontend)
    if (id && id.startsWith('mock-')) {
      return throwError(() => new Error('Impossible de supprimer une disponibilité temporaire. Supprimez-la localement.'));
    }
    return this.http.delete<void>(`${this.apiUrl}/disponibilites/${id}`);
  }

  /**
   * Get disponibilités by day
   * GET /api/disponibilites/day/:jour
   */
  getDisponibilitesByDay(jour: string, userId?: string): Observable<Disponibilite[]> {
    let params = new HttpParams().set('jour', jour);
    if (userId) params = params.set('userId', userId);
    return this.http.get<Disponibilite[]>(`${this.apiUrl}/disponibilites/day/${jour}`, { params });
  }

  /**
   * Get disponibilités by user and date range
   * GET /api/reservations/disponibilites/user/:userId/range?startDate=xxx&endDate=xxx
   */
  getDisponibilitesByDateRange(userId: string, startDate: string, endDate: string): Observable<Disponibilite[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Disponibilite[]>(`${this.apiUrl}/disponibilites/user/${userId}/range`, { params });
  }

  /**
   * Get all disponibilités by date range (for admin)
   * GET /api/reservations/disponibilites/all/range?startDate=xxx&endDate=xxx
   */
  getAllDisponibilitesByDateRange(startDate: string, endDate: string): Observable<Disponibilite[]> {
    const params = new HttpParams()
      .set('startDate', startDate)
      .set('endDate', endDate);
    return this.http.get<Disponibilite[]>(`${this.apiUrl}/disponibilites/all/range`, { params });
  }
}
