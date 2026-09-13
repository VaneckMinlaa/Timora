/**
 * Auth Guard
 * Protège les routes qui nécessitent une authentification
 */

import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard {
  constructor(private authService: AuthService, private router: Router) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    // En mode développement, permettre l'accès sans authentification si bypassAuth est activé
    if (environment.bypassAuth && !environment.production) {
      console.warn('⚠️ Mode développement: authentification bypass activé');
      return true;
    }

    const requiredRole = route.data['role'] as string | undefined;

    if (!this.authService.isAuthenticated()) {
      // Utiliser replaceUrl pour empêcher le retour en arrière
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    const user = this.authService.getCurrentUser();

    // Si pas d'utilisateur, rediriger vers login
    if (!user) {
      this.router.navigate(['/login'], { replaceUrl: true });
      return false;
    }

    // Gestion spéciale pour la route /dashboard - redirection selon le rôle
    if (state.url === '/dashboard' && user) {
      const userRole = user.role?.toUpperCase();
      if (userRole === 'ADMINISTRATEUR' || userRole === 'ADMIN') {
        this.router.navigate(['/admin/dashboard'], { replaceUrl: true });
        return false;
      } else if (userRole === 'ENSEIGNANT' || userRole === 'TEACHER') {
        this.router.navigate(['/teacher/dashboard'], { replaceUrl: true });
        return false;
      }
    }

    // La route /profile est accessible à tous les utilisateurs authentifiés
    if (state.url === '/profile' || state.url.startsWith('/profile')) {
      return true;
    }

    if (requiredRole && user) {
      // Vérifier le rôle - ADMINISTRATEUR peut accéder aux routes ADMIN
      const userRole = user.role?.toUpperCase();
      const requiredRoleUpper = requiredRole.toUpperCase();
      
      if (requiredRoleUpper === 'ADMIN') {
        // Seuls les ADMINISTRATEUR peuvent accéder aux routes ADMIN
        if (userRole !== 'ADMINISTRATEUR' && userRole !== 'ADMIN') {
          // Rediriger vers le dashboard approprié selon le rôle
          if (userRole === 'ENSEIGNANT' || userRole === 'TEACHER') {
            this.router.navigate(['/teacher/dashboard']);
          } else {
            this.router.navigate(['/admin/dashboard']);
          }
          return false;
        }
        return true;
      }
      
      if (requiredRoleUpper === 'USER') {
        // Les routes USER sont accessibles aux ENSEIGNANT et ADMINISTRATEUR
        if (userRole === 'ENSEIGNANT' || userRole === 'TEACHER' || userRole === 'ADMINISTRATEUR' || userRole === 'ADMIN') {
          return true;
        }
        // Si le rôle ne correspond pas, rediriger vers le dashboard approprié
        if (userRole === 'ADMINISTRATEUR' || userRole === 'ADMIN') {
          this.router.navigate(['/admin/dashboard']);
        } else {
          this.router.navigate(['/teacher/dashboard']);
        }
        return false;
      }
    }

    return true;
  }
}

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot, state: RouterStateSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const guard = new AuthGuard(authService, router);
  return guard.canActivate(route, state);
};
