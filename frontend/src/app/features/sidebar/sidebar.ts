import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { AuthUser } from '../../core/models';
import { ConfirmModalComponent } from '../../core/components/confirm-modal/confirm-modal.component';
import { ConflictService } from '../../core/services/conflict.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterModule, ConfirmModalComponent],
  templateUrl: './sidebar.html',
  styleUrls: ['./sidebar.scss']
})
export class Sidebar implements OnInit {
  logoUrl: string = ''; // Logo désactivé - utiliser le texte "Timora" à la place
  
  currentUser: AuthUser | null = null;
  roleLabel: string = 'Admin IUSJC';
  isAdmin: boolean = false;
  isTeacher: boolean = false;
  showLogoutModal: boolean = false;
  pendingConflictsCount: number = 0;

  constructor(
    private router: Router,
    private authService: AuthService,
    private conflictService: ConflictService
  ) {}

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        // Déboguer le rôle reçu
        console.log('🔍 Sidebar - Rôle utilisateur:', user.role, 'Type:', typeof user.role);
        
        // Déterminer le label et les permissions selon le rôle
        const roleUpper = user.role?.toUpperCase() || '';
        if (roleUpper === 'ADMINISTRATEUR' || roleUpper === 'ADMIN') {
          this.roleLabel = 'Admin IUSJC';
          this.isAdmin = true;
          this.isTeacher = false;
        } else if (roleUpper === 'ENSEIGNANT' || roleUpper === 'TEACHER') {
          this.roleLabel = 'Enseignant IUSJC';
          this.isAdmin = false;
          this.isTeacher = true;
        } else {
          // Par défaut, afficher Admin IUSJC si le rôle n'est pas reconnu
          console.warn('⚠️ Rôle non reconnu:', user.role, '- Affichage par défaut: Admin IUSJC');
          this.roleLabel = 'Admin IUSJC';
          this.isAdmin = true;
          this.isTeacher = false;
        }
        console.log('✅ Label affiché:', this.roleLabel);
      } else {
        // Si pas d'utilisateur, garder le label par défaut
        this.roleLabel = 'Admin IUSJC';
        this.isAdmin = false;
        this.isTeacher = false;
      }
      
      if (this.isAdmin) {
        this.fetchConflictStats();
      }
    });
  }

  fetchConflictStats(): void {
    this.conflictService.getConflictStats().subscribe({
      next: (stats) => {
        this.pendingConflictsCount = stats?.pendingConflicts || 0;
      },
      error: (err) => console.error('Error fetching stats for sidebar:', err)
    });
  }

  onLogout(event: Event): void {
    event.preventDefault();
    this.showLogoutModal = true;
  }

  onLogoutConfirm(): void {
    this.authService.logout();
    // Utiliser replaceUrl pour empêcher le retour en arrière
    this.router.navigate(['/login'], { replaceUrl: true }).then(() => {
      // Forcer le remplacement de l'historique après navigation
      if (window.history.length > 1) {
        window.history.replaceState(null, '', '/login');
      }
    });
  }

  onLogoutCancel(): void {
    this.showLogoutModal = false;
  }
}
