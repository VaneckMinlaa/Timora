import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';

export type ImportType = 'resources' | 'students' | 'rooms';

export interface ImportResult {
  message: string;
  count: number;
}

@Component({
  selector: 'app-excel-import',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './excel-import.component.html',
  styleUrls: ['./excel-import.component.scss']
})
export class ExcelImportComponent {
  @Input() importType: ImportType = 'resources';
  @Input() isOpen: boolean = false;

  @Output() closeModal = new EventEmitter<void>();
  @Output() fileSelected = new EventEmitter<File>();

  isDragging: boolean = false;
  selectedFile: File | null = null;
  isUploading: boolean = false;
  importResult: ImportResult | null = null;
  importError: string | null = null;

  get title(): string {
    switch (this.importType) {
      case 'resources': return 'Importer des équipements';
      case 'students': return 'Importer des étudiants';
      case 'rooms': return 'Importer des salles';
    }
  }

  get columnsDescription(): { col: string; desc: string }[] {
    switch (this.importType) {
      case 'resources':
        return [
          { col: 'Colonne A', desc: 'Nom de l\'équipement (requis)' },
          { col: 'Colonne B', desc: 'Statut: DISPONIBLE / EN_MAINTENANCE / DEFECTUEUX / EN_COUR_D_UTILISATION' },
          { col: 'Colonne C', desc: 'ID de la salle (requis)' },
        ];
      case 'students':
        return [
          { col: 'Colonne A', desc: 'Nom (requis)' },
          { col: 'Colonne B', desc: 'Prénom (requis)' },
          { col: 'Colonne C', desc: 'Email (requis, unique)' },
          { col: 'Colonne D', desc: 'Téléphone' },
          { col: 'Colonne E', desc: 'ID Filière' },
          { col: 'Colonne F', desc: 'Niveau' },
          { col: 'Colonne G', desc: 'ID École' },
          { col: 'Colonne H', desc: 'ID Classe' },
        ];
      case 'rooms':
        return [
          { col: 'Colonne A', desc: 'Nom de la salle (requis)' },
          { col: 'Colonne B', desc: 'Capacité (nombre)' },
          { col: 'Colonne C', desc: 'École (optionnel)' },
          { col: 'Colonne D', desc: 'Type: AMPHI / TD / LABORATOIRE / COURS' },
        ];
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
    }
  }

  handleFile(file: File): void {
    if (!file.name.endsWith('.xlsx')) {
      this.importError = 'Seuls les fichiers .xlsx sont acceptés.';
      return;
    }
    this.selectedFile = file;
    this.importError = null;
    this.importResult = null;
  }

  onImport(): void {
    if (!this.selectedFile) return;
    this.isUploading = true;
    this.importError = null;
    this.fileSelected.emit(this.selectedFile);
  }

  setResult(result: ImportResult): void {
    this.importResult = result;
    this.isUploading = false;
  }

  setError(error: string): void {
    this.importError = error;
    this.isUploading = false;
  }

  close(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.importError = null;
    this.isUploading = false;
    this.closeModal.emit();
  }

  resetFile(): void {
    this.selectedFile = null;
    this.importResult = null;
    this.importError = null;
  }
}
