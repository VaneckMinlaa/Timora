import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, firstValueFrom } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';
import { ScheduleService, ReservationService, AuthService, ToastNotificationService, CourseService, RoomService } from '../../../../core/services';
import { Room, Course, EmploiDuTempsWithCours, CoursEDT, Disponibilite, AuthUser, CreateDisponibiliteRequest } from '../../../../core/models';

interface CalendarEvent {
  id: string;
  title: string;
  subject?: string;
  room?: string;
  class?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  color: string;
  type: 'cours' | 'disponibilite' | 'reunion' | 'indisponible';
}

interface WeekDay {
  name: string;
  date: Date;
  isToday: boolean;
}

interface DayWithCourses {
  day: number;
  date: Date;
  isCurrentMonth: boolean;
  courses: CoursEDT[];
  hasEvents: boolean;
}

@Component({
  selector: 'app-calendar-sync',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar, TeacherHeaderComponent],
  templateUrl: './sync.component.html',
  styleUrls: ['./sync.component.scss']
})
export class CalendarSyncComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User info
  currentUser: AuthUser | null = null;
  enseignantId: string = '';

  // Calendar view
  calendarView: 'Jour' | 'Semaine' | 'Mois' = 'Semaine';
  
  // Schedule data
  emploiDuTemps: EmploiDuTempsWithCours | null = null;
  disponibilites: Disponibilite[] = [];
  calendarEvents: CalendarEvent[] = [];
  
  // Week navigation
  currentDate: Date = new Date();
  currentMonth: string = '';
  weekDays: WeekDay[] = [
    { name: 'Lundi', date: new Date(), isToday: false },
    { name: 'Mardi', date: new Date(), isToday: false },
    { name: 'Mercredi', date: new Date(), isToday: false },
    { name: 'Jeudi', date: new Date(), isToday: false },
    { name: 'Vendredi', date: new Date(), isToday: false },
    { name: 'Samedi', date: new Date(), isToday: false }
  ];
  
  // Calendar days for month view
  calendarDays: number[] = [];
  currentMonthYear: string = '';
  
  // Month calendar with courses
  monthCalendarDays: DayWithCourses[] = [];
  
  // Availability management
  availabilityGrid: { [key: string]: 'disponible' | 'prefere' | 'indisponible' | '' } = {};
  
  // Time slots — same as admin calendar (08:00 → 17:00)
  timeSlots: { start: string; end: string }[] = [
    { start: '08:00', end: '10:00' },
    { start: '10:00', end: '12:00' },
    { start: '13:00', end: '15:00' },
    { start: '15:00', end: '17:00' }
  ];

  // Days of week
  weekDayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  isLoading: boolean = false;
  errorMessage: string = '';

  rooms: Room[] = [];

  constructor(
    private scheduleService: ScheduleService,
    private reservationService: ReservationService,
    private authService: AuthService,
    private toastNotification: ToastNotificationService,
    private courseService: CourseService,
    private roomService: RoomService
  ) {}

  ngOnInit(): void {
    // Charger les salles d'abord
    this.roomService.getAllRooms().pipe(takeUntil(this.destroy$)).subscribe(rooms => {
      this.rooms = rooms || [];
      
      // Récupérer l'utilisateur connecté ensuite
      this.authService.currentUser$
        .pipe(takeUntil(this.destroy$))
        .subscribe(user => {
          this.currentUser = user;
          if (user) {
            this.enseignantId = user.id || '';
            this.loadSchedule();
            this.loadDisponibilites();
          }
        });
    });

    this.initializeCalendar();
    
    // Mettre à jour le tableau de disponibilité après le chargement
    setTimeout(() => {
      this.updateAvailabilityGridFromSchedule();
    }, 500);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le calendrier
   */
  initializeCalendar(): void {
    this.updateCurrentMonth();
    this.initializeWeekDays();
    this.initializeCalendarDays();
  }

  /**
   * Initialiser les jours de la semaine
   */
  initializeWeekDays(): void {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.getFullYear(), today.getMonth(), diff);
    
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    this.weekDays = days.map((dayName, index) => {
      const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + index);
      const isToday = date.toDateString() === new Date().toDateString();
      
      return {
        name: dayName,
        date: date,
        isToday
      } as WeekDay;
    });
  }

  /**
   * Initialiser les jours du calendrier mensuel
   */
  initializeCalendarDays(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Ajuster pour commencer le lundi (0 = dimanche, 1 = lundi, etc.)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    this.calendarDays = [];
    
    // Ajouter les jours du mois précédent
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      this.calendarDays.push(prevMonthLastDay - i);
    }
    
    // Ajouter les jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      this.calendarDays.push(i);
    }
    
    // Ajouter les jours du mois suivant pour compléter la grille
    const remainingDays = 42 - this.calendarDays.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      this.calendarDays.push(i);
    }
  }

  /**
   * Mettre à jour le mois courant
   */
  updateCurrentMonth(): void {
    const months = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    this.currentMonth = months[this.currentDate.getMonth()];
    this.currentMonthYear = `${this.currentMonth} ${this.currentDate.getFullYear()}`;
  }

  /**
   * Charger l'emploi du temps
   */
  loadSchedule(): void {
    if (!this.enseignantId) return;
    
    this.isLoading = true;
    this.courseService.getCoursesByTeacher(this.enseignantId)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement de l\'emploi du temps:', error);
          this.toastNotification.error('Erreur', 'Impossible de charger vos cours.');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (courses: Course[]) => {
          if (!courses) courses = [];
          
          const coursList = courses
            .filter(c => c.heureDebut && c.heureFin && c.jourSemaine)
            .map(c => ({
              idCours: c.idCours,
              nom: c.nom,
              type: c.type,
              jourSemaine: c.jourSemaine,
              heureDebut: c.heureDebut,
              heureFin: c.heureFin,
              salleId: c.salleId,
              enseignantId: c.enseignantId,
              classeIds: c.classeIds
            } as CoursEDT));
            
          this.emploiDuTemps = {
            id: 'real-edt-sync',
            semaine: 1,
            dateDebut: '',
            dateFin: '',
            statut: 'VALIDE',
            enseignantId: this.enseignantId,
            cours: coursList
          };
          this.processSchedule();
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger les disponibilités
   */
  loadDisponibilites(): void {
    if (!this.enseignantId) return;
    
    this.reservationService.getUserDisponibilites(this.enseignantId)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des disponibilités:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (dispos) => {
          this.disponibilites = dispos;
          // Mettre à jour le tableau de disponibilité avec les disponibilités chargées
          this.updateAvailabilityGridFromDisponibilites();
        }
      });
  }

  /**
   * Mettre à jour le tableau de disponibilité à partir des disponibilités chargées
   */
  updateAvailabilityGridFromDisponibilites(): void {
    if (!this.disponibilites || this.disponibilites.length === 0) return;

    // Pour chaque disponibilité, déterminer la période et mettre à jour le tableau
    this.disponibilites.forEach(dispo => {
      if (dispo.jour && dispo.heureDebut) {
        const hour = parseInt(dispo.heureDebut.split(':')[0]);
        const period = hour < 12 ? 'Matin' : 'Après-midi';
        const key = `${dispo.jour}-${period}`;
        
        // Marquer comme disponible (on pourrait aussi vérifier le statut si disponible dans le modèle)
        this.availabilityGrid[key] = 'disponible';
      }
    });
  }

  /**
   * Traiter l'emploi du temps pour créer les événements calendrier
   */
  processSchedule(): void {
    if (!this.emploiDuTemps || !this.emploiDuTemps.cours) {
      this.calendarEvents = [];
      this.monthCalendarDays = [];
      return;
    }

    this.calendarEvents = this.emploiDuTemps.cours
      .filter(cours => cours.nom) // Filtrer les cours sans nom
      .map(cours => {
        const nom = cours.nom || 'Cours sans nom';
        return {
          id: cours.idCours,
          title: nom,
          subject: nom,
          room: this.resolveRoomName(cours.salleId),
          class: cours.classeIds?.join(', ') || '',
          dayOfWeek: cours.jourSemaine,
          startTime: cours.heureDebut,
          endTime: cours.heureFin,
          color: this.getColorForSubject(cours.nom),
          type: 'cours' as const
        };
      });
    
    // Générer le calendrier mensuel avec les cours
    this.generateMonthlyCalendarWithCourses();
  }

  resolveRoomName(roomId?: string): string {
    if (!roomId) return 'NS'; // Non spécifié
    const room = this.rooms.find(r => r.idSalle === roomId);
    return (room && room.nomsalle) ? room.nomsalle : roomId;
  }

  /**
   * Obtenir la couleur pour un sujet
   */
  getColorForSubject(subject: string | undefined): string {
    if (!subject) return '#2563eb';
    const palette = [
      '#2563eb', '#7c3aed', '#0891b2', '#059669',
      '#d97706', '#dc2626', '#0284c7', '#9333ea',
      '#0d9488', '#b45309'
    ];
    let hash = 0;
    for (let i = 0; i < subject.length; i++) {
      hash = (hash << 5) - hash + subject.charCodeAt(i);
      hash |= 0;
    }
    return palette[Math.abs(hash) % palette.length];
  }

  /**
   * Get events for a specific day and 2-hour time slot (admin-compatible)
   */
  getEventsForDayAndSlot(dayName: string, timeSlot: { start: string; end: string }): CalendarEvent[] {
    return this.calendarEvents.filter(event => {
      if (event.dayOfWeek !== dayName) return false;
      const eventStart = this.parseTime(event.startTime);
      const slotStart = this.parseTime(timeSlot.start);
      const slotEnd   = this.parseTime(timeSlot.end);
      return eventStart >= slotStart && eventStart < slotEnd;
    });
  }

  /**
   * Get event top % position within its 2-hour slot cell
   */
  getEventTopInSlot(event: CalendarEvent, timeSlot: { start: string; end: string }): number {
    const eventStart  = this.parseTime(event.startTime);
    const slotStart   = this.parseTime(timeSlot.start);
    const slotDuration = this.parseTime(timeSlot.end) - slotStart;
    return ((eventStart - slotStart) / slotDuration) * 100;
  }

  /**
   * Get event height % within its 2-hour slot cell (clamped to slot boundary)
   */
  getEventHeightInSlot(event: CalendarEvent, timeSlot: { start: string; end: string }): number {
    const eventStart   = this.parseTime(event.startTime);
    const eventEnd     = this.parseTime(event.endTime);
    const slotStart    = this.parseTime(timeSlot.start);
    const slotEnd      = this.parseTime(timeSlot.end);
    const clampedStart = Math.max(eventStart, slotStart);
    const clampedEnd   = Math.min(eventEnd,   slotEnd);
    const duration     = Math.max(0, clampedEnd - clampedStart);
    const slotDuration = slotEnd - slotStart;
    return (duration / slotDuration) * 100;
  }

  /**
   * Obtenir les événements pour un jour et un créneau horaire (legacy, kept for compatibility)
   */
  getEventsForDayAndTime(day: string, timeSlot: { start: string; end: string }): CalendarEvent[] {
    return this.calendarEvents.filter(event => {
      if (event.dayOfWeek !== day) return false;
      
      const eventStart = this.parseTime(event.startTime);
      const slotStart = this.parseTime(timeSlot.start);
      const slotEnd = this.parseTime(timeSlot.end);
      
      return eventStart >= slotStart && eventStart < slotEnd;
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
   * Changer la vue du calendrier
   */
  changeView(view: 'Jour' | 'Semaine' | 'Mois'): void {
    this.calendarView = view;
  }

  /**
   * Get start date of current week
   */
  get weekStartDate(): Date {
    const today = new Date();
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    return new Date(today.setDate(diff));
  }

  /**
   * Get end date of current week
   */
  get weekEndDate(): Date {
    const startDate = this.weekStartDate;
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);
    return endDate;
  }

  /**
   * Navigate to previous week
   */
  previousWeek(): void {
    const today = new Date();
    today.setDate(today.getDate() - 7);
    this.currentDate = today;
    this.initializeWeekDays();
  }

  /**
   * Navigate to next week
   */
  nextWeek(): void {
    const today = new Date();
    today.setDate(today.getDate() + 7);
    this.currentDate = today;
    this.initializeWeekDays();
  }

  /**
   * Go to today
   */
  goToToday(): void {
    this.currentDate = new Date();
    this.initializeWeekDays();
  }

  /**
   * Get events for a specific day
   */
  getEventsForDay(day: WeekDay): CalendarEvent[] {
    if (!this.emploiDuTemps || !this.emploiDuTemps.cours) {
      return [];
    }

    return this.emploiDuTemps.cours
      .filter(cours => cours.jourSemaine === day.name)
      .map(cours => ({
        id: cours.idCours || '',
        title: cours.nom || '',
        subject: cours.nom || '',
        room: '', // À adapter selon vos données
        class: '', // À adapter selon vos données
        dayOfWeek: day.name,
        startTime: cours.heureDebut || '00:00',
        endTime: cours.heureFin || '00:00',
        color: this.getColorClassForCourse(cours),
        type: 'cours'
      }));
  }

  /**
   * Check if there are any events in the current week
   */
  hasEvents(): boolean {
    return this.weekDays.some(day => this.getEventsForDay(day).length > 0);
  }

  /**
   * Get the top position percentage for an event in the calendar grid
   */
  getEventTop(event: CalendarEvent): number {
    const startTime = event.startTime.split(':');
    const hours = parseInt(startTime[0]) - 8; // Calendar starts at 08:00
    const minutes = parseInt(startTime[1]);
    const minuteOffset = (hours * 60 + minutes) / 720; // 720 minutes = 100% of 12-hour day (08:00–20:00)
    return minuteOffset * 100;
  }

  /**
   * Get the height percentage for an event in the calendar grid
   */
  getEventHeight(event: CalendarEvent): number {
    const startTime = event.startTime.split(':');
    const endTime = event.endTime.split(':');
    const startMinutes = parseInt(startTime[0]) * 60 + parseInt(startTime[1]);
    const endMinutes = parseInt(endTime[0]) * 60 + parseInt(endTime[1]);
    const durationMinutes = endMinutes - startMinutes;
    return (durationMinutes / 720) * 100; // 720 minutes = 100% of 12-hour day (08:00–20:00)
  }

  /**
   * Mois précédent
   */
  previousMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() - 1, 1);
    this.updateCurrentMonth();
    this.initializeCalendarDays();
    this.generateMonthlyCalendarWithCourses();
  }

  /**
   * Mois suivant
   */
  nextMonth(): void {
    this.currentDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth() + 1, 1);
    this.updateCurrentMonth();
    this.initializeCalendarDays();
    this.generateMonthlyCalendarWithCourses();
  }

  /**
   * Obtenir l'état de disponibilité pour un jour et un créneau
   */
  getAvailabilityState(day: string, period: 'Matin' | 'Après-midi'): 'disponible' | 'prefere' | 'indisponible' | '' {
    const key = `${day}-${period}`;
    return this.availabilityGrid[key] || '';
  }

  /**
   * Toggle la disponibilité
   */
  toggleAvailability(day: string, period: 'Matin' | 'Après-midi'): void {
    const key = `${day}-${period}`;
    const current = this.availabilityGrid[key] || '';
    
    if (current === '') {
      this.availabilityGrid[key] = 'disponible';
    } else if (current === 'disponible') {
      this.availabilityGrid[key] = 'prefere';
    } else if (current === 'prefere') {
      this.availabilityGrid[key] = 'indisponible';
    } else {
      this.availabilityGrid[key] = '';
    }
  }

  /**
   * Soumettre l'emploi du temps et mettre à jour les disponibilités
   */
  submitSchedule(): void {
    if (!this.enseignantId || !this.emploiDuTemps) {
      this.errorMessage = 'Aucun emploi du temps à soumettre';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Convertir l'emploi du temps en disponibilités
    const disponibilitesToCreate: any[] = [];
    
    if (this.emploiDuTemps.cours && this.emploiDuTemps.cours.length > 0) {
      // Pour chaque cours, créer une disponibilité correspondante
      this.emploiDuTemps.cours.forEach(cours => {
        if (cours.jourSemaine && cours.heureDebut && cours.heureFin) {
          // Trouver la date correspondante pour ce jour de la semaine
          const dayIndex = this.weekDayNames.indexOf(cours.jourSemaine);
          if (dayIndex !== -1 && this.weekDays[dayIndex]) {
            const date = this.weekDays[dayIndex].date;
            
            disponibilitesToCreate.push({
              date: date,
              heureDebut: cours.heureDebut,
              heureFin: cours.heureFin,
              jour: cours.jourSemaine
            });
          }
        }
      });
    }

    // Mettre à jour le tableau de disponibilité avec les créneaux de l'emploi du temps
    this.updateAvailabilityGridFromSchedule();

    this.isLoading = false;
    console.log('Emploi du temps soumis, disponibilités mises à jour');
    this.toastNotification.success(
      'Emploi du temps soumis',
      'Votre emploi du temps a été soumis. Les disponibilités ont été mises à jour automatiquement.'
    );
  }

  /**
   * Mettre à jour le tableau de disponibilité à partir de l'emploi du temps
   */
  updateAvailabilityGridFromSchedule(): void {
    if (!this.emploiDuTemps || !this.emploiDuTemps.cours) return;

    // Réinitialiser le tableau
    this.availabilityGrid = {};

    // Pour chaque cours, déterminer la période (Matin ou Après-midi) et marquer comme disponible
    this.emploiDuTemps.cours.forEach(cours => {
      if (cours.jourSemaine && cours.heureDebut) {
        const hour = parseInt(cours.heureDebut.split(':')[0]);
        const period = hour < 12 ? 'Matin' : 'Après-midi';
        const key = `${cours.jourSemaine}-${period}`;
        
        // Marquer comme disponible si ce n'est pas déjà marqué comme préféré
        if (!this.availabilityGrid[key]) {
          this.availabilityGrid[key] = 'disponible';
        }
      }
    });
  }

  /**
   * Soumettre les disponibilités
   */
  submitAvailabilities(): void {
    if (!this.enseignantId) {
      this.errorMessage = 'Utilisateur non identifié';
      return;
    }

    // Vérifier qu'il y a au moins une disponibilité à soumettre
    const hasAvailabilities = Object.keys(this.availabilityGrid).some(
      key => this.availabilityGrid[key] && this.availabilityGrid[key] !== 'indisponible'
    );

    if (!hasAvailabilities) {
      this.errorMessage = 'Veuillez sélectionner au moins une disponibilité';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Convertir le tableau de disponibilité en requêtes de création
    const requests: CreateDisponibiliteRequest[] = [];
    
    Object.keys(this.availabilityGrid).forEach(key => {
      const [day, period] = key.split('-');
      const state = this.availabilityGrid[key];
      
      if (state && state !== 'indisponible') {
        // Trouver la date correspondante pour ce jour
        const dayIndex = this.weekDayNames.indexOf(day);
        if (dayIndex !== -1 && this.weekDays[dayIndex]) {
          // Formater la date correctement (YYYY-MM-DD)
          const today = new Date();
          const dayOfWeek = today.getDay();
          const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
          const monday = new Date(today.setDate(diff));
          const targetDate = new Date(monday);
          targetDate.setDate(monday.getDate() + dayIndex);
          
          const dateStr = targetDate.toISOString().split('T')[0];
          
          // Déterminer les heures selon la période
          let heureDebut = '08:00';
          let heureFin = '12:00';
          
          if (period === 'Après-midi') {
            heureDebut = '13:00';
            heureFin = '17:00';
          }

          requests.push({
            jour: day,
            date: dateStr,
            heureDebut: heureDebut,
            heureFin: heureFin,
            utilisateurId: this.enseignantId
          });
        }
      }
    });

    if (requests.length === 0) {
      this.errorMessage = 'Aucune disponibilité à soumettre';
      this.isLoading = false;
      return;
    }

    // Envoyer les requêtes au backend
    const createPromises = requests.map(request => 
      firstValueFrom(this.reservationService.createDisponibilite(request))
    );

    Promise.all(createPromises)
      .then(() => {
        this.isLoading = false;
        console.log('Disponibilités soumises avec succès');
        // Recharger les disponibilités pour mettre à jour l'affichage
        this.loadDisponibilites();
        // Afficher un message de succès
        this.toastNotification.success(
          'Disponibilités soumises',
          'Vos disponibilités ont été soumises avec succès. Elles sont maintenant visibles par l\'administration.'
        );
      })
      .catch((error) => {
        this.isLoading = false;
        console.error('Erreur lors de la soumission des disponibilités:', error);
        this.errorMessage = error.error?.message || 'Erreur lors de la soumission. Veuillez réessayer.';
        this.toastNotification.error(
          'Erreur de soumission',
          this.errorMessage
        );
      });
  }

  /**
   * Exporter l'emploi du temps en .ics
   */
  exportToICS(): void {
    console.log('Export en .ics');
    // TODO: Implémenter l'export .ics
  }

  /**
   * Demander une modification
   */
  requestModification(): void {
    console.log('Demande de modification');
    // TODO: Implémenter la demande de modification
  }

  /**
   * Vérifier si un jour est aujourd'hui
   */
  isToday(day: number): boolean {
    const today = new Date();
    return day === today.getDate() && 
           this.currentDate.getMonth() === today.getMonth() &&
           this.currentDate.getFullYear() === today.getFullYear();
  }

  /**
   * Vérifier si un jour est dans le mois précédent
   */
  isPreviousMonth(day: number): boolean {
    return day > 15 && this.calendarDays.indexOf(day) < 7;
  }

  /**
   * Vérifier si un jour est dans le mois suivant
   */
  isNextMonth(day: number): boolean {
    return day < 15 && this.calendarDays.indexOf(day) > 20;
  }

  /**
   * Générer le calendrier mensuel avec les cours
   */
  generateMonthlyCalendarWithCourses(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();
    
    // Ajuster pour commencer le lundi (0 = dimanche, 1 = lundi, etc.)
    const adjustedStart = startingDayOfWeek === 0 ? 6 : startingDayOfWeek - 1;
    
    this.monthCalendarDays = [];
    
    // Ajouter les jours du mois précédent
    const prevMonth = new Date(year, month, 0);
    const prevMonthLastDay = prevMonth.getDate();
    for (let i = adjustedStart - 1; i >= 0; i--) {
      const day = prevMonthLastDay - i;
      const date = new Date(prevMonth.getFullYear(), prevMonth.getMonth(), day);
      this.monthCalendarDays.push({
        day,
        date,
        isCurrentMonth: false,
        courses: this.getCoursesForDay(date),
        hasEvents: false
      });
    }
    
    // Ajouter les jours du mois courant
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      const courses = this.getCoursesForDay(date);
      this.monthCalendarDays.push({
        day: i,
        date,
        isCurrentMonth: true,
        courses,
        hasEvents: courses.length > 0
      });
    }
    
    // Ajouter les jours du mois suivant pour compléter la grille
    const nextMonth = new Date(year, month + 1, 1);
    const remainingDays = 42 - this.monthCalendarDays.length; // 6 semaines * 7 jours
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(nextMonth.getFullYear(), nextMonth.getMonth(), i);
      this.monthCalendarDays.push({
        day: i,
        date,
        isCurrentMonth: false,
        courses: this.getCoursesForDay(date),
        hasEvents: false
      });
    }
  }

  /**
   * Obtenir les cours d'une date spécifique
   */
  getCoursesForDay(date: Date): CoursEDT[] {
    if (!this.emploiDuTemps || !this.emploiDuTemps.cours) {
      return [];
    }

    const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayName = dayNames[date.getDay()];
    
    return this.emploiDuTemps.cours.filter(cours => 
      cours.jourSemaine && cours.jourSemaine.toLowerCase() === dayName.toLowerCase()
    ) || [];
  }

  /**
   * Passer au mois suivant
   */
  getColorClassForCourse(cours: CoursEDT): string {
    const colors = ['#2563eb', '#e11d48', '#ea580c', '#7c3aed', '#06b6d4', '#059669'];
    const index = Math.abs(cours.idCours?.charCodeAt(0) || 0) % colors.length;
    return colors[index];
  }
}
