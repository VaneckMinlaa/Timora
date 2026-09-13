import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Reservation, ReservationFilter, ReservationStatus, ReservationWithRoom, UpdateReservationRequest } from '../../../../core/models/reservation.model';
import { Room } from '../../../../core/models/room.model';
import { ReservationService } from '../../../../core/services/reservation.service';
import { RoomService } from '../../../../core/services/room.service';
import { AuthService } from '../../../../core/services/auth.service';
import { UserService } from '../../../../core/services/user.service';
import { AuthUser, User } from '../../../../core/models';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';

@Component({
  selector: 'app-reservation-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reservation-management.component.html',
  styleUrls: ['./reservation-management.component.scss']
})
export class ReservationManagementComponent implements OnInit {
  reservations: Reservation[] = [];
  filteredReservations: Reservation[] = [];
  paginatedReservations: Reservation[] = [];
  searchTerm: string = '';
  selectedStatus: string = '';
  selectedRoomId: string = '';
  
  // Dropdowns de filtres
  showStatusDropdown: boolean = false;
  showRoomDropdown: boolean = false;
  
  // Options de filtres
  statusOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'CONFIRME', label: 'Confirmé' },
    { value: 'ANNULEE', label: 'Annulé' },
    { value: 'CONFLIT', label: 'Conflit' }
  ];
  
  // Liste des salles pour le filtre
  rooms: Room[] = [];
  roomOptions: { value: string; label: string }[] = [];
  
  // État de chargement et erreurs
  isLoading: boolean = false;
  error: string | null = null;
  
  // Modal d'édition de réservation
  showEditModal: boolean = false;
  editingReservation: Reservation | null = null;
  editForm: any = {
    status: '',
    purpose: '',
    notes: ''
  };
  isSubmittingEdit: boolean = false;
  editFormError: string | null = null;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalReservations: number = 0;
  totalPages: number = 0;
  startIndex: number = 1;
  endIndex: number = 10;
  visiblePages: number[] = [];
  
  // États d'expansion des lignes
  expandedRows: Set<string> = new Set<string>();
  
  // Informations utilisateur connecté
  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Admin IUSJ';
  userEmail: string = 'admin@iusj.com';
  userProfilePhoto: string | null = null;
  userInitials: string = 'A';
  avatarColor: string = '#2563eb';
  
  // Map of users
  usersMap: Map<string, string> = new Map();
  
  constructor(
    private reservationService: ReservationService,
    private roomService: RoomService,
    private authService: AuthService,
    private userService: UserService,
    private toastService: ToastNotificationService
  ) {}
  
  ngOnInit(): void {
    this.paginatedReservations = [];
    this.loadRooms();
    this.loadUsers();
    this.loadReservations();
    
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
   * Charger les utilisateurs pour matcher les IDs
   */
  loadUsers(): void {
    this.userService.getAllUsers().subscribe({
      next: (users) => {
        users.forEach(u => {
          this.usersMap.set(u.id, `${u.firstName || ''} ${u.lastName || ''}`.trim());
        });
        this.applyUserNames();
      },
      error: (err) => console.error('Erreur chargement utilisateurs:', err)
    });
  }
  
  applyUserNames(): void {
    if (this.reservations.length > 0 && this.usersMap.size > 0) {
      this.reservations.forEach(r => {
        if (r.utilisateurId && this.usersMap.has(r.utilisateurId)) {
          r.utilisateurNom = this.usersMap.get(r.utilisateurId);
        }
      });
      this.filteredReservations.forEach(r => {
        if (r.utilisateurId && this.usersMap.has(r.utilisateurId)) {
          r.utilisateurNom = this.usersMap.get(r.utilisateurId);
        }
      });
      // Mettre à jour la vue sans réinitialiser la pagination complète
      const start = (this.currentPage - 1) * this.itemsPerPage;
      const end = start + this.itemsPerPage;
      this.paginatedReservations = this.filteredReservations.slice(start, end);
    }
  }

  /**
   * Charger toutes les salles pour le filtre
   */
  loadRooms(): void {
    this.roomService.getAllRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.roomOptions = [
          { value: '', label: 'Toutes les salles' },
          ...rooms
            .filter(room => room.id && (room.name || room.nomsalle))
            .map(room => ({ 
              value: room.id || room.idSalle || '', 
              label: room.name || room.nomsalle || 'Salle inconnue' 
            }))
        ];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des salles:', err);
      }
    });
  }
  
  /**
   * Charger toutes les réservations
   */
  loadReservations(): void {
    this.isLoading = true;
    this.error = null;
    
    const filter: ReservationFilter = {};
    
    if (this.selectedStatus) {
      filter.status = this.selectedStatus as ReservationStatus;
    }
    
    if (this.selectedRoomId) {
      filter.roomId = this.selectedRoomId;
    }
    
    this.reservationService.getAllReservations(filter).subscribe({
      next: (reservations) => {
        this.reservations = reservations;
        this.filteredReservations = [...this.reservations];
        this.applyUserNames();
        this.currentPage = 1;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des réservations:', err);
        this.error = 'Impossible de charger les réservations. Veuillez réessayer.';
        this.isLoading = false;
        this.reservations = [];
        this.filteredReservations = [];
        this.paginatedReservations = [];
        this.updatePagination();
      }
    });
  }
  
  /**
   * Rechercher des réservations
   */
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    this.filteredReservations = this.reservations.filter(reservation => {
      // Filtre par statut
      if (this.selectedStatus && reservation.status !== this.selectedStatus) {
        return false;
      }
      
      // Filtre par salle
      if (this.selectedRoomId && reservation.roomId !== this.selectedRoomId) {
        return false;
      }
      
      // Filtre par recherche (but, notes)
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const purpose = (reservation.purpose || '').toLowerCase();
        const notes = (reservation.notes || '').toLowerCase();
        if (!purpose.includes(searchLower) && !notes.includes(searchLower)) {
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
    this.selectedStatus = '';
    this.selectedRoomId = '';
    this.closeDropdowns();
    this.currentPage = 1;
    this.loadReservations();
  }
  
  /**
   * Toggle le dropdown de filtre de statut
   */
  toggleStatusFilter(): void {
    this.showStatusDropdown = !this.showStatusDropdown;
    if (this.showStatusDropdown) {
      this.showRoomDropdown = false;
    }
  }
  
  /**
   * Toggle le dropdown de filtre de salle
   */
  toggleRoomFilter(): void {
    this.showRoomDropdown = !this.showRoomDropdown;
    if (this.showRoomDropdown) {
      this.showStatusDropdown = false;
    }
  }
  
  /**
   * Fermer tous les dropdowns
   */
  closeDropdowns(): void {
    this.showStatusDropdown = false;
    this.showRoomDropdown = false;
  }
  
  /**
   * Sélectionner un statut
   */
  selectStatus(status: string): void {
    this.selectedStatus = status;
    this.showStatusDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Sélectionner une salle
   */
  selectRoom(roomId: string): void {
    this.selectedRoomId = roomId;
    this.showRoomDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Obtenir le label du statut
   */
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'N/A';
    const option = this.statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  }
  
  /**
   * Obtenir le label du statut sélectionné
   */
  getSelectedStatusLabel(): string {
    const option = this.statusOptions.find(opt => opt.value === this.selectedStatus);
    return option ? option.label : 'Tous';
  }
  
  /**
   * Obtenir le label de la salle sélectionnée
   */
  getSelectedRoomLabel(): string {
    const option = this.roomOptions.find(opt => opt.value === this.selectedRoomId);
    return option ? option.label : 'Toutes les salles';
  }
  
  /**
   * Obtenir le nom d'une salle par ID
   */
  getRoomName(roomId: string | undefined): string {
    if (!roomId) return 'Salle inconnue';
    const room = this.rooms.find(r => (r.id || r.idSalle) === roomId);
    return room ? (room.name || room.nomsalle || 'Salle inconnue') : 'Salle inconnue';
  }
  
  /**
   * Formater une date
   */
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
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage de date:', error);
      return 'Date invalide';
    }
  }
  
  /**
   * Obtenir la date d'une réservation (gère les deux formats)
   */
  getReservationDate(reservation: Reservation): string | null {
    if (reservation.startDateTime) {
      return reservation.startDateTime;
    } else if (reservation.date) {
      return reservation.date;
    }
    return null;
  }

  /**
   * Obtenir l'heure de début d'une réservation (gère les deux formats)
   * Retourne l'heure au format utilisable par formatTime() ou directement formatée
   */
  getReservationStartTime(reservation: Reservation): string | null {
    // Si on a déjà une date/heure complète
    if (reservation.startDateTime) {
      return reservation.startDateTime;
    }
    
    // Si on a date + heure séparées (format backend)
    if (reservation.date && reservation.heureDebut) {
      // Retourner directement l'heure si c'est au format HH:mm:ss ou HH:mm
      const time = reservation.heureDebut.trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
        // Retourner l'heure seule pour formatTime() qui peut la gérer directement
        return time;
      }
      // Sinon, construire une date ISO complète
      const dateStr = reservation.date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [hours, minutes] = time.split(':').slice(0, 2);
        return `${dateStr}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      }
    }
    return null;
  }

  /**
   * Obtenir l'heure de fin d'une réservation (gère les deux formats)
   * Retourne l'heure au format utilisable par formatTime() ou directement formatée
   */
  getReservationEndTime(reservation: Reservation): string | null {
    // Si on a déjà une date/heure complète
    if (reservation.endDateTime) {
      return reservation.endDateTime;
    }
    
    // Si on a date + heure séparées (format backend)
    if (reservation.date && reservation.heureFin) {
      // Retourner directement l'heure si c'est au format HH:mm:ss ou HH:mm
      const time = reservation.heureFin.trim();
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(time)) {
        // Retourner l'heure seule pour formatTime() qui peut la gérer directement
        return time;
      }
      // Sinon, construire une date ISO complète
      const dateStr = reservation.date.trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        const [hours, minutes] = time.split(':').slice(0, 2);
        return `${dateStr}T${hours.padStart(2, '0')}:${minutes.padStart(2, '0')}:00`;
      }
    }
    return null;
  }

  formatDateOnly(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      // Si c'est déjà au format YYYY-MM-DD, le formater directement
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
        const [year, month, day] = dateString.split('-');
        return `${day}/${month}/${year}`;
      }
      
      // Si c'est au format ISO avec heure (YYYY-MM-DDTHH:mm:ss), extraire juste la date
      if (dateString.includes('T')) {
        const datePart = dateString.split('T')[0];
        if (/^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
          const [year, month, day] = datePart.split('-');
          return `${day}/${month}/${year}`;
        }
      }
      
      // Sinon, essayer de parser comme Date
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
      console.error('Erreur de formatage de date:', error, dateString);
      return 'Date invalide';
    }
  }
  
  /**
   * Formater uniquement l'heure
   */
  formatTime(dateString: string | null | undefined): string {
    if (!dateString) {
      return 'N/A';
    }
    
    try {
      // Si c'est au format HH:mm:ss ou HH:mm (LocalTime du backend)
      if (/^\d{1,2}:\d{2}(:\d{2})?$/.test(dateString)) {
        const [hours, minutes] = dateString.split(':');
        return `${hours.padStart(2, '0')}:${minutes}`;
      }
      
      // Si c'est au format ISO avec date (YYYY-MM-DDTHH:mm:ss), extraire juste l'heure
      if (dateString.includes('T')) {
        const timePart = dateString.split('T')[1];
        if (timePart) {
          // Enlever les secondes et le timezone si présent
          const timeOnly = timePart.split('.')[0].split('+')[0].split('Z')[0];
          const [hours, minutes] = timeOnly.split(':');
          return `${hours.padStart(2, '0')}:${minutes}`;
        }
      }
      
      // Sinon, essayer de parser comme Date
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Heure invalide';
      }
      return date.toLocaleTimeString('fr-FR', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erreur de formatage d\'heure:', error, dateString);
      return 'Heure invalide';
    }
  }
  
  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-pending';
    switch(status) {
      case 'CONFIRME':
        return 'status-confirmed';
      case 'EN_ATTENTE':
        return 'status-pending';
      case 'ANNULEE':
        return 'status-cancelled';
      case 'CONFLIT':
        return 'status-conflict';
      default:
        return 'status-default';
    }
  }
  
  /**
   * Ouvrir le modal d'édition de réservation
   */
  onEditReservation(reservation: Reservation): void {
    this.editingReservation = reservation;
    this.editForm = {
      status: reservation.status,
      purpose: reservation.purpose || '',
      notes: reservation.notes || ''
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
    this.editingReservation = null;
    this.resetEditForm();
  }
  
  /**
   * Réinitialiser le formulaire d'édition
   */
  resetEditForm(): void {
    this.editForm = {
      status: '',
      purpose: '',
      notes: ''
    };
    this.editFormError = null;
    this.isSubmittingEdit = false;
  }
  
  /**
   * Soumettre le formulaire d'édition
   */
  onSubmitEditReservation(): void {
    if (!this.editingReservation) {
      return;
    }
    
    this.isSubmittingEdit = true;
    this.editFormError = null;
    
    const updateData: UpdateReservationRequest = {};
    
    if (this.editForm.status && this.editForm.status !== this.editingReservation.status) {
      updateData.status = this.editForm.status as ReservationStatus;
    }
    
    if (this.editForm.purpose !== this.editingReservation.purpose) {
      updateData.purpose = this.editForm.purpose;
    }
    
    if (this.editForm.notes !== (this.editingReservation.notes || '')) {
      updateData.notes = this.editForm.notes;
    }
    
    // Obtenir l'ID de la réservation
    const reservationId = this.editingReservation.id || this.editingReservation.idDemandeReservation;
    if (!reservationId) {
      this.editFormError = 'ID de réservation manquant.';
      this.isSubmittingEdit = false;
      return;
    }

    // Si le statut a changé, utiliser les méthodes spécifiques
    if (updateData.status === 'CONFIRME' && (this.editingReservation.status || this.editingReservation.statut) !== 'CONFIRME') {
      this.reservationService.confirmReservation(reservationId).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Réservation confirmée avec succès');
          this.closeEditModal();
          this.loadReservations();
          this.isSubmittingEdit = false;
        },
        error: (err) => {
          console.error('Erreur lors de la confirmation:', err);
          this.editFormError = 'Impossible de confirmer la réservation. Veuillez réessayer.';
          this.isSubmittingEdit = false;
        }
      });
      return;
    }
    
    if (updateData.status === 'ANNULEE' && (this.editingReservation.status || this.editingReservation.statut) !== 'ANNULEE') {
      this.reservationService.cancelReservation(reservationId).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Réservation annulée avec succès');
          this.closeEditModal();
          this.loadReservations();
          this.isSubmittingEdit = false;
        },
        error: (err) => {
          console.error('Erreur lors de l\'annulation:', err);
          this.editFormError = 'Impossible d\'annuler la réservation. Veuillez réessayer.';
          this.isSubmittingEdit = false;
        }
      });
      return;
    }
    
    // Sinon, mettre à jour normalement
    if (Object.keys(updateData).length > 0) {
      this.reservationService.updateReservation(reservationId, updateData).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Réservation mise à jour avec succès');
          this.closeEditModal();
          this.loadReservations();
          this.isSubmittingEdit = false;
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.editFormError = 'Impossible de mettre à jour la réservation. Veuillez réessayer.';
          this.isSubmittingEdit = false;
        }
      });
    } else {
      this.isSubmittingEdit = false;
      this.closeEditModal();
    }
  }
  
  /**
   * Supprimer une réservation
   */
  onDeleteReservation(reservation: Reservation): void {
    const reservationId = reservation.id || reservation.idDemandeReservation;
    if (!reservationId) {
      this.toastService.error('Erreur', 'ID de réservation manquant');
      return;
    }

    const roomId = reservation.roomId || reservation.salleId;
    const dateStr = reservation.startDateTime 
      ? this.formatDate(reservation.startDateTime) 
      : (reservation.date ? this.formatDate(reservation.date) : 'N/A');

    const confirmation = confirm(
      `Êtes-vous sûr de vouloir supprimer cette réservation ?\n` +
      `Salle: ${this.getRoomName(roomId)}\n` +
      `Date: ${dateStr}`
    );
    
    if (!confirmation) {
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    this.reservationService.deleteReservation(reservationId).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Réservation supprimée avec succès');
        this.loadReservations();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error = 'Impossible de supprimer la réservation. Veuillez réessayer.';
        this.isLoading = false;
        this.toastService.error('Erreur', 'Erreur lors de la suppression de la réservation');
      }
    });
  }
  
  /**
   * Confirmer une réservation
   */
  confirmReservation(reservation: Reservation): void {
    const reservationId = reservation.id || reservation.idDemandeReservation;
    if (!reservationId) {
      this.toastService.error('Erreur', 'ID de réservation manquant');
      return;
    }

    this.reservationService.confirmReservation(reservationId).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Réservation confirmée avec succès');
        this.loadReservations();
      },
      error: (err) => {
        console.error('Erreur lors de la confirmation:', err);
        this.toastService.error('Erreur', 'Impossible de confirmer la réservation');
      }
    });
  }
  
  /**
   * Annuler une réservation
   */
  cancelReservation(reservation: Reservation): void {
    const reservationId = reservation.id || reservation.idDemandeReservation;
    if (!reservationId) {
      this.toastService.error('Erreur', 'ID de réservation manquant');
      return;
    }

    const confirmation = confirm('Êtes-vous sûr de vouloir annuler cette réservation ?');
    if (!confirmation) {
      return;
    }
    
    this.reservationService.cancelReservation(reservationId).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Réservation annulée avec succès');
        this.loadReservations();
      },
      error: (err) => {
        console.error('Erreur lors de l\'annulation:', err);
        this.toastService.error('Erreur', 'Impossible d\'annuler la réservation');
      }
    });
  }
  
  /**
   * Gestion de l'expansion des lignes
   */
  toggleRow(id: string | undefined): void {
    if (!id) return;
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  isRowExpanded(id: string | undefined): boolean {
    if (!id) return false;
    return this.expandedRows.has(id);
  }

  /**
   * Pagination
   */
  updatePagination(): void {
    this.totalReservations = this.filteredReservations.length;
    this.totalPages = Math.ceil(this.totalReservations / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalReservations);
    
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedReservations = this.filteredReservations.slice(start, end);
    
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
}
