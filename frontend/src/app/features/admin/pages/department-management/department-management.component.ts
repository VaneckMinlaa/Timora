import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { CourseService } from '../../../../core/services/course.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { Filiere, UE, Classe, Ecole } from '../../../../core/models/course.model';
import { forkJoin, of } from 'rxjs';

@Component({
  selector: 'app-department-management',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './department-management.component.html',
  styleUrls: ['./department-management.component.scss']
})
export class DepartmentManagementComponent implements OnInit {
  activeTab: 'filieres' | 'ues' | 'classes' | 'niveaux' = 'filieres';
  
  // Data
  filieres: Filiere[] = [];
  ues: UE[] = [];
  classes: Classe[] = [];
  ecoles: Ecole[] = [];
  niveaux: string[] = ['Licence 1', 'Licence 2', 'Licence 3', 'Master 1', 'Master 2', '1ère Année', '2ème Année', '3ème Année', '4ème Année', '5ème Année'];

  isLoading: boolean = false;
  searchTerm: string = '';

  // Forms
  filiereForm: FormGroup;
  ueForm: FormGroup;
  classeForm: FormGroup;
  niveauForm: FormGroup;

  editingId: string | null = null;
  showModal: boolean = false;

  constructor(
    private fb: FormBuilder,
    private courseService: CourseService,
    private toastService: ToastNotificationService
  ) {
    this.filiereForm = this.fb.group({
      nom: ['', [Validators.required]],
      description: [''],
      ecoleId: ['', [Validators.required]]
    });

    this.ueForm = this.fb.group({
      codeUE: ['', [Validators.required]],
      nomUE: ['', [Validators.required]],
      description: [''],
      nombreCredit: [0, [Validators.required, Validators.min(1)]],
      filiereId: ['', [Validators.required]],
      semestre: ['', [Validators.required]]
    });

    this.classeForm = this.fb.group({
      nom: ['', [Validators.required]],
      effectif: [0, [Validators.required, Validators.min(1)]],
      filiereId: ['', [Validators.required]],
      ecoleId: ['', [Validators.required]],
      niveau: ['', [Validators.required]],
      nombreGroupes: [1, [Validators.min(1), Validators.max(20)]]
    });

    this.niveauForm = this.fb.group({
      nom: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadData();
    this.loadEcoles();
  }

  loadData(): void {
    this.isLoading = true;
    if (this.activeTab === 'filieres') {
      this.courseService.getAllFilieres().subscribe({
        next: (data) => { this.filieres = data; this.isLoading = false; },
        error: () => { this.toastService.error('Erreur', 'Impossible de charger les filières'); this.isLoading = false; }
      });
    } else if (this.activeTab === 'ues') {
      this.courseService.getAllUEs().subscribe({
        next: (data) => { this.ues = data; this.isLoading = false; },
        error: () => { this.toastService.error('Erreur', 'Impossible de charger les UEs'); this.isLoading = false; }
      });
    } else if (this.activeTab === 'classes') {
      // Pour les classes, on doit peut-être agréger ou charger par filière
      // Si le service n'a pas de "getAllClasses", on devra peut-être en ajouter un ou charger par filière
      this.courseService.getAllFilieres().subscribe({
        next: (filieres) => {
          const classRequests = filieres.map(f => this.courseService.getClassesByFiliere(f.idFiliere));
          // Note: On pourrait utiliser forkJoin ici
          this.classes = [];
          filieres.forEach(f => {
            this.courseService.getClassesByFiliere(f.idFiliere).subscribe(cls => {
              this.classes = [...this.classes, ...cls];
            });
          });
          this.isLoading = false;
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  loadEcoles(): void {
    this.courseService.getAllEcoles().subscribe(data => this.ecoles = data);
  }

  switchTab(tab: 'filieres' | 'ues' | 'classes' | 'niveaux'): void {
    this.activeTab = tab;
    this.searchTerm = '';
    this.loadData();
  }

  openAddModal(): void {
    this.editingId = null;
    this.filiereForm.reset();
    this.ueForm.reset();
    this.ueForm.reset();
    this.classeForm.reset({ nombreGroupes: 1, effectif: 0 });
    this.niveauForm.reset();
    this.showModal = true;
  }

  editFiliere(filiere: Filiere): void {
    this.editingId = filiere.idFiliere;
    this.filiereForm.patchValue({
      nom: filiere.nom,
      description: filiere.description,
      ecoleId: filiere.ecoleId || ''
    });
    this.showModal = true;
  }

  editUE(ue: UE): void {
    this.editingId = ue.idUE;
    this.ueForm.patchValue({
      codeUE: ue.codeUE,
      nomUE: ue.nomUE,
      description: ue.description,
      nombreCredit: ue.nombreCredit,
      filiereId: ue.filiereId,
      semestre: ue.semestre
    });
    this.showModal = true;
  }

  editClasse(classe: Classe): void {
    this.editingId = classe.idClasse;
    this.classeForm.patchValue({
      nom: classe.nom,
      effectif: classe.effectif,
      filiereId: classe.filiereId,
      ecoleId: classe.ecoleId,
      niveau: classe.niveau
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
  }

  onSubmit(): void {
    if (this.activeTab === 'filieres') {
      this.onCreateFiliere();
    } else if (this.activeTab === 'ues') {
      this.onCreateUE();
    } else if (this.activeTab === 'classes') {
      this.onCreateClasse();
    } else if (this.activeTab === 'niveaux') {
      this.onAddNiveau();
    }
  }

  onCreateFiliere(): void {
    if (this.filiereForm.invalid) return;
    if (this.editingId) {
      this.courseService.updateFiliere(this.editingId, this.filiereForm.value).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Filière mise à jour');
          this.loadData();
          this.closeModal();
        },
        error: (err) => this.toastService.error('Erreur', err.error?.message || 'Erreur lors de la mise à jour')
      });
    } else {
      this.courseService.createFiliere(this.filiereForm.value).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Filière créée');
          this.loadData();
          this.closeModal();
        },
        error: (err) => this.toastService.error('Erreur', err.error?.message || 'Erreur lors de la création')
      });
    }
  }

  onCreateUE(): void {
    if (this.ueForm.invalid) return;
    if (this.editingId) {
      this.courseService.updateUE(this.editingId, this.ueForm.value).subscribe({
        next: () => {
          this.toastService.success('Succès', 'UE mise à jour');
          this.loadData();
          this.closeModal();
        },
        error: (err) => this.toastService.error('Erreur', err.error?.message || 'Erreur lors de la mise à jour')
      });
    } else {
      this.courseService.createUE(this.ueForm.value).subscribe({
        next: () => {
          this.toastService.success('Succès', 'UE créée');
          this.loadData();
          this.closeModal();
        },
        error: (err) => this.toastService.error('Erreur', err.error?.message || 'Erreur lors de la création')
      });
    }
  }

  onCreateClasse(): void {
    if (this.classeForm.invalid) return;
    const val = this.classeForm.value;
    const nbGroupes = val.nombreGroupes || 1;

    if (this.editingId) {
      // En mode édition, on ne permet pas de changer le nombre de groupes
      this.courseService.updateClasse(this.editingId, val).subscribe({
        next: () => {
          this.toastService.success('Succès', 'Groupe mis à jour');
          this.loadData();
          this.closeModal();
        },
        error: (err) => this.toastService.error('Erreur', err.error?.message || 'Erreur lors de la mise à jour')
      });
    } else {
      if (nbGroupes > 1) {
        // Génération automatique de plusieurs groupes
        const totalEffectif = val.effectif;
        const effectifParGroupe = Math.floor(totalEffectif / nbGroupes);
        const reste = totalEffectif % nbGroupes;
        
        const creations = [];
        for (let i = 1; i <= nbGroupes; i++) {
          // Distribuer le reste sur les premiers groupes
          const currentEffectif = i <= reste ? effectifParGroupe + 1 : effectifParGroupe;
          
          const groupRequest = {
            ...val,
            nom: `${val.nom} - G${i}`,
            effectif: currentEffectif
          };
          delete groupRequest.nombreGroupes; // Retirer le champ non géré par l'API
          
          creations.push(this.courseService.createClasse(val.filiereId, groupRequest));
        }

        this.isLoading = true;
        forkJoin(creations).subscribe({
          next: () => {
            this.toastService.success('Succès', `${nbGroupes} groupes créés avec succès`);
            this.loadData();
            this.closeModal();
            this.isLoading = false;
          },
          error: (err) => {
            this.toastService.error('Erreur', 'Certains groupes n\'ont pas pu être créés');
            this.loadData();
            this.isLoading = false;
          }
        });
      } else {
        // Création simple d'un seul groupe
        const request = { ...val };
        delete request.nombreGroupes;
        
        this.courseService.createClasse(val.filiereId, request).subscribe({
          next: () => {
            this.toastService.success('Succès', 'Groupe créé');
            this.loadData();
            this.closeModal();
          },
          error: (err) => this.toastService.error('Erreur', err.error?.message || 'Erreur lors de la création')
        });
      }
    }
  }

  onAddNiveau(): void {
    const nom = this.niveauForm.get('nom')?.value;
    if (nom && !this.niveaux.includes(nom)) {
      this.niveaux.push(nom);
      this.toastService.success('Succès', 'Niveau ajouté');
      this.closeModal();
    }
  }

  onDelete(id: string): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet élément ?')) {
      if (this.activeTab === 'filieres') {
        this.courseService.deleteFiliere(id).subscribe({
          next: () => { this.toastService.success('Succès', 'Filière supprimée'); this.loadData(); },
          error: (err) => { this.toastService.error('Erreur', err.error?.message || 'Impossible de supprimer la filière'); }
        });
      } else if (this.activeTab === 'ues') {
        this.courseService.deleteUE(id).subscribe({
          next: () => { this.toastService.success('Succès', 'UE supprimée'); this.loadData(); },
          error: (err) => { this.toastService.error('Erreur', err.error?.message || 'Impossible de supprimer l\'UE'); }
        });
      } else if (this.activeTab === 'classes') {
        this.courseService.deleteClasse(id).subscribe({
          next: () => { this.toastService.success('Succès', 'Groupe supprimé'); this.loadData(); },
          error: (err) => { this.toastService.error('Erreur', err.error?.message || 'Impossible de supprimer ce groupe'); }
        });
      }
    }
  }

  getFiliereName(id: string): string {
    return this.filieres.find(f => f.idFiliere === id)?.nom || id;
  }

  getEcoleName(id: string): string {
    return this.ecoles.find(e => e.idEcole === id)?.nomEcole || id;
  }

  getSemestreLabel(semestre: string | undefined): string {
    if (semestre === 'SEMESTRE_1') return 'Semestre 1';
    if (semestre === 'SEMESTRE_2') return 'Semestre 2';
    return semestre || 'Non spécifié';
  }
}
