/**
 * API Interceptor
 * Ajoute le token JWT à chaque requête
 */

import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AuthService } from '../services/auth.service';

@Injectable()
export class ApiInterceptor implements HttpInterceptor {
  private isRefreshing = false;

  constructor(private authService: AuthService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Add token to request
    const token = this.authService.getToken();
    if (token) {
      request = this.addToken(request, token);
    }

    return next.handle(request).pipe(
      catchError(error => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.handle401Error(request, next);
        }
        return throwError(() => error);
      })
    );
  }

  /**
   * Add JWT token to request header
   */
  private addToken(request: HttpRequest<any>, token: string): HttpRequest<any> {
    return request.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  /**
   * Handle 401 Unauthorized errors
   * Attempt token refresh
   */
  private handle401Error(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    if (!this.isRefreshing) {
      this.isRefreshing = true;

      return this.authService.refreshToken().pipe(
        switchMap((response) => {
          this.isRefreshing = false;
          const token = this.authService.getToken();
          if (token) {
            return next.handle(this.addToken(request, token));
          }
          return throwError(() => new Error('Failed to refresh token'));
        }),
        catchError((error) => {
          this.isRefreshing = false;
          this.authService.logout();
          return throwError(() => error);
        })
      );
    }

    // Wait for token refresh to complete
    return this.waitForTokenRefresh().pipe(
      switchMap(() => {
        const token = this.authService.getToken();
        if (token) {
          return next.handle(this.addToken(request, token));
        }
        return throwError(() => new Error('No token available'));
      })
    );
  }

  /**
   * Wait for token refresh to complete
   */
  private waitForTokenRefresh(): Observable<void> {
    return new Observable(observer => {
      const checkToken = setInterval(() => {
        if (!this.isRefreshing) {
          clearInterval(checkToken);
          observer.next();
          observer.complete();
        }
      }, 100);
    });
  }
}
