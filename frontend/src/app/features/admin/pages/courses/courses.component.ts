import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Course, CreateCourseRequest, Filiere, Classe, UE, Ecole } from '../../../../core/models/course.model';
import { CourseService } from '../../../../core/services/course.service';
import { UserService } from '../../../../core/services/user.service';
import { RoomService } from '../../../../core/services/room.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { User } from '../../../../core/models';
import { Room } from '../../../../core/models/room.model';
import { TypeCours, Semestre } from '../../../../core/models/schedule.model';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';

@Component({
  selector: 'app-courses',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './courses.component.html',
  styleUrls: ['./courses.component.scss']
})
export class CoursesComponent implements OnInit {
  courses: Course[] = [];
  filteredCourses: Course[] = [];
  paginatedCourses: Course[] = [];
  searchTerm: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  isSubmitting: boolean = false;
  editingCourseId: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalCourses: number = 0;
  totalPages: number = 0;
  startIndex: number = 1;
  endIndex: number = 5;
  visiblePages: number[] = [];

  // Form
  courseForm: FormGroup;

  // Dropdown data
  teachers: User[] = [];
  ecoles: Ecole[] = [];
  filieres: Filiere[] = [];
  classes: Classe[] = [];
  ues: UE[] = [];
  availableRooms: Room[] = [];

  // Cache pour les noms
  teacherCache: Map<string, string> = new Map();
  teacherInitialsCache: Map<string, string> = new Map();
  teacherColorCache: Map<string, string> = new Map();
  filiereCache: Map<string, string> = new Map();
  classeCache: Map<string, string> = new Map();

  // Niveaux disponibles
  niveaux: string[] = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', '1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'];

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private userService: UserService,
    private roomService: RoomService,
    private toastService: ToastNotificationService
  ) {
    this.courseForm = this.fb.group({
      nom: ['', [Validators.required]],
      type: ['', [Validators.required]],
      enseignantId: ['', [Validators.required]],
      salleId: [''],
      filiereId: [''],
      niveau: [''],
      classeIds: [[]], // Liste des classes
      codeUE: [''],
      volumeHoraire: [''],
      credits: ['', [Validators.required, Validators.min(0)]],
      semestre: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadCourses();
    this.loadTeachers();
    this.loadRooms();
    this.loadEcoles();
    this.loadFilieres();
    this.loadAllUEs();
  }

  /**
   * Charger tous les cours
   */
  loadCourses(): void {
    this.isLoading = true;
    this.error = null;

    // Charger d'abord toutes les classes pour le cache des noms
    this.courseService.getAllClasses().subscribe({
      next: (allClasses) => {
        allClasses.forEach(c => this.classeCache.set(c.idClasse, c.nom));
        
        // Charger les cours après avoir rempli le cache des classes
        this.courseService.getAllCourses().subscribe({
            next: (courses) => {
              // On ne garde que les cours "Maîtres" pour la gestion (ceux qui ne sont pas encore planifiés dans le calendrier)
              this.courses = courses.filter(c => !c.heureDebut);
              this.filteredCourses = [...this.courses];
              this.currentPage = 1;
              this.updatePagination();
              this.isLoading = false;
            },
          error: (err) => {
            console.error('Erreur lors du chargement des cours:', err);
            this.error = 'Impossible de charger les cours. Veuillez réessayer plus tard.';
            this.isLoading = false;
          }
        });
      },
      error: (err) => {
        console.error('Erreur chargement cache classes:', err);
        // On continue quand même
        this.isLoading = false;
      }
    });
  }

  /**
   * Charger les enseignants
   */
  loadTeachers(): void {
    this.userService.getAllUsers({ role: 'TEACHER' }).subscribe({
      next: (users) => {
        this.teachers = users;
        // Remplir les caches pour les enseignants
        users.forEach(teacher => {
          const teacherId = String(teacher.id).toLowerCase();
          this.teacherCache.set(teacherId, `${teacher.firstName} ${teacher.lastName}`);
          this.teacherInitialsCache.set(teacherId, getUserInitials(teacher.firstName, teacher.lastName));
          this.teacherColorCache.set(teacherId, getUserAvatarColor(teacher.firstName, teacher.lastName));
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des enseignants:', err);
      }
    });
  }

  /**
   * Charger les salles disponibles
   */
  loadRooms(): void {
    this.roomService.getAllRooms({}).subscribe({
      next: (rooms) => {
        this.availableRooms = rooms;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des salles:', err);
      }
    });
  }

  /**
   * Filtrer les cours par terme de recherche
   */
  filterCourses(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCourses = [...this.courses];
    } else {
      const searchLower = this.searchTerm.toLowerCase();
      this.filteredCourses = this.courses.filter(course => {
        const nom = (course.nom || '').toLowerCase();
        const teacherName = (this.getTeacherName(course.enseignantId) || '').toLowerCase();
        return nom.includes(searchLower) || teacherName.includes(searchLower);
      });
    }
    this.currentPage = 1;
    this.updatePagination();
  }

  /**
   * Mettre à jour la pagination
   */
  updatePagination(): void {
    this.totalCourses = this.filteredCourses.length;
    this.totalPages = Math.ceil(this.totalCourses / this.itemsPerPage);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    this.paginatedCourses = this.filteredCourses.slice(start, end);

    this.startIndex = this.totalCourses > 0 ? start + 1 : 0;
    this.endIndex = Math.min(end, this.totalCourses);

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
   * Charger toutes les écoles
   */
  loadEcoles(): void {
    this.courseService.getAllEcoles().subscribe({
      next: (ecoles) => {
        this.ecoles = ecoles;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des écoles:', err);
      }
    });
  }

  /**
   * Charger les filières
   */
  loadFilieres(): void {
    this.courseService.getAllFilieres().subscribe({
      next: (filieres) => {
        this.filieres = filieres;
        filieres.forEach(f => {
          this.filiereCache.set(f.idFiliere, f.nom);
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des filières:', err);
      }
    });
  }

  /**
   * Charger les classes par filière
   */
  loadClassesByFiliere(filiereId: string): void {
    this.courseService.getClassesByFiliere(filiereId).subscribe({
      next: (classes) => {
        this.classes = classes;
        classes.forEach(c => {
          this.classeCache.set(c.idClasse, c.nom);
        });
      },
      error: (err) => {
        console.error('Erreur lors du chargement des classes:', err);
      }
    });
  }

  /**
   * Charger toutes les UEs
   */
  loadAllUEs(): void {
    this.courseService.getAllUEs().subscribe({
      next: (ues) => {
        this.ues = ues;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des UEs:', err);
      }
    });
  }

  /**
   * Charger les UEs par filière
   */
  loadUEsByFiliere(filiereId: string): void {
    this.courseService.getUEsByFiliere(filiereId).subscribe({
      next: (ues) => {
        // Mettre à jour la liste des UEs avec celles de la filière
        // Si on veut filtrer, on peut remplacer this.ues par ues
        // Pour l'instant, on garde toutes les UEs mais on pourrait filtrer
        this.ues = ues;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des UEs:', err);
      }
    });
  }

  /**
   * Gérer le changement de filière
   */
  onFiliereChange(): void {
    const filiereId = this.courseForm.get('filiereId')?.value;
    if (filiereId) {
      this.loadClassesByFiliere(filiereId);
      this.loadUEsByFiliere(filiereId);
    } else {
      this.classes = [];
      this.ues = [];
    }
  }

  /**
   * Soumettre le formulaire
   */
  onSubmit(): void {
    if (this.courseForm.invalid) {
      this.courseForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    const formValue = this.courseForm.value;

    // Résoudre les UEs depuis le codeUE
    let ueIds: string[] = [];
    if (formValue.codeUE) {
      const ue = this.ues.find(u => u.codeUE === formValue.codeUE);
      if (ue) {
        ueIds = [ue.idUE];
      }
    }

    // Récupérer la salle sélectionnée
    const salleId: string | undefined = formValue.salleId || undefined;

    if (this.editingCourseId) {
      // Mise à jour d'un cours existant
      const updateRequest = {
        nom: formValue.nom,
        type: formValue.type as TypeCours,
        enseignantId: formValue.enseignantId,
        salleId: salleId,
        ueIds: ueIds.length > 0 ? ueIds : undefined,
        classeIds: formValue.classeIds && formValue.classeIds.length > 0 ? formValue.classeIds : undefined,
        credits: formValue.credits,
        semestre: formValue.semestre,
        volumeTotal: formValue.volumeHoraire,
        volumeRestant: formValue.volumeHoraire // En édition, on peut vouloir garder l'existant, mais ici on simplifie
      };

      this.courseService.updateCourse(this.editingCourseId, updateRequest).subscribe({
        next: (course) => {
          this.toastService.success('Succès', 'Cours mis à jour avec succès');
          this.loadCourses();
          this.resetForm();
          this.isSubmitting = false;
          this.editingCourseId = null;
        },
        error: (err) => {
          console.error('Erreur lors de la mise à jour du cours:', err);
          this.toastService.error('Erreur', 'Impossible de mettre à jour le cours. Veuillez réessayer.');
          this.isSubmitting = false;
        }
      });
    } else {
      // Création d'un nouveau cours
      const request: CreateCourseRequest = {
        nom: formValue.nom,
        type: formValue.type as TypeCours,
        enseignantId: formValue.enseignantId,
        salleId: salleId,
        filiereId: formValue.filiereId || undefined,
        niveau: formValue.niveau || undefined,
        classeIds: formValue.classeIds && formValue.classeIds.length > 0 ? formValue.classeIds : undefined,
        ueIds: ueIds.length > 0 ? ueIds : undefined,
        credits: formValue.credits,
        semestre: formValue.semestre,
        volumeTotal: formValue.volumeHoraire,
        volumeRestant: formValue.volumeHoraire
      };

      this.courseService.createCourse(request).subscribe({
        next: (course) => {
          this.toastService.success('Succès', 'Cours créé avec succès');
          this.loadCourses();
          this.resetForm();
          this.isSubmitting = false;
        },
        error: (err) => {
          console.error('Erreur lors de la création du cours:', err);
          this.toastService.error('Erreur', 'Impossible de créer le cours. Veuillez réessayer.');
          this.isSubmitting = false;
        }
      });
    }
  }

  /**
   * Annuler le formulaire
   */
  onCancel(): void {
    this.resetForm();
  }

  /**
   * Réinitialiser le formulaire
   */
  resetForm(): void {
    this.courseForm.reset({
      nom: '',
      type: '',
      enseignantId: '',
      salleId: '',
      filiereId: '',
      niveau: '',
      classeIds: [],
      codeUE: '',
      volumeHoraire: '',
      credits: '',
      semestre: ''
    });
    this.courseForm.markAsUntouched();
    this.editingCourseId = null;
    this.classes = [];
    this.ues = [];
  }

  /**
   * Modifier un cours
   */
  onEdit(course: Course): void {
    // Si le cours a des UEs, charger les détails pour obtenir le codeUE
    let codeUE = '';
    if (course.ueIds && course.ueIds.length > 0) {
      // Trouver l'UE correspondante dans la liste chargée
      const ue = this.ues.find(u => u.idUE === course.ueIds![0]);
      if (ue) {
        codeUE = ue.codeUE;
      } else {
        // Si l'UE n'est pas dans la liste, on peut essayer de la charger
        // Pour l'instant, on laisse vide
      }
    }

    // Charger les données du cours dans le formulaire
    this.courseForm.patchValue({
      nom: course.nom,
      type: course.type,
      enseignantId: course.enseignantId,
      salleId: course.salleId || '',
      filiereId: course.filiereId || '',
      niveau: course.niveau || '',
      classeIds: course.classeIds || [],
      codeUE: codeUE,
      volumeHoraire: course.volumeTotal || '',
      credits: course.credits || '',
      semestre: course.semestre || ''
    });

    // Charger les classes/UEs de la filière pour permettre l'édition
    if (course.filiereId) {
      this.loadClassesByFiliere(course.filiereId);
      this.loadUEsByFiliere(course.filiereId);
    }

    // Scroll vers le formulaire
    document.querySelector('section')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    this.editingCourseId = course.idCours;
  }

  /**
   * Supprimer un cours
   */
  onDelete(course: Course): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer le cours "${course.nom}" ?`)) {
      this.courseService.deleteCourse(course.idCours).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Cours supprimé avec succès');
          this.loadCourses();
        },
        error: (err) => {
          console.error('Erreur lors de la suppression du cours:', err);
          this.toastService.error('Erreur', 'Impossible de supprimer le cours. Veuillez réessayer.');
        }
      });
    }
  }

  /**
   * Obtenir le label d'un type de cours
   */
  getTypeLabel(type: TypeCours): string {
    const labels: Record<TypeCours, string> = {
      'COURS_MAGISTRAL': 'CM (Cours Magistral)',
      'TD': 'TD (Travaux Dirigés)',
      'TP': 'TP (Travaux Pratiques)',
      'EXAMEN': 'Examen'
    };
    return labels[type] || type;
  }

  /**
   * Obtenir le nom d'un enseignant
   */
  getTeacherName(teacherId: string): string {
    if (!teacherId) return 'Inconnu';
    return this.teacherCache.get(String(teacherId).toLowerCase()) || teacherId;
  }

  /**
   * Obtenir les initiales d'un enseignant
   */
  getTeacherInitials(teacherId: string): string {
    if (!teacherId) return 'U';
    return this.teacherInitialsCache.get(String(teacherId).toLowerCase()) || String(teacherId).substring(0, 2).toUpperCase();
  }

  /**
   * Obtenir la couleur d'avatar d'un enseignant
   */
  getTeacherColor(teacherId: string): string {
    if (!teacherId) return '#64748b';
    return this.teacherColorCache.get(String(teacherId).toLowerCase()) || '#2563eb';
  }


  /**
   * Obtenir le nom d'une filière
   */
  getFiliereName(course: Course): string {
    return course.filiereNom || 'Non spécifiée';
  }

  /**
   * Obtenir le nom d'un niveau
   */
  getNiveauName(course: Course): string {
    return course.niveau || 'Tous';
  }

  /**
   * Obtenir les noms des classes
   */
  getClasseNames(course: Course): string {
    if (!course.classeIds || course.classeIds.length === 0) {
      return 'Toutes les classes';
    }
    return course.classeIds
      .map(id => this.classeCache.get(id) || id)
      .join(', ');
  }

  /**
   * Obtenir le label d'un semestre
   */
  getSemestreLabel(semestre: string | undefined): string {
    if (semestre === 'SEMESTRE_1') return 'Semestre 1';
    if (semestre === 'SEMESTRE_2') return 'Semestre 2';
    return semestre || 'Non spécifié';
  }

  /**
   * Calculer la progression du volume horaire
   */
  getProgress(course: Course): number {
    const total = course.volumeTotal || (course.credits ? course.credits * 15 : 30);
    if (total === 0) return 0;
    const consumed = total - (course.volumeRestant || total);
    const progress = (consumed / total) * 100;
    return Math.min(100, Math.round(progress));
  }

  /**
   * Obtenir le libellé de consommation (ex: 12h / 30h)
   */
  getVolumeLabel(course: Course): string {
    const total = course.volumeTotal || (course.credits ? course.credits * 15 : 30);
    const consumed = total - (course.volumeRestant || total);
    return `${consumed}h / ${total}h`;
  }
}
