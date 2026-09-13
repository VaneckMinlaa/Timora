import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-verify-reset-code',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './verify-reset-code.component.html',
  styleUrls: ['./verify-reset-code.component.scss']
})
export class VerifyResetCodeComponent implements OnInit {
  verifyCodeForm!: FormGroup;
  isLoading: boolean = false;
  errorMessage: string = '';
  email: string = '';
  showSuccessPopup: boolean = false;
  private popupTimeout: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    // Créer 6 FormControls séparés pour chaque chiffre
    const codeControls: { [key: string]: any } = {};
    for (let i = 0; i < 6; i++) {
      codeControls[`code${i}`] = ['', [Validators.required, Validators.pattern(/^[0-9]$/)]];
    }
    this.verifyCodeForm = this.fb.group(codeControls);
  }

  ngOnInit(): void {
    // Récupérer l'email depuis les query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      if (!this.email) {
        // Si pas d'email, rediriger vers forgot-password
        this.router.navigate(['/auth/forgot-password']);
      }
    });

    // Focus sur le premier input après le rendu
    setTimeout(() => {
      const firstInput = document.getElementById('code-0');
      if (firstInput) {
        (firstInput as HTMLInputElement).focus();
      }
    }, 100);
  }

  get code(): AbstractControl | null {
    // Construire le code complet à partir des 6 inputs
    const codeValue = this.getFullCode();
    return codeValue ? this.fb.control(codeValue, [Validators.required, Validators.pattern(/^[0-9]{6}$/)]) : null;
  }

  getFullCode(): string {
    let code = '';
    for (let i = 0; i < 6; i++) {
      const value = this.verifyCodeForm.get(`code${i}`)?.value || '';
      code += value;
    }
    return code;
  }

  onCodeInput(index: number, event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = input.value.replace(/[^0-9]/g, ''); // Ne garder que les chiffres

    // Mettre à jour la valeur
    this.verifyCodeForm.get(`code${index}`)?.setValue(value);

    // Si un chiffre est entré et qu'on n'est pas sur le dernier input, passer au suivant
    if (value && index < 5) {
      const nextInput = document.getElementById(`code-${index + 1}`);
      if (nextInput) {
        (nextInput as HTMLInputElement).focus();
      }
    }

    // Vérifier si tous les champs sont remplis
    this.checkCodeComplete();
  }

  onCodeKeyDown(index: number, event: KeyboardEvent): void {
    const input = event.target as HTMLInputElement | null;
    // Si Backspace et que le champ est vide, revenir au champ précédent
    if (event.key === 'Backspace' && input && !input.value && index > 0) {
      const prevInput = document.getElementById(`code-${index - 1}`);
      if (prevInput) {
        (prevInput as HTMLInputElement).focus();
      }
    }
  }

  onCodePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6);

    for (let i = 0; i < 6; i++) {
      const value = digits[i] || '';
      this.verifyCodeForm.get(`code${i}`)?.setValue(value);
    }

    // Focus sur le dernier input rempli ou le premier vide
    const lastFilledIndex = Math.min(digits.length - 1, 5);
    const nextInput = document.getElementById(`code-${lastFilledIndex}`);
    if (nextInput) {
      (nextInput as HTMLInputElement).focus();
    }

    this.checkCodeComplete();
  }

  checkCodeComplete(): void {
    const fullCode = this.getFullCode();
    if (fullCode.length === 6) {
      // Auto-soumission si le code est complet
      setTimeout(() => {
        this.onSubmit();
      }, 300);
    }
  }

  onSubmit(): void {
    const fullCode = this.getFullCode();

    if (fullCode.length !== 6) {
      // Marquer tous les champs comme touchés
      for (let i = 0; i < 6; i++) {
        this.verifyCodeForm.get(`code${i}`)?.markAsTouched();
      }
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.verifyResetCode(this.email, fullCode).subscribe({
      next: (response) => {
        this.isLoading = false;
        // Afficher le popup de validation
        this.showSuccessPopup = true;
        // Rediriger vers la page de login après 3 secondes
        this.popupTimeout = setTimeout(() => {
          this.goToLogin();
        }, 3000);
      },
      error: (error: any) => {
        this.isLoading = false;
        console.error('Erreur lors de la vérification du code:', error);

        if (error.error?.message) {
          this.errorMessage = error.error.message;
        } else {
          this.errorMessage = 'Code invalide ou expiré. Veuillez réessayer.';
        }

        // Réinitialiser les champs en cas d'erreur
        for (let i = 0; i < 6; i++) {
          this.verifyCodeForm.get(`code${i}`)?.setValue('');
        }
        const firstInput = document.getElementById('code-0');
        if (firstInput) {
          (firstInput as HTMLInputElement).focus();
        }
      }
    });
  }

  goToLogin(): void {
    // Nettoyer le timeout si présent
    if (this.popupTimeout) {
      clearTimeout(this.popupTimeout);
    }
    // Masquer le popup
    this.showSuccessPopup = false;
    // Rediriger vers la page de login
    this.router.navigate(['/auth/login']);
  }

  onResendCode(): void {
    this.authService.forgotPassword(this.email).subscribe({
      next: () => {
        this.errorMessage = '';
        alert('Un nouveau code a été envoyé à votre adresse email');
        // Réinitialiser les champs
        for (let i = 0; i < 6; i++) {
          this.verifyCodeForm.get(`code${i}`)?.setValue('');
        }
        const firstInput = document.getElementById('code-0');
        if (firstInput) {
          (firstInput as HTMLInputElement).focus();
        }
      },
      error: (error: any) => {
        console.error('Erreur lors du renvoi du code:', error);
        this.errorMessage = 'Erreur lors du renvoi du code. Veuillez réessayer.';
      }
    });
  }
}
