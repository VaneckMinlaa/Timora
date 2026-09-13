/**
 * Schedule Service
 * Service pour la gestion des horaires
 * Port backend: 8085
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Schedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
  RoomSchedule,
  AvailableSlot,
  EmploiDuTemps,
  EmploiDuTempsWithCours
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class ScheduleService {
  private apiUrl = '/api/schedules';

  constructor(private http: HttpClient) {}

  /**
   * Get all schedules
   * GET /api/schedules
   */
  getAllSchedules(): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.apiUrl}/cours`);
  }

  /**
   * Get schedule by ID
   * GET /api/schedules/:id
   */
  getScheduleById(id: string): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create schedule
   * POST /api/schedules
   */
  createSchedule(data: CreateScheduleRequest): Observable<Schedule> {
    return this.http.post<Schedule>(this.apiUrl, data);
  }

  /**
   * Update schedule
   * PUT /api/schedules/:id
   */
  updateSchedule(id: string, data: UpdateScheduleRequest): Observable<Schedule> {
    return this.http.put<Schedule>(`${this.apiUrl}/${id}`, data);
  }

  /**
   * Delete schedule
   * DELETE /api/schedules/:id
   */
  deleteSchedule(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get room schedule
   * GET /api/schedules/room/:roomId
   */
  getRoomSchedule(roomId: string): Observable<RoomSchedule> {
    return this.http.get<RoomSchedule>(`${this.apiUrl}/room/${roomId}`);
  }

  /**
   * Get available slots for room
   * GET /api/schedules/room/:roomId/available-slots
   */
  getAvailableSlots(roomId: string, date: string): Observable<AvailableSlot[]> {
    const params = new HttpParams().set('date', date);
    return this.http.get<AvailableSlot[]>(`${this.apiUrl}/room/${roomId}/available-slots`, { params });
  }

  /**
   * Check if room is open on date
   * GET /api/schedules/check-open
   */
  checkIfOpen(roomId: string, dateTime: string): Observable<boolean> {
    const params = new HttpParams()
      .set('roomId', roomId)
      .set('dateTime', dateTime);

    return this.http.get<boolean>(`${this.apiUrl}/check-open`, { params });
  }

  /**
   * Get schedules by day of week
   * GET /api/schedules/day/:dayOfWeek
   */
  getSchedulesByDay(dayOfWeek: number): Observable<Schedule[]> {
    return this.http.get<Schedule[]>(`${this.apiUrl}/day/${dayOfWeek}`);
  }

  /**
   * Update room schedules
   * POST /api/schedules/room/:roomId/bulk
   */
  updateRoomSchedules(roomId: string, schedules: CreateScheduleRequest[]): Observable<Schedule[]> {
    return this.http.post<Schedule[]>(`${this.apiUrl}/room/${roomId}/bulk`, { schedules });
  }

  /**
   * Get emploi du temps for a teacher
   * GET /api/emplois-du-temps/enseignant/:enseignantId
   */
  getEmploiDuTempsByEnseignant(enseignantId: string, semaine?: number): Observable<EmploiDuTempsWithCours> {
    let params = new HttpParams();
    if (semaine) params = params.set('semaine', semaine.toString());
    return this.http.get<EmploiDuTempsWithCours>(`${this.apiUrl}/emplois-du-temps/enseignant/${enseignantId}`, { params });
  }

  /**
   * Get emploi du temps by ID
   * GET /api/emplois-du-temps/:id
   */
  getEmploiDuTempsById(id: string): Observable<EmploiDuTempsWithCours> {
    return this.http.get<EmploiDuTempsWithCours>(`${this.apiUrl}/emplois-du-temps/${id}`);
  }

  /**
   * Get current week emploi du temps for a teacher
   * GET /api/emplois-du-temps/enseignant/:enseignantId/current-week
   */
  getCurrentWeekEmploiDuTemps(enseignantId: string): Observable<EmploiDuTempsWithCours> {
    return this.http.get<EmploiDuTempsWithCours>(`${this.apiUrl}/emplois-du-temps/enseignant/${enseignantId}/current-week`);
  }

  /**
   * Generate timetable globally
   * POST /api/schedules/emplois-du-temps/generate
   */
  generateTimetable(params: any): Observable<any[]> {
    return this.http.post<any[]>(`${this.apiUrl}/emplois-du-temps/generate`, params);
  }

  /**
   * Get all emplois du temps (History)
   */
  getAllEmploisDuTemps(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/emplois-du-temps`);
  }

  /**
   * Save a newly generated emploi du temps
   */
  saveEmploiDuTemps(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/emplois-du-temps`, request);
  }

  /**
   * Delete an emploi du temps
   */
  deleteEmploiDuTemps(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/emplois-du-temps/${id}`);
  }

  /**
   * Notifier les enseignants concernés par un emploi du temps
   */
  notifyTeachers(id: string, attachment?: { base64: string, name: string }): Observable<void> {
    const body: any = {};
    if (attachment) {
      body.attachmentBase64 = attachment.base64;
      body.attachmentName = attachment.name;
    }
    return this.http.post<void>(`${this.apiUrl}/emplois-du-temps/${id}/notify-teachers`, body);
  }

  /**
   * Get all schools
   * GET /api/schedules/ecoles
   */
  getAllEcoles(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ecoles`);
  }
}

