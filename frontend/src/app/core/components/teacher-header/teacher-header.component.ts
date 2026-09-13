import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthUser } from '../../models';
import { getUserInitials, getUserAvatarColor } from '../../utils/user.utils';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-teacher-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './teacher-header.component.html',
  styleUrls: ['./teacher-header.component.scss']
})
export class TeacherHeaderComponent implements OnInit {
  @Input() pageTitle: string = 'Tableau de Bord Enseignant';

  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Enseignant';
  userEmail: string = '';
  userProfilePhoto: string | null = null;
  userInitials: string = 'U';
  avatarColor: string = '#2563eb';

  private authService = inject(AuthService);
  private router = inject(Router);
  private notificationService = inject(NotificationService);

  unreadCount: number = 0;

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur connecté
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userDisplayName = `${user.firstName} ${user.lastName}`.trim() || 'Enseignant';
        this.userEmail = user.email || '';
        this.userProfilePhoto = user.profilePhoto || null;
        this.userInitials = getUserInitials(user.firstName, user.lastName);
        this.avatarColor = getUserAvatarColor(user.firstName, user.lastName);
        this.fetchUnreadCount(user.id);
      }
    });
  }

  fetchUnreadCount(userId: string): void {
    this.notificationService.getUnreadCount(userId).subscribe({
      next: (count) => this.unreadCount = count,
      error: (err) => console.error('Error fetching unread count:', err)
    });
  }

  toggleSidebar(): void {
    console.log('Toggle sidebar');
    // TODO: Implement sidebar toggle for mobile
  }

  onSearch(): void {
    console.log('Search clicked');
    // TODO: Implement search functionality
  }

  onNotifications(): void {
    console.log('Notifications clicked');
    this.router.navigate(['/notifications']);
  }

  /**
   * Navigation vers la page de profil / paramètres
   */
  goToProfile(): void {
    console.log('Navigation vers /profile depuis teacher header');
    this.router.navigate(['/profile']).then(
      (success) => {
        if (success) {
          console.log('Navigation réussie vers /profile');
        } else {
          console.error('Échec de la navigation vers /profile');
        }
      },
      (error) => {
        console.error('Erreur lors de la navigation vers /profile:', error);
      }
    );
  }
}

