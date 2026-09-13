/**
 * Auth Service
 * Service d'authentification JWT
 * Port backend: 8081
 */

import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError, timer } from 'rxjs';
import { tap, catchError, switchMap } from 'rxjs/operators';
import { LoginRequest, LoginResponse, RegisterRequest, RegisterResponse, AuthUser, RefreshTokenRequest } from '../models';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = '/api/auth';

  private currentUserSubject = new BehaviorSubject<AuthUser | null>(this.loadUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient) {
    this.setupTokenRefresh();
  }

  /**
   * Login user
   * POST /api/auth/login
   */
  login(credentials: LoginRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(this.handleError)
      );
  }

  /**
   * Register new user
   * POST /api/auth/register
   */
  register(data: RegisterRequest): Observable<RegisterResponse> {
    return this.http.post<RegisterResponse>(`${this.apiUrl}/register`, data)
      .pipe(
        catchError(this.handleError)
      );
  }

  /**
   * Refresh token
   * POST /api/auth/refresh
   */
  refreshToken(): Observable<LoginResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    const request: RefreshTokenRequest = { refreshToken };
    return this.http.post<LoginResponse>(`${this.apiUrl}/refresh`, request)
      .pipe(
        tap(response => this.handleAuthResponse(response)),
        catchError(error => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  /**
   * Logout user
   */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);
    
    // Empêcher le retour en arrière après déconnexion
    // Remplacer l'historique pour empêcher la navigation en arrière
    if (typeof window !== 'undefined' && window.history) {
      // Remplacer l'état actuel par la page de login
      window.history.replaceState(null, '', '/login');
      // Ajouter un nouvel état pour la page de login (empêche le retour)
      window.history.pushState(null, '', '/login');
    }
  }

  /**
   * Get current token
   */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /**
   * Get refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  /**
   * Get current user
   */
  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  /**
   * Get current user observable
   */
  getCurrentUser$(): Observable<AuthUser | null> {
    return this.currentUserSubject.asObservable();
  }

  /**
   * Handle auth response
   */
  private handleAuthResponse(response: LoginResponse): void {
    localStorage.setItem('token', response.token);
    localStorage.setItem('refreshToken', response.refreshToken);

    const user: AuthUser = {
      id: response.userId,
      email: response.email,
      firstName: response.firstName,
      lastName: response.lastName,
      role: response.role || 'USER',
      profilePhoto: response.profilePhoto,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };

    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
    this.isAuthenticatedSubject.next(true);
  }

  /**
   * Load user from storage
   */
  private loadUserFromStorage(): AuthUser | null {
    const user = localStorage.getItem('currentUser');
    return user ? JSON.parse(user) : null;
  }

  /**
   * Check if user has token
   */
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }

  /**
   * Setup automatic token refresh
   * Refresh token 5 minutes before expiration
   */
  private setupTokenRefresh(): void {
    this.isAuthenticated$.subscribe(isAuth => {
      if (isAuth) {
        const token = this.getToken();
        if (token) {
          const exp = this.getTokenExpiration(token);
          if (exp) {
            const now = Date.now();
            const refreshTime = Math.max(0, exp - now - 5 * 60 * 1000); // 5 min before expiry

            timer(refreshTime).pipe(
              switchMap(() => this.refreshToken())
            ).subscribe({
              error: () => this.logout()
            });
          }
        }
      }
    });
  }

  /**
   * Get token expiration time
   */
  private getTokenExpiration(token: string): number | null {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp ? payload.exp * 1000 : null;
    } catch {
      return null;
    }
  }

  /**
   * Handle HTTP errors
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Une erreur est survenue';

    if (error.error instanceof ErrorEvent) {
      // Erreur côté client (erreur réseau, connexion refusée, etc.)
      const clientError = error.error.message || '';
      if (clientError.includes('Connection refused') || clientError.includes('getsockopt')) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le Gateway est démarré sur le port 8080.';
      } else {
        errorMessage = `Erreur réseau: ${clientError}`;
      }
    } else {
      // Erreur côté serveur
      
      // Détecter si la réponse est du HTML (ex: page d'erreur Nginx 504)
      const isHtmlResponse = typeof error.error === 'string' && error.error.includes('<!DOCTYPE html>');
      
      if (isHtmlResponse) {
        if (error.status === 504) {
          errorMessage = 'Le serveur met trop de temps à répondre (Délai d\'attente dépassé). Veuillez réessayer dans quelques instants.';
        } else if (error.status === 502) {
          errorMessage = 'Le service est temporairement indisponible (Mauvaise passerelle).';
        } else {
          errorMessage = 'Une erreur inattendue est survenue sur le serveur.';
        }
      } else if (error.error?.message) {
        errorMessage = error.error.message;
      } else if (error.error?.errorMessage) {
        errorMessage = error.error.errorMessage;
      } else if (typeof error.error === 'string' && error.error.length < 200) {
        errorMessage = error.error;
      } else if (error.status === 401) {
        errorMessage = 'Email ou mot de passe incorrect';
      } else if (error.status === 403) {
        // Pour les comptes bloqués, le message vient du serveur
        errorMessage = error.error?.message || 
                      error.error?.errorMessage || 
                      'Votre compte est désactivé. Veuillez contacter un administrateur pour réactiver votre compte.';
      } else if (error.status === 404) {
        errorMessage = 'Ressource introuvable.';
      } else if (error.status === 500) {
        errorMessage = error.error?.message || error.error?.errorMessage || 'Erreur serveur. Veuillez réessayer plus tard.';
      } else if (error.status === 504) {
        errorMessage = 'Le serveur met trop de temps à répondre. Veuillez réessayer.';
      } else if (error.status === 0) {
        errorMessage = 'Impossible de se connecter au serveur. Vérifiez votre connexion internet ou que le service est démarré.';
      } else {
        errorMessage = error.error?.message || error.error?.errorMessage || `Erreur ${error.status}: ${error.message}`;
      }
    }

    // Créer une erreur qui préserve le statut HTTP si disponible
    const customError: any = new Error(errorMessage);
    if (error.status !== undefined) {
      customError.status = error.status;
    }
    if (error.error) {
      customError.error = error.error;
    }
    return throwError(() => customError);
  }

  /**
   * Forgot password - Request reset code
   * POST /api/auth/forgot-password
   */
  forgotPassword(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/forgot-password`, { email })
      .pipe(catchError(this.handleError));
  }

  /**
   * Verify reset code and reset password
   * POST /api/auth/verify-reset-code
   */
  verifyResetCode(email: string, code: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/verify-reset-code`, { email, code })
      .pipe(catchError(this.handleError));
  }
}
