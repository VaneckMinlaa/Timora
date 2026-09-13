import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';
import { LoginRequest } from '../../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit, OnDestroy {
  loginForm!: FormGroup;
  showPassword: boolean = false;
  isLoading: boolean = false;
  errorMessage: string = '';
  infoMessage: string = '';
  private popStateListener?: () => void;

  constructor(
    private router: Router,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    // Vérifier s'il y a un message dans les query params (ex: après redirection depuis register)
    const urlParams = new URLSearchParams(window.location.search);
    const message = urlParams.get('message');
    if (message) {
      this.infoMessage = decodeURIComponent(message);
    }
  }

  ngOnInit(): void {
    // Empêcher le retour en arrière après déconnexion
    // Remplacer l'historique pour que le bouton retour ne fonctionne pas
    if (window.history.length > 1) {
      window.history.replaceState(null, '', '/login');
    }
    
    // Ajouter un listener pour empêcher le retour en arrière vers les pages protégées
    this.popStateListener = () => {
      // Si l'utilisateur n'est pas authentifié, empêcher le retour vers les pages protégées
      if (!this.authService.isAuthenticated()) {
        // Empêcher la navigation en arrière et rester sur la page de login
        window.history.pushState(null, '', '/login');
      }
    };
    window.addEventListener('popstate', this.popStateListener);
    
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email, this.emailValidator]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      rememberMe: [false]
    });

    // Effacer les erreurs de connexion quand l'utilisateur commence à taper
    this.loginForm.valueChanges.subscribe(() => {
      if (this.errorMessage) {
        this.errorMessage = '';
      }
      if (this.infoMessage) {
        this.infoMessage = '';
      }
      // Effacer les erreurs de connexion (incorrect) pour permettre une nouvelle tentative
      if (this.email?.hasError('incorrect')) {
        const emailErrors = { ...this.email.errors };
        delete emailErrors['incorrect'];
        this.email.setErrors(Object.keys(emailErrors).length > 0 ? emailErrors : null);
      }
      if (this.password?.hasError('incorrect')) {
        const passwordErrors = { ...this.password.errors };
        delete passwordErrors['incorrect'];
        this.password.setErrors(Object.keys(passwordErrors).length > 0 ? passwordErrors : null);
      }
    });
  }

  // Validateur personnalisé pour email
  emailValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(control.value) ? null : { invalidEmail: true };
  }

  // Getters pour faciliter l'accès aux contrôles dans le template
  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }

  get rememberMe() {
    return this.loginForm.get('rememberMe')?.value || false;
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['required']) {
        return `${fieldName === 'email' ? 'L\'email' : 'Le mot de passe'} est requis`;
      }
      if (field.errors['email'] || field.errors['invalidEmail']) {
        return 'Format d\'email invalide';
      }
      if (field.errors['minlength']) {
        return 'Le mot de passe doit contenir au moins 6 caractères';
      }
    }
    return '';
  }

  onSubmit(): void {
    // Vérifier les erreurs de validation (required, email, minLength)
    // Mais permettre la soumission même avec des erreurs 'incorrect' (erreurs de connexion)
    const hasValidationErrors = 
      !this.email?.value || 
      !this.password?.value || 
      (this.email?.hasError('required') || this.email?.hasError('email')) ||
      (this.password?.hasError('required') || this.password?.hasError('minlength'));

    if (hasValidationErrors) {
      // Marquer tous les champs comme touchés pour afficher les erreurs de validation
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading = true;
    // Réinitialiser uniquement les erreurs de connexion (incorrect)
    // Garder les erreurs de validation si elles existent
    if (this.email?.hasError('incorrect')) {
      const emailErrors = { ...this.email.errors };
      delete emailErrors['incorrect'];
      this.email.setErrors(Object.keys(emailErrors).length > 0 ? emailErrors : null);
    }
    if (this.password?.hasError('incorrect')) {
      const passwordErrors = { ...this.password.errors };
      delete passwordErrors['incorrect'];
      this.password.setErrors(Object.keys(passwordErrors).length > 0 ? passwordErrors : null);
    }

    const loginRequest: LoginRequest = {
      email: this.email?.value,
      password: this.password?.value
    };

    this.authService.login(loginRequest).subscribe({
      next: (response) => {
        this.isLoading = false;
        console.log('Connexion réussie:', response);
        
        // Récupérer l'URL de retour si présente
        const returnUrl = new URLSearchParams(window.location.search).get('returnUrl');
        
        // Récupérer l'utilisateur connecté
        const user = this.authService.getCurrentUser();
        
        if (returnUrl) {
          // Si une URL de retour est spécifiée, l'utiliser
          this.router.navigateByUrl(returnUrl);
        } else if (user) {
          // Rediriger selon le rôle de l'utilisateur
          const userRole = user.role?.toUpperCase();
          
          if (userRole === 'ADMINISTRATEUR' || userRole === 'ADMIN') {
            // Rediriger les administrateurs vers le dashboard admin
            this.router.navigate(['/admin/dashboard']);
          } else if (userRole === 'ENSEIGNANT' || userRole === 'TEACHER') {
            // Rediriger les enseignants vers le dashboard enseignant
            this.router.navigate(['/teacher/dashboard']);
          } else {
            // Fallback vers dashboard si pas d'utilisateur
            this.router.navigate(['/dashboard']);
          }
        } else {
          // Fallback vers dashboard si pas d'utilisateur
          this.router.navigate(['/dashboard']);
        }
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Erreur de connexion:', error);
        console.error('Error details:', {
          status: error.status,
          message: error.message,
          error: error.error,
          errorMessage: error.error?.message
        });
        
        // Récupérer le message d'erreur (vérifier toutes les propriétés possibles)
        // Priorité: error.error.message > error.error.errorMessage > error.message > error.errorMessage > error.error (string)
        let errorMessage = '';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.error?.errorMessage) {
          errorMessage = error.error.errorMessage;
        } else if (error.message) {
          errorMessage = error.message;
        } else if ((error as any).errorMessage) {
          errorMessage = (error as any).errorMessage;
        } else if (typeof error.error === 'string') {
          errorMessage = error.error;
        }
        
        console.log('Message d\'erreur extrait:', errorMessage);
        console.log('error.error:', error.error);
        console.log('error.error.message:', error.error?.message);
        console.log('error.error.errorMessage:', error.error?.errorMessage);
        console.log('error.message:', error.message);
        console.log('error.errorMessage:', (error as any).errorMessage);
        
        // Si errorMessage est vide, essayer de le récupérer directement depuis error
        if (!errorMessage || errorMessage.trim().length === 0) {
          if (error.message) {
            errorMessage = error.message;
          } else if ((error as any).errorMessage) {
            errorMessage = (error as any).errorMessage;
          }
        }
        
        let errorMessageLower = errorMessage ? errorMessage.toLowerCase() : '';
        const httpStatus = error.status; // Peut être undefined si l'erreur vient de handleError
        
        // Vérifier si le compte est désactivé/bloqué
        // Priorité: message d'erreur > statut HTTP
        const isAccountDisabled = httpStatus === 403 ||
                                  errorMessageLower.includes('désactivé') || 
                                  errorMessageLower.includes('inactif') ||
                                  errorMessageLower.includes('bloqué') ||
                                  errorMessageLower.includes('disabled') ||
                                  errorMessageLower.includes('inactive') ||
                                  errorMessageLower.includes('blocked') ||
                                  errorMessageLower.includes('réactiver') ||
                                  errorMessageLower.includes('administrateur') ||
                                  errorMessageLower.includes('support it');
        
        // Vérifier si c'est un problème de mot de passe incorrect
        const isPasswordIncorrect = (httpStatus === 401 && !isAccountDisabled) ||
                                    (errorMessageLower.includes('mot de passe incorrect') && !isAccountDisabled) ||
                                    (errorMessageLower.includes('email ou mot de passe incorrect') && !isAccountDisabled) ||
                                    (errorMessageLower.includes('password incorrect') && !isAccountDisabled);
        
        // Afficher le message d'erreur approprié
        if (isAccountDisabled) {
          // Toujours utiliser le message du serveur s'il est disponible
          if (errorMessage && errorMessage.trim().length > 0) {
            this.errorMessage = errorMessage;
          } else {
            // Message par défaut si aucun message du serveur
            this.errorMessage = 'Votre compte est désactivé. Veuillez contacter un administrateur pour réactiver votre compte.';
          }
        } else if (isPasswordIncorrect) {
          // Utiliser le message du serveur s'il est disponible
          if (errorMessage && errorMessage.trim().length > 0) {
            this.errorMessage = errorMessage;
          } else {
            this.errorMessage = 'Email ou mot de passe incorrect';
          }
        } else if (errorMessage && errorMessage.trim().length > 0) {
          // Utiliser le message d'erreur disponible
          this.errorMessage = errorMessage;
        } else if (httpStatus === 0 || (errorMessageLower && (errorMessageLower.includes('connection refused') || 
                   errorMessageLower.includes('getsockopt')))) {
          // Erreur de connexion réseau
          this.errorMessage = 'Impossible de se connecter au serveur. Vérifiez que le Gateway est démarré sur le port 8080.';
        } else if (httpStatus === 500) {
          // Erreur serveur - essayer d'extraire le message
          this.errorMessage = errorMessage || 'Erreur serveur. Veuillez réessayer plus tard.';
        } else {
          this.errorMessage = 'Une erreur est survenue. Veuillez réessayer.';
        }
        
        console.log('Message d\'erreur final affiché:', this.errorMessage);
        console.log('errorMessage variable:', errorMessage);
        console.log('isAccountDisabled:', isAccountDisabled);
        
        // Marquer les champs comme invalides pour les colorer en rouge
        if (isPasswordIncorrect) {
          // Erreur de mot de passe : marquer les deux champs
          this.email?.markAsTouched();
          this.email?.setErrors({ 'incorrect': true });
          this.password?.markAsTouched();
          this.password?.setErrors({ 'incorrect': true });
        } else if (isAccountDisabled) {
          // Compte bloqué : marquer seulement l'email
          this.email?.markAsTouched();
          this.email?.setErrors({ 'incorrect': true });
          this.password?.clearValidators();
          this.password?.updateValueAndValidity();
        } else {
          // Autres erreurs : marquer seulement l'email
          this.email?.markAsTouched();
          this.email?.setErrors({ 'incorrect': true });
        }
      }
    });
  }

  onForgotPassword(event: Event): void {
    event.preventDefault();
    this.router.navigate(['/auth/forgot-password']);
  }

  ngOnDestroy(): void {
    // Nettoyer le listener pour éviter les fuites mémoire
    if (this.popStateListener) {
      window.removeEventListener('popstate', this.popStateListener);
    }
  }

  onGoogleSignIn(): void {
    console.log('Google sign in clicked');
    // TODO: Implémenter la connexion Google
  }
}
