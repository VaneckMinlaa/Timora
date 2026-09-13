import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ecole, CreateEcoleRequest } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';

@Component({
  selector: 'app-ecole-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './ecole-management.component.html',
  styleUrls: ['./ecole-management.component.scss']
})
export class EcoleManagementComponent implements OnInit {
  ecoles: Ecole[] = [];
  filteredEcoles: Ecole[] = [];
  paginatedEcoles: Ecole[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  isSubmitting: boolean = false;
  editingEcoleId: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalEcoles: number = 0;
  totalPages: number = 0;
  startIndex: number = 1;
  endIndex: number = 5;
  visiblePages: number[] = [];

  // Modal
  showModal: boolean = false;
  ecoleForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private toastService: ToastNotificationService
  ) {
    this.ecoleForm = this.fb.group({
      nomEcole: ['', [Validators.required, Validators.minLength(2)]]
    });
  }

  ngOnInit(): void {
    this.loadEcoles();
  }

  /**
   * Charge toutes les écoles
   */
  loadEcoles(): void {
    this.isLoading = true;
    this.error = null;
    this.courseService.getAllEcoles().subscribe({
      next: (ecoles) => {
        this.ecoles = ecoles;
        this.filteredEcoles = ecoles;
        this.currentPage = 1;
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des écoles:', err);
        this.error = 'Impossible de charger les écoles. Veuillez réessayer.';
        this.isLoading = false;
        this.toastService.error('Erreur', 'Impossible de charger les écoles');
      }
    });
  }

  /**
   * Filtre les écoles selon le terme de recherche
   */
  onSearch(): void {
    if (!this.searchTerm.trim()) {
      this.filteredEcoles = this.ecoles;
    } else {
      const term = this.searchTerm.toLowerCase().trim();
      this.filteredEcoles = this.ecoles.filter(ecole =>
        ecole.nomEcole.toLowerCase().includes(term) ||
        ecole.idEcole.toLowerCase().includes(term)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Mettre à jour la pagination
   */
  updatePagination(): void {
    this.totalEcoles = this.filteredEcoles.length;
    this.totalPages = Math.ceil(this.totalEcoles / this.itemsPerPage);
    
    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedEcoles = this.filteredEcoles.slice(start, end);
    
    this.startIndex = this.totalEcoles > 0 ? start + 1 : 0;
    this.endIndex = Math.min(end, this.totalEcoles);
    
    // Calculer les pages visibles
    const maxVisible = 5;
    let startPage = Math.max(1, this.currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(this.totalPages, startPage + maxVisible - 1);
    
    if (endPage - startPage < maxVisible - 1) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }
    
    this.visiblePages = [];
    for (let i = startPage; i <= endPage; i++) {
      this.visiblePages.push(i);
    }
  }

  /**
   * Aller à la page précédente
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  /**
   * Aller à la page suivante
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  /**
   * Aller à une page spécifique
   */
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
    }
  }

  /**
   * Ouvre le modal pour ajouter une école
   */
  onAddEcole(): void {
    this.editingEcoleId = null;
    this.ecoleForm.reset();
    this.showModal = true;
  }

  /**
   * Ouvre le modal pour éditer une école
   */
  onEdit(ecole: Ecole): void {
    this.editingEcoleId = ecole.idEcole;
    this.ecoleForm.patchValue({
      nomEcole: ecole.nomEcole
    });
    this.showModal = true;
  }

  /**
   * Ferme le modal
   */
  closeModal(): void {
    this.showModal = false;
    this.editingEcoleId = null;
    this.isSubmitting = false;
    this.ecoleForm.reset();
  }

  /**
   * Soumet le formulaire (création ou mise à jour)
   */
  onSubmit(): void {
    if (this.ecoleForm.invalid) {
      this.ecoleForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const request: CreateEcoleRequest = {
      nomEcole: this.ecoleForm.value.nomEcole
    };

    if (this.editingEcoleId) {
      // Mise à jour
      this.courseService.updateEcole(this.editingEcoleId, request).subscribe({
        next: () => {
          this.toastService.success('Succès', 'École mise à jour avec succès');
          this.closeModal();
          this.loadEcoles();
          this.updatePagination();
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour:', err);
          this.toastService.error('Erreur', err.error?.message || 'Impossible de mettre à jour l\'école');
          this.isSubmitting = false;
        }
      });
    } else {
      // Création
      this.courseService.createEcole(request).subscribe({
        next: () => {
          this.toastService.success('Succès', 'École créée avec succès');
          this.closeModal();
          this.loadEcoles();
          this.currentPage = 1;
          this.updatePagination();
        },
        error: (err) => {
          console.error('Erreur lors de la création:', err);
          this.toastService.error('Erreur', err.error?.message || 'Impossible de créer l\'école');
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Supprime une école
   */
  onDelete(ecole: Ecole): void {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer l'école "${ecole.nomEcole}" ?`)) {
      return;
    }

    this.courseService.deleteEcole(ecole.idEcole).subscribe({
      next: () => {
        this.toastService.success('Succès', 'École supprimée avec succès');
        this.loadEcoles();
        this.currentPage = 1;
        this.updatePagination();
      },
      error: (err) => {
        console.error('Erreur lors de la suppression:', err);
        this.toastService.error('Erreur', err.error?.message || 'Impossible de supprimer l\'école');
      }
    });
  }

  /**
   * Formate une date
   */
  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('fr-FR');
  }
}
