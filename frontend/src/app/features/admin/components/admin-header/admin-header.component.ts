import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/models';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import { NotificationService } from '../../../../core/services/notification.service';

@Component({
  selector: 'app-admin-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-header.component.html',
  styleUrls: ['./admin-header.component.scss']
})
export class AdminHeaderComponent implements OnInit {
  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Timora Admin';
  userEmail: string = 'admin@timora.com';
  userProfilePhoto: string | null = null;
  userInitials: string = 'TA';
  avatarColor: string = '#2563eb';
  pageTitle: string = 'Tableau de Bord Administrateur';

  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private notificationService = inject(NotificationService);

  unreadCount: number = 0;

  ngOnInit(): void {
    // Récupérer les informations de l'utilisateur connecté
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userDisplayName = `${user.firstName} ${user.lastName}`.trim() || 'Timora Admin';
        this.userEmail = user.email || 'admin@timora.com';
        this.userProfilePhoto = user.profilePhoto || null;
        this.userInitials = getUserInitials(user.firstName, user.lastName);
        this.avatarColor = getUserAvatarColor(user.firstName, user.lastName);
        this.fetchUnreadCount(user.id);
      }
    });

    // Déterminer le titre de la page selon la route
    this.updatePageTitle();
    this.router.events.subscribe(() => {
      this.updatePageTitle();
    });
  }

  fetchUnreadCount(userId: string): void {
    this.notificationService.getUnreadCount(userId).subscribe({
      next: (count) => this.unreadCount = count,
      error: (err) => console.error('Error fetching unread count:', err)
    });
  }

  private updatePageTitle(): void {
    const url = this.router.url;
    if (url.includes('/profile')) {
      this.pageTitle = 'Mon Profil';
    } else if (url.includes('/users') || url.includes('/user-management')) {
      this.pageTitle = 'Gestion des Utilisateurs';
    } else if (url.includes('/rooms') || url.includes('/room-management')) {
      this.pageTitle = 'Gestion des Salles';
    } else if (url.includes('/schedule') || url.includes('/schedule-management')) {
      this.pageTitle = 'Gestion des Emplois du Temps';
    } else if (url.includes('/reports')) {
      this.pageTitle = 'Rapports & Statistiques';
    } else if (url.includes('/ecoles')) {
      this.pageTitle = 'Gestion des Écoles';
    } else if (url.includes('/dashboard')) {
      this.pageTitle = 'Tableau de Bord Administrateur';
    } else {
      this.pageTitle = 'Tableau de Bord Administrateur';
    }
  }

  toggleSidebar(): void {
    // TODO: Implement sidebar toggle for mobile
    console.log('Toggle sidebar');
  }

  onSearch(): void {
    // TODO: Implement search functionality
    console.log('Search clicked');
  }

  onNotifications(): void {
    console.log('Notifications clicked');
    this.router.navigate(['/notifications']);
  }

  /**
   * Navigation vers la page de profil / paramètres
   */
  goToProfile(): void {
    console.log('Navigation vers /profile depuis admin header');
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

