import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Room, CreateRoomRequest, UpdateRoomRequest, RoomFilter } from '../../../../core/models/room.model';
import { RoomService } from '../../../../core/services/room.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { EquipementService } from '../../../../core/services/equipement.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/models';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import { ExcelImportComponent } from '../../../../core/components/excel-import/excel-import.component';

@Component({
  selector: 'app-room-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ExcelImportComponent],
  templateUrl: './room-management.component.html',
  styleUrls: ['./room-management.component.scss']
})
export class RoomManagementComponent implements OnInit {
  rooms: Room[] = [];
  filteredRooms: Room[] = [];
  paginatedRooms: Room[] = [];
  searchTerm: string = '';
  selectedType: string = '';
  selectedCapacity: string = '';
  selectedSchool: string = '';

  // Dropdowns de filtres
  showTypeDropdown: boolean = false;
  showCapacityDropdown: boolean = false;
  showSchoolDropdown: boolean = false;

  // Options de filtres
  typeOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'AMPHI', label: 'Amphi' },
    { value: 'TD', label: 'TD' },
    { value: 'LABORATOIRE', label: 'Laboratoire' },
    { value: 'COURS', label: 'Cours' }
  ];

  capacityOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: '10', label: '10+' },
    { value: '20', label: '20+' },
    { value: '30', label: '30+' },
    { value: '50', label: '50+' },
    { value: '100', label: '100+' }
  ];

  schoolOptions: { value: string; label: string }[] = [
    { value: '', label: 'Toutes les écoles' }
  ];

  // État de chargement et erreurs
  isLoading: boolean = false;
  error: string | null = null;

  // Gestion des lignes dépliantes
  expandedRoomId: string | null = null;
  expandedRoomEquipments: any[] = [];
  expandedRoomOccupations: any[] = [];

  // Modal d'ajout de salle
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  editingRoom: Room | null = null;
  
  showImportModal: boolean = false;
  @ViewChild(ExcelImportComponent) importModalRef!: ExcelImportComponent;

  newRoom: CreateRoomRequest = {
    name: '',
    description: '',
    capacity: 0,
    ecole: '',
    amenities: [],
    typeSalle: 'COURS' // Valeur par défaut
  };

  editForm: UpdateRoomRequest = {
    name: '',
    capacity: 0,
    typeSalle: 'COURS',
    isAvailable: true
  };

  isSubmitting: boolean = false;
  isSubmittingEdit: boolean = false;
  formError: string | null = null;
  editFormError: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalRooms: number = 0;
  totalPages: number = 0;
  startIndex: number = 1;
  endIndex: number = 10;
  visiblePages: number[] = [];

  // Informations utilisateur connecté
  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Admin IUSJ';
  userEmail: string = 'admin@iusj.com';
  userProfilePhoto: string | null = null;
  userInitials: string = 'A';
      avatarColor: string = '#2563eb';

  constructor(
    private roomService: RoomService,
    private scheduleService: ScheduleService,
    private authService: AuthService,
    private equipementService: EquipementService,
    private toastService: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.paginatedRooms = [];
    this.loadRooms();
    this.loadEcoles();

    // Récupérer les informations de l'utilisateur connecté
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
      if (user) {
        this.userDisplayName = `${user.firstName} ${user.lastName}`.trim() || 'Admin';
        this.userEmail = user.email || 'admin@iusj.com';
        this.userProfilePhoto = user.profilePhoto || null;
        this.userInitials = getUserInitials(user.firstName, user.lastName);
        this.avatarColor = getUserAvatarColor(user.firstName, user.lastName);
      }
    });
  }

  /**
   * Charger toutes les salles
   */
  loadRooms(): void {
    this.isLoading = true;
    this.error = null;

    const filter: RoomFilter = {};

    if (this.selectedCapacity) {
      filter.capacity = parseInt(this.selectedCapacity);
    }

    if (this.selectedSchool) {
      filter.ecole = this.selectedSchool;
    }

    this.roomService.getAllRooms(filter).subscribe({
      next: (rooms) => {
        console.log('Salles reçues du backend:', rooms);
        console.log('Nombre de salles:', rooms.length);

        // Filtrer par type si sélectionné
        let filtered = rooms;
        if (this.selectedType) {
          filtered = rooms.filter(room => room.typeSalle === this.selectedType || false);
        }

        this.rooms = filtered;
        this.filteredRooms = [...this.rooms];
        console.log('Salles après filtrage:', this.filteredRooms);
        console.log('Première salle:', this.filteredRooms[0]);

        this.currentPage = 1;
        this.updatePagination();
        console.log('Paginated rooms:', this.paginatedRooms);
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des salles:', err);
        this.error = 'Impossible de charger les salles. Veuillez réessayer.';
        this.isLoading = false;
        this.rooms = [];
        this.filteredRooms = [];
        this.paginatedRooms = [];
        this.updatePagination();
      }
    });
  }

  /**
   * Rechercher des salles
   */
        onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Charger la liste des écoles uniques
   */
  loadEcoles(): void {
    this.scheduleService.getAllEcoles().subscribe({
      next: (ecoles: any[]) => {
        this.schoolOptions = [
          { value: '', label: 'Toutes les écoles' },
          ...ecoles.map(ecole => ({ value: ecole.nomEcole, label: ecole.nomEcole }))
        ];
      },
      error: (err: any) => {
        console.error('Erreur lors du chargement des écoles:', err);
      }
    });
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    this.filteredRooms = this.rooms.filter(room => {
      // Filtre par recherche (nom, description, localisation)
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const name = (room.name || '').toLowerCase();
        const description = (room.description || '').toLowerCase();
        const ecole = (room.ecole || '').toLowerCase();
        if (!name.includes(searchLower) && !description.includes(searchLower) && !ecole.includes(searchLower)) {
          return false;
        }
      }

      // Filtre par école
      if (this.selectedSchool && room.ecole !== this.selectedSchool) {
        return false;
      }

      // Filtre par capacité
      if (this.selectedCapacity && room.capacity !== undefined && room.capacite !== undefined) {
        const capacity = room.capacity || room.capacite || 0;
        if (capacity < parseInt(this.selectedCapacity)) {
          return false;
        }
      }

      return true;
    });

    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Réinitialiser les filtres
   */
  resetFilters(): void {
    this.searchTerm = '';
    this.selectedType = '';
    this.selectedCapacity = '';
    this.selectedSchool = '';
    this.closeDropdowns();
    this.currentPage = 1;
    this.loadRooms();
  }

  /**
   * Toggle le dropdown de filtre de type
   */
  toggleTypeFilter(): void {
    this.showTypeDropdown = !this.showTypeDropdown;
    if (this.showTypeDropdown) {
      this.showCapacityDropdown = false;
      this.showSchoolDropdown = false;
    }
  }

  /**
   * Toggle le dropdown de filtre de capacité
   */
  toggleCapacityFilter(): void {
    this.showCapacityDropdown = !this.showCapacityDropdown;
    if (this.showCapacityDropdown) {
      this.showTypeDropdown = false;
      this.showSchoolDropdown = false;
    }
  }

  /**
   * Toggle le dropdown de filtre d'école
   */
  toggleSchoolFilter(): void {
    this.showSchoolDropdown = !this.showSchoolDropdown;
    if (this.showSchoolDropdown) {
      this.showTypeDropdown = false;
      this.showCapacityDropdown = false;
    }
  }

  /**
   * Fermer tous les dropdowns
   */
  closeDropdowns(): void {
    this.showTypeDropdown = false;
    this.showCapacityDropdown = false;
    this.showSchoolDropdown = false;
  }

  /**
   * Sélectionner un type
   */
  selectType(type: string): void {
    this.selectedType = type;
    this.showTypeDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Sélectionner une capacité
   */
  selectCapacity(capacity: string): void {
    this.selectedCapacity = capacity;
    this.showCapacityDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Sélectionner une école
   */
  selectSchool(school: string): void {
    this.selectedSchool = school;
    this.showSchoolDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }

  /**
   * Obtenir le label du type sélectionné
   */
  getSelectedTypeLabel(): string {
    const option = this.typeOptions.find(opt => opt.value === this.selectedType);
    return option ? option.label : 'Tous';
  }

  /**
   * Obtenir le label de la capacité sélectionnée
   */
  getSelectedCapacityLabel(): string {
    const option = this.capacityOptions.find(opt => opt.value === this.selectedCapacity);
    return option ? option.label : 'Tous';
  }

  /**
   * Obtenir le label de l'école sélectionnée
   */
  getSelectedSchoolLabel(): string {
    const option = this.schoolOptions.find(opt => opt.value === this.selectedSchool);
    return option ? option.label : 'Toutes les écoles';
  }

  /**
   * Obtenir le label du type de salle
   */
  getTypeSalleLabel(typeSalle: string | undefined): string {
    if (!typeSalle) return 'N/A';

    const typeLabels: { [key: string]: string } = {
      'COURS': 'Salle de Cours',
      'TD': 'Salle TD',
      'AMPHI': 'Amphithéâtre',
      'LABORATOIRE': 'Laboratoire'
    };

    return typeLabels[typeSalle] || typeSalle;
  }

  /**
   * Obtenir le label du statut de l'équipement
   */
  getStatutLabel(statut: string): string {
    switch (statut) {
      case 'DISPONIBLE':
        return 'Disponible';
      case 'EN_COUR_D_UTILISATION':
        return 'En cours d\'utilisation';
      case 'EN_MAINTENANCE':
        return 'En maintenance';
      case 'DEFECTUEUX':
        return 'Défectueux';
      default:
        return statut;
    }
  }

  /**
   * Formater une date
   */
  formatDate(dateString: string | null | undefined | any): string {
    if (!dateString) {
      return 'N/A';
    }

    try {
      let date: Date;

      // Si c'est un objet avec date et time (format LocalDateTime du backend Jackson)
      if (typeof dateString === 'object' && dateString.date && dateString.time) {
        const timeStr = dateString.time.split('.')[0]; // Enlever les millisecondes si présentes
        date = new Date(`${dateString.date}T${timeStr}`);
      } else if (typeof dateString === 'string') {
        date = new Date(dateString);
      } else {
        // Essayer de convertir directement
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) {
        console.warn('Date invalide:', dateString);
        return 'N/A';
      }

      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error, dateString);
      return 'N/A';
    }
  }

  /**
   * Ouvrir le modal d'ajout de salle
   */
  onAddRoom(): void {
    this.resetForm();
    this.showAddModal = true;
  }

  /**
   * Fermer le modal d'ajout
   */
  closeAddModal(): void {
    this.showAddModal = false;
    this.resetForm();
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.newRoom = {
      name: '',
      capacity: 0,
      typeSalle: 'COURS',
      ecole: ''
    };
    this.formError = null;
    this.isSubmitting = false;
  }

  /**
   * Valider le formulaire
   */
  validateForm(): boolean {
    this.formError = null;

    if (!this.newRoom.name || !this.newRoom.name.trim()) {
      this.formError = 'Le nom de la salle est obligatoire';
      return false;
    }

    if (!this.newRoom.capacity || this.newRoom.capacity <= 0) {
      this.formError = 'La capacité doit être supérieure à 0';
      return false;
    }

    if (!this.newRoom.typeSalle) {
      this.formError = 'Le type de salle est obligatoire';
      return false;
    }

    return true;
  }

  /**
   * Soumettre le formulaire de création
   */
  onSubmitAddRoom(): void {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    this.formError = null;

    const roomData: CreateRoomRequest = {
      name: this.newRoom.name.trim(),
      capacity: this.newRoom.capacity,
      typeSalle: this.newRoom.typeSalle || 'COURS',
      ecole: this.newRoom.ecole?.trim()
    };

    this.roomService.createRoom(roomData).subscribe({
      next: (room) => {
        console.log('Salle créée, réponse du backend:', room);
        const roomName = room.name || room.nomsalle || 'la salle';
        this.toastService.success('Succès', `La salle ${roomName} a été créée avec succès`);
        this.closeAddModal();
        // Forcer le rechargement après un court délai pour s'assurer que la base de données est à jour
        setTimeout(() => {
          this.loadRooms();
        }, 200);
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        let errorMessage = 'Impossible de créer la salle. ';

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

        this.formError = errorMessage;
        this.isSubmitting = false;
      }
    });
  }

  /**
   * Ouvrir le modal d'édition de salle
   */
  onEditRoom(room: Room): void {
    this.editingRoom = room;
    this.editForm = {
      name: room.name || room.nomsalle || '',
      capacity: room.capacity || room.capacite || 0,
      typeSalle: room.typeSalle || 'COURS',
      ecole: room.ecole || '',
      isAvailable: room.isAvailable !== undefined ? room.isAvailable : true
    };
    this.editFormError = null;
    this.isSubmittingEdit = false;
    this.showEditModal = true;
  }

  /**
   * Fermer le modal d'édition
   */
  closeEditModal(): void {
    this.showEditModal = false;
    this.editingRoom = null;
    this.resetEditForm();
  }

  /**
   * Réinitialiser le formulaire d'édition
   */
  resetEditForm(): void {
    this.editForm = {
      name: '',
      capacity: 0,
      typeSalle: 'COURS',
      isAvailable: true
    };
    this.editFormError = null;
    this.isSubmittingEdit = false;
  }

  /**
   * Valider le formulaire d'édition
   */
  validateEditForm(): boolean {
    this.editFormError = null;

    if (this.editForm.name !== undefined && (!this.editForm.name || !this.editForm.name.trim())) {
      this.editFormError = 'Le nom de la salle est obligatoire';
      return false;
    }

    if (this.editForm.capacity !== undefined && this.editForm.capacity <= 0) {
      this.editFormError = 'La capacité doit être supérieure à 0';
      return false;
    }

    return true;
  }

  /**
   * Soumettre le formulaire d'édition
   */
  onSubmitEditRoom(): void {
    if (!this.validateEditForm()) {
      return;
    }

    if (!this.editingRoom) {
      return;
    }

    this.isSubmittingEdit = true;
    this.editFormError = null;

    const updateData: UpdateRoomRequest = {
      name: this.editForm.name?.trim(),
      capacity: this.editForm.capacity,
      typeSalle: this.editForm.typeSalle,
      isAvailable: this.editForm.isAvailable,
      ecole: this.editForm.ecole?.trim()
    };

    // Retirer les champs undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateRoomRequest] === undefined) {
        delete updateData[key as keyof UpdateRoomRequest];
      }
    });

    const roomId = this.editingRoom.id || this.editingRoom.idSalle;
    if (!roomId) {
      this.editFormError = 'ID de salle manquant.';
      this.isSubmittingEdit = false;
      return;
    }

    this.roomService.updateRoom(roomId, updateData).subscribe({
      next: (room) => {
        this.toastService.success('Succès', 'Salle mise à jour avec succès');
        this.closeEditModal();
        this.loadRooms();
        this.isSubmittingEdit = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        let errorMessage = 'Impossible de mettre à jour la salle. ';

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
   * Supprimer une salle
   */
  onDeleteRoom(room: Room): void {
    const roomId = room.id || room.idSalle;
    if (!roomId) {
      this.toastService.error('Erreur', 'ID de salle manquant');
      return;
    }

    const roomName = room.name || room.nomsalle || 'cette salle';
    const confirmation = confirm(
      `Êtes-vous sûr de vouloir supprimer la salle "${roomName}" ?\n` +
      `Cette action est irréversible.`
    );

    if (!confirmation) {
      return;
    }

    this.isLoading = true;
    this.error = null;

    this.roomService.deleteRoom(roomId).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Salle supprimée avec succès');
        this.loadRooms();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error = 'Impossible de supprimer la salle. Veuillez réessayer.';
        this.isLoading = false;
        this.toastService.error('Erreur', 'Erreur lors de la suppression de la salle');
      }
    });
  }

  /**
   * Toggle l'affichage des détails d'une salle
   */
  toggleRow(room: Room): void {
    const roomId = room.id || room.idSalle;
    if (this.expandedRoomId === roomId) {
      this.expandedRoomId = null;
    } else {
      this.expandedRoomId = roomId || null;
      if (this.expandedRoomId) {
        this.loadRoomDetails(this.expandedRoomId);
      }
    }
  }

  /**
   * Charger les détails d'une salle (équipements et occupations)
   */
  loadRoomDetails(roomId: string): void {
    this.expandedRoomEquipments = [];
    this.expandedRoomOccupations = [];
    
    // Charger équipements
    this.equipementService.getEquipementsBySalleId(roomId).subscribe(eqs => {
      this.expandedRoomEquipments = eqs;
    });

    // Charger occupations (simulé pour l'instant)
    this.expandedRoomOccupations = [];
  }

  /**
   * Récupérer les équipements d'une salle (ancien, à supprimer si non utilisé)
   */
  getRoomEquipements(room: Room): any[] {
    return this.expandedRoomEquipments;
  }

  /**
   * Récupérer les occupations actuelles d'une salle
   */
  getRoomOccupations(room: Room): any[] {
    // Cette partie nécessiterait idéalement un appel service, 
    // mais on peut simuler avec les réservations si disponibles
    return []; 
  }

  /**
   * Obtenir le label de l'école (simulé ou via constante si non présent dans le modèle)
   */
  getSchoolLabel(room: Room): string {
    return room.ecole || 'Non spécifié';
  }

  /**
   * Pagination
   */
  updatePagination(): void {
    this.totalRooms = this.filteredRooms.length;
    this.totalPages = Math.ceil(this.totalRooms / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalRooms);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedRooms = this.filteredRooms.slice(start, end);

    this.visiblePages = [];
    const maxVisiblePages = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisiblePages - 1);

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

  exportToCSV(): void {
    this.toastService.help('Info', 'L\'export CSV sera disponible prochainement');
  }

  openImportModal(): void {
    this.showImportModal = true;
  }

  onImportFile(file: File): void {
    this.roomService.importFromExcel(file).subscribe({
      next: (res) => {
        this.importModalRef.setResult({ message: res.message, count: res.count });
        this.toastService.success('Succès', res.message);
        this.loadRooms();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de l\'importation';
        this.importModalRef.setError(msg);
        this.toastService.error('Erreur', msg);
      }
    });
  }
}
