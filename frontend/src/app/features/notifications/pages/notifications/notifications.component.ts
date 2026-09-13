import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';
import { AdminHeaderComponent } from '../../../admin/components/admin-header/admin-header.component';
import { AuthService } from '../../../../core/services/auth.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { AuthUser, Notification } from '../../../../core/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, Sidebar, TeacherHeaderComponent, AdminHeaderComponent],
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.scss'] 
})
export class NotificationsComponent implements OnInit {
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);

  currentUser: AuthUser | null = null;
  isAdmin: boolean = false;
  notifications: Notification[] = [];
  isLoading: boolean = false;
  unreadCount: number = 0;

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.isAdmin = user.role?.toUpperCase() === 'ADMIN' || user.role?.toUpperCase() === 'ADMINISTRATEUR';
        this.loadNotifications();
      }
    });
  }

  loadNotifications(): void {
    if (!this.currentUser) return;

    this.isLoading = true;
    this.notificationService.getUserNotifications(this.currentUser.id).subscribe({
      next: (notifications) => {
        this.notifications = notifications;
        this.unreadCount = notifications.filter(n => n.status === 'UNREAD').length;
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Error loading notifications:', err);
        this.isLoading = false;
      }
    });
  }

  markAsRead(id: string): void {
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        const notif = this.notifications.find(n => n.id === id);
        if (notif) {
          notif.status = 'READ';
          this.unreadCount = this.notifications.filter(n => n.status === 'UNREAD').length;
        }
      },
      error: (err) => console.error('Error marking as read:', err)
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: () => {
        this.notifications.forEach(n => n.status = 'READ');
        this.unreadCount = 0;
      },
      error: (err) => console.error('Error marking all as read:', err)
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'SUCCESS': return 'check_circle';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'info';
    }
  }
}

