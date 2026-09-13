import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  Equipement,
  CreateEquipementRequest,
  UpdateEquipementRequest,
  EquipementFilter,
  EtatEquipement
} from '../../../../core/models/equipement.model';
import { Room } from '../../../../core/models/room.model';
import { EquipementService } from '../../../../core/services/equipement.service';
import { RoomService } from '../../../../core/services/room.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/models';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { ExcelImportComponent } from '../../../../core/components/excel-import/excel-import.component';

@Component({
  selector: 'app-resources',
  standalone: true,
  imports: [CommonModule, FormsModule, ExcelImportComponent],
  templateUrl: './resources.component.html',
  styleUrls: ['./resources.component.scss']
})
export class ResourcesComponent implements OnInit {
  equipements: Equipement[] = [];
  filteredEquipements: Equipement[] = [];
  paginatedEquipements: Equipement[] = [];
  searchTerm: string = '';
  selectedStatut: string = '';
  selectedSalleId: string = '';
  selectedCategorie: string = '';
  
  // Dropdowns de filtres
  showStatutDropdown: boolean = false;
  showSalleDropdown: boolean = false;
  showCategorieDropdown: boolean = false;
  
  // Options de filtres
  statutOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'DISPONIBLE', label: 'Disponible' },
    { value: 'EN_COUR_D_UTILISATION', label: 'En cours d\'utilisation' },
    { value: 'EN_MAINTENANCE', label: 'En maintenance' },
    { value: 'DEFECTUEUX', label: 'Défectueux' }
  ];
  
  categorieOptions: { value: string; label: string }[] = [
    { value: '', label: 'Tous' },
    { value: 'Projecteur', label: 'Projecteur' },
    { value: 'Ordinateur', label: 'Ordinateur' },
    { value: 'Tableau', label: 'Tableau' },
    { value: 'Climatiseur', label: 'Climatiseur' },
    { value: 'Autre', label: 'Autre' }
  ];
  
  // Liste des salles pour le filtre
  rooms: Room[] = [];
  salleOptions: { value: string; label: string }[] = [];
  categories: string[] = ['Projecteur', 'Ordinateur', 'Tableau', 'Climatiseur', 'Système Audio', 'Mobilier'];
  
  // État de chargement et erreurs
  isLoading: boolean = false;
  error: string | null = null;
  
  // Modal d'ajout d'équipement
  showAddModal: boolean = false;
  showEditModal: boolean = false;
  editingEquipement: Equipement | null = null;
  
  newEquipement: CreateEquipementRequest = {
    nom: '',
    categorie: 'Autre',
    statut: 'DISPONIBLE',
    salleId: ''
  };
  
  editForm: UpdateEquipementRequest = {
    nom: '',
    categorie: 'Autre',
    statut: 'DISPONIBLE',
    salleId: ''
  };
  
  isSubmitting: boolean = false;
  isSubmittingEdit: boolean = false;
  formError: string | null = null;
  editFormError: string | null = null;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalEquipements: number = 0;
  totalPages: number = 0;
  startIndex: number = 1;
  endIndex: number = 10;
  visiblePages: number[] = [];
  
  // Category management
  newCategoryName: string = '';
  showCategoryModal: boolean = false;
  
  // Import Excel
  showImportModal: boolean = false;
  @ViewChild(ExcelImportComponent) importModalRef!: ExcelImportComponent;
  
  // Informations utilisateur connecté
  currentUser: AuthUser | null = null;
  
  // Gestion des lignes dépliantes
  expandedEquipId: string | null = null;
  
  constructor(
    private equipementService: EquipementService,
    private roomService: RoomService,
    private authService: AuthService,
    private toastService: ToastNotificationService
  ) {}
  
  ngOnInit(): void {
    this.paginatedEquipements = [];
    this.loadEquipements();
    this.loadRooms();
    
    // Récupérer les informations de l'utilisateur connecté
    this.authService.getCurrentUser$().subscribe(user => {
      this.currentUser = user;
    });
  }

  /**
   * Compte le nombre d'équipements par statut
   */
  getCountByStatut(statut: string): number {
    return this.equipements.filter(e => e.statut === statut).length;
  }
  
  /**
   * Charger tous les équipements
   */
  loadEquipements(): void {
    this.isLoading = true;
    this.error = null;
    
    const filter: EquipementFilter = {};
    if (this.selectedStatut) {
      filter.statut = this.selectedStatut as EtatEquipement;
    }
    if (this.selectedSalleId) {
      filter.salleId = this.selectedSalleId;
    }
    
    this.equipementService.getAllEquipements(filter).subscribe({
      next: (equipements) => {
        this.equipements = equipements;
        
        // Extraire les catégories uniques existantes
        const existingCategories = Array.from(new Set(equipements.map(e => e.categorie).filter(c => !!c)));
        existingCategories.forEach(cat => {
          if (!this.categories.includes(cat)) {
            this.categories.push(cat);
          }
        });

        this.filteredEquipements = [...this.equipements];
        this.currentPage = 1;
        this.applyFilters();
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des équipements:', err);
        this.error = 'Impossible de charger les équipements. Veuillez réessayer.';
        this.isLoading = false;
        this.equipements = [];
        this.filteredEquipements = [];
        this.paginatedEquipements = [];
        this.updatePagination();
      }
    });
  }
  
  /**
   * Charger toutes les salles pour les filtres
   */
  loadRooms(): void {
    this.roomService.getAllRooms().subscribe({
      next: (rooms) => {
        this.rooms = rooms;
        this.salleOptions = [
          { value: '', label: 'Toutes' },
          ...rooms
            .filter(room => (room.id || room.idSalle) && (room.name || room.nomsalle))
            .map(room => ({
              value: room.id || room.idSalle || '',
              label: room.name || room.nomsalle || 'Salle inconnue'
            }))
        ];
      },
      error: (err) => {
        console.error('Erreur lors du chargement des salles:', err);
        this.salleOptions = [{ value: '', label: 'Toutes' }];
      }
    });
  }
  
  /**
   * Rechercher des équipements
   */
  onSearch(): void {
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    this.filteredEquipements = this.equipements.filter(equipement => {
      // Filtre par recherche (nom)
      if (this.searchTerm) {
        const searchLower = this.searchTerm.toLowerCase();
        const nom = (equipement.nom || '').toLowerCase();
        if (!nom.includes(searchLower)) {
          return false;
        }
      }
      
      // Filtre par catégorie (basé sur le nom)
      if (this.selectedCategorie) {
        const nomLower = (equipement.nom || '').toLowerCase();
        const categorieLower = this.selectedCategorie.toLowerCase();
        if (!nomLower.includes(categorieLower)) {
          return false;
        }
      }
      
      // Filtre par salle
      if (this.selectedSalleId && equipement.salleId !== this.selectedSalleId) {
        return false;
      }
      
      // Filtre par statut
      if (this.selectedStatut && equipement.statut !== this.selectedStatut) {
        return false;
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
    this.selectedStatut = '';
    this.selectedSalleId = '';
    this.selectedCategorie = '';
    this.closeDropdowns();
    this.currentPage = 1;
    this.loadEquipements();
  }
  
  /**
   * Toggle le dropdown de filtre de statut
   */
  toggleStatutFilter(): void {
    this.showStatutDropdown = !this.showStatutDropdown;
    if (this.showStatutDropdown) {
      this.showSalleDropdown = false;
      this.showCategorieDropdown = false;
    }
  }
  
  /**
   * Toggle le dropdown de filtre de salle
   */
  toggleSalleFilter(): void {
    this.showSalleDropdown = !this.showSalleDropdown;
    if (this.showSalleDropdown) {
      this.showStatutDropdown = false;
      this.showCategorieDropdown = false;
    }
  }
  
  /**
   * Toggle le dropdown de filtre de catégorie
   */
  toggleCategorieFilter(): void {
    this.showCategorieDropdown = !this.showCategorieDropdown;
    if (this.showCategorieDropdown) {
      this.showStatutDropdown = false;
      this.showSalleDropdown = false;
    }
  }
  
  /**
   * Fermer tous les dropdowns
   */
  closeDropdowns(): void {
    this.showStatutDropdown = false;
    this.showSalleDropdown = false;
    this.showCategorieDropdown = false;
  }
  
  /**
   * Sélectionner un statut
   */
  selectStatut(statut: string): void {
    this.selectedStatut = statut;
    this.showStatutDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Sélectionner une salle
   */
  selectSalle(salleId: string): void {
    this.selectedSalleId = salleId;
    this.showSalleDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Sélectionner une catégorie
   */
  selectCategorie(categorie: string): void {
    this.selectedCategorie = categorie;
    this.showCategorieDropdown = false;
    this.currentPage = 1;
    this.applyFilters();
  }
  
  /**
   * Obtenir le label du statut sélectionné
   */
  getSelectedStatutLabel(): string {
    const option = this.statutOptions.find(opt => opt.value === this.selectedStatut);
    return option ? option.label : 'Tous';
  }
  
  /**
   * Obtenir le label de la salle sélectionnée
   */
  getSelectedSalleLabel(): string {
    const option = this.salleOptions.find(opt => opt.value === this.selectedSalleId);
    return option ? option.label : 'Toutes';
  }
  
  /**
   * Obtenir le label de la catégorie sélectionnée
   */
  getSelectedCategorieLabel(): string {
    const option = this.categorieOptions.find(opt => opt.value === this.selectedCategorie);
    return option ? option.label : 'Tous';
  }
  
  /**
   * Obtenir le nom de la salle d'un équipement
   */
  getSalleName(salleId: string): string {
    if (!salleId) return 'Salle inconnue';
    const room = this.rooms.find(r => (r.id || r.idSalle) === salleId);
    return room ? (room.name || room.nomsalle || 'Salle inconnue') : salleId;
  }
  
  /**
   * Obtenir la catégorie d'un équipement
   */
  getCategorie(equipement: Equipement): string {
    return equipement.categorie || 'Non classé';
  }
  
  /**
   * Obtenir le code de l'équipement (basé sur l'ID pour l'instant)
   */
  getEquipementCode(equipement: Equipement): string {
    // Pour l'instant, on génère un code basé sur l'ID (premiers caractères)
    if (!equipement.idEquip) {
      return 'N/A';
    }
    // Prendre les 8 premiers caractères de l'ID et les convertir en majuscules
    return equipement.idEquip.substring(0, Math.min(8, equipement.idEquip.length)).toUpperCase();
  }
  
  /**
   * Obtenir la classe CSS pour le statut
   */
  getStatutClass(statut: EtatEquipement): string {
    switch (statut) {
      case 'DISPONIBLE':
        return 'status-available';
      case 'EN_COUR_D_UTILISATION':
        return 'status-in-use';
      case 'EN_MAINTENANCE':
        return 'status-maintenance';
      case 'DEFECTUEUX':
        return 'status-defective';
      default:
        return '';
    }
  }
  
  /**
   * Obtenir le label du statut
   */
  getStatutLabel(statut: EtatEquipement): string {
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
  formatDate(dateString: string | null | undefined): string {
    if (!dateString) {
      return '-';
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
  
  /**
   * Obtenir la prochaine date de maintenance (pour l'instant, calculée à partir de la date de création + 3 mois)
   */
  getNextMaintenanceDate(equipement: Equipement): string {
    if (!equipement.createdAt) {
      return '-';
    }
    
    try {
      const date = new Date(equipement.createdAt);
      date.setMonth(date.getMonth() + 3); // 3 mois après la création
      return date.toLocaleDateString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch (error) {
      return '-';
    }
  }
  
  /**
   * Ouvrir le modal d'ajout d'équipement
   */
  onAddEquipement(): void {
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
    this.newEquipement = {
      nom: '',
      categorie: this.categories[0] || '',
      statut: 'DISPONIBLE',
      salleId: ''
    };
    this.formError = null;
    this.isSubmitting = false;
  }
  
  /**
   * Valider le formulaire
   */
  validateForm(): boolean {
    this.formError = null;
    
    if (!this.newEquipement.nom || !this.newEquipement.nom.trim()) {
      this.formError = 'Le nom de l\'équipement est obligatoire';
      return false;
    }
    
    if (!this.newEquipement.categorie || !this.newEquipement.categorie.trim()) {
      this.formError = 'La catégorie (type) est obligatoire';
      return false;
    }
    
    if (!this.newEquipement.statut) {
      this.formError = 'Le statut est obligatoire';
      return false;
    }
    
    return true;
  }
  
  /**
   * Soumettre le formulaire de création
   */
  onSubmitAddEquipement(): void {
    if (!this.validateForm()) {
      return;
    }
    
    this.isSubmitting = true;
    this.formError = null;
    
    const equipementData: CreateEquipementRequest = {
      nom: this.newEquipement.nom.trim(),
      categorie: this.newEquipement.categorie || 'Autre',
      statut: this.newEquipement.statut,
      salleId: this.newEquipement.salleId ? this.newEquipement.salleId : undefined
    };
    
    this.equipementService.createEquipement(equipementData).subscribe({
      next: (equipement) => {
        this.toastService.success('Succès', `L'équipement ${equipement.nom} a été créé avec succès`);
        this.closeAddModal();
        this.loadEquipements();
        this.isSubmitting = false;
      },
      error: (err) => {
        console.error('Erreur lors de la création:', err);
        let errorMessage = 'Impossible de créer l\'équipement. ';
        
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
   * Ouvrir le modal d'édition d'équipement
   */
  onEditEquipement(equipement: Equipement): void {
    this.editingEquipement = equipement;
    this.editForm = {
      nom: equipement.nom,
      categorie: equipement.categorie,
      statut: equipement.statut,
      salleId: equipement.salleId || ''
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
    this.editingEquipement = null;
    this.resetEditForm();
  }
  
  /**
   * Réinitialiser le formulaire d'édition
   */
  resetEditForm(): void {
    this.editForm = {
      nom: '',
      categorie: 'Autre', // Changed from '' to 'Autre'
      statut: 'DISPONIBLE',
      salleId: ''
    };
    this.editFormError = null;
    this.isSubmittingEdit = false;
  }
  
  /**
   * Valider le formulaire d'édition
   */
  validateEditForm(): boolean {
    this.editFormError = null;
    
    if (this.editForm.nom !== undefined && (!this.editForm.nom || !this.editForm.nom.trim())) {
      this.editFormError = 'Le nom de l\'équipement est obligatoire';
      return false;
    }
    
    if (this.editForm.categorie !== undefined && (!this.editForm.categorie || !this.editForm.categorie.trim())) {
      this.editFormError = 'La catégorie est obligatoire';
      return false;
    }
    
    return true;
  }
  
  /**
   * Soumettre le formulaire d'édition
   */
  onSubmitEditEquipement(): void {
    if (!this.validateEditForm()) {
      return;
    }
    
    if (!this.editingEquipement) {
      return;
    }
    
    this.isSubmittingEdit = true;
    this.editFormError = null;
    
    const updateData: UpdateEquipementRequest = {
      nom: this.editForm.nom?.trim(),
      categorie: this.editForm.categorie,
      statut: this.editForm.statut,
      salleId: this.editForm.salleId ? this.editForm.salleId : undefined
    };
    
    // Retirer les champs undefined
    Object.keys(updateData).forEach(key => {
      if (updateData[key as keyof UpdateEquipementRequest] === undefined) {
        delete updateData[key as keyof UpdateEquipementRequest];
      }
    });
    
    this.equipementService.updateEquipement(this.editingEquipement.idEquip, updateData).subscribe({
      next: (equipement) => {
        this.toastService.success('Succès', 'Équipement mis à jour avec succès');
        this.closeEditModal();
        this.loadEquipements();
        this.isSubmittingEdit = false;
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        let errorMessage = 'Impossible de mettre à jour l\'équipement. ';
        
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
   * Supprimer un équipement
   */
  onDeleteEquipement(equipement: Equipement): void {
    const confirmation = confirm(
      `Êtes-vous sûr de vouloir supprimer l'équipement "${equipement.nom}" ?\n` +
      `Cette action est irréversible.`
    );
    
    if (!confirmation) {
      return;
    }
    
    this.isLoading = true;
    this.error = null;
    
    this.equipementService.deleteEquipement(equipement.idEquip).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Équipement supprimé avec succès');
        this.loadEquipements();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.error = 'Impossible de supprimer l\'équipement. Veuillez réessayer.';
        this.isLoading = false;
        this.toastService.error('Erreur', 'Erreur lors de la suppression de l\'équipement');
      }
    });
  }
  
  /**
   * Marquer un équipement comme en maintenance
   */
  onMaintenanceEquipement(equipement: Equipement): void {
    const updateData: UpdateEquipementRequest = {
      statut: 'EN_MAINTENANCE'
    };
    
    this.equipementService.updateEquipement(equipement.idEquip, updateData).subscribe({
      next: () => {
        this.toastService.success('Succès', 'Équipement marqué comme en maintenance');
        this.loadEquipements();
      },
      error: (err) => {
        console.error('Erreur lors de la mise à jour:', err);
        this.toastService.error('Erreur', 'Impossible de mettre à jour l\'équipement');
      }
    });
  }
  
  /**
   * Exporter en CSV (simulé pour l'instant)
   */
  exportToCSV(): void {
    // TODO: Implémenter l'export CSV
    this.toastService.help('Info', 'L\'export CSV sera disponible prochainement');
  }

  /**
   * Ouvrir le modal d'import Excel
   */
  openImportModal(): void {
    this.showImportModal = true;
  }

  /**
   * Gérer le fichier sélectionné dans le modal d'import
   */
  onImportFile(file: File): void {
    this.equipementService.importFromExcel(file).subscribe({
      next: (res) => {
        this.importModalRef.setResult({ message: res.message, count: res.count });
        this.toastService.success('Succès', res.message);
        this.loadEquipements();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de l\'importation';
        this.importModalRef.setError(msg);
        this.toastService.error('Erreur', msg);
      }
    });
  }
  
  /**
   * Toggle l'affichage des détails d'un équipement
   */
  toggleRow(equipement: Equipement): void {
    const id = equipement.idEquip;
    if (this.expandedEquipId === id) {
      this.expandedEquipId = null;
    } else {
      this.expandedEquipId = id || null;
    }
  }

  /**
   * Pagination
   */
  updatePagination(): void {
    this.totalEquipements = this.filteredEquipements.length;
    this.totalPages = Math.ceil(this.totalEquipements / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalEquipements);
    
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedEquipements = this.filteredEquipements.slice(start, end);
    
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
   * Ajouter un nouveau type d'équipement car le client doit creer un type avant d'ajouter un equipement
   */
  addCategory(): void {
    if (this.newCategoryName && this.newCategoryName.trim()) {
      const cat = this.newCategoryName.trim();
      if (!this.categories.includes(cat)) {
        this.categories.push(cat);
        this.toastService.success('Type créé', `Le type ${cat} a été ajouté`);
        this.newCategoryName = '';
        this.showCategoryModal = false;
      } else {
        this.toastService.warning('Déjà existant', 'Ce type existe déjà');
      }
    }
  }

  openCategoryModal(): void {
    this.newCategoryName = '';
    this.showCategoryModal = true;
  }
}
