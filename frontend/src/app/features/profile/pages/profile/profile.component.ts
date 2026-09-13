import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl, ValidationErrors } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthUser, UpdateUserRequest, ChangePasswordRequest } from '../../../../core/models';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';
import { AdminHeaderComponent } from '../../../admin/components/admin-header/admin-header.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, RouterModule, ReactiveFormsModule, Sidebar, TeacherHeaderComponent, AdminHeaderComponent],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.scss']
})
export class ProfileComponent implements OnInit {
  currentUser: AuthUser | null = null;
  userInitials: string = 'U';
  avatarColor: string = '#2563eb';
  profilePhotoUrl: string | undefined = undefined;
  profilePhotoFile: File | null = null;
  profilePhotoFileName: string = 'Profile-pic.jpg';
  isAdmin: boolean = false;
  isTeacher: boolean = false;
  isLoading: boolean = false;
  isUpdatingPhoto: boolean = false;
  isUpdatingInfo: boolean = false;
  isChangingPassword: boolean = false;
  updateSuccess: boolean = false;
  updateError: string = '';
  passwordSuccess: boolean = false;
  passwordError: string = '';

  // Formulaire pour les informations utilisateur
  userInfoForm: FormGroup;

  // Formulaire pour le changement de mot de passe
  passwordForm: FormGroup;

  private authService = inject(AuthService);
  private userService = inject(UserService);
  private fb = inject(FormBuilder);

  constructor() {
    // Initialiser le formulaire des informations utilisateur
    this.userInfoForm = this.fb.group({
      fullName: ['', [Validators.required, Validators.minLength(2)]],
      email: [{ value: '', disabled: true }], // Email non modifiable
      phone: ['']
    });

    // Initialiser le formulaire de changement de mot de passe
    this.passwordForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  // Validateur personnalisé pour vérifier que les mots de passe correspondent
  passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const newPassword = control.get('newPassword');
    const confirmPassword = control.get('confirmPassword');

    if (!newPassword || !confirmPassword) {
      return null;
    }

    return newPassword.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  ngOnInit(): void {
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userInitials = getUserInitials(user.firstName, user.lastName);
        this.avatarColor = getUserAvatarColor(user.firstName, user.lastName);
        this.profilePhotoUrl = user.profilePhoto;

        // Déterminer le rôle pour afficher le bon header
        const roleUpper = user.role?.toUpperCase() || '';
        this.isAdmin = roleUpper === 'ADMINISTRATEUR' || roleUpper === 'ADMIN';
        this.isTeacher = roleUpper === 'ENSEIGNANT' || roleUpper === 'TEACHER';

        // Initialiser le formulaire avec les données utilisateur
        this.userInfoForm.patchValue({
          fullName: `${user.firstName} ${user.lastName}`.trim(),
          email: user.email || '',
          phone: user.phone || ''
        });
      }
    });
  }


  onPhotoSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];

      // Vérifier la taille du fichier (10 Mo maximum)
      const maxSize = 10 * 1024 * 1024; // 10 Mo en octets
      if (file.size > maxSize) {
        this.updateError = 'La photo est trop grande. La taille maximale autorisée est de 10 Mo.';
        this.profilePhotoFile = null;
        this.profilePhotoFileName = 'Profile-pic.jpg';
        // Réinitialiser l'input
        if (input) {
          input.value = '';
        }
        return;
      }

      this.profilePhotoFile = file;
      this.profilePhotoFileName = file.name;
      this.updateError = ''; // Réinitialiser l'erreur si le fichier est valide

      // Créer une URL de prévisualisation
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.profilePhotoUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

  updatePhoto(): void {
    if (!this.profilePhotoFile || !this.currentUser?.id) {
      return;
    }

    this.isUpdatingPhoto = true;
    this.updateError = '';

    // Pour l'instant, on simule l'upload - vous devrez implémenter un service d'upload d'image
    // TODO: Implémenter l'upload de photo vers le backend
    setTimeout(() => {
      // Simuler l'upload
      const updateData: UpdateUserRequest = {
        profilePicture: this.profilePhotoUrl || undefined
      };

      this.userService.updateUserProfile(this.currentUser!.id, updateData).subscribe({
        next: (updatedProfile) => {
          this.isUpdatingPhoto = false;
          this.updateSuccess = true;
          setTimeout(() => this.updateSuccess = false, 3000);
          // Mettre à jour l'utilisateur dans AuthService
          if (this.currentUser) {
            this.currentUser.profilePhoto = updatedProfile?.profilePicture || this.profilePhotoUrl || undefined;
          }
        },
        error: (error) => {
          this.isUpdatingPhoto = false;
          console.error('Erreur upload photo:', error);
          if (error.status === 500) {
            this.updateError = 'Erreur serveur lors de la mise à jour de la photo. Veuillez réessayer.';
          } else if (error.error?.message) {
            this.updateError = error.error.message;
          } else {
            this.updateError = 'Erreur lors de la mise à jour de la photo';
          }
        }
      });
    }, 500);
  }

  updateUserInfo(): void {
    if (!this.userInfoForm.valid || !this.currentUser?.id) {
      this.userInfoForm.markAllAsTouched();
      return;
    }

    this.isUpdatingInfo = true;
    this.updateError = '';
    this.updateSuccess = false;

    const formValue = this.userInfoForm.value;
    const nameParts = formValue.fullName.trim().split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    const updateData: UpdateUserRequest = {
      firstName: firstName,
      lastName: lastName,
      phone: formValue.phone || undefined
    };

    this.userService.updateUserProfile(this.currentUser.id, updateData).subscribe({
      next: (updatedProfile) => {
        this.isUpdatingInfo = false;
        this.updateSuccess = true;

        // Mettre à jour l'utilisateur actuel
        if (this.currentUser) {
          this.currentUser.firstName = firstName;
          this.currentUser.lastName = lastName;
          this.currentUser.phone = formValue.phone || null;
          this.userInitials = getUserInitials(firstName, lastName);
          this.avatarColor = getUserAvatarColor(firstName, lastName);
        }

        setTimeout(() => this.updateSuccess = false, 3000);
      },
      error: (error) => {
        this.isUpdatingInfo = false;
        this.updateError = 'Erreur lors de la mise à jour des informations';
        console.error('Erreur mise à jour profil:', error);
      }
    });
  }

  changePassword(): void {
    if (!this.currentUser?.id) {
      return;
    }

    // Marquer tous les champs comme touchés pour afficher les erreurs
    this.passwordForm.markAllAsTouched();

    // Vérifier que les mots de passe correspondent
    if (this.passwordForm.hasError('passwordMismatch')) {
      this.passwordError = 'Les mots de passe ne correspondent pas';
      return;
    }

    if (!this.passwordForm.valid) {
      return;
    }

    this.isChangingPassword = true;
    this.passwordError = '';
    this.passwordSuccess = false;

    const formValue = this.passwordForm.value;

    const passwordData: ChangePasswordRequest = {
      oldPassword: formValue.oldPassword,
      newPassword: formValue.newPassword,
      confirmPassword: formValue.confirmPassword
    };

    this.userService.changePassword(this.currentUser.id, passwordData).subscribe({
      next: () => {
        this.isChangingPassword = false;
        this.passwordSuccess = true;
        this.passwordForm.reset();
        setTimeout(() => {
          this.passwordSuccess = false;
        }, 3000);
      },
      error: (error) => {
        this.isChangingPassword = false;
        if (error.status === 400) {
          // Le backend renvoie un message d'erreur dans error.error.message ou error.error
          const errorMessage = error.error?.message || error.error || 'Erreur lors du changement de mot de passe';
          this.passwordError = errorMessage;
        } else if (error.status === 401) {
          this.passwordError = 'L\'ancien mot de passe est incorrect';
        } else {
          this.passwordError = 'Erreur lors du changement de mot de passe. Veuillez réessayer.';
        }
        console.error('Erreur changement mot de passe:', error);
      }
    });
  }
}
