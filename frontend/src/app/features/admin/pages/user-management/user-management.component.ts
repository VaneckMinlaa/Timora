import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { User, UserRole, UserFilter, CreateUserRequest, UpdateUserRequest, School } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/models';
import { CourseService } from '../../../../core/services/course.service';
import { Filiere, Classe, UE } from '../../../../core/models/course.model';

import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-management.component.html',
  styleUrls: ['./user-management.component.scss']
})
export class Users implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  paginatedUsers: User[] = []; // Utilisateurs de la page courante
  searchTerm: string = '';
  selectedRole: string = '';
  selectedStatus: string = '';
  selectedSchool: string = '';

  // Dropdowns de filtres
  showRoleDropdown: boolean = false;
  showStatusDropdown: boolean = false;
  showSchoolDropdown: boolean = false;

  // Options de filtres
  roleOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'ADMIN', label: 'Administrateur' },
    { value: 'TEACHER', label: 'Enseignant' }
  ];

  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'Actif', label: 'Actif' },
    { value: 'Inactif', label: 'Inactif' }
  ];

  schoolOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'SJI', label: 'SJI' },
    { value: 'SJM', label: 'SJM' },
    { value: 'PrepaVogt', label: 'Prépa Vogt' },
    { value: 'CPGE', label: 'CPGE' }
  ];

  // État de chargement et erreurs
  isLoading: boolean = false;
  error: string | null = null;

  // Modal d'ajout d'utilisateur
  showAddModal: boolean = false;
  isSubmitting: boolean = false;
  formError: string | null = null;

  // Modal d'édition d'utilisateur
  showEditModal: boolean = false;
  editingUser: User | null = null;
  editUserForm: UpdateUserRequest = {
    firstName: '',
    lastName: '',
    phone: '',
    department: '',
    schools: []
  };
  isSubmittingEdit: boolean = false;
  editFormError: string | null = null;
  editFormStep: number = 1;
  totalFormSteps: number = 2; // Nombre total d'étapes pour le formulaire d'édition

  // Options d'écoles disponibles
  availableSchools: School[] = ['SJI', 'SJM', 'PrepaVogt', 'CPGE'];

  // Formulaire de création
  newUser: CreateUserRequest = {
    email: '',
    firstName: '',
    lastName: '',
    phone: '',
    role: 'TEACHER',
    department: '',
    schools: []
  };

  currentPage: number = 1;
  itemsPerPage: number = 7; // Limité à 7 éléments par page
  totalUsers: number = 0;
  totalPages: number = 0;
  startIndex: number = 1;
  endIndex: number = 7;
  visiblePages: number[] = [];

  // Informations utilisateur connecté
  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Admin IUSJ';
  userEmail: string = 'admin@iusj.com';
  userProfilePhoto: string | null = null;
  userInitials: string = 'U';
  avatarColor: string = '#2563eb';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private courseService: CourseService,
    private toastService: ToastNotificationService
  ) {}

  ngOnInit(): void {
    // Initialiser paginatedUsers
    this.paginatedUsers = [];
    this.loadUsers();
    // Récupérer les informations de l'utilisateur connecté
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userDisplayName = `${user.firstName} ${user.lastName}`.trim() || 'Utilisateur';
        this.userEmail = user.email || 'admin@iusj.com';
        this.userProfilePhoto = user.profilePhoto || null;
        this.userInitials = getUserInitials(user.firstName, user.lastName);
        this.avatarColor = getUserAvatarColor(user.firstName, user.lastName);
      }
    });
  }

  /**
   * Toggle sidebar (pour mobile)
   */
  toggleSidebar(): void {
    // Implémentation à venir si nécessaire
  }

  /**
   * Gestion des notifications
   */
  onNotifications(): void {
    // Implémentation à venir
    console.log('Notifications clicked');
  }


  /**
   * Charge les utilisateurs depuis l'API
   */
  loadUsers(): void {
    this.isLoading = true;
    this.error = null;

    const filter: UserFilter = {};

    // Appliquer les filtres de rôle
    if (this.selectedRole) {
      filter.role = this.selectedRole as UserRole;
    }

    // Appliquer les filtres de statut
    if (this.selectedStatus) {
      filter.isActive = this.selectedStatus === 'Actif';
    }

    // Appliquer la recherche
    if (this.searchTerm) {
      filter.search = this.searchTerm;
    }

    this.userService.getAllUsers(filter).subscribe({
      next: (users) => {
        this.users = users;
        this.filteredUsers = [...this.users];
        this.currentPage = 1; // Réinitialiser à la première page
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des utilisateurs:', err);

        // Message d'erreur plus détaillé
        let errorMessage = 'Impossible de charger les utilisateurs. ';

        if (err.status === 0) {
          errorMessage += 'Le serveur ne répond pas. Vérifiez que le backend est démarré.';
        } else if (err.status === 404) {
          errorMessage += 'Service introuvable. Vérifiez la configuration du Gateway.';
        } else if (err.status === 500) {
          errorMessage += 'Erreur serveur (500). ';

          // Extraire le message d'erreur détaillé
          let detailMessage = '';
          if (err.error?.message) {
            detailMessage = err.error.message;
          } else if (typeof err.error === 'string') {
            detailMessage = err.error;
          } else if (err.message) {
            detailMessage = err.message;
          }

          // Détecter les problèmes spécifiques
          if (detailMessage.includes('Connection timed out') || detailMessage.includes('timeout')) {
            errorMessage += 'Timeout de connexion au User Service. Vérifiez que le User Service est démarré et accessible. ';
            errorMessage += 'Problème probable : configuration Eureka avec une mauvaise adresse IP.';
          } else if (detailMessage.includes('Connection refused') || detailMessage.includes('refused')) {
            errorMessage += 'Connexion refusée. Le User Service n\'est probablement pas démarré.';
          } else if (detailMessage.includes('Service Unavailable') || detailMessage.includes('503')) {
            errorMessage += 'Service indisponible. Vérifiez que le User Service est enregistré dans Eureka.';
          } else {
            errorMessage += 'Vérifiez les logs du backend.';
            if (detailMessage) {
              errorMessage += ` Détails: ${detailMessage}`;
            }
          }
        } else if (err.status === 503) {
          errorMessage += 'Service indisponible. Vérifiez que le User Service est démarré et enregistré dans Eureka.';
        } else {
          errorMessage += `Erreur ${err.status}: ${err.statusText || 'Erreur inconnue'}`;
        }

        this.error = errorMessage;
        this.isLoading = false;
        // En cas d'erreur, utiliser un tableau vide
        this.users = [];
        this.filteredUsers = [];
        this.paginatedUsers = [];
        this.currentPage = 1;
        this.updatePagination();
      }
    });
  }

  getFullName(user: User): string {
    return `${user.firstName} ${user.lastName}`.trim();
  }

  getUserInitials(firstName?: string | null, lastName?: string | null): string {
    return getUserInitials(firstName, lastName);
  }

  getUserAvatarColor(firstName?: string | null, lastName?: string | null): string {
    return getUserAvatarColor(firstName, lastName);
  }

  getRoleLabel(role: string): string {
    switch(role) {
      case 'ADMIN': return 'Administrateur';
      case 'TEACHER': return 'Enseignant';
      case 'USER': return 'Enseignant'; // Compatibilité avec ancien format
      case 'MANAGER': return 'Gestionnaire';
      default: return role;
    }
  }

  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'N/A';
    }

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Date invalide';
      }
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  }

  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Toggle le dropdown de filtre de rôle
   */
  toggleRoleFilter(): void {
    this.showRoleDropdown = !this.showRoleDropdown;
    if (this.showRoleDropdown) {
      this.showStatusDropdown = false; // Fermer l'autre dropdown
    }
  }

  /**
   * Toggle le dropdown de filtre de statut
   */
  toggleStatusFilter(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
    if (this.showStatusDropdown) {
      this.showRoleDropdown = false; // Fermer l'autre dropdown
      this.showSchoolDropdown = false;
    }
  }

  /**
   * Toggle le dropdown de filtre par école
   */
  toggleSchoolFilter(): void {
    this.showSchoolDropdown = !this.showSchoolDropdown;
    if (this.showSchoolDropdown) {
      this.showRoleDropdown = false;
      this.showStatusDropdown = false;
    }
  }

  /**
   * Sélectionner un rôle
   */
  selectRole(role: string): void {
    this.selectedRole = role;
    this.showRoleDropdown = false;
    this.currentPage = 1;
    this.applyFilters(); // Appliquer les filtres
  }

  /**
   * Sélectionner un statut
   */
  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.currentPage = 1;
    this.applyFilters(); // Appliquer les filtres
  }

  /**
   * Sélectionner une école pour le filtre
   */
  selectSchool(school: string): void {
    this.selectedSchool = school;
    this.showSchoolDropdown = false;
    this.currentPage = 1;
    this.applyFilters(); // Appliquer les filtres
  }

  /**
   * Fermer tous les dropdowns
   */
  closeDropdowns(): void {
    this.showRoleDropdown = false;
    this.showStatusDropdown = false;
    this.showSchoolDropdown = false;
  }

  /**
   * Obtenir le label du rôle sélectionné
   */
  getSelectedRoleLabel(): string {
    const option = this.roleOptions.find(opt => opt.value === this.selectedRole);
    return option ? option.label : 'Tous';
  }

  /**
   * Obtenir le label du statut sélectionné
   */
  getSelectedStatusLabel(): string {
    const option = this.statusOptions.find(opt => opt.value === this.selectedStatus);
    return option ? option.label : 'Tous';
  }

  /**
   * Obtenir le label de l'école sélectionnée
   */
  getSelectedSchoolLabel(): string {
    const option = this.schoolOptions.find(opt => opt.value === this.selectedSchool);
    return option ? option.label : 'Tous';
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedRole = '';
    this.selectedStatus = '';
    this.selectedSchool = '';
    this.closeDropdowns();
    this.currentPage = 1;
    this.loadUsers();
  }

  updatePagination(): void {
    this.totalUsers = this.filteredUsers.length;
    this.totalPages = Math.ceil(this.totalUsers / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalUsers);

    // Calculer les utilisateurs à afficher pour la page courante
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedUsers = this.filteredUsers.slice(start, end);

    // Calculer les pages visibles
    this.visiblePages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

    // Ajuster si on est proche de la fin
    if (endPage - startPage < maxVisiblePages - 1) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      this.visiblePages.push(i);
    }
  }

  goToPage(page: number): void {
    this.currentPage = page;
    this.updatePagination();
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Ouvrir le modal d'ajout d'utilisateur
   */
  onAddUser(): void {
    this.resetForm();
    this.showAddModal = true;
  }

  /**
   * Fermer le modal
   */
  closeAddModal(): void {
    this.showAddModal = false;
    this.resetForm();
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.newUser = {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      role: 'TEACHER',
      department: '',
      schools: []
    };
    this.formError = null;
    this.isSubmitting = false;
  }

  /**
   * Toggle la sélection d'une école
   */
  toggleSchool(school: School): void {
    const index = this.newUser.schools.indexOf(school);
    if (index > -1) {
      this.newUser.schools.splice(index, 1);
    } else {
      this.newUser.schools.push(school);
    }
  }

  /**
   * Vérifier si une école est sélectionnée
   */
  isSchoolSelected(school: School): boolean {
    return this.newUser.schools.includes(school);
  }

  /**
   * Obtenir le label d'une école
   */
  getSchoolLabel(school: School): string {
    const labels: Record<School, string> = {
      'SJI': 'SJI',
      'SJM': 'SJM',
      'PrepaVogt': 'Prépa Vogt',
      'CPGE': 'CPGE'
    };
    return labels[school] || school;
  }

  /**
   * Obtenir les écoles d'un utilisateur comme chaîne
   */
  getSchoolsDisplay(user: User): string {
    if (!user.schools || user.schools.length === 0) {
      return 'Aucune';
    }
    return user.schools.map(school => this.getSchoolLabel(school as School)).join(', ');
  }

  /**
   * Appliquer les filtres sur les utilisateurs
   */
  applyFilters(): void {
    this.filteredUsers = this.users.filter(user => {
      // Filtre par rôle
      if (this.selectedRole && user.role !== this.selectedRole) {
        return false;
      }

      // Filtre par statut
      if (this.selectedStatus) {
        const isActive = this.selectedStatus === 'Actif';
        if (user.isActive !== isActive) {
          return false;
        }
      }

      // Filtre par école
      if (this.selectedSchool) {
        if (!user.schools || !user.schools.includes(this.selectedSchool)) {
          return false;
        }
      }

      // Filtre par recherche (nom, email)
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const fullName = `${user.firstName} ${user.lastName}`.toLowerCase();
        const email = user.email.toLowerCase();
        if (!fullName.includes(searchLower) && !email.includes(searchLower)) {
          return false;
        }
      }

      return true;
    });

    this.currentPage = 1; // Réinitialiser à la première page après filtrage
    this.updatePagination();
  }

  /**
   * Valider l'étape 1 du formulaire
   */
  validateStep1(): boolean {
    this.formError = null;

    // Validation email
    if (!this.newUser.email || !this.newUser.email.trim()) {
      this.formError = 'L\'email est obligatoire';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.newUser.email.trim())) {
      this.formError = 'L\'email doit être valide';
      return false;
    }

    // Validation prénom
    if (!this.newUser.firstName || !this.newUser.firstName.trim()) {
      this.formError = 'Le prénom est obligatoire';
      return false;
    }

    const firstNameTrimmed = this.newUser.firstName.trim();
    if (firstNameTrimmed.length < 2 || firstNameTrimmed.length > 50) {
      this.formError = 'Le prénom doit contenir entre 2 et 50 caractères';
      return false;
    }

    // Validation nom
    if (!this.newUser.lastName || !this.newUser.lastName.trim()) {
      this.formError = 'Le nom est obligatoire';
      return false;
    }

    const lastNameTrimmed = this.newUser.lastName.trim();
    if (lastNameTrimmed.length < 2 || lastNameTrimmed.length > 50) {
      this.formError = 'Le nom doit contenir entre 2 et 50 caractères';
      return false;
    }

    return true;
  }


  /**
   * Soumettre le formulaire de création
   */
  onSubmitAddUser(): void {
    if (!this.validateStep1()) {
      return;
    }

    this.isSubmitting = true;
    this.formError = null;

    // Nettoyer le numéro de téléphone (retirer espaces, tirets, etc.)
    let cleanedPhone: string | undefined = undefined;
    if (this.newUser.phone && this.newUser.phone.trim()) {
      // Retirer tous les caractères non numériques
      cleanedPhone = this.newUser.phone.trim().replace(/\D/g, '');
      // Si après nettoyage, c'est vide, ne pas envoyer
      if (cleanedPhone.length === 0) {
        cleanedPhone = undefined;
      }
    }

    // Préparer les données (sans mot de passe - généré automatiquement)
    const userData: CreateUserRequest = {
      email: this.newUser.email.trim(),
      firstName: this.newUser.firstName.trim(),
      lastName: this.newUser.lastName.trim(),
      // password: retiré - généré automatiquement et envoyé par email
      phone: cleanedPhone,
      role: this.newUser.role || 'TEACHER',
      department: this.newUser.department?.trim() || undefined,
      schools: [] // Champ écoles retiré du formulaire
    };

    // Vérification de debug
    console.log('Données envoyées:', userData);
    console.log('Écoles sélectionnées:', userData.schools);

    this.userService.createUser(userData).subscribe({
      next: (user) => {
        console.log('Utilisateur créé avec succès:', user);
        this.closeAddModal();
        const successMsg = `L'utilisateur ${user.firstName} ${user.lastName} a été créé avec succès. Un email avec les identifiants de connexion a été envoyé à ${user.email}.`;
        this.toastService.createNotification('success', 'Utilisateur créé', successMsg);
        this.loadUsers(); // Recharger la liste
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        let errorMsg = 'Impossible de créer l\'utilisateur. ';
        if (err.status === 409) {
          errorMsg += 'Un utilisateur avec cet email existe déjà.';
        } else {
          errorMsg += err.error?.message || 'Réessayez.';
        }
        this.toastService.createNotification('error', 'Erreur', errorMsg);
        this.formError = errorMsg;
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Ouvrir le modal d'édition d'utilisateur
   */
  onEditUser(user: User): void {
    this.editingUser = user;
    this.editUserForm = {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      department: user.department || '',
      schools: user.schools ? [...user.schools] as School[] : []
    };
    this.editFormError = null;
    this.isSubmittingEdit = false;
    this.editFormStep = 1;
    this.showEditModal = true;
  }

  /**
   * Fermer le modal d'édition
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingUser = null;
    this.resetEditForm();
  }

  /**
   * Réinitialiser le formulaire d'édition
   */
  resetEditForm(): void {
    this.editUserForm = {
      firstName: '',
      lastName: '',
      phone: '',
      department: '',
      schools: []
    };
    this.editFormError = null;
    this.isSubmittingEdit = false;
    this.editFormStep = 1;
  }

  /**
   * Toggle la sélection d'une école dans le formulaire d'édition
   */
  toggleEditSchool(school: School): void {
    if (!this.editUserForm.schools) {
      this.editUserForm.schools = [];
    }
    const index = this.editUserForm.schools.indexOf(school);
    if (index > -1) {
      this.editUserForm.schools.splice(index, 1);
    } else {
      this.editUserForm.schools.push(school);
    }
  }

  /**
   * Vérifier si une école est sélectionnée dans le formulaire d'édition
   */
  isEditSchoolSelected(school: School): boolean {
    if (!this.editUserForm.schools) {
      return false;
    }
    return this.editUserForm.schools.includes(school);
  }

  /**
   * Valider l'étape 1 du formulaire d'édition
   */
  validateEditStep1(): boolean {
    this.editFormError = null;

    // Validation prénom
    if (!this.editUserForm.firstName || !this.editUserForm.firstName.trim()) {
      this.editFormError = 'Le prénom est obligatoire';
      return false;
    }

    const firstNameTrimmed = this.editUserForm.firstName.trim();
    if (firstNameTrimmed.length < 2 || firstNameTrimmed.length > 50) {
      this.editFormError = 'Le prénom doit contenir entre 2 et 50 caractères';
      return false;
    }

    // Validation nom
    if (!this.editUserForm.lastName || !this.editUserForm.lastName.trim()) {
      this.editFormError = 'Le nom est obligatoire';
      return false;
    }

    const lastNameTrimmed = this.editUserForm.lastName.trim();
    if (lastNameTrimmed.length < 2 || lastNameTrimmed.length > 50) {
      this.editFormError = 'Le nom doit contenir entre 2 et 50 caractères';
      return false;
    }

    return true;
  }

  /**
   * Aller à l'étape suivante du formulaire d'édition
   */
  nextEditStep(): void {
    if (this.editFormStep === 1) {
      if (!this.validateEditStep1()) {
        return;
      }
    }

    if (this.editFormStep < this.totalFormSteps) {
      this.editFormStep++;
    }
  }

  /**
   * Aller à l'étape précédente du formulaire d'édition
   */
  previousEditStep(): void {
    if (this.editFormStep > 1) {
      this.editFormStep--;
    }
  }

  /**
   * Soumettre le formulaire d'édition
   */
  onSubmitEditUser(): void {
    if (!this.validateEditStep1()) {
      return;
    }

    if (!this.editingUser) {
      return;
    }

    this.isSubmittingEdit = true;
    this.editFormError = null;

    // Préparer les données
    const updateData: UpdateUserRequest = {
      firstName: this.editUserForm.firstName?.trim() || undefined,
      lastName: this.editUserForm.lastName?.trim() || undefined,
      phone: this.editUserForm.phone?.trim() || undefined,
      department: this.editUserForm.department?.trim() || undefined,
      schools: [] // Champ écoles retiré du formulaire
    };

    this.userService.updateUser(this.editingUser.id, updateData).subscribe({
      next: (user) => {
        console.log('Utilisateur mis à jour avec succès:', user);
        this.toastService.createNotification('success', 'Mise à jour', `L'utilisateur ${user.firstName} a été mis à jour.`);
        this.closeEditModal();
        this.loadUsers(); // Recharger la liste
        this.isSubmittingEdit = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);

        let errorMessage = 'Impossible de mettre à jour l\'utilisateur. ';

        if (err.status === 400) {
          if (err.error?.message) {
            errorMessage += err.error.message;
          } else {
            errorMessage += 'Les données fournies sont invalides.';
          }
        } else if (err.error?.message) {
          errorMessage += err.error.message;
        } else {
          errorMessage += 'Veuillez réessayer.';
        }

        this.editFormError = errorMessage;
        this.isSubmittingEdit = false;
      }
    });
  }

  /**
   * Supprimer un utilisateur
   */
  onDeleteUser(user: User): void {
    const fullName = this.getFullName(user);
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${fullName} ?`)) {
      this.isLoading = true;
      this.error = null;

      this.userService.deleteUser(user.id).subscribe({
        next: () => {
          this.toastService.createNotification('success', 'Supprimé', 'Utilisateur supprimé avec succès');
          this.loadUsers();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression:', err);
          this.toastService.createNotification('error', 'Erreur', 'Impossible de supprimer l\'utilisateur.');
          this.isLoading = false;
        }
      });
    }
  }

  /**
   * Activer un utilisateur
   */
  activateUser(user: User): void {
    this.isLoading = true;
    this.error = null;

    this.userService.activateUser(user.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.createNotification('success', 'Activé', 'Utilisateur activé avec succès');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erreur lors de l\'activation:', err);
        this.isLoading = false;
        this.toastService.createNotification('error', 'Erreur', err.error?.message || 'Impossible d\'activer l\'utilisateur.');
      }
    });
  }

  /**
   * Désactiver un utilisateur
   */
  deactivateUser(user: User): void {
    this.isLoading = true;
    this.error = null;

    this.userService.deactivateUser(user.id).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.createNotification('success', 'Désactivé', 'Utilisateur désactivé avec succès');
        this.loadUsers();
      },
      error: (err) => {
        console.error('Erreur lors de la désactivation:', err);
        this.isLoading = false;
        this.toastService.createNotification('error', 'Erreur', err.error?.message || 'Impossible de désactiver l\'utilisateur.');
      }
    });
  }
}
