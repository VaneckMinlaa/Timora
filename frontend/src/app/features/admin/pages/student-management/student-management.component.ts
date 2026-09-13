import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Etudiant, CreateEtudiantRequest, StudentFilter } from '../../../../core/models/student.model';
import { StudentService } from '../../../../core/services/student.service';
import { CourseService } from '../../../../core/services/course.service';
import { Filiere, Classe, UE, Ecole } from '../../../../core/models/course.model';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import { ExcelImportComponent } from '../../../../core/components/excel-import/excel-import.component';

@Component({
  selector: 'app-student-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ExcelImportComponent],
  templateUrl: './student-management.component.html',
  styleUrls: ['./student-management.component.scss']
})
export class StudentManagement implements OnInit {
  students: Etudiant[] = [];
  filteredStudents: Etudiant[] = [];
  paginatedStudents: Etudiant[] = [];
  searchTerm: string = '';
  selectedFiliereId: string = '';
  selectedNiveau: string = '';

  isLoading: boolean = false;
  error: string | null = null;

  // Modals
  showModal: boolean = false;
  isEditing: boolean = false;
  isSubmitting: boolean = false;
  formError: string | null = null;
  
  showImportModal: boolean = false;
  @ViewChild(ExcelImportComponent) importModalRef!: ExcelImportComponent;

  // Student specific data
  filieres: Filiere[] = [];
  ecoles: Ecole[] = [];
  classes: Classe[] = [];
  allClasses: Classe[] = [];
  niveaux: string[] = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', '1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'];

  // Cache pour les noms
  classeCache: Map<string, string> = new Map();

  // Current student being edited/created
  currentStudent: CreateEtudiantRequest = this.getEmptyStudent();
  editingStudentId: string | null = null;

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;
  totalStudentsCount: number = 0;
  totalPages: number = 0;
  startIndex: number = 0;
  endIndex: number = 0;
  visiblePages: number[] = [];

  // Dropdowns
  showFiliereDropdown: boolean = false;
  showNiveauDropdown: boolean = false;

  constructor(
    private studentService: StudentService,
    private courseService: CourseService
  ) {}

  ngOnInit(): void {
    this.loadStudents();
    this.loadFilieres();
    this.loadEcoles();
    this.loadAllClasses();
  }

  loadStudents(): void {
    this.isLoading = true;
    this.error = null;

    const filter: StudentFilter = {
      search: this.searchTerm || undefined,
      filiereId: this.selectedFiliereId || undefined,
      niveau: this.selectedNiveau || undefined
    };

    this.studentService.getAllStudents(filter).subscribe({
      next: (students) => {
        this.students = students;
        this.filteredStudents = [...students];
        this.updatePagination();
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur chargement étudiants:', err);
        this.error = 'Impossible de charger la liste des étudiants.';
        this.isLoading = false;
      }
    });
  }

  loadFilieres(): void {
    this.courseService.getAllFilieres().subscribe({
      next: (filieres) => this.filieres = filieres,
      error: (err) => console.error('Erreur chargement filières:', err)
    });
  }
  
  loadEcoles(): void {
    this.courseService.getAllEcoles().subscribe({
      next: (ecoles) => this.ecoles = ecoles,
      error: (err) => console.error('Erreur chargement écoles:', err)
    });
  }

  loadAllClasses(): void {
    this.courseService.getAllClasses().subscribe({
      next: (classes) => {
        this.allClasses = classes;
        classes.forEach(c => this.classeCache.set(c.idClasse, c.nom));
      },
      error: (err) => console.error('Erreur chargement de toutes les classes:', err)
    });
  }

  loadClassesByFiliere(filiereId: string): void {
    this.courseService.getClassesByFiliere(filiereId).subscribe({
      next: (classes) => this.classes = classes,
      error: (err) => {
        console.error('Erreur chargement classes pour filière:', err);
        this.classes = [];
      }
    });
  }

  onFiliereChange(): void {
    if (this.currentStudent.filiereId) {
      this.loadClassesByFiliere(this.currentStudent.filiereId);
      
      // Auto-assigner l'école si trouvée dans la filière
      const selectedFiliere = this.filieres.find(f => f.idFiliere === this.currentStudent.filiereId);
      if (selectedFiliere && selectedFiliere.ecoleId) {
        this.currentStudent.ecoleId = selectedFiliere.ecoleId;
      }
    } else {
      this.classes = [];
    }
  }

  getFiliereName(id?: string): string {
    if (!id) return 'N/A';
    const filiere = this.filieres.find(f => f.idFiliere === id);
    return filiere ? filiere.nom : id;
  }

  getClasseName(id?: string): string {
    if (!id) return 'N/A';
    return this.classeCache.get(id) || id;
  }

  getEcoleName(id?: string): string {
    if (!id) return 'N/A';
    const ecole = this.ecoles.find(e => e.idEcole === id);
    return ecole ? ecole.nomEcole : id;
  }

  onSearch(): void {
    this.currentPage = 1;
    this.loadStudents();
  }

  toggleFiliereFilter(): void {
    this.showFiliereDropdown = !this.showFiliereDropdown;
    this.showNiveauDropdown = false;
  }

  toggleNiveauFilter(): void {
    this.showNiveauDropdown = !this.showNiveauDropdown;
    this.showFiliereDropdown = false;
  }

  selectFiliere(id: string): void {
    this.selectedFiliereId = id;
    this.showFiliereDropdown = false;
    this.onSearch();
  }

  selectNiveau(niveau: string): void {
    this.selectedNiveau = niveau;
    this.showNiveauDropdown = false;
    this.onSearch();
  }

  getSelectedFiliereLabel(): string {
    if (!this.selectedFiliereId) return 'Toutes';
    return this.getFiliereName(this.selectedFiliereId);
  }

  resetFilters(): void {
    this.searchTerm = '';
    this.selectedFiliereId = '';
    this.selectedNiveau = '';
    this.onSearch();
  }

  closeDropdowns(): void {
    this.showFiliereDropdown = false;
    this.showNiveauDropdown = false;
  }

  // Modals operations
  onAddStudent(): void {
    this.isEditing = false;
    this.currentStudent = this.getEmptyStudent();
    this.showModal = true;
  }

  onEditStudent(student: Etudiant): void {
    this.isEditing = true;
    this.editingStudentId = student.id;
    this.currentStudent = {
      email: student.email,
      firstName: student.firstName,
      lastName: student.lastName,
      phone: student.phone || '',
      filiereId: student.filiereId,
      niveau: student.niveau,
      ecoleId: student.ecoleId,
      classeId: student.classeId,
      ueIds: student.ueIds ? [...student.ueIds] : []
    };
    if (student.filiereId) {
      this.onFiliereChange();
    }
    this.showModal = true;
  }

  onDeleteStudent(student: Etudiant): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'étudiant ${student.firstName} ${student.lastName} ?`)) {
      this.studentService.deleteStudent(student.id).subscribe({
        next: () => this.loadStudents(),
        error: (err) => alert('Erreur lors de la suppression')
      });
    }
  }

  closeModal(): void {
    this.showModal = false;
    this.formError = null;
  }

  onSubmit(): void {
    if (!this.currentStudent.email || !this.currentStudent.firstName || !this.currentStudent.lastName) {
      this.formError = 'Veuillez remplir les champs obligatoires.';
      return;
    }

    this.isSubmitting = true;
    this.formError = null;

    const request = this.isEditing && this.editingStudentId
      ? this.studentService.updateStudent(this.editingStudentId, this.currentStudent)
      : this.studentService.createStudent(this.currentStudent);

    request.subscribe({
      next: () => {
        this.isLoading = false;
        this.isSubmitting = false;
        this.closeModal();
        this.loadStudents();
      },
      error: (err) => {
        this.isSubmitting = false;
        this.formError = 'Une erreur est survenue. Veuillez vérifier les informations.';
      }
    });
  }

  updatePagination(): void {
    this.totalStudentsCount = this.filteredStudents.length;
    this.totalPages = Math.ceil(this.totalStudentsCount / this.itemsPerPage);
    this.startIndex = (this.currentPage - 1) * this.itemsPerPage + 1;
    this.endIndex = Math.min(this.currentPage * this.itemsPerPage, this.totalStudentsCount);

    const start = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedStudents = this.filteredStudents.slice(start, start + this.itemsPerPage);

    this.visiblePages = [];
    for (let i = 1; i <= this.totalPages; i++) {
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

  getEmptyStudent(): CreateEtudiantRequest {
    return {
      email: '',
      firstName: '',
      lastName: '',
      phone: '',
      ueIds: []
    };
  }

  getUserInitials(first?: string, last?: string): string {
    return getUserInitials(first, last);
  }

  getUserAvatarColor(first?: string, last?: string): string {
    return getUserAvatarColor(first, last);
  }

  exportToCSV(): void {
    alert('L\'export CSV sera bientôt disponible');
  }

  openImportModal(): void {
    this.showImportModal = true;
  }

  onImportFile(file: File): void {
    const filieresMap: Record<string, string> = {};
    const ecolesMap: Record<string, string> = {};
    const classesMap: Record<string, string> = {};

    this.filieres.forEach(f => { if (f.nom && f.idFiliere) filieresMap[f.nom.toLowerCase()] = f.idFiliere; });
    this.ecoles.forEach(e => { if (e.nomEcole && e.idEcole) ecolesMap[e.nomEcole.toLowerCase()] = e.idEcole; });
    this.allClasses.forEach(c => { if (c.nom && c.idClasse) classesMap[c.nom.toLowerCase()] = c.idClasse; });

    this.studentService.importFromExcel(
      file, 
      JSON.stringify(filieresMap),
      JSON.stringify(classesMap),
      JSON.stringify(ecolesMap)
    ).subscribe({
      next: (res) => {
        this.importModalRef.setResult({ message: res.message, count: res.count });
        this.loadStudents();
      },
      error: (err) => {
        const msg = err?.error?.message || 'Erreur lors de l\'importation';
        this.importModalRef.setError(msg);
      }
    });
  }
}
