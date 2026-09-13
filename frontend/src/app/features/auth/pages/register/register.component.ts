import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss']
})
export class RegisterComponent {
  private router = inject(Router);

  constructor() {
    // Rediriger automatiquement vers la page de login
    // L'enregistrement n'est pas disponible pour les utilisateurs publics
    // Seuls les administrateurs peuvent créer des utilisateurs via la gestion des utilisateurs
    setTimeout(() => {
      this.router.navigate(['/login'], {
        queryParams: { message: 'L\'enregistrement n\'est pas disponible. Veuillez contacter un administrateur.' }
      });
    }, 100);
  }
}
