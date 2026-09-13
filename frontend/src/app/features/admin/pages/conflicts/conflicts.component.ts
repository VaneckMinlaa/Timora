import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

import { ConflictService } from '../../../../core/services/conflict.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import {
  Conflict,
  ConflictDetails,
  ConflictType,
  ConflictFilters,
  Solution,
  ResolveConflictRequest,
  ConflictStats,
  ConflictSeverity
} from '../../../../core/models/conflict.model';

@Component({
  selector: 'app-conflicts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './conflicts.component.html',
  styleUrls: ['./conflicts.component.scss']
})
export class ConflictsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Data
  conflicts: Conflict[] = [];
  filteredConflicts: Conflict[] = [];
  selectedConflict: ConflictDetails | null = null;
  stats: ConflictStats | null = null;
  
  // Filters
  filters: ConflictFilters = {};
  searchQuery: string = '';
  selectedType: string = 'all';
  selectedSeverity: string = 'all';
  selectedStatus: string = 'PENDING';
  selectedDate: string = '';
  
  // UI State
  isLoading: boolean = false;
  showManualResolution: boolean = false;
  
  // Manual Resolution Form
  manualForm = {
    day: 'Lundi',
    time: '10:00 - 12:00',
    room: 'S102'
  };

  // Available options for manual resolution
  days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  timeSlots = [
    '08:00 - 10:00',
    '10:00 - 12:00',
    '13:00 - 15:00',
    '15:00 - 17:00'
  ];
  rooms = ['S102', 'S105', 'S201', 'S303'];

  constructor(
    private conflictService: ConflictService,
    private toastNotification: ToastNotificationService
  ) {}

  ngOnInit(): void {
    this.loadStats();
    this.loadConflicts();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Load conflict statistics
   */
  loadStats(): void {
    this.conflictService.getConflictStats()
      .pipe(
        catchError(error => {
          console.error('Error loading stats:', error);
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(stats => {
        this.stats = stats;
      });
  }

  /**
   * Load all conflicts
   */
  loadConflicts(): void {
    this.isLoading = true;
    
    this.conflictService.getAllConflicts(this.filters)
      .pipe(
        catchError(error => {
          console.error('Error loading conflicts:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible de charger les conflits');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(conflicts => {
        this.conflicts = conflicts;
        this.applyFilters();
        this.isLoading = false;
        
        // Auto-select first conflict if available
        if (this.filteredConflicts.length > 0 && !this.selectedConflict) {
          this.selectConflict(this.filteredConflicts[0]);
        }
      });
  }

  /**
   * Apply filters to conflicts list
   */
  applyFilters(): void {
    this.filteredConflicts = this.conflicts.filter(conflict => {
      // Search filter
      if (this.searchQuery) {
        const query = this.searchQuery.toLowerCase();
        const matchesSearch = 
          conflict.title.toLowerCase().includes(query) ||
          conflict.description.toLowerCase().includes(query) ||
          conflict.teacherName?.toLowerCase().includes(query) ||
          conflict.roomName?.toLowerCase().includes(query);
        
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (this.selectedType !== 'all' && conflict.type !== this.selectedType) {
        return false;
      }
      
      // Date filter
      if (this.selectedDate && conflict.date !== this.selectedDate) {
        return false;
      }
      
      return true;
    });
  }

  /**
   * Select a conflict to view details
   */
  selectConflict(conflict: Conflict): void {
    this.isLoading = true;
    this.showManualResolution = false;
    
    this.conflictService.getConflictById(conflict.id)
      .pipe(
        catchError(error => {
          console.error('Error loading conflict details:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible de charger les détails du conflit');
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(details => {
        this.selectedConflict = details;
        this.isLoading = false;
      });
  }

  /**
   * Apply a suggested solution
   */
  applySolution(solution: Solution): void {
    if (!this.selectedConflict) return;
    
    const request: ResolveConflictRequest = {
      resolutionId: solution.id,
      notes: 'Solution appliquée depuis l\'interface',
      resolvedBy: 'admin'
    };
    
    this.isLoading = true;
    this.conflictService.resolveConflict(this.selectedConflict.conflict.id, request)
      .pipe(
        catchError(error => {
          console.error('Error resolving conflict:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible de résoudre le conflit');
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.toastNotification.createNotification('success', 'Succès', 'Conflit résolu avec succès');
        this.isLoading = false;
        this.selectedConflict = null;
        this.loadConflicts();
      });
  }

  /**
   * Show manual resolution form
   */
  showManualResolutionForm(): void {
    this.showManualResolution = true;
  }

  /**
   * Cancel manual resolution
   */
  cancelManualResolution(): void {
    this.showManualResolution = false;
  }

  /**
   * Submit manual resolution
   */
  submitManualResolution(): void {
    if (!this.selectedConflict) return;
    
    // Pour la résolution manuelle, on devrait créer une solution personnalisée
    // Pour l'instant, on ignore simplement le conflit avec une note
    const reason = `Résolution manuelle: ${this.manualForm.day} ${this.manualForm.time} en salle ${this.manualForm.room}`;
    
    this.isLoading = true;
    this.conflictService.ignoreConflict(this.selectedConflict.conflict.id, reason)
      .pipe(
        catchError(error => {
          console.error('Error resolving conflict:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible de résoudre le conflit');
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.toastNotification.createNotification('success', 'Succès', 'Conflit résolu avec succès');
        this.isLoading = false;
        this.showManualResolution = false;
        this.selectedConflict = null;
        this.loadStats();
        this.loadConflicts();
      });
  }

  /**
   * Get conflict type label
   */
  getConflictTypeLabel(type: ConflictType): string {
    const labels: Record<ConflictType, string> = {
      'ROOM_OVERLAP': 'Conflit de Salle',
      'TEACHER_OVERLAP': 'Conflit Enseignant',
      'STUDENT_GROUP_OVERLAP': 'Conflit de Groupe',
      'ROOM_CAPACITY': 'Capacité Insuffisante',
      'EQUIPMENT_MISSING': 'Équipement Manquant',
      'TEACHER_UNAVAILABLE': 'Enseignant Indisponible',
      'TIME_OVERFLOW': 'Dépassement Horaire'
    };
    return labels[type] || type;
  }

  /**
   * Get conflict type icon
   */
  getConflictTypeIcon(type: ConflictType): string {
    const icons: Record<ConflictType, string> = {
      'ROOM_OVERLAP': 'meeting_room',
      'TEACHER_OVERLAP': 'person',
      'STUDENT_GROUP_OVERLAP': 'groups',
      'ROOM_CAPACITY': 'reduce_capacity',
      'EQUIPMENT_MISSING': 'build',
      'TEACHER_UNAVAILABLE': 'event_busy',
      'TIME_OVERFLOW': 'schedule'
    };
    return icons[type] || 'error';
  }

  /**
   * Get conflict type color
   */
  getConflictTypeColor(type: ConflictType): string {
    const colors: Record<ConflictType, string> = {
      'ROOM_OVERLAP': '#dc2626',
      'TEACHER_OVERLAP': '#f59e0b',
      'STUDENT_GROUP_OVERLAP': '#3b82f6',
      'ROOM_CAPACITY': '#8b5cf6',
      'EQUIPMENT_MISSING': '#ec4899',
      'TEACHER_UNAVAILABLE': '#14b8a6',
      'TIME_OVERFLOW': '#f97316'
    };
    return colors[type] || '#6b7280';
  }

  /**
   * Get solution icon
   */
  getSolutionIcon(type: string): string {
    const icons: Record<string, string> = {
      'CHANGE_ROOM': 'swap_horiz',
      'CHANGE_TIME': 'schedule',
      'SWAP_COURSES': 'swap_vert',
      'SPLIT_GROUP': 'call_split',
      'CHANGE_TEACHER': 'person_swap',
      'CANCEL_COURSE': 'cancel'
    };
    return icons[type] || 'check_circle';
  }

  /**
   * Handle search input
   */
  onSearchChange(): void {
    this.applyFilters();
  }

  /**
   * Handle filter change
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Detect conflicts
   */
  detectConflicts(): void {
    this.isLoading = true;
    this.conflictService.detectConflicts()
      .pipe(
        catchError(error => {
          console.error('Error detecting conflicts:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible de détecter les conflits');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(conflicts => {
        this.toastNotification.createNotification('success', 'Succès', `${conflicts.length} conflits détectés`);
        this.loadStats();
        this.loadConflicts();
      });
  }

  /**
   * Auto-resolve all conflicts
   */
  autoResolveAll(): void {
    if (!confirm('Voulez-vous vraiment résoudre automatiquement tous les conflits en attente ?')) {
      return;
    }

    this.isLoading = true;
    this.conflictService.autoResolveAll()
      .pipe(
        catchError(error => {
          console.error('Error auto-resolving conflicts:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible de résoudre automatiquement les conflits');
          return of({ resolved: 0, failed: 0 });
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        this.toastNotification.createNotification(
          'success', 
          'Résolution automatique terminée', 
          `${result.resolved} conflits résolus, ${result.failed} échoués`
        );
        this.loadStats();
        this.loadConflicts();
      });
  }

  /**
   * Ignore conflict
   */
  ignoreConflict(): void {
    if (!this.selectedConflict) return;

    const reason = prompt('Raison de l\'ignorance du conflit (optionnel):');
    if (reason === null) return; // User cancelled

    this.isLoading = true;
    this.conflictService.ignoreConflict(this.selectedConflict.conflict.id, reason || undefined)
      .pipe(
        catchError(error => {
          console.error('Error ignoring conflict:', error);
          this.toastNotification.createNotification('error', 'Erreur', 'Impossible d\'ignorer le conflit');
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        this.toastNotification.createNotification('warning', 'Conflit ignoré', 'Le conflit a été marqué comme ignoré');
        this.isLoading = false;
        this.selectedConflict = null;
        this.loadStats();
        this.loadConflicts();
      });
  }

  /**
   * Get severity label
   */
  getSeverityLabel(severity: ConflictSeverity): string {
    const labels: Record<ConflictSeverity, string> = {
      'CRITICAL': 'Critique',
      'HIGH': 'Élevé',
      'MEDIUM': 'Moyen',
      'LOW': 'Faible'
    };
    return labels[severity] || severity;
  }

  /**
   * Get severity color
   */
  getSeverityColor(severity: ConflictSeverity): string {
    const colors: Record<ConflictSeverity, string> = {
      'CRITICAL': '#dc2626',
      'HIGH': '#f59e0b',
      'MEDIUM': '#3b82f6',
      'LOW': '#10b981'
    };
    return colors[severity] || '#6b7280';
  }
}
