// schedule-management.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { User, UserRole } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { CourseService } from '../../../../core/services/course.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { ChangeDetectorRef } from '@angular/core';
import { Disponibilite, Room } from '../../../../core/models';
import { Classe } from '../../../../core/models/course.model';

import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Schedule {
  id: string;
  type: 'cours' | 'disponibilite';
  title: string;
  teacher: string;
  teacherId?: string;
  teacherName?: string;
  teachers?: string[]; // Pour regrouper plusieurs enseignants disponibles au même créneau
  classeNom?: string;
  subject?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  school?: string;
  color: string;
  date?: string;
  isDisponibilite?: boolean;
  isGrouped?: boolean; // Indique si cet événement est un groupe de disponibilités
  emploiDuTempsId?: string;
  classeId?: string;
  classeIds?: string[];
}

interface SavedSchedule {
  id: string;
  title: string;
  institution: string;
  type: string;
  date: string;
  size: string;
  status: 'EN_ATTENTE' | 'VALIDE' | 'REJETE' | 'TERMINE';
  filiere?: string;
  semestre?: string;
  classeName?: string;
}

interface WeekDay {
  name: string;
  date: string;
  isToday: boolean;
  dateObj?: Date;
}

@Component({
  selector: 'app-schedule-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedule-management.component.html',
  styleUrls: ['./schedule-management.component.scss']
})
export class ScheduleManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  userInitials: string = 'TI';
  userDisplayName: string = 'Timora IUSJC';
  userEmail: string = 'vaneck.minlaa@gmail.com';
  avatarColor: string = '#2563eb';

  // Tabs
  activeTab: string = 'interactive';

  // Données
  schedules: Schedule[] = [];
  filteredSchedules: Schedule[] = [];
  disponibilites: Disponibilite[] = [];
  teachers: User[] = [];
  classes: Classe[] = [];
  filieres: any[] = [];
  ecoles: any[] = [];
  savedSchedules: SavedSchedule[] = [];
  
  semestres = [
    { id: 'SEMESTRE_1', label: 'Semestre 1' },
    { id: 'SEMESTRE_2', label: 'Semestre 2' }
  ];
  selectedFiliere: string = 'Tous';
  selectedSchool: string = 'Tous';
  selectedSemestre: string = 'S1';
  
  // Drag and Drop
  draggedEvent: any = null;
  hasUnsavedChanges: boolean = false;
  originalSchedules: any[] = [];

  // Palette de couleurs pour les cours
  private readonly COURSE_COLORS = [
    '#6366f1', // violet
    '#ec4899', // rose
    '#f59e0b', // ambre
    '#10b981', // vert
    '#ef4444', // rouge
    '#3b82f6', // bleu
    '#8b5cf6', // purple
    '#14b8a6', // teal
    '#f97316', // orange
    '#06b6d4', // cyan
    '#84cc16', // lime
    '#a855f7', // fushia
  ];
  private courseColorMap: Map<string, string> = new Map();

  // Filtres
  filterSchool: string = 'Tous';
  selectedTeacher: string = 'Tous';
  selectedClass: string = 'Tous';
  selectedClassId: string = 'Tous';
  searchTerm: string = '';
  schools: string[] = ['SJI', 'Prépa Vogt', 'Timora'];

  // État et UI
  isLoading: boolean = false;
  errorMessage: string = '';
  showGenerateModal: boolean = false;
  expandedRows = new Set<string>();
  
  // Paramètres de génération
  genParams = {
    semestre: 'SEMESTRE_1',
    classeId: '',
    filiere: '',
    ecoleId: '',
    semaine: '',
    filiereId: ''
  };
  
  // Generation Navigation
  genDate: Date = new Date();
  genWeekStart: string = '';
  genWeekEnd: string = '';

  isPreviewingNew: boolean = false;
  viewingEmploiDuTempsId: string | null = null;

  // Suivi des modifications
  changedScheduleIds = new Set<string>();

  // Navigation
  currentDate: Date = new Date();
  currentWeekStart: string = '';
  currentWeekEnd: string = '';
  weekDays: WeekDay[] = [];

  hours: string[] = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Time slots de 2 heures pour l'affichage (comme côté enseignant)
  timeSlots = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '13:00', end: '15:00' },
    { start: '15:00', end: '17:00' }
  ];

  legend = [
    { color: '#3b82f6', label: 'Cours' },
    { color: '#10b981', label: 'Disponibilité' }
  ];

  constructor(
    private userService: UserService,
    private reservationService: ReservationService,
    private scheduleService: ScheduleService,
    private courseService: CourseService,
    private toastNotification: ToastNotificationService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializePeriod();
    this.loadTeachers();
    this.loadClasses();
    this.loadEcoles();
    this.loadFilieres();
    this.loadSavedSchedules();
    // Attendre un peu pour que les enseignants soient chargés avant de charger les disponibilités et les cours
    setTimeout(() => {
      this.loadDisponibilites();
      this.loadCours();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser la période (semaine courante)
   */
  initializePeriod(): void {
    const targetDate = new Date(this.currentDate);
    const dayOfWeek = targetDate.getDay();
    const diff = targetDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(targetDate.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    this.currentDate = new Date(monday);
    this.currentWeekStart = this.formatDate(monday);
    this.currentWeekEnd = this.formatDate(sunday);

    // Mettre à jour automatiquement le paramètre "semaine" pour la génération
    this.genParams.semaine = this.formatDateForApi(monday);

    this.initializeWeekDays(monday);
  }

  /**
   * Initialiser les jours de la semaine
   */
  initializeWeekDays(startDate: Date): void {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.weekDays = days.map((dayName, index) => {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + index);
      const isToday = date.toDateString() === today.toDateString();

      return {
        name: dayName,
        date: String(date.getDate()),
        isToday,
        dateObj: date
      };
    });
  }

  /**
   * Formater une date
   */
  formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day} ${this.getMonthName(date.getMonth())} ${year}`;
  }

  /**
   * Obtenir le nom du mois
   */
  getMonthName(month: number): string {
    const months = ['Jan.', 'Fév.', 'Mar.', 'Avr.', 'Mai', 'Juin',
                    'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    return months[month];
  }

  getFullMonthName(month: number): string {
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
                    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    return months[month];
  }

  /**
   * Formater une date au format YYYY-MM-DD pour l'API
   */
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Charger les enseignants
   */
  loadTeachers(): void {
    this.isLoading = true;
    this.userService.getAllUsers({ role: 'TEACHER', isActive: true })
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des enseignants:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (users: User[]) => {
          this.teachers = users;
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger les classes
   */
  loadClasses(): void {
    this.courseService.getAllClasses()
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des classes:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (classes) => {
          this.classes = classes || [];
        }
      });
  }

  /**
   * Charger les écoles
   */
  loadEcoles(): void {
    this.courseService.getAllEcoles()
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des écoles:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(ecoles => {
        this.ecoles = ecoles;
        if (ecoles.length > 0) {
          this.schools = ecoles.map(e => e.nomEcole);
        }
      });
  }

  /**
   * Charger les filières
   */
  loadFilieres(): void {
    this.courseService.getAllFilieres()
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des filières:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(filieres => {
        this.filieres = filieres;
      });
  }

  loadSavedSchedules(): void {
    console.log('Appel de l\'historique des emplois du temps...');
    this.isLoading = true;
    this.scheduleService.getAllEmploisDuTemps()
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement de l\'historique:', error);
          this.errorMessage = 'Impossible de charger l\'historique des générations. Veuillez réessayer plus tard.';
          this.toastNotification.createNotification('error', 'Historique', 'Erreur lors du chargement de l\'historique');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe((schedules: any[]) => {
        if (schedules && schedules.length > 0) {
          this.savedSchedules = schedules.map((s: any) => ({
            id: s.idEmploi || s.id,
            title: s.titre || `Emploi du temps - ${s.classeNom || 'N/A'}`,
            institution: s.ecoleNom || 'Saint Jean',
            type: 'PLANNING',
            date: s.dateCreation || s.createdAt || new Date().toISOString().split('T')[0],
            size: '1.2 MB',
            status: s.statut || 'TERMINE',
            filiere: s.filiereNom,
            semestre: s.semestre?.toString(),
            classeName: s.classeNom
          }));
        } else {
          this.savedSchedules = [];
        }
        this.isLoading = false;
      });
  }



  toggleRow(id: string): void {
    if (this.expandedRows.has(id)) {
      this.expandedRows.delete(id);
    } else {
      this.expandedRows.add(id);
    }
  }

  isRowExpanded(id: string): boolean {
    return this.expandedRows.has(id);
  }

  /**
   * Changer d'onglet
   */
  switchTab(tab: string, resetPreview: boolean = true): void {
    if (this.hasUnsavedChanges && !confirm('Vous avez des modifications non enregistrées. Voulez-vous vraiment changer d\'onglet ?')) {
      return;
    }
    
    if (tab === 'saved' && resetPreview) {
      // Lorsqu'on clique manuellement sur l'onglet historique, on réinitialise l'ID visualisé
      this.viewingEmploiDuTempsId = null;
      this.isPreviewingNew = false;
      this.applyFilters();
    }
    console.log('Changement d\'onglet:', this.activeTab, '->', tab, { resetPreview });
    this.activeTab = tab;
    this.cdr.detectChanges();
  }

  isTabActive(tab: string): boolean {
    return this.activeTab === tab;
  }

  /**
   * Charger les disponibilités pour la semaine courante
   */
  loadDisponibilites(): void {
    if (!this.weekDays.length || !this.weekDays[0].dateObj) return;

    const monday = this.weekDays[0].dateObj;
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = this.formatDateForApi(monday);
    const endDate = this.formatDateForApi(sunday);

    this.isLoading = true;
    this.reservationService.getAllDisponibilitesByDateRange(startDate, endDate)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des disponibilités:', error);
          this.errorMessage = 'Erreur lors du chargement des disponibilités';
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (dispos: Disponibilite[]) => {
          this.disponibilites = dispos;
          this.processDisponibilites();
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  /**
   * Traiter les disponibilités pour créer les événements calendrier
   */
  processDisponibilites(): void {
    const disponibiliteEvents: Schedule[] = this.disponibilites.map(dispo => {
      const teacher = this.teachers.find(t => t.id === dispo.utilisateurId);
      const teacherName = teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Enseignant inconnu';
      
      // Utiliser une couleur spécifique à l'enseignant pour les disponibilités
      const teacherColor = teacher ? getUserAvatarColor(teacher.firstName, teacher.lastName) : '#10b981';

      // Convertir le jour de la semaine (ex: "Lundi" depuis le champ `jour`)
      const jour = dispo.jour || this.getDayNameFromDate(dispo.date);

      return {
        id: dispo.idDisponibilite,
        type: 'disponibilite',
        title: `Disponible - ${teacherName}`,
        teacher: teacherName,
        teacherId: dispo.utilisateurId,
        teacherName: teacherName,
        dayOfWeek: jour,
        startTime: dispo.heureDebut,
        endTime: dispo.heureFin,
        color: teacherColor,
        isDisponibilite: true
      };
    });

    // Fusionner avec les cours existants (si disponibles)
    this.schedules = [...this.schedules.filter(s => !s.isDisponibilite), ...disponibiliteEvents];
  }

  /**
   * Charger les cours
   */
  loadCours(): void {
    this.isLoading = true;
    this.scheduleService.getAllSchedules()
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des cours:', error);
          this.errorMessage = 'Erreur lors du chargement des cours';
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (cours: any[]) => {
          console.log('Cours reçus du backend:', cours);
          this.processCours(cours);
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  /**
   * Traiter les cours
   */
  processCours(coursData: any[]): void {
    const coursEvents: Schedule[] = coursData
      .filter(c => c.heureDebut && c.jourSemaine) // Seulement les cours planifiés
      .map(c => {
        const teacherName = this.getTeacherName(c.enseignantId);
        const subjectName = c.nom || c.name || c.subject || 'Cours sans nom';
    // Mappage du jour de la semaine (index ou nom)
    let dayOfWeek = c.jourSemaine || c.dayOfWeek || 'Lundi';
    if (dayOfWeek && !isNaN(parseInt(dayOfWeek))) {
      const index = parseInt(dayOfWeek);
      const daysRef = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
      dayOfWeek = daysRef[index % daysRef.length] || 'Lundi';
    }

    // Normalisation du nom de l'école (Essayer de mapper sur les labels courts)
    let schoolLabel = c.nomEcole || c.ecoleNom || 'Tous';
    if (schoolLabel.toLowerCase().includes('saint jean')) schoolLabel = 'SJI';
    if (schoolLabel.toLowerCase().includes('vogt')) schoolLabel = 'Prépa Vogt';
    if (schoolLabel.toLowerCase().includes('timora')) schoolLabel = 'Timora';

    return {
      id: c.idCours || c.id || `course-${Math.random()}`,
      type: 'cours',
      title: subjectName,
      subject: subjectName,
      teacher: teacherName,
      teacherId: c.enseignantId,
      dayOfWeek: dayOfWeek,
      startTime: c.heureDebut || c.startTime,
      endTime: c.heureFin || c.endTime,
      color: this.getCourseColor(subjectName),
      isDisponibilite: false,
      room: c.salleId || c.roomNom || c.room,
      classeNom: c.classeNom || this.classes.find(cls => String(cls.idClasse) === String(c.classeId || (c.classeIds && c.classeIds.length > 0 ? c.classeIds[0] : null)))?.nom || c.niveau || 'N/A',
      school: schoolLabel,
      emploiDuTempsId: c.emploiDuTempsId,
      classeId: c.classeId || (c.classeIds && c.classeIds.length > 0 ? c.classeIds[0] : null),
      classeIds: c.classeIds || (c.classeId ? [c.classeId] : [])
    };
      });

    // Remplacer les cours existants et garder les disponibilités
    this.schedules = [...coursEvents, ...this.schedules.filter(s => s.isDisponibilite)];
    console.log('Events calendrier après traitement:', this.schedules.filter(s => !s.isDisponibilite));
  }

  /**
   * Assign a stable color to each unique course
   */
  getCourseColor(courseId: string): string {
    if (!courseId) return this.COURSE_COLORS[0];
    if (!this.courseColorMap.has(courseId)) {
      const index = this.courseColorMap.size % this.COURSE_COLORS.length;
      this.courseColorMap.set(courseId, this.COURSE_COLORS[index]);
    }
    return this.courseColorMap.get(courseId)!;
  }

  /**
   * Returns only disponibilite events (for the Disponibilités tab)
   */
  getDispoEventsForDayAndTimeSlot(day: string, timeSlot: { start: string; end: string }): any[] {
    return this.filteredSchedules.filter(event => {
      if (!event.isDisponibilite) return false;
      const matchDay = event.dayOfWeek?.toLowerCase() === day.toLowerCase();
      const startTime = event.startTime ? String(event.startTime).substring(0, 5) : null;
      const matchTime = startTime === timeSlot.start || 
                        (event.startTime && event.startTime <= timeSlot.end && event.endTime && event.endTime > timeSlot.start);
      return matchDay && matchTime;
    });
  }

  getDayNameFromDate(dateString: string): string {
    if (!dateString) return 'Lundi';
    const date = new Date(dateString);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    return days[date.getDay()];
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    const previousCount = this.filteredSchedules.length;
    this.filteredSchedules = this.schedules.filter(schedule => {
      // Normaliser les comparaisons d'école
      let matchesSchool = this.filterSchool === 'Tous';
      if (!matchesSchool) {
        const schedSchool = schedule.school?.toString().toLowerCase() || '';
        const filtSchool = this.filterSchool.toLowerCase();
        matchesSchool = schedSchool.includes(filtSchool) || filtSchool.includes(schedSchool) || schedSchool === 'tous';
      }

      const matchesTeacher = this.selectedTeacher === 'Tous' ||
                            schedule.teacherId === this.selectedTeacher ||
                            schedule.teacher === this.selectedTeacher;
      
      let matchesClass = this.selectedClass === 'Tous';
      if (!matchesClass) {
        const targetClass = this.selectedClass.toLowerCase();
        matchesClass = !!(schedule.classeNom && schedule.classeNom.toLowerCase().includes(targetClass)) || 
                       (schedule.classeId === this.selectedClassId) ||
                       !!(schedule.classeIds && schedule.classeIds.some(id => {
                         const cls = this.classes.find(cl => String(cl.idClasse) === String(id));
                         return id === this.selectedClassId || (cls && cls.nom.toLowerCase().includes(targetClass));
                       }));
      }
      
      let matchesEmploiDuTemps = true;
      if (this.viewingEmploiDuTempsId && !schedule.isDisponibilite) {
        matchesEmploiDuTemps = schedule.emploiDuTempsId === this.viewingEmploiDuTempsId;
      }
      
      return matchesSchool && matchesTeacher && matchesClass && matchesEmploiDuTemps;
    });
    console.log(`Filtrage terminé: ${this.filteredSchedules.length} éléments affichés (avant: ${previousCount})`, 
               { filterSchool: this.filterSchool, selectedTeacher: this.selectedTeacher, viewingEmploiDuTemps: this.viewingEmploiDuTempsId });
  }

  /**
   * Gérer le changement de filtre
   */
  onFilterChange(): void {
    this.applyFilters();
  }

  /**
   * Obtenir les événements pour un jour et une heure donnés (ancienne méthode, conservée pour compatibilité)
   */
  getEventsForDayAndHour(day: string, hour: string): Schedule[] {
    return this.filteredSchedules.filter(schedule => {
      if (schedule.dayOfWeek !== day) return false;

      const scheduleHour = parseInt(schedule.startTime.split(':')[0]);
      const slotHour = parseInt(hour.split(':')[0]);

      return scheduleHour === slotHour;
    });
  }

  /**
   * Parser une heure au format HH:mm en minutes
   */
  parseTime(time: string): number {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  }

  /**
   * Obtenir la liste des classes uniques présentes dans les résultats filtrés
   */
  getUniqueClasses(): any[] {
    // Collecter tous les IDs de classes uniques depuis les cours filtrés
    const classIds = new Set();
    this.filteredSchedules.forEach(s => {
      if (!s.isDisponibilite && s.type === 'cours') {
        if (s.classeId) classIds.add(String(s.classeId));
        if (s.classeIds && Array.isArray(s.classeIds)) {
          s.classeIds.forEach(id => classIds.add(String(id)));
        }
      }
    });

    // Retourner les objets classes correspondants
    const uniqueClasses = this.classes.filter(c => classIds.has(String(c.idClasse)));
    
    // Si aucune classe n'est trouvée dans la liste officielle mais qu'il y a des cours, 
    // créer des objets fictifs basés sur les noms de classe pour l'affichage
    if (uniqueClasses.length === 0 && classIds.size > 0) {
      return Array.from(classIds).map(id => {
        const course = this.filteredSchedules.find(s => String(s.classeId) === id || (s.classeIds && s.classeIds.some(cid => String(cid) === id)));
        return { idClasse: id, nom: course?.classeNom || `Classe ${id}` };
      });
    }
    
    return uniqueClasses;
  }

  /**
   * Obtenir les événements pour un jour et un créneau horaire (pour l'affichage en créneaux de 2h)
   * Les disponibilités qui se chevauchent exactement sont regroupées
   * Un événement est affiché dans tous les créneaux qu'il chevauche
   */
  getEventsForDayAndTimeSlot(day: string, timeSlot: { start: string; end: string }, includeDispos: boolean = false, classId?: string): Schedule[] {
    const events = this.filteredSchedules.filter(schedule => {
      // Filtrer les disponibilités si non demandées
      if (!includeDispos && schedule.isDisponibilite) return false;
      if (!schedule.dayOfWeek) return false;
      
      // Filtrer par classe si spécifié
      if (classId && !schedule.isDisponibilite && String(schedule.classeId) !== String(classId)) return false;

      const eventDay = schedule.dayOfWeek.toLowerCase();
      const currentDay = day.toLowerCase();

      if (eventDay !== currentDay) return false;

      const eventStart = this.parseTime(schedule.startTime);
      const eventEnd = this.parseTime(schedule.endTime);
      const slotStart = this.parseTime(timeSlot.start);
      const slotEnd = this.parseTime(timeSlot.end);

      // L'événement chevauche le créneau s'il commence avant la fin du créneau et se termine après le début
      return eventStart < slotEnd && eventEnd > slotStart;
    });

    if (includeDispos) {
      // Si on inclut les dispos, on peut vouloir grouper les disponibilités identiques
      const disponibilites = events.filter(e => e.isDisponibilite);
      const cours = events.filter(e => !e.isDisponibilite);
      const groupedDisponibilites = this.groupDisponibilites(disponibilites);
      
      return [...cours, ...groupedDisponibilites].sort((a, b) => {
        return this.parseTime(a.startTime) - this.parseTime(b.startTime);
      });
    }

    // Trier par heure de début
    return events.sort((a, b) => {
      const aStart = this.parseTime(a.startTime);
      const bStart = this.parseTime(b.startTime);
      return aStart - bStart;
    });
  }

  /**
   * Grouper les disponibilités qui se chevauchent exactement (même heure de début et de fin)
   */
  groupDisponibilites(disponibilites: Schedule[]): Schedule[] {
    const groups = new Map<string, Schedule[]>();

    // Grouper par clé (jour + heure début + heure fin)
    disponibilites.forEach(dispo => {
      const key = `${dispo.dayOfWeek}_${dispo.startTime}_${dispo.endTime}`;
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key)!.push(dispo);
    });

    // Créer des événements groupés
    const grouped: Schedule[] = [];
    groups.forEach((group, key) => {
      if (group.length === 1) {
        // Une seule disponibilité, pas besoin de regrouper
        grouped.push(group[0]);
      } else {
        // Plusieurs disponibilités au même créneau, les regrouper
        const first = group[0];
        const teachers = group.map(d => d.teacher).filter((name, index, self) => self.indexOf(name) === index); // Éviter les doublons

        grouped.push({
          ...first,
          id: `grouped_${key}`,
          teachers: teachers,
          teacher: teachers[0], // Garder le premier pour compatibilité
          isGrouped: true
        });
      }
    });

    return grouped;
  }

  /**
   * Calculer la position top d'un événement dans un créneau de 2h
   */
  getEventTopInSlot(event: Schedule, timeSlot: { start: string; end: string }): number {
    const slotStart = this.parseTime(timeSlot.start);
    const eventStart = this.parseTime(event.startTime);

    // Position relative dans le créneau (en minutes)
    const minutesFromSlotStart = Math.max(0, eventStart - slotStart);

    // Convertir en pourcentage (120 minutes = 100%)
    return (minutesFromSlotStart / 120) * 100;
  }

  /**
   * Calculer la hauteur d'un événement dans un créneau de 2h
   */
  getEventHeightInSlot(event: Schedule, timeSlot: { start: string; end: string }): number {
    const eventStart = this.parseTime(event.startTime);
    const eventEnd = this.parseTime(event.endTime);
    const slotStart = this.parseTime(timeSlot.start);
    const slotEnd = this.parseTime(timeSlot.end);

    // Limiter l'événement aux bornes du créneau
    const actualStart = Math.max(eventStart, slotStart);
    const actualEnd = Math.min(eventEnd, slotEnd);

    const duration = Math.max(0, actualEnd - actualStart);

    // Convertir en pourcentage (120 minutes = 100%)
    const heightPercent = (duration / 120) * 100;

    // Hauteur minimale pour la lisibilité
    return Math.max(25, heightPercent);
  }

  /**
   * Calculer la position left d'un événement pour gérer les chevauchements
   */
  getEventLeftInSlot(event: Schedule, day: string, timeSlot: { start: string; end: string }, index: number): number {
    // Les événements groupés prennent toute la largeur
    if (event.isGrouped) {
      return 0;
    }

    const overlappingEvents = this.getOverlappingEvents(event, day, timeSlot);
    const totalOverlapping = overlappingEvents.length;

    if (totalOverlapping <= 1) {
      return 0; // Pas de chevauchement, prendre toute la largeur
    }

    // Trouver la position de cet événement dans le groupe de chevauchements
    const positionInGroup = overlappingEvents.findIndex(e => e.id === event.id);

    // Calculer la largeur de chaque événement (100% / nombre d'événements qui se chevauchent)
    // On laisse 2% de marge totale (1% de chaque côté)
    const marginPercent = 2;
    const availableWidth = 100 - marginPercent;
    const widthPerEvent = availableWidth / totalOverlapping;

    // Position left = marge gauche + (position dans le groupe * largeur par événement)
    return (marginPercent / 2) + (positionInGroup * widthPerEvent);
  }

  /**
   * Calculer la largeur d'un événement pour gérer les chevauchements
   */
  getEventWidthInSlot(event: Schedule, day: string, timeSlot: { start: string; end: string }): number {
    // Les événements groupés prennent toute la largeur
    if (event.isGrouped) {
      return 100;
    }

    const overlappingEvents = this.getOverlappingEvents(event, day, timeSlot);
    const totalOverlapping = overlappingEvents.length;

    if (totalOverlapping <= 1) {
      return 100; // Pas de chevauchement, prendre toute la largeur
    }

    // Largeur = (100% - marge totale) / nombre d'événements qui se chevauchent
    const marginPercent = 2;
    const availableWidth = 100 - marginPercent;
    return availableWidth / totalOverlapping;
  }

  /**
   * Obtenir tous les événements qui se chevauchent avec un événement donné
   */
  getOverlappingEvents(event: Schedule, day: string, timeSlot: { start: string; end: string }): Schedule[] {
    let eventsInSlot: Schedule[];

    if (event.isDisponibilite) {
      eventsInSlot = this.filteredSchedules.filter(e => {
        if (!e.isDisponibilite) return false;
        if (e.dayOfWeek?.toLowerCase() !== day.toLowerCase()) return false;

        const eStart = this.parseTime(e.startTime);
        const eEnd = this.parseTime(e.endTime);
        const slotStart = this.parseTime(timeSlot.start);
        const slotEnd = this.parseTime(timeSlot.end);

        return eStart < slotEnd && eEnd > slotStart;
      });
    } else {
      eventsInSlot = this.getEventsForDayAndTimeSlot(day, timeSlot, false);
    }

    const eventStart = this.parseTime(event.startTime);
    const eventEnd = this.parseTime(event.endTime);

    const overlapping = eventsInSlot.filter(e => {
      const eStart = this.parseTime(e.startTime);
      const eEnd = this.parseTime(e.endTime);

      // Deux événements se chevauchent s'ils ont une intersection temporelle
      return (eStart < eventEnd && eEnd > eventStart);
    });

    // Trier par heure de début pour un affichage cohérent
    return overlapping.sort((a, b) => {
      const aStart = this.parseTime(a.startTime);
      const bStart = this.parseTime(b.startTime);
      if (aStart !== bStart) {
        return aStart - bStart;
      }
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
  }

  /**
   * Navigation semaine précédente
   */
  previousWeek(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() - 7);
    this.currentDate = newDate;
    this.initializePeriod();
    this.loadDisponibilites();
    this.loadCours();
  }

  /**
   * Navigation semaine suivante
   */
  nextWeek(): void {
    const newDate = new Date(this.currentDate);
    newDate.setDate(newDate.getDate() + 7);
    this.currentDate = newDate;
    this.initializePeriod();
    this.loadDisponibilites();
    this.loadCours();
  }

  /**
   * Aller à aujourd'hui
   */
  goToToday(): void {
    this.currentDate = new Date();
    this.initializePeriod();
    this.loadDisponibilites();
    this.loadCours();
  }

  onDateChange(event: any): void {
    const date = event.target.value;
    if (date) {
      this.currentDate = new Date(date);
      this.initializePeriod();
      this.loadDisponibilites();
      this.loadCours();
    }
  }

  /**
   * Gérer la modal de génération
   */
  openGenerateModal(): void {
    this.updateGenParamsFromContext();
    this.showGenerateModal = true;
  }

  closeGenerateModal(): void {
    this.showGenerateModal = false;
  }

  /**
   * Mettre à jour les paramètres de génération avant ouverture
   */
  updateGenParamsFromContext(): void {
    if (this.weekDays.length > 0 && this.weekDays[0].dateObj) {
      this.genDate = new Date(this.weekDays[0].dateObj);
      this.updateGenWeekInfo();
    }
    
    // Déterminer le semestre par défaut
    const currentMonth = new Date().getMonth();
    // Sept-Jan : Semestre 1, Fév-Juin : Semestre 2
    this.genParams.semestre = (currentMonth >= 8 || currentMonth <= 0) ? '1' : '2';
    
    // Pré-remplir l'école si une seule disponible
    if (this.ecoles.length > 0) {
      this.genParams.ecoleId = this.ecoles[0].idEcole;
    }
  }

  updateGenWeekInfo(): void {
    const dayOfWeek = this.genDate.getDay();
    const diff = this.genDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(this.genDate);
    monday.setDate(diff);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    this.genWeekStart = this.formatDate(monday);
    this.genWeekEnd = this.formatDate(sunday);
    this.genParams.semaine = this.formatDateForApi(monday);
  }

  previousGenWeek(): void {
    const newDate = new Date(this.genDate);
    newDate.setDate(newDate.getDate() - 7);

    // Empêcher la navigation vers des semaines passées
    const now = new Date();
    const currentMonday = new Date(now);
    const day = now.getDay();
    currentMonday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    currentMonday.setHours(0, 0, 0, 0);

    const newMonday = new Date(newDate);
    const nDay = newMonday.getDay();
    newMonday.setDate(newDate.getDate() - nDay + (nDay === 0 ? -6 : 1));
    newMonday.setHours(0, 0, 0, 0);

    if (newMonday < currentMonday) return; // Ne pas aller dans le passé

    this.genDate = newDate;
    this.updateGenWeekInfo();
  }

  isGenWeekCurrentOrPast(): boolean {
    const now = new Date();
    const day = now.getDay();
    const currentMonday = new Date(now);
    currentMonday.setDate(now.getDate() - day + (day === 0 ? -6 : 1));
    currentMonday.setHours(0, 0, 0, 0);

    const genDay = this.genDate.getDay();
    const genMonday = new Date(this.genDate);
    genMonday.setDate(this.genDate.getDate() - genDay + (genDay === 0 ? -6 : 1));
    genMonday.setHours(0, 0, 0, 0);

    return genMonday <= currentMonday;
  }

  nextGenWeek(): void {
    const newDate = new Date(this.genDate);
    newDate.setDate(newDate.getDate() + 7);
    this.genDate = newDate;
    this.updateGenWeekInfo();
  }

  goToGenToday(): void {
    this.genDate = new Date();
    this.updateGenWeekInfo();
  }

  // Filtrer les classes par filière et école
  getFilteredClasses(): Classe[] {
    let filtered = this.classes;
    
    if (this.genParams.ecoleId) {
      filtered = filtered.filter(c => c.ecoleId === this.genParams.ecoleId);
    }
    
    if (this.genParams.filiereId) {
      filtered = filtered.filter(c => c.filiereId === this.genParams.filiereId);
    } else if (this.genParams.filiere) {
      // Fallback recherche textuelle
      filtered = filtered.filter(c => c.nom.toLowerCase().includes(this.genParams.filiere.toLowerCase()));
    }
    
    return filtered;
  }

  /**
   * Lancer la génération avec paramètres
   */
  confirmGenerate(): void {
    // Vérifier si la semaine est dans le passé
    const now = new Date();
    const currentMonday = new Date(now);
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    currentMonday.setDate(diff);
    currentMonday.setHours(0, 0, 0, 0);

    const genMonday = new Date(this.genDate);
    const gDay = genMonday.getDay();
    const gDiff = genMonday.getDate() - gDay + (gDay === 0 ? -6 : 1);
    genMonday.setDate(gDiff);
    genMonday.setHours(0, 0, 0, 0);

    if (genMonday < currentMonday) {
      alert('⚠️ Impossible de générer un emploi du temps pour une semaine déjà passée.');
      return;
    }

    this.showGenerateModal = false;
    this.isLoading = true;
    
    // Convertir les paramètres pour l'API
    const params: any = {
      semestre: this.genParams.semestre, // Plus de parseInt ici pour les énums
      semaine: this.genParams.semaine
    };
    
    if (this.genParams.classeId) params.classeId = this.genParams.classeId;
    if (this.genParams.ecoleId) params.ecoleId = this.genParams.ecoleId;
    if (this.genParams.filiere) params.filiere = this.genParams.filiere;

    console.log('Lancement de la génération avec params:', params);
    
    this.scheduleService.generateTimetable(params)
      .pipe(
        catchError(error => {
          console.error('Erreur lors de la génération:', error);
          this.errorMessage = 'Erreur lors de la génération';
          this.isLoading = false;
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe(result => {
        if (result) {
          // Charger les nouvelles données pour la semaine concernée
          this.loadDisponibilites(); 
          this.loadCours(); 
          this.isPreviewingNew = true;
          this.activeTab = 'saved';
          this.showGenerateModal = false; // Fermer seulement après succès
          this.cdr.detectChanges();
          this.toastNotification.createNotification('success', 'Génération réussie', 'Génération provisoire réussie ! Veuillez sauvegarder l\'emploi du temps pour l\'enregistrer dans l\'historique.');
        }
        this.isLoading = false; // Reset après tout le traitement
      });
  }

  saveWholeSchedule(): void {
    if (!this.isPreviewingNew) return;
    
    const classObj = this.classes.find(c => String(c.idClasse) === String(this.genParams.classeId));
    const className = classObj ? classObj.nom : 'Toutes Classes';
    const filiereObj = this.filieres.find(f => String(f.idFiliere) === String(this.genParams.filiereId) || String(f.id) === String(this.genParams.filiere));
    const filiereName = filiereObj ? (filiereObj.nomFiliere || filiereObj.nom) : 'Toutes Filières';
    const ecoleObj = this.ecoles.find(e => String(e.idEcole) === String(this.genParams.ecoleId));
    const ecoleNomStr = ecoleObj ? ecoleObj.nomEcole : (this.schools.length > 0 ? this.schools[0] : 'Saint Jean');
    const numSemestre = String(this.genParams.semestre).replace('SEMESTRE_', '');
    
    // Extrait les IDs de tous les cours générés et actuellement affichés
    const coursIds = this.filteredSchedules
      .filter(s => s.type === 'cours' && !s.isDisponibilite)
      .map(s => s.id)
      .filter(id => id && !String(id).startsWith('course-')); // Conserve que les vrais IDs (pas mockés)

    const title = `Emploi du temps - Semestre ${numSemestre} - ${className}`;

    const request = {
      titre: title,
      ecoleNom: ecoleNomStr,
      filiereNom: filiereName,
      classeNom: className,
      semestre: numSemestre,
      classeId: this.genParams.classeId,
      coursIds: coursIds
    };

    this.scheduleService.saveEmploiDuTemps(request).subscribe({
      next: (response: any) => {
        this.toastNotification.createNotification('success', 'Succès', 'L\'emploi du temps a été sauvegardé avec succès dans l\'historique.');
        this.isPreviewingNew = false;
        this.loadSavedSchedules();
        this.loadCours();

        // Proposer d'envoyer aux enseignants
        if (confirm('Voulez-vous envoyer cet emploi du temps aux enseignants concernés par email ?')) {
          this.onNotifyTeachers(response.id, response.titre);
        }
      },
      error: (err) => {
        console.error(err);
        this.toastNotification.createNotification('error', 'Erreur', 'Impossible de sauvegarder l\'emploi du temps global.');
      }
    });
  }

  /**
   * Notifier les enseignants d'un emploi du temps (avec PDF joint)
   */
  onNotifyTeachers(id: string, title: string): void {
     this.toastNotification.createNotification('help', 'Notification', `Génération du PDF et envoi des notifications pour "${title}"...`);
     
     // S'assurer que les filtres pointent sur cet emploi du temps pour que exportToPDF fonctionne
     const originalViewingId = this.viewingEmploiDuTempsId;
     this.viewingEmploiDuTempsId = id;
     this.applyFilters();
     
     // Petit délai pour laisser le filtrage s'opérer (important pour le contenu du PDF)
     setTimeout(() => {
       try {
         // Trouver l'objet schedule dans l'historique si possible
         const scheduleObj = this.savedSchedules.find(s => s.id === id);
         
         // Générer le PDF sans le télécharger immédiatement
         const doc = this.exportToPDF(scheduleObj, false);
         const pdfDataUri = doc.output('datauristring');
         const pdfBase64 = pdfDataUri.split(',')[1];
         const fileName = title.replace(/ /g, '_') + '.pdf';

         this.scheduleService.notifyTeachers(id, { base64: pdfBase64, name: fileName }).subscribe({
           next: () => {
             this.toastNotification.createNotification('success', 'Envoyé', 'Les enseignants ont été notifiés par mail (PDF joint).');
             // Restaurer l'état
             this.viewingEmploiDuTempsId = originalViewingId;
             this.applyFilters();
           },
           error: (err) => {
             console.error(err);
             this.toastNotification.createNotification('error', 'Erreur', 'Impossible d\'envoyer les notifications.');
             this.viewingEmploiDuTempsId = originalViewingId;
             this.applyFilters();
           }
         });
       } catch (err) {
         console.error('Erreur génération PDF pour mail:', err);
         this.toastNotification.createNotification('error', 'Erreur PDF', 'Échec de génération du PDF pour l\'envoi.');
         this.viewingEmploiDuTempsId = originalViewingId;
         this.applyFilters();
       }
     }, 600);
  }

  addSchedule(): void {
    // Bouton de fallback s'il y a un composant enfant qui l'appelle sans passer par openGenerateModal
    this.openGenerateModal();
  }

  /**
   * Générer un emploi du temps PDF basé sur les événements avec un design Premium
   */
  exportToPDF(schedule?: SavedSchedule, shouldSave: boolean = true): jsPDF {
    const doc = new jsPDF('landscape');
    
    // Paramètres principaux
    const isMultiClass = !schedule || schedule.title.includes('Toutes Classes');
    const semestreVal = schedule?.semestre || String(this.genParams.semestre).replace('SEMESTRE_', '');
    const dateRangeStr = this.currentWeekStart + ' - ' + this.currentWeekEnd;
    const filiereName = schedule?.filiere || 'Ingénierie';
    const ecoleObj = this.ecoles.find(e => String(e.idEcole) === String(this.genParams.ecoleId));
    let defaultEcoleName = 'INSTITUT UNIVERSITAIRE SAINT JEAN';
    if (ecoleObj) defaultEcoleName = ecoleObj.nomEcole;
    else if (this.schools.length > 0) defaultEcoleName = this.schools[0];
    
    const ecoleName = schedule?.institution || defaultEcoleName;

    // 1. Récupération des données
    const allCourses = schedule 
      ? this.schedules.filter(e => !e.isDisponibilite && e.emploiDuTempsId === schedule.id)
      : this.filteredSchedules.filter(e => !e.isDisponibilite);

    let classesToProcess: string[] = [];
    if (isMultiClass) {
        classesToProcess = Array.from(new Set(allCourses.map(c => c.classeNom || 'Non assigné'))).sort();
    } else {
        const actualClassesInDraft = Array.from(new Set(allCourses.map(c => c.classeNom))).filter(Boolean);
        classesToProcess = actualClassesInDraft.length > 0 ? [actualClassesInDraft[0] as string] : [schedule?.classeName || 'Classe'];
    }

    if (classesToProcess.length === 0) classesToProcess = ['Emploi du Temps'];

    // 2. Boucle de génération des pages
    classesToProcess.forEach((currentClasse, pageIdx) => {
        if (pageIdx > 0) doc.addPage('landscape');

        const pageWidth = doc.internal.pageSize.width;
        const pageHeight = doc.internal.pageSize.height;

        // Header Decoration
        doc.setFillColor(30, 41, 59); 
        doc.rect(0, 0, pageWidth, 4, 'F');
        
        // Brand & Logo Area
        const getLogoPath = (name: string) => {
            const n = name.toUpperCase();
            if (n.includes('VOGT')) return '/prepa vogt.png';
            if (n.includes('PREPA')) return '/prepa sj.png';
            if (n.includes('MANAGEMENT')) return '/sjm.png';
            return '/sj.png'; // Défaut
        };

        const logoPath = getLogoPath(ecoleName);
        const logoW = 20; 
        const logoH = 20;
        const logoX = (pageWidth / 2) - (logoW / 2);
        
        try {
            doc.addImage(logoPath, 'PNG', logoX, 6, logoW, logoH);
        } catch (e) {
            console.warn('Logo non trouvé, fallback texte');
            doc.setFontSize(18);
            doc.setTextColor(15, 23, 42);
            doc.setFont('time new roman', 'bold');
            doc.text(ecoleName.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
        }

        // Tagline (Ajustée sous le logo)
        doc.setFontSize(9);
        doc.setFont('time new roman', 'normal');
        doc.setTextColor(100, 116, 139);
        doc.text('RECHERCHE - INNOVATION - EXCELLENCE', pageWidth / 2, 28, { align: 'center' });

        // Print Time
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(`Imprimé le : ${new Date().toLocaleDateString('fr-FR')} à ${new Date().toLocaleTimeString('fr-FR')}`, pageWidth - 15, 15, { align: 'right' });

        // Title Bar
        doc.setFillColor(241, 245, 249);
        doc.rect(15, 30, pageWidth - 30, 12, 'F');
        
        doc.setFontSize(11);
        doc.setFont('time new roman', 'bold');
        doc.setTextColor(30, 41, 59);
        const fullTitle = `EMPLOI DU TEMPS - SEMAINE DU ${dateRangeStr.toUpperCase()}`;
        doc.text(fullTitle, pageWidth / 2, 37.5, { align: 'center' });

        // Sub Info
        doc.setFontSize(9);
        doc.setFont('time new roman', 'normal');
        doc.setTextColor(71, 85, 105);
        
        const leftInfo = `Filière : ${filiereName}`;
        const centerInfo = `Semestre : ${this.getSemestreLabel(semestreVal)}`;
        const rightInfo = `Section : ${currentClasse}`;
        
        doc.text(leftInfo, 20, 48);
        doc.text(centerInfo, pageWidth / 2, 48, { align: 'center' });
        doc.text(rightInfo, pageWidth - 20, 48, { align: 'right' });

        // Grid Design
        const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
        const times = [
          { start: '08:00', end: '09:00', val: '08:00 - 09:00' },
          { start: '09:00', end: '10:00', val: '09:00 - 10:00' },
          { start: '10:00', end: '11:00', val: '10:00 - 11:00' },
          { start: '11:00', end: '12:00', val: '11:00 - 12:00' },
          { start: '12:00', end: '13:00', val: 'Pause' },
          { start: '13:00', end: '14:00', val: '13:00 - 14:00' },
          { start: '14:00', end: '15:00', val: '14:00 - 15:00' },
          { start: '15:00', end: '16:00', val: '15:00 - 16:00' },
          { start: '16:00', end: '17:00', val: '16:00 - 17:00' }
        ];

        const coursesForPage = classesToProcess.length === 1 ? allCourses : allCourses.filter(c => {
            const cName = c.classeNom || '';
            return cName === currentClasse;
        });
        
        let skipRows: { [key: string]: number } = { Lundi: 0, Mardi: 0, Mercredi: 0, Jeudi: 0, Vendredi: 0, Samedi: 0 };
        const body: any[] = [];

        const normalizeT = (t: string) => {
            if (!t) return '';
            const parts = t.replace('h', ':').split(':');
            return parts.slice(0, 2).map(p => p.trim().padStart(2, '0')).join(':');
        };

        times.forEach((t) => {
          let row: any[] = [t.val];
          const targetTimeStr = normalizeT(t.start);
          
          if (t.val === 'Pause') {
            row.push({ 
              content: 'Pause', 
              colSpan: 6, 
              styles: { halign: 'center', fillColor: [146, 208, 80], textColor: [0, 0, 0], fontStyle: 'bold', fontSize: 9 } 
            });
            days.forEach(d => { if(skipRows[d] > 0) skipRows[d]--; });
          } else {
            days.forEach(day => {
              if (skipRows[day] > 0) {
                skipRows[day]--;
              } else {
                const event = coursesForPage.find(e => {
                  if (!e.dayOfWeek || !e.startTime) return false;
                  const evDay = e.dayOfWeek.trim().toLowerCase();
                  if (evDay !== day.toLowerCase()) return false;
                  return normalizeT(e.startTime) === targetTimeStr;
                });

                if (event) {
                  const startH = parseInt(normalizeT(event.startTime).split(':')[0], 10);
                  const endH = parseInt(normalizeT(event.endTime).split(':')[0], 10);
                  let durationRows = Math.max(1, endH - startH);

                  // Fusionner les blocs adjacents (ex: 2 + 2 = 4h)
                  let currentEnd = normalizeT(event.endTime);
                  let merged = true;
                  while (merged) {
                    const localEnd = currentEnd;
                    const nextEvent = coursesForPage.find(e => {
                      const evDay = (e.dayOfWeek || '').trim().toLowerCase();
                      if (evDay !== day.toLowerCase()) return false;
                      const isSameSubject = (e.subject || '').trim().toLowerCase() === (event.subject || '').trim().toLowerCase();
                      const isSameTeacher = (e.teacher || '').trim().toLowerCase() === (event.teacher || '').trim().toLowerCase();
                      return normalizeT(e.startTime) === localEnd && isSameSubject && isSameTeacher;
                    });

                    if (nextEvent) {
                      const nStartH = parseInt(normalizeT(nextEvent.startTime).split(':')[0], 10);
                      const nEndH = parseInt(normalizeT(nextEvent.endTime).split(':')[0], 10);
                      durationRows += (nEndH - nStartH);
                      currentEnd = normalizeT(nextEvent.endTime);
                    } else {
                      merged = false;
                    }
                  }

                  let safeDuration = durationRows;
                  if (startH < 12 && (startH + safeDuration) > 12) safeDuration = 12 - startH; 
                  skipRows[day] = safeDuration - 1;

                  let rgb: [number, number, number] = [0, 112, 192];
                  if (event.color) {
                    const hexExec = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(event.color);
                    if (hexExec) rgb = [parseInt(hexExec[1], 16), parseInt(hexExec[2], 16), parseInt(hexExec[3], 16)];
                  }
                  
                  const formattedSubject = (event.subject || '').toLowerCase();
                  const finalSubject = formattedSubject.charAt(0).toUpperCase() + formattedSubject.slice(1);
                  
                  row.push({
                    content: finalSubject,
                    rowSpan: safeDuration,
                    styles: { 
                        halign: 'center', 
                        valign: 'middle', 
                        fillColor: rgb, 
                        textColor: [255, 255, 255], 
                        fontStyle: 'normal', 
                        fontSize: 6,
                        cellPadding: 1
                    },
                    metadata: { teacher: (event.teacher || '') }
                  });
                } else {
                  // Regrouper le travail personnel de l'étudiant
                  let emptyCount = 0;
                  const currentTimeIdx = times.indexOf(t);
                  
                  for (let i = currentTimeIdx; i < times.length; i++) {
                    const nextT = times[i];
                    if (nextT.val === 'Pause') break;
                    
                    const nextTargetTimeStr = normalizeT(nextT.start);
                    const nextEvent = coursesForPage.find(e => {
                      if (!e.dayOfWeek || !e.startTime) return false;
                      return e.dayOfWeek.trim().toLowerCase() === day.toLowerCase() && 
                             normalizeT(e.startTime) === nextTargetTimeStr;
                    });
                    
                    if (nextEvent) break;
                    emptyCount++;
                  }

                  let span = 1;
                  if (emptyCount >= 4) span = 4;
                  else if (emptyCount >= 2) span = 2;
                  
                  skipRows[day] = span - 1;

                  row.push({ 
                      content: 'Travail personnel de l\'étudiant', 
                      rowSpan: span,
                      styles: { 
                        fillColor: [255, 255, 255], 
                        textColor: [140, 140, 140], 
                        fontSize: 5,
                        fontStyle: 'normal',
                        cellPadding: 0.5,
                        halign: 'center',
                        valign: 'middle'
                      } 
                  });
                }
              }
            });
          }
          body.push(row);
        });

        const dayColWidth = (pageWidth - 20 - 25) / 6;

        autoTable(doc, {
          head: [['HORAIRES', ...days.map(d => d.toUpperCase())]],
          body: body,
          startY: 50,
          margin: { horizontal: 10, bottom: 15 },
          theme: 'grid',
          styles: { 
            fontSize: 5.5, 
            cellPadding: 1.5, 
            overflow: 'linebreak', 
            halign: 'center', 
            lineColor: [0, 0, 0], 
            lineWidth: 0.1, 
            valign: 'middle',
            minCellHeight: 11,
            font: 'time new roman'
          },
          headStyles: { 
            fillColor: [255, 255, 255], 
            textColor: [0, 0, 0], 
            fontSize: 8, 
            cellPadding: 2,
            lineColor: [0, 0, 0],
            lineWidth: 0.2
          },
          columnStyles: { 
            0: { cellWidth: 25, fontStyle: 'bold', fontSize: 7 },
            1: { cellWidth: dayColWidth },
            2: { cellWidth: dayColWidth },
            3: { cellWidth: dayColWidth },
            4: { cellWidth: dayColWidth },
            5: { cellWidth: dayColWidth },
            6: { cellWidth: dayColWidth }
          },
          didDrawCell: (data) => {
            const cell = data.cell as any;
            if (data.section === 'body' && cell.raw && cell.raw.metadata && cell.raw.metadata.teacher) {
               const cellDoc = data.doc;
               const teacherName = cell.raw.metadata.teacher;
               cellDoc.setFontSize(5.5);
               cellDoc.setFont('time new roman', 'normal');
               cellDoc.setTextColor(255, 255, 0); // JAUNE
               const textWidth = cellDoc.getTextWidth(teacherName);
               const x = cell.x + (cell.width - textWidth) / 2;
               // On ajuste le centrage vertical pour les cellules plus basses
               const y = cell.y + (cell.height / 2) + 3.5;
               cellDoc.text(teacherName, x, y);
            }
          }
        });

        // Footer
        doc.setFontSize(7);
        doc.setTextColor(100, 116, 139);
        doc.text(`Page ${pageIdx + 1} / ${classesToProcess.length}`, pageWidth - 10, pageHeight - 8, { align: 'right' });
        doc.text('© 2026 Timora ERP - Système Automatisé de Gestion Académique', 10, pageHeight - 8);
        doc.setDrawColor(0, 0, 0);
        doc.line(10, pageHeight - 12, pageWidth - 10, pageHeight - 12);
    });

    const fileName = (schedule ? schedule.title.replace(/ /g, '_') : 'Emploi_du_temps_Timora') + '.pdf';
    if (shouldSave) { doc.save(fileName); }
    return doc;
  }

  /**
   * Modifier un créneau
   */
  editSchedule(schedule: Schedule): void {
    console.log('Modifier:', schedule);
    // Logique pour modifier
  }

  /**
   * Supprimer un créneau
   */
  deleteSchedule(schedule: Schedule): void {
    console.log('Supprimer:', schedule);
    // Logique pour supprimer
  }

  toggleSidebar(): void {
    console.log('Toggle sidebar');
  }

  onSearch(): void {
    console.log('Search clicked');
  }

  onNotifications(): void {
    console.log('Notifications clicked');
  }

  /**
   * Obtenir le nom complet d'un enseignant
   */
  /**
   * Actions sur l'historique
   */
  downloadSavedSchedule(schedule: SavedSchedule): void {
    // Permet de s'assurer que les bons cours sont en mémoire avant impression
    this.viewingEmploiDuTempsId = schedule.id;
    this.applyFilters();
    this.toastNotification.createNotification('success', 'Téléchargement', `Génération du planning PDF en cours...`);
    setTimeout(() => {
      this.exportToPDF(schedule);
      this.viewingEmploiDuTempsId = null; // Remise à zéro
      this.applyFilters();
    }, 500);
  }

  viewSavedSchedule(schedule: SavedSchedule): void {
    console.log('Prévisualisation de l\'emploi du temps:', schedule);
    this.viewingEmploiDuTempsId = schedule.id;
    this.isPreviewingNew = false;
    this.switchTab('saved', false); // Ne pas réinitialiser
    
    // Mettre à jour les filtres pour correspondre au planning sélectionné
    if (schedule.institution && this.schools.includes(schedule.institution)) {
      this.filterSchool = schedule.institution;
    }
    
    if (schedule.semestre) {
      this.selectedSemestre = `S${schedule.semestre}`;
    }
    
    this.applyFilters();
    this.toastNotification.createNotification('success', 'Visualisation', `Visualisation de ${schedule.title}`);
  }

  deleteSavedSchedule(schedule: SavedSchedule): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${schedule.title} de façon permanente ?`)) {
      this.scheduleService.deleteEmploiDuTemps(schedule.id).subscribe({
        next: () => {
           this.toastNotification.createNotification('success', 'Supprimé', 'Emploi du temps supprimé avec succès');
           this.loadSavedSchedules();
        },
        error: (err) => {
           this.toastNotification.createNotification('error', 'Erreur', 'Impossible de supprimer cet élément');
        }
      });
    }
  }

  getTeacherName(teacherId: string): string {
    const teacher = this.teachers.find(t => t.id === teacherId);
    return teacher ? `${teacher.firstName} ${teacher.lastName}` : 'Enseignant inconnu';
  }

  getSemestreLabel(semestre: string | undefined): string {
    if (!semestre) return 'N/A';
    if (semestre === 'SEMESTRE_1' || semestre === '1') return 'Semestre 1';
    if (semestre === 'SEMESTRE_2' || semestre === '2') return 'Semestre 2';
    return semestre;
  }

  getPreviewTitle(): string {
    if (this.viewingEmploiDuTempsId) {
      const schedule = this.savedSchedules.find(s => s.id === this.viewingEmploiDuTempsId);
      return schedule ? schedule.title : 'Emploi du temps enregistré';
    }
    if (this.isPreviewingNew) {
      const classObj = this.classes.find(c => String(c.idClasse) === String(this.genParams.classeId));
      const className = classObj ? classObj.nom : 'Toutes les classes';
      const numSemestre = String(this.genParams.semestre).replace('SEMESTRE_', '');
      return `Nouvelle Génération - Semestre ${numSemestre} - ${className}`;
    }
    return '';
  }

  // --- Drag and Drop Logic ---

  onDragStart(event: DragEvent, schedule: any): void {
    this.draggedEvent = schedule;
    if (event.dataTransfer) {
      event.dataTransfer.setData('text/plain', schedule.id);
      event.dataTransfer.effectAllowed = 'move';
    }
    // Si c'est la première modification, on sauvegarde l'état original
    if (!this.hasUnsavedChanges) {
      this.originalSchedules = JSON.parse(JSON.stringify(this.schedules));
    }
  }

  onDrop(event: DragEvent, day: string, timeSlot: any, newClass?: any): void {
    event.preventDefault();
    if (!this.draggedEvent) return;

    // Trouver l'index de l'élément à mettre à jour
    const index = this.schedules.findIndex(s => s.id === this.draggedEvent.id);
    if (index !== -1) {
      // Mettre à jour localement
      this.schedules[index] = {
        ...this.schedules[index],
        dayOfWeek: day,
        startTime: timeSlot.start,
        endTime: timeSlot.end
      };
      
      // Si on a droppé dans une instance de calendrier spécifique à une classe
      if (newClass) {
        this.schedules[index].classeId = newClass.idClasse;
        this.schedules[index].classeNom = newClass.nom;
      }
      
      this.hasUnsavedChanges = true;
      this.changedScheduleIds.add(this.draggedEvent.id);
      this.applyFilters();
      this.toastNotification.createNotification('success', 'Modification', `Déplacement de ${this.draggedEvent.title} vers ${day} à ${timeSlot.start}`);
    }
    
    this.draggedEvent = null;
    this.cdr.detectChanges();
  }

  savePlanningChanges(): void {
    if (this.changedScheduleIds.size === 0) {
      this.hasUnsavedChanges = false;
      return;
    }

    this.isLoading = true;
    const updatePromises = [];

    for (const id of this.changedScheduleIds) {
      const schedule = this.schedules.find(s => s.id === id);
      if (schedule && !schedule.isDisponibilite) {
        // Mapper vers UpdateScheduleRequest
        const updateData = {
          nom: schedule.subject,
          jourSemaine: schedule.dayOfWeek, // Envoi du nom du jour (ex: "Lundi")
          heureDebut: schedule.startTime,
          heureFin: schedule.endTime,
          enseignantId: schedule.teacherId,
          salleId: schedule.room,
          idCours: schedule.id
        };
        updatePromises.push(this.scheduleService.updateSchedule(id, updateData as any).toPromise());
      }
    }

    Promise.all(updatePromises)
      .then(() => {
        this.isLoading = false;
        this.hasUnsavedChanges = false;
        this.changedScheduleIds.clear();
        this.toastNotification.createNotification('success', 'Calendrier', 'Modifications enregistrées avec succès');
        this.loadCours(); // Recharger pour synchroniser
      })
      .catch(error => {
        console.error('Erreur lors de l\'enregistrement:', error);
        this.isLoading = false;
        this.toastNotification.createNotification('error', 'Calendrier', 'Erreur lors de l\'enregistrement des modifications');
      });
  }

  cancelChanges(): void {
    if (confirm('Voulez-vous vraiment annuler toutes les modifications ?')) {
      this.schedules = JSON.parse(JSON.stringify(this.originalSchedules));
      this.hasUnsavedChanges = false;
      this.changedScheduleIds.clear();
      this.applyFilters();
      this.toastNotification.createNotification('success', 'Calendrier', 'Modifications annulées');
    }
  }
}
