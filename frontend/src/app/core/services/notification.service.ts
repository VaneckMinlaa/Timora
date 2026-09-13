/**
 * Notification Service
 * Service pour les notifications
 * Port backend: 8086
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
  Notification,
  CreateNotificationRequest,
  NotificationPreferences,
  NotificationFilter
} from '../models';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = '/api/notifications';

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications
   * GET /api/notifications
   */
  getAllNotifications(filter?: NotificationFilter): Observable<Notification[]> {
    let params = new HttpParams();

    if (filter) {
      if (filter.type) params = params.set('type', filter.type);
      if (filter.status) params = params.set('status', filter.status);
      if (filter.startDate) params = params.set('startDate', filter.startDate);
      if (filter.endDate) params = params.set('endDate', filter.endDate);
    }

    return this.http.get<Notification[]>(this.apiUrl, { params });
  }

  /**
   * Get notification by ID
   * GET /api/notifications/:id
   */
  getNotificationById(id: string): Observable<Notification> {
    return this.http.get<Notification>(`${this.apiUrl}/${id}`);
  }

  /**
   * Create notification
   * POST /api/notifications
   */
  createNotification(data: CreateNotificationRequest): Observable<Notification> {
    return this.http.post<Notification>(this.apiUrl, data);
  }

  /**
   * Mark notification as read
   * PATCH /api/notifications/:id/read
   */
  markAsRead(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/read`, {});
  }

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/read-all
   */
  markAllAsRead(): Observable<void> {
    return this.http.patch<void>(`${this.apiUrl}/read-all`, {});
  }

  /**
   * Delete notification
   * DELETE /api/notifications/:id
   */
  deleteNotification(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get user notifications
   * GET /api/notifications/user/:userId
   */
  getUserNotifications(userId: string, unreadOnly = false): Observable<Notification[]> {
    const params = new HttpParams().set('unreadOnly', unreadOnly.toString());
    return this.http.get<Notification[]>(`${this.apiUrl}/user/${userId}`, { params });
  }

  /**
   * Get unread count
   * GET /api/notifications/user/:userId/unread-count
   */
  getUnreadCount(userId: string): Observable<number> {
    return this.http.get<number>(`${this.apiUrl}/user/${userId}/unread-count`);
  }

  /**
   * Get notification preferences
   * GET /api/notifications/preferences/:userId
   */
  getPreferences(userId: string): Observable<NotificationPreferences> {
    return this.http.get<NotificationPreferences>(`${this.apiUrl}/preferences/${userId}`);
  }

  /**
   * Update notification preferences
   * PUT /api/notifications/preferences/:userId
   */
  updatePreferences(userId: string, preferences: NotificationPreferences): Observable<NotificationPreferences> {
    return this.http.put<NotificationPreferences>(`${this.apiUrl}/preferences/${userId}`, preferences);
  }

  /**
   * Archive notification
   * PATCH /api/notifications/:id/archive
   */
  archiveNotification(id: string): Observable<Notification> {
    return this.http.patch<Notification>(`${this.apiUrl}/${id}/archive`, {});
  }
}
