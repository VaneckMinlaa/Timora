/**
 * Notification Models
 * Modèles pour les notifications
 */

export type NotificationType = 'INFO' | 'WARNING' | 'ERROR' | 'SUCCESS';
export type NotificationStatus = 'UNREAD' | 'READ' | 'ARCHIVED';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  status: NotificationStatus;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
  createdAt: string;
  readAt?: string;
}

export interface CreateNotificationRequest {
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  relatedEntityType?: string;
  relatedEntityId?: string;
  actionUrl?: string;
}

export interface NotificationPreferences {
  userId: string;
  emailNotifications: boolean;
  pushNotifications: boolean;
  smsNotifications: boolean;
  reservationReminder: boolean;
  cancellationAlert: boolean;
}

export interface NotificationFilter {
  type?: NotificationType;
  status?: NotificationStatus;
  startDate?: string;
  endDate?: string;
}
