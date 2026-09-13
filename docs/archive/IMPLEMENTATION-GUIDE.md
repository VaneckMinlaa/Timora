# 🎯 FrontEnd_Timora - Implementation Guide

**Phase 1:** Auth Components  
**Durée estimée:** 3-5 jours  
**Complexité:** Faible (infrastructure en place)

---

## 📋 Fichiers à Créer (Phase 1)

### Étape 1: Créer LoginComponent

```bash
ng generate component features/auth/pages/login --skip-tests
```

**Fichiers générés:**
- `src/app/features/auth/pages/login/login.component.ts`
- `src/app/features/auth/pages/login/login.component.html`
- `src/app/features/auth/pages/login/login.component.scss`

### Étape 2: Créer RegisterComponent

```bash
ng generate component features/auth/pages/register --skip-tests
```

**Fichiers générés:**
- `src/app/features/auth/pages/register/register.component.ts`
- `src/app/features/auth/pages/register/register.component.html`
- `src/app/features/auth/pages/register/register.component.scss`

### Étape 3: Créer DashboardComponent (minimal)

```bash
ng generate component features/dashboard/pages/dashboard --skip-tests
```

---

## 💻 Code Template LoginComponent

### login.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { LoginRequest } from '../../../core/models';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  onLogin(): void {
    if (this.loginForm.invalid) {
      this.error = 'Please fill in all fields correctly';
      return;
    }

    this.loading = true;
    this.error = null;

    const credentials: LoginRequest = this.loginForm.value;

    this.authService.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: (error) => {
        this.error = error.message || 'Login failed. Please try again.';
        this.loading = false;
      }
    });
  }

  get email() {
    return this.loginForm.get('email');
  }

  get password() {
    return this.loginForm.get('password');
  }
}
```

### login.component.html

```html
<div class="login-container">
  <div class="login-card">
    <h1>Timora</h1>
    <p class="subtitle">Room Reservation System</p>

    <form [formGroup]="loginForm" (ngSubmit)="onLogin()" class="login-form">
      <!-- Email Field -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          placeholder="Enter your email"
          class="form-control"
          [class.is-invalid]="email?.invalid && email?.touched"
        />
        <div *ngIf="email?.invalid && email?.touched" class="error-message">
          <span *ngIf="email?.errors?.['required']">Email is required</span>
          <span *ngIf="email?.errors?.['email']">Invalid email format</span>
        </div>
      </div>

      <!-- Password Field -->
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          placeholder="Enter your password"
          class="form-control"
          [class.is-invalid]="password?.invalid && password?.touched"
        />
        <div *ngIf="password?.invalid && password?.touched" class="error-message">
          <span *ngIf="password?.errors?.['required']">Password is required</span>
          <span *ngIf="password?.errors?.['minlength']">Minimum 6 characters</span>
        </div>
      </div>

      <!-- Global Error -->
      <div *ngIf="error" class="alert alert-error">
        {{ error }}
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn btn-primary btn-block"
        [disabled]="loginForm.invalid || loading"
      >
        {{ loading ? 'Logging in...' : 'Login' }}
      </button>
    </form>

    <!-- Register Link -->
    <p class="register-link">
      Don't have an account? <a routerLink="/register">Register here</a>
    </p>
  </div>
</div>
```

### login.component.scss

```scss
.login-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .login-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    padding: 40px;
    width: 100%;
    max-width: 400px;

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .login-form {
      .form-group {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.3s;

          &:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          &.is-invalid {
            border-color: #e74c3c;
          }
        }

        .error-message {
          color: #e74c3c;
          font-size: 12px;
          margin-top: 5px;
        }
      }

      .alert {
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 20px;
        font-size: 14px;

        &.alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #e74c3c;
        }
      }

      .btn {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.3s;

        &.btn-primary {
          background: #667eea;
          color: white;

          &:hover:not(:disabled) {
            background: #5568d3;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        &.btn-block {
          display: block;
          width: 100%;
        }
      }
    }

    .register-link {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #666;

      a {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
```

---

## 💻 Code Template RegisterComponent

### register.component.ts

```typescript
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';
import { RegisterRequest } from '../../../core/models';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss'
})
export class RegisterComponent implements OnInit {
  registerForm!: FormGroup;
  loading = false;
  error: string | null = null;
  success = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.registerForm = this.fb.group(
      {
        firstName: ['', [Validators.required, Validators.minLength(2)]],
        lastName: ['', [Validators.required, Validators.minLength(2)]],
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required, Validators.minLength(6)]],
        confirmPassword: ['', Validators.required],
        phone: ['']
      },
      { validators: this.passwordMatchValidator }
    );
  }

  onRegister(): void {
    if (this.registerForm.invalid) {
      this.error = 'Please fill in all required fields correctly';
      return;
    }

    this.loading = true;
    this.error = null;

    const { confirmPassword, ...data } = this.registerForm.value;
    const registerData: RegisterRequest = data;

    this.authService.register(registerData).subscribe({
      next: () => {
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2000);
      },
      error: (error) => {
        this.error = error.message || 'Registration failed. Please try again.';
        this.loading = false;
      }
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password && confirmPassword && password !== confirmPassword) {
      return { passwordMismatch: true };
    }
    return null;
  }

  get firstName() {
    return this.registerForm.get('firstName');
  }

  get lastName() {
    return this.registerForm.get('lastName');
  }

  get email() {
    return this.registerForm.get('email');
  }

  get password() {
    return this.registerForm.get('password');
  }

  get confirmPassword() {
    return this.registerForm.get('confirmPassword');
  }
}
```

### register.component.html

```html
<div class="register-container">
  <div class="register-card">
    <h1>Create Account</h1>
    <p class="subtitle">Join Timora - Room Reservation System</p>

    <div *ngIf="success" class="alert alert-success">
      Registration successful! Redirecting to login...
    </div>

    <form [formGroup]="registerForm" (ngSubmit)="onRegister()" class="register-form">
      <!-- First Name -->
      <div class="form-group">
        <label for="firstName">First Name</label>
        <input
          id="firstName"
          type="text"
          formControlName="firstName"
          placeholder="Enter your first name"
          class="form-control"
          [class.is-invalid]="firstName?.invalid && firstName?.touched"
        />
        <div *ngIf="firstName?.invalid && firstName?.touched" class="error-message">
          <span *ngIf="firstName?.errors?.['required']">First name is required</span>
          <span *ngIf="firstName?.errors?.['minlength']">Minimum 2 characters</span>
        </div>
      </div>

      <!-- Last Name -->
      <div class="form-group">
        <label for="lastName">Last Name</label>
        <input
          id="lastName"
          type="text"
          formControlName="lastName"
          placeholder="Enter your last name"
          class="form-control"
          [class.is-invalid]="lastName?.invalid && lastName?.touched"
        />
        <div *ngIf="lastName?.invalid && lastName?.touched" class="error-message">
          <span *ngIf="lastName?.errors?.['required']">Last name is required</span>
          <span *ngIf="lastName?.errors?.['minlength']">Minimum 2 characters</span>
        </div>
      </div>

      <!-- Email -->
      <div class="form-group">
        <label for="email">Email</label>
        <input
          id="email"
          type="email"
          formControlName="email"
          placeholder="Enter your email"
          class="form-control"
          [class.is-invalid]="email?.invalid && email?.touched"
        />
        <div *ngIf="email?.invalid && email?.touched" class="error-message">
          <span *ngIf="email?.errors?.['required']">Email is required</span>
          <span *ngIf="email?.errors?.['email']">Invalid email format</span>
        </div>
      </div>

      <!-- Phone (optional) -->
      <div class="form-group">
        <label for="phone">Phone (Optional)</label>
        <input
          id="phone"
          type="tel"
          formControlName="phone"
          placeholder="Enter your phone number"
          class="form-control"
        />
      </div>

      <!-- Password -->
      <div class="form-group">
        <label for="password">Password</label>
        <input
          id="password"
          type="password"
          formControlName="password"
          placeholder="Enter your password"
          class="form-control"
          [class.is-invalid]="password?.invalid && password?.touched"
        />
        <div *ngIf="password?.invalid && password?.touched" class="error-message">
          <span *ngIf="password?.errors?.['required']">Password is required</span>
          <span *ngIf="password?.errors?.['minlength']">Minimum 6 characters</span>
        </div>
      </div>

      <!-- Confirm Password -->
      <div class="form-group">
        <label for="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          formControlName="confirmPassword"
          placeholder="Confirm your password"
          class="form-control"
          [class.is-invalid]="confirmPassword?.invalid && confirmPassword?.touched"
        />
        <div *ngIf="confirmPassword?.invalid && confirmPassword?.touched" class="error-message">
          <span *ngIf="confirmPassword?.errors?.['required']">Confirm password is required</span>
          <span *ngIf="registerForm.errors?.['passwordMismatch']">Passwords do not match</span>
        </div>
      </div>

      <!-- Global Error -->
      <div *ngIf="error" class="alert alert-error">
        {{ error }}
      </div>

      <!-- Submit Button -->
      <button
        type="submit"
        class="btn btn-primary btn-block"
        [disabled]="registerForm.invalid || loading"
      >
        {{ loading ? 'Creating account...' : 'Register' }}
      </button>
    </form>

    <!-- Login Link -->
    <p class="login-link">
      Already have an account? <a routerLink="/login">Login here</a>
    </p>
  </div>
</div>
```

### register.component.scss

```scss
.register-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 20px;

  .register-card {
    background: white;
    border-radius: 8px;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
    padding: 40px;
    width: 100%;
    max-width: 500px;

    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 28px;
    }

    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }

    .register-form {
      .form-group {
        margin-bottom: 20px;

        label {
          display: block;
          margin-bottom: 8px;
          font-weight: 500;
          color: #333;
          font-size: 14px;
        }

        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 14px;
          transition: border-color 0.3s;

          &:focus {
            outline: none;
            border-color: #667eea;
            box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
          }

          &.is-invalid {
            border-color: #e74c3c;
          }
        }

        .error-message {
          color: #e74c3c;
          font-size: 12px;
          margin-top: 5px;
        }
      }

      .alert {
        padding: 12px;
        border-radius: 4px;
        margin-bottom: 20px;
        font-size: 14px;

        &.alert-error {
          background: #fee;
          color: #c33;
          border: 1px solid #e74c3c;
        }

        &.alert-success {
          background: #efe;
          color: #3c3;
          border: 1px solid #27ae60;
        }
      }

      .btn {
        width: 100%;
        padding: 10px;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: background 0.3s;

        &.btn-primary {
          background: #667eea;
          color: white;

          &:hover:not(:disabled) {
            background: #5568d3;
          }

          &:disabled {
            opacity: 0.6;
            cursor: not-allowed;
          }
        }

        &.btn-block {
          display: block;
          width: 100%;
        }
      }
    }

    .login-link {
      text-align: center;
      margin-top: 20px;
      font-size: 14px;
      color: #666;

      a {
        color: #667eea;
        text-decoration: none;
        font-weight: 500;

        &:hover {
          text-decoration: underline;
        }
      }
    }
  }
}
```

---

## 📋 Checklist Phase 1

- [ ] Créer LoginComponent avec `ng g c`
- [ ] Copier code TypeScript
- [ ] Copier code HTML
- [ ] Copier code SCSS
- [ ] Tester valeurs par défaut (email: test@example.com, pwd: password)
- [ ] Tester formulaire invalide (vérifier validation)
- [ ] Tester soumission (appelle AuthService.login)
- [ ] Tester redirection (vers /dashboard au succès)
- [ ] Tester erreur (affiche message)
- [ ] Créer RegisterComponent
- [ ] Tests complets Register
- [ ] Tests intégration Auth<->API Gateway
- [ ] Tests JWT token storage
- [ ] Tests token refresh (401 handling)
- [ ] Tests AuthGuard
- [ ] Tests redirection après login

---

## 🎯 Test Planning

### Test 1: Form Validation
```typescript
it('should disable submit button when form invalid', () => {
  component.loginForm.patchValue({
    email: 'invalid',
    password: ''
  });
  expect(component.loginForm.invalid).toBe(true);
});
```

### Test 2: API Call
```typescript
it('should call authService.login with credentials', () => {
  spyOn(authService, 'login').and.returnValue(of(mockResponse));
  component.onLogin();
  expect(authService.login).toHaveBeenCalledWith(credentials);
});
```

### Test 3: Redirection
```typescript
it('should navigate to dashboard on success', () => {
  spyOn(router, 'navigate');
  component.onLogin();
  fixture.detectChanges();
  expect(router.navigate).toHaveBeenCalledWith(['/dashboard']);
});
```

---

## ✅ Commandes à Lancer

```bash
# Génération automatique
ng g c features/auth/pages/login --skip-tests
ng g c features/auth/pages/register --skip-tests

# Ou avec tests:
ng g c features/auth/pages/login
ng g c features/auth/pages/register

# Copier/coller le code depuis ce guide

# Tester
ng serve --proxy-config proxy.conf.json --open
```

---

**Status:** 🚀 Prêt à implémenter Phase 1  
**Temps estimé:** 3-5 jours  
**Difficullté:** ⭐ Faible (infrastructure en place)

Commencez par créer les components et testez avec le backend! 🎯
