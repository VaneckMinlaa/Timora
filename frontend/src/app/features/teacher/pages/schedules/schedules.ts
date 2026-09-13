// schedule-management.component.ts
import { Component, OnInit, OnDestroy} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, firstValueFrom } from 'rxjs';
import { takeUntil, catchError } from 'rxjs/operators';
import {
  ScheduleService,
  ReservationService,
  AuthService,
  CourseService,
  RoomService
} from '../../../../core/services';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import {
  EmploiDuTempsWithCours,
  CoursEDT,
  DisponibiliteEDT,
  Disponibilite,
  CreateDisponibiliteRequest,
  AuthUser,
  Room,
  Course
} from '../../../../core/models';

interface CalendarEvent {
  id: string;
  type: 'cours' | 'disponibilite';
  title: string;
  teacher?: string;
  class?: string;
  subject?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  school?: string;
  color: string;
  isDisponibilite?: boolean; // Pour différencier les disponibilités
}

interface WeekDay {
  name: string;
  date: string;
  isToday: boolean;
}

@Component({
  selector: 'app-schedule-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './schedules.html',
  styleUrls: ['./schedules.scss']
})
export class ScheduleManagementComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User info
  currentUser: AuthUser | null = null;
  enseignantId: string = '';

  // Emploi du temps et disponibilités
  emploiDuTemps: EmploiDuTempsWithCours | null = null;
  disponibilites: (Disponibilite & { isSubmitted?: boolean })[] = [];
  // Disponibilités créées localement (non encore soumises au backend) — persistantes entre les changements de semaine
  localDisponibilites: (Disponibilite & { isSubmitted?: boolean })[] = [];
  reservations: any[] = []; // Liste des réservations de l'enseignant
  isLoading: boolean = false;
  errorMessage: string = '';

  // Calendar events (cours + disponibilités)
  calendarEvents: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];

  filterSchool: string = 'Tous';
  schools: string[] = [];

  // Modal state
  showDisponibiliteModal: boolean = false;
  isEditMode: boolean = false;
  selectedDisponibilite: Disponibilite | null = null;
  disponibiliteForm = {
    jour: '',
    heureDebut: '',
    heureFin: ''
  };

  // Navigation indépendante du modal de disponibilité
  modalDate: Date = new Date();
  modalWeekStart: string = '';
  modalWeekEnd: string = '';
  joursSemaine: string[] = [];

  // View management
  viewMode: 'week' | 'month' = 'week';
  currentDate: Date = new Date();
  currentWeekStart: string = '';
  currentWeekEnd: string = '';
  currentMonthStart: string = '';
  currentMonthEnd: string = '';
  currentPeriodLabel: string = '';
  weekDays: WeekDay[] = [];
  monthDays: WeekDay[] = [];

  // Drag and drop
  draggedEvent: CalendarEvent | null = null;
  dragStartY: number = 0;
  dragStartTop: number = 0;

  hours: string[] = [
    '07:00', '08:00', '09:00', '10:00', '11:00', '12:00',
    '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  // Time slots de 2 heures pour l'affichage (comme dans sync)
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

  rooms: Room[] = [];

  constructor(
    private scheduleService: ScheduleService,
    private reservationService: ReservationService,
    private courseService: CourseService,
    private roomService: RoomService,
    private authService: AuthService,
    private toastNotification: ToastNotificationService
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
          if (user?.id) {
            this.enseignantId = user.id;
            this.initializePeriod();
            this.loadEmploiDuTemps();
            this.loadDisponibilites();
            this.loadReservations();
          }
        });
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser la période courante (semaine ou mois)
   */
  initializePeriod(): void {
    if (this.viewMode === 'week') {
      this.initializeWeek();
    } else {
      this.initializeMonth();
    }
  }

  /**
   * Initialiser la semaine courante
   */
  initializeWeek(): void {
    const today = new Date(this.currentDate);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.setDate(diff));

    this.currentWeekStart = this.formatDate(monday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    this.currentWeekEnd = this.formatDate(sunday);
    this.currentPeriodLabel = `${this.currentWeekStart} - ${this.currentWeekEnd}`;

    this.updateWeekDays(monday);
  }

  /**
   * Initialiser le mois courant
   */
  initializeMonth(): void {
    const today = new Date(this.currentDate);
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);

    this.currentMonthStart = this.formatDate(firstDay);
    this.currentMonthEnd = this.formatDate(lastDay);

    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    this.currentPeriodLabel = `${monthNames[today.getMonth()]} ${today.getFullYear()}`;

    this.updateMonthDays(firstDay);
  }

  /**
   * Mettre à jour les jours du mois
   */
  updateMonthDays(monthStart: Date): void {
    const days: WeekDay[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Obtenir tous les jours du mois
    const year = monthStart.getFullYear();
    const month = monthStart.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month, day);
      const dayOfWeek = date.getDay();
      const dayName = dayNames[dayOfWeek === 0 ? 6 : dayOfWeek - 1]; // Ajuster pour lundi = 0
      const isToday = date.getTime() === today.getTime();

      days.push({
        name: dayName,
        date: day.toString(),
        isToday: isToday
      });
    }

    this.monthDays = days;
  }

  /**
   * Changer le mode d'affichage
   */
  setViewMode(mode: 'week' | 'month'): void {
    this.viewMode = mode;
    this.initializePeriod();
    this.loadEmploiDuTemps();
    this.loadDisponibilites();
    this.loadReservations();
  }

  updateWeekDays(weekStart: Date): void {
    const days = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    this.weekDays = days.map((dayName, index) => {
      const date = new Date(weekStart);
      date.setDate(weekStart.getDate() + index);
      const isToday = date.getTime() === today.getTime();

      return {
        name: dayName,
        date: date.getDate().toString(),
        isToday
      };
    });
  }

  formatDate(date: Date): string {
    const months = ['Jan.', 'Fév.', 'Mar.', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];
    return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
  }

  /**
   * Charger l'emploi du temps de l'enseignant (tous ses cours)
   * Méthode selon UML : Enseignant.consulterEDT()
   */
  loadEmploiDuTemps(): void {
    if (!this.enseignantId) return;

    this.isLoading = true;
    this.courseService.getCoursesByTeacher(this.enseignantId)
      .pipe(
        catchError(error => {
          console.error('Erreur lors du chargement des cours:', error);
          this.toastNotification.error('Erreur', 'Impossible de charger vos cours programmé.');
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (courses: Course[]) => {
          if (!courses) courses = [];
          // Convert Course objects to CoursEDT structure that processEmploiDuTemps understands
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
              enseignantId: c.enseignantId
            } as CoursEDT));

          this.emploiDuTemps = {
            id: 'real-edt',
            semaine: 1,
            dateDebut: this.currentWeekStart,
            dateFin: this.currentWeekEnd,
            statut: 'VALIDE',
            enseignantId: this.enseignantId,
            cours: coursList
          };

          this.processEmploiDuTemps();
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger les disponibilités de l'enseignant pour la semaine courante
   * Selon UML : Utilisateur 1 -- +ensdispense -- 1..* Disponibilite
   */
  loadDisponibilites(): void {
    if (!this.enseignantId) return;

    // Calculer les dates de début et fin de la semaine courante
    const currentWeekDays = this.viewMode === 'week' ? this.weekDays : this.monthDays;
    if (currentWeekDays.length === 0) return;

    // Obtenir la date réelle du premier et dernier jour
    const today = new Date(this.currentDate);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Formater les dates au format YYYY-MM-DD
    const startDate = this.formatDateForApi(monday);
    const endDate = this.formatDateForApi(sunday);

    this.reservationService.getDisponibilitesByDateRange(this.enseignantId, startDate, endDate)
      .pipe(
        catchError((error) => {
          if (error.status === 404) {
            return this.reservationService.getUserDisponibilites(this.enseignantId).pipe(
              catchError(() => of([]))
            );
          }
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (dispos: Disponibilite[]) => {
          // Marquer les disponibilités reçues du backend comme déjà soumises
          dispos.forEach(d => (d as any).isSubmitted = true);

          // Filtrer les disponibilités si elles chevauchent une réservation CONFIRMEE
          const filteredDispos = dispos.filter(dispo => {
            if (!dispo.jour || !dispo.heureDebut || !dispo.heureFin) return true;
            
            // Vérifier s'il y a une réservation confirmée qui chevauche
            const hasConflict = this.reservations.some(res => {
              const resStatus = res.status || res.statut;
              if (resStatus !== 'CONFIRME') return false;
              
              const resDate = res.date || (res.startDateTime ? res.startDateTime.split('T')[0] : null);
              if (resDate !== dispo.jour) return false;
              
              const resStart = res.heureDebut || (res.startDateTime ? res.startDateTime.split('T')[1].substring(0, 5) : null);
              const resEnd = res.heureFin || (res.endDateTime ? res.endDateTime.split('T')[1].substring(0, 5) : null);
              
              if (!resStart || !resEnd) return false;
              
              // Vérification de chevauchement d'intervalles
              return (dispo.heureDebut < resEnd && dispo.heureFin > resStart);
            });
            
            return !hasConflict;
          });

          // Fusionner les dispos backend + les dispos locales non encore soumises
          const remoteIds = new Set(filteredDispos.map(d => String(d.idDisponibilite)));
          const pendingLocal = this.localDisponibilites.filter(d => !remoteIds.has(String(d.idDisponibilite)));
          
          this.disponibilites = [...filteredDispos, ...pendingLocal];
          this.processDisponibilites();
          this.updateFilteredEvents();
        }
      });
  }

  /**
   * Charger les réservations de l'enseignant
   */
  loadReservations(): void {
    if (!this.enseignantId) return;

    const today = new Date(this.currentDate);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    const startDate = this.formatDateForApi(monday);
    const endDate = this.formatDateForApi(sunday);

    this.reservationService.getReservationsByDateRange(startDate, endDate)
      .pipe(
        catchError(() => of([])),
        takeUntil(this.destroy$)
      )
      .subscribe(reservations => {
        // Filtrer pour l'enseignant actuel
        this.reservations = reservations.filter(r => (r.utilisateurId === this.enseignantId || r.userId === this.enseignantId));
        this.processReservations();
        
        // Re-charger les disponibilités après avoir chargé les réservations pour filtrer les chevauchements
        this.loadDisponibilites();
      });
  }

  /**
   * Traiter les réservations pour créer les événements calendrier
   */
  processReservations(): void {
    if (!this.reservations) return;

    const reservationEvents: CalendarEvent[] = this.reservations.map(res => {
      const status = res.status || res.statut || 'EN_ATTENTE';
      const isConfirmed = status === 'CONFIRME';
      
      return {
        id: res.id || res.idDemandeReservation,
        type: 'cours', // On les affiche comme des cours mais avec un style différent
        title: res.purpose || (isConfirmed ? 'Réservation Confirmée' : 'Réservation en Attente'),
        subject: isConfirmed ? 'CONFIRMÉ' : 'EN ATTENTE',
        dayOfWeek: this.mapDayToFrench(this.getDayNameFromDate(res.date || res.startDateTime)),
        startTime: res.heureDebut || (res.startDateTime ? res.startDateTime.split('T')[1].substring(0, 5) : '08:00'),
        endTime: res.heureFin || (res.endDateTime ? res.endDateTime.split('T')[1].substring(0, 5) : '10:00'),
        room: res.salleNom || 'Salle réservée',
        color: isConfirmed ? '#2563eb' : '#f59e0b' // Bleu pour confirmé, Orange pour attente
      };
    });

    // Fusionner avec les autres événements
    // On garde les cours et on ajoute les réservations
    const otherEvents = this.calendarEvents.filter(e => e.type !== 'cours' || !this.isReservationEvent(e));
    // Note: this.isReservationEvent is a helper we need to define
    
    // Pour l'instant, on va juste concaténer et on verra
    this.calendarEvents = [...this.calendarEvents.filter(e => e.type === 'disponibilite'), ...this.calendarEvents.filter(e => e.type === 'cours' && !this.isReservationEvent(e)), ...reservationEvents];
    this.updateFilteredEvents();
  }

  public isReservationEvent(event: CalendarEvent): boolean {
    return this.reservations.some(r => (r.id === event.id || r.idDemandeReservation === event.id));
  }

  private getDayNameFromDate(dateStr: string): string {
    if (!dateStr) return 'Lundi';
    const date = new Date(dateStr);
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[date.getDay()];
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
   * Traiter l'emploi du temps pour créer les événements calendrier
   */
  processEmploiDuTemps(): void {
    if (!this.emploiDuTemps?.cours) return;

    const coursEvents: CalendarEvent[] = this.emploiDuTemps.cours.map(cours => ({
      id: cours.idCours,
      type: 'cours',
      title: cours.nom || `Cours ${cours.type}`,
      subject: cours.type,
      dayOfWeek: this.mapDayToFrench(cours.jourSemaine),
      startTime: cours.heureDebut,
      endTime: cours.heureFin,
      room: this.resolveRoomName(cours.salleId),
      color: this.getColorForType(cours.type),
      isDisponibilite: false
    }));

    this.calendarEvents = [...this.calendarEvents.filter(e => e.type === 'disponibilite'), ...coursEvents];
    this.updateFilteredEvents();
  }

  resolveRoomName(roomId?: string): string {
    if (!roomId) return 'NS'; // Non spécifié
    const room = this.rooms.find(r => r.idSalle === roomId);
    return (room && room.nomsalle) ? room.nomsalle : roomId;
  }

  /**
   * Traiter les disponibilités pour créer les événements calendrier
   * Filtrer par date précise de la semaine courante
   */
  processDisponibilites(): void {
    // Récupérer les jours de la semaine courante avec leurs dates réelles
    const currentWeekDays = this.viewMode === 'week' ? this.weekDays : this.monthDays;

    // Créer un map des dates réelles pour chaque jour
    const today = new Date(this.currentDate);
    const dayOfWeek = today.getDay();
    const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(today.setDate(diff));

    const weekDates = currentWeekDays.map((day, index) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + index);
      return this.formatDateForApi(date);
    });

    // Filtrer les disponibilités pour la semaine courante par date précise
    const disponibilitesForWeek = this.disponibilites.filter(dispo =>
      dispo.date && weekDates.includes(dispo.date)
    );

    const disponibiliteEvents: CalendarEvent[] = disponibilitesForWeek.map(dispo => ({
      id: dispo.idDisponibilite,
      type: 'disponibilite',
      title: 'Disponible',
      dayOfWeek: dispo.jour,
      startTime: dispo.heureDebut,
      endTime: dispo.heureFin,
      color: '#10b981',
      isDisponibilite: true
    }));

    this.calendarEvents = [...this.calendarEvents.filter(e => e.type === 'cours'), ...disponibiliteEvents];
    this.updateFilteredEvents();
  }

  mapDayToFrench(day: string): string {
    const mapping: { [key: string]: string } = {
      'MONDAY': 'Lundi',
      'TUESDAY': 'Mardi',
      'WEDNESDAY': 'Mercredi',
      'THURSDAY': 'Jeudi',
      'FRIDAY': 'Vendredi',
      'SATURDAY': 'Samedi',
      'SUNDAY': 'Dimanche'
    };
    return mapping[day.toUpperCase()] || day;
  }

  getColorForType(type: string): string {
    const colors: { [key: string]: string } = {
      'COURS_MAGISTRAL': '#3b82f6',
      'TD': '#22c55e',
      'TP': '#f97316',
      'EXAMEN': '#ef4444'
    };
    return colors[type] || '#6b7280';
  }

  updateFilteredEvents(): void {
    this.filteredEvents = [...this.calendarEvents];
  }

  onFilterChange(): void {
    this.updateFilteredEvents();
  }

  /**
   * Récupérer tous les événements d'un jour
   */
  getAllEventsForDay(day: string): CalendarEvent[] {
    return this.filteredEvents.filter(event => event.dayOfWeek === day);
  }

  /**
   * Calculer la position absolue en pixels depuis le haut du conteneur day-slots
   * Chaque créneau horaire = 80px, on calcule en fonction de l'heure de début
   */
  getEventAbsoluteTop(event: CalendarEvent): number {
    const eventStartHour = parseInt(event.startTime.split(':')[0]);
    const eventStartMin = parseInt(event.startTime.split(':')[1] || '0');

    // Trouver l'heure de début la plus proche dans le tableau hours
    // Si l'heure n'est pas exactement dans le tableau, on calcule par rapport à la première heure
    const firstHour = parseInt(this.hours[0]?.split(':')[0] || '7');
    const hourDiff = eventStartHour - firstHour;

    // Position de base = différence d'heures * 80px (hauteur d'un créneau)
    const baseTop = hourDiff * 80;

    // Ajouter les minutes dans le créneau (proportionnellement)
    const minutesOffset = (eventStartMin / 60) * 80;

    return Math.max(0, baseTop + minutesOffset);
  }

  /**
   * Calculer la hauteur absolue en pixels d'un événement
   */
  getEventAbsoluteHeight(event: CalendarEvent): number {
    const eventStartHour = parseInt(event.startTime.split(':')[0]);
    const eventStartMin = parseInt(event.startTime.split(':')[1] || '0');
    const eventEndHour = parseInt(event.endTime.split(':')[0]);
    const eventEndMin = parseInt(event.endTime.split(':')[1] || '0');

    // Calculer la position de fin absolue
    const firstHour = parseInt(this.hours[0]?.split(':')[0] || '7');
    const endHourDiff = eventEndHour - firstHour;
    const endBaseTop = endHourDiff * 80;
    const endMinutesOffset = (eventEndMin / 60) * 80;
    const endAbsoluteTop = endBaseTop + endMinutesOffset;

    // Si l'événement se termine exactement à l'heure (minutes = 0), il doit aller jusqu'au bas du créneau
    // Donc ajouter 80px pour aller jusqu'au bas du créneau
    const endPosition = eventEndMin === 0 ? endAbsoluteTop + 80 : endAbsoluteTop;

    // Calculer la position de début absolue
    const startHourDiff = eventStartHour - firstHour;
    const startBaseTop = startHourDiff * 80;
    const startMinutesOffset = (eventStartMin / 60) * 80;
    const startAbsoluteTop = startBaseTop + startMinutesOffset;

    // La hauteur est la différence entre la position de fin et la position de début
    const height = endPosition - startAbsoluteTop;

    // S'assurer que la hauteur minimale est de 40px pour la lisibilité
    return Math.max(40, height);
  }

  /**
   * Ancienne méthode conservée pour compatibilité (non utilisée maintenant)
   */
  getEventsForDayAndHour(day: string, hour: string): CalendarEvent[] {
    return this.filteredEvents.filter(event => {
      if (event.dayOfWeek !== day) return false;

      const eventHour = parseInt(event.startTime.split(':')[0]);
      const slotHour = parseInt(hour.split(':')[0]);

      return eventHour === slotHour;
    });
  }

  previousPeriod(): void {
    if (this.viewMode === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() - 7);
    } else {
      this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    }
    this.initializePeriod();
    this.loadEmploiDuTemps();
    this.loadDisponibilites();
    this.loadReservations();
  }

  nextPeriod(): void {
    if (this.viewMode === 'week') {
      this.currentDate.setDate(this.currentDate.getDate() + 7);
    } else {
      this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    }
    this.initializePeriod();
    this.loadEmploiDuTemps();
    this.loadDisponibilites();
    this.loadReservations();
  }

  goToToday(): void {
    this.currentDate = new Date();
    this.initializePeriod();
    this.loadEmploiDuTemps();
    this.loadDisponibilites();
    this.loadReservations();
  }

  /**
   * Créer une disponibilité
   * Méthode selon UML : Disponibilite.creerDispo()
   */
  createDisponibilite(): void {
    if (!this.enseignantId) return;

    if (!this.disponibiliteForm.jour || !this.disponibiliteForm.heureDebut || !this.disponibiliteForm.heureFin) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    // Valider les heures
    if (this.disponibiliteForm.heureDebut >= this.disponibiliteForm.heureFin) {
      this.errorMessage = '⚠️ Erreur de validation :\n\nL\'heure de fin doit être supérieure à l\'heure de début.\n\nVeuillez corriger les heures.';
      return;
    }

    // Valider les restrictions horaires
    const heureDebut = this.disponibiliteForm.heureDebut;
    const heureFin = this.disponibiliteForm.heureFin;
    const heureMin = '08:00';
    const heureMax = '17:00';
    const pauseDebut = '12:00';
    const pauseFin = '13:00';

    // Vérifier que les heures sont dans la plage autorisée (8h-17h)
    if (heureDebut < heureMin || heureFin > heureMax) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nLes disponibilités doivent être comprises entre 8h et 17h.\n\nVeuillez choisir un créneau horaire valide.';
      return;
    }

    // Vérifier que l'heure de début n'est pas avant 8h
    if (heureDebut < heureMin) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nL\'heure de début doit être au minimum 8h.\n\nVeuillez corriger l\'heure de début.';
      return;
    }

    // Vérifier que l'heure de fin n'est pas après 17h
    if (heureFin > heureMax) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nL\'heure de fin doit être au maximum 17h.\n\nVeuillez corriger l\'heure de fin.';
      return;
    }

    // Vérifier si le créneau chevauche la pause de midi (12h-13h)
    if ((heureDebut < pauseFin && heureFin > pauseDebut)) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nLes disponibilités ne peuvent pas être créées pendant la pause de midi (12h-13h).\n\nVeuillez choisir un autre créneau horaire.';
      return;
    }

    // Calculer la date réelle basée sur le jour sélectionné et la semaine du MODAL
    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const dayIndex = dayNames.indexOf(this.disponibiliteForm.jour);
    if (dayIndex === -1) {
      this.errorMessage = 'Jour invalide sélectionné';
      return;
    }

    // Calculer la date réelle à partir de la semaine du modal
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const baseDate = new Date(this.modalDate);
    const dayOfWeek = baseDate.getDay();
    const diff = baseDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1); // Lundi
    const monday = new Date(baseDate);
    monday.setDate(diff);
    const actualDate = new Date(monday);
    actualDate.setDate(monday.getDate() + dayIndex);

    // Empêcher la création de disponibilités dans le passé
    const selectedDate = new Date(actualDate);
    selectedDate.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      this.errorMessage = '⚠️ Vous ne pouvez pas créer une disponibilité à une date déjà passée.';
      return;
    }

    const dateStr = this.formatDateForApi(actualDate);

    const request: CreateDisponibiliteRequest = {
      jour: this.disponibiliteForm.jour,
      date: dateStr,
      heureDebut: this.disponibiliteForm.heureDebut,
      heureFin: this.disponibiliteForm.heureFin,
      utilisateurId: this.enseignantId,
      emploiDuTempsId: this.emploiDuTemps?.id
    };

    // Créer la disponibilité localement sans l'envoyer au backend
    // Elle sera envoyée uniquement lors de la soumission
    this.createMockDisponibilite(request);
    this.closeDisponibiliteModal();

    this.toastNotification.createNotification(
      'success',
      'Disponibilité ajoutée',
      'La disponibilité a été ajoutée localement. N\'oubliez pas de la soumettre pour qu\'elle soit visible par l\'administration.'
    );

    return;

    /* Ancien code - envoi immédiat au backend (désactivé)
    this.isLoading = true;
    this.errorMessage = ''; // Réinitialiser le message d'erreur

    this.reservationService.createDisponibilite(request)
      .pipe(
        catchError((error) => {
          // Gérer les erreurs avec des messages clairs
          if (error.status === 404) {
            // Endpoint non disponible - créer localement pour l'UI
            this.createMockDisponibilite(request);
            this.closeDisponibiliteModal();
            return of(null);
          } else if (error.status === 400 || error.status === 409) {
            // Erreur de validation ou conflit
            const errorMsg = error.error?.message || error.message || 'Erreur lors de la création';
            if (errorMsg.includes('chevauche') || errorMsg.includes('conflit') || errorMsg.includes('existe déjà') || errorMsg.includes('créneau horaire')) {
              this.errorMessage = `⚠️ Conflit de disponibilité détecté !\n\nUne disponibilité existe déjà pour le ${request.jour} entre ${request.heureDebut} et ${request.heureFin}.\n\nVeuillez choisir un autre créneau horaire ou modifier la disponibilité existante.`;
              this.toastNotification.warning(
                'Conflit de disponibilité',
                `Une disponibilité existe déjà pour le ${request.jour} entre ${request.heureDebut} et ${request.heureFin}.`
              );
            } else if (errorMsg.includes('heure de fin') || errorMsg.includes('supérieure')) {
              this.errorMessage = `⚠️ Erreur de validation :\n\nL'heure de fin (${request.heureFin}) doit être supérieure à l'heure de début (${request.heureDebut}).\n\nVeuillez corriger les heures.`;
              this.toastNotification.warning(
                'Erreur de validation',
                `L'heure de fin (${request.heureFin}) doit être supérieure à l'heure de début (${request.heureDebut}).`
              );
            } else {
              this.errorMessage = `⚠️ Erreur : ${errorMsg}`;
              this.toastNotification.error('Erreur', errorMsg);
            }
            this.isLoading = false;
            return of(null);
          } else {
            this.errorMessage = '❌ Erreur : Impossible de créer la disponibilité.\n\nVeuillez vérifier votre connexion et réessayer.';
            this.toastNotification.error(
              'Erreur de connexion',
              'Impossible de créer la disponibilité. Veuillez vérifier votre connexion et réessayer.'
            );
            this.isLoading = false;
            return of(null);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (result) {
            // Si la création a réussi côté backend
            this.loadDisponibilites();
            this.closeDisponibiliteModal();
            this.errorMessage = '';
          }
          this.isLoading = false;
        }
      });
    */
  }

  /**
   * Créer une disponibilité mockée (pour l'UI en attendant le backend)
   */
  createMockDisponibilite(request: CreateDisponibiliteRequest): void {
    // S'assurer que la date est au format YYYY-MM-DD
    let dateStr = request.date;
    if (!dateStr) {
      dateStr = new Date().toISOString().split('T')[0];
    } else if (dateStr.includes('T')) {
      // Si c'est une date ISO, extraire seulement la partie date
      dateStr = dateStr.split('T')[0];
    }

    const mockDispo: Disponibilite & { isSubmitted?: boolean } = {
      idDisponibilite: `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      jour: request.jour,
      date: dateStr,
      heureDebut: request.heureDebut,
      heureFin: request.heureFin,
      utilisateurId: request.utilisateurId,
      emploiDuTempsId: request.emploiDuTempsId,
      isSubmitted: false // Marquer comme non soumise
    };

    // Ajouter dans le store persistant ET dans le tableau courant
    this.localDisponibilites.push(mockDispo);
    this.disponibilites = [...this.disponibilites.filter(d => d.idDisponibilite !== mockDispo.idDisponibilite), mockDispo];
    this.processDisponibilites();
    this.updateFilteredEvents();
  }

  /**
   * Modifier une disponibilité
   * Méthode selon UML : Disponibilite.modifierDispo()
   */
  updateDisponibilite(): void {
    if (!this.selectedDisponibilite) return;

    if (!this.disponibiliteForm.jour || !this.disponibiliteForm.heureDebut || !this.disponibiliteForm.heureFin) {
      this.errorMessage = 'Veuillez remplir tous les champs';
      return;
    }

    // Valider les heures
    if (this.disponibiliteForm.heureDebut >= this.disponibiliteForm.heureFin) {
      this.errorMessage = '⚠️ Erreur de validation :\n\nL\'heure de fin doit être supérieure à l\'heure de début.\n\nVeuillez corriger les heures.';
      return;
    }

    // Valider les restrictions horaires
    const heureDebut = this.disponibiliteForm.heureDebut;
    const heureFin = this.disponibiliteForm.heureFin;
    const heureMin = '08:00';
    const heureMax = '17:00';
    const pauseDebut = '12:00';
    const pauseFin = '13:00';

    // Vérifier que les heures sont dans la plage autorisée (8h-17h)
    if (heureDebut < heureMin || heureFin > heureMax) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nLes disponibilités doivent être comprises entre 8h et 17h.\n\nVeuillez choisir un créneau horaire valide.';
      return;
    }

    // Vérifier que l'heure de début n'est pas avant 8h
    if (heureDebut < heureMin) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nL\'heure de début doit être au minimum 8h.\n\nVeuillez corriger l\'heure de début.';
      return;
    }

    // Vérifier que l'heure de fin n'est pas après 17h
    if (heureFin > heureMax) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nL\'heure de fin doit être au maximum 17h.\n\nVeuillez corriger l\'heure de fin.';
      return;
    }

    // Vérifier si le créneau chevauche la pause de midi (12h-13h)
    if ((heureDebut < pauseFin && heureFin > pauseDebut)) {
      this.errorMessage = '⚠️ Créneau non autorisé :\n\nLes disponibilités ne peuvent pas être créées pendant la pause de midi (12h-13h).\n\nVeuillez choisir un autre créneau horaire.';
      return;
    }

    // Vérifier si c'est une disponibilité mockée (non sauvegardée)
    const isMockDisponibilite = this.selectedDisponibilite.idDisponibilite.startsWith('mock-');
    
    if (isMockDisponibilite) {
      // Mettre à jour localement sans appeler le backend
      this.updateMockDisponibilite();
      this.closeDisponibiliteModal();
      this.toastNotification.createNotification(
        'success',
        'Disponibilité modifiée',
        'La disponibilité a été modifiée localement. N\'oubliez pas de la soumettre pour qu\'elle soit sauvegardée.'
      );
      return;
    }

    this.isLoading = true;
    this.errorMessage = ''; // Réinitialiser le message d'erreur

    this.reservationService.updateDisponibilite(
      this.selectedDisponibilite.idDisponibilite,
      {
        jour: this.disponibiliteForm.jour,
        heureDebut: this.disponibiliteForm.heureDebut,
        heureFin: this.disponibiliteForm.heureFin
      }
    )
      .pipe(
        catchError((error) => {
          // Gérer les erreurs avec des messages clairs
          if (error.status === 404) {
            // Endpoint non disponible - modifier localement
            this.updateMockDisponibilite();
            this.closeDisponibiliteModal();
            return of(null);
          } else if (error.status === 400 || error.status === 409) {
            // Erreur de validation ou conflit
            const errorMsg = error.error?.message || error.message || 'Erreur lors de la modification';
            if (errorMsg.includes('chevauche') || errorMsg.includes('conflit') || errorMsg.includes('existe déjà') || errorMsg.includes('créneau horaire')) {
              this.errorMessage = `⚠️ Conflit de disponibilité détecté !\n\nUne disponibilité existe déjà pour le ${this.disponibiliteForm.jour} entre ${this.disponibiliteForm.heureDebut} et ${this.disponibiliteForm.heureFin}.\n\nVeuillez choisir un autre créneau horaire.`;
              this.toastNotification.warning(
                'Conflit de disponibilité',
                `Une disponibilité existe déjà pour le ${this.disponibiliteForm.jour} entre ${this.disponibiliteForm.heureDebut} et ${this.disponibiliteForm.heureFin}.`
              );
            } else if (errorMsg.includes('heure de fin') || errorMsg.includes('supérieure')) {
              this.errorMessage = `⚠️ Erreur de validation :\n\nL'heure de fin (${this.disponibiliteForm.heureFin}) doit être supérieure à l'heure de début (${this.disponibiliteForm.heureDebut}).\n\nVeuillez corriger les heures.`;
              this.toastNotification.warning(
                'Erreur de validation',
                `L'heure de fin (${this.disponibiliteForm.heureFin}) doit être supérieure à l'heure de début (${this.disponibiliteForm.heureDebut}).`
              );
            } else {
              this.errorMessage = `⚠️ Erreur : ${errorMsg}`;
              this.toastNotification.error('Erreur', errorMsg);
            }
            this.isLoading = false;
            return of(null);
          } else {
            this.errorMessage = '❌ Erreur : Impossible de modifier la disponibilité.\n\nVeuillez vérifier votre connexion et réessayer.';
            this.toastNotification.error(
              'Erreur de connexion',
              'Impossible de modifier la disponibilité. Veuillez vérifier votre connexion et réessayer.'
            );
            this.isLoading = false;
            return of(null);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          if (result) {
            // Si la modification a réussi côté backend
            this.loadDisponibilites();
            this.closeDisponibiliteModal();
            this.errorMessage = '';
          }
          this.isLoading = false;
        }
      });
  }

  /**
   * Modifier une disponibilité mockée
   */
  updateMockDisponibilite(): void {
    if (!this.selectedDisponibilite) return;

    const index = this.disponibilites.findIndex(d => d.idDisponibilite === this.selectedDisponibilite!.idDisponibilite);
    if (index !== -1) {
      this.disponibilites[index] = {
        ...this.disponibilites[index],
        jour: this.disponibiliteForm.jour,
        heureDebut: this.disponibiliteForm.heureDebut,
        heureFin: this.disponibiliteForm.heureFin
      };
      this.processDisponibilites();
      this.updateFilteredEvents();
    }
  }

  /**
   * Supprimer une disponibilité
   */
  deleteDisponibilite(id: string): void {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cette disponibilité ?')) return;

    // Vérifier si c'est une disponibilité mockée (non sauvegardée)
    const isMockDisponibilite = id.startsWith('mock-');
    
    if (isMockDisponibilite) {
      // Supprimer du store persistant ET du tableau courant
      this.localDisponibilites = this.localDisponibilites.filter(d => d.idDisponibilite !== id);
      this.disponibilites = this.disponibilites.filter(d => d.idDisponibilite !== id);
      this.processDisponibilites();
      this.updateFilteredEvents();
      this.toastNotification.createNotification(
        'success',
        'Disponibilité supprimée',
        'La disponibilité temporaire a été supprimée.'
      );
      return;
    }

    this.isLoading = true;
    this.reservationService.deleteDisponibilite(id)
      .pipe(
        catchError((error) => {
          // Gérer silencieusement les erreurs 404 (endpoint non disponible)
          if (error.status === 404) {
            // Endpoint non disponible - supprimer localement
            const index = this.disponibilites.findIndex(d => d.idDisponibilite === id);
            if (index !== -1) {
              this.disponibilites.splice(index, 1);
              this.processDisponibilites();
              this.updateFilteredEvents();
              this.toastNotification.success(
                'Disponibilité supprimée',
                'La disponibilité a été supprimée avec succès.'
              );
            }
            this.isLoading = false;
            return of(null);
          } else {
            this.toastNotification.error(
              'Erreur',
              'Impossible de supprimer la disponibilité. Veuillez réessayer.'
            );
            this.isLoading = false;
            return of(null);
          }
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (result) => {
          this.isLoading = false;
          if (result !== null) {
            // Si la suppression a réussi côté backend
            this.loadDisponibilites();
            this.toastNotification.success(
              'Disponibilité supprimée',
              'La disponibilité a été supprimée avec succès.'
            );
          }
        }
      });
  }

  editSchedule(event: CalendarEvent): void {
    if (event.type === 'disponibilite') {
      // Trouver la disponibilité correspondante
      const disponibilite = this.disponibilites.find(d => d.idDisponibilite === event.id);
      if (disponibilite) {
        this.openEditDisponibiliteModal(disponibilite);
      }
    } else {
      // Les cours ne peuvent pas être modifiés par l'enseignant directement
      console.log('Cours:', event);
    }
  }

  /**
   * Ouvrir le modal pour ajouter une disponibilité
   */
  openAddDisponibiliteModal(): void {
    this.isEditMode = false;
    this.selectedDisponibilite = null;
    this.disponibiliteForm = {
      jour: '',
      heureDebut: '',
      heureFin: ''
    };
    this.updateModalWeekInfo();
    this.showDisponibiliteModal = true;
    this.errorMessage = '';
  }

  updateModalWeekInfo(): void {
    const d = new Date(this.modalDate);
    const day = d.getDay();
    const monday = new Date(d);
    monday.setDate(d.getDate() - day + (day === 0 ? -6 : 1));
    const saturday = new Date(monday);
    saturday.setDate(monday.getDate() + 5);

    this.modalWeekStart = this.formatDate(monday);
    this.modalWeekEnd = this.formatDate(saturday);

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    this.joursSemaine = dayNames.map((name, i) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      return name;
    });
  }

  previousModalWeek(): void {
    const d = new Date(this.modalDate);
    d.setDate(d.getDate() - 7);
    this.modalDate = d;
    this.updateModalWeekInfo();
    this.disponibiliteForm.jour = '';
  }

  nextModalWeek(): void {
    const d = new Date(this.modalDate);
    d.setDate(d.getDate() + 7);
    this.modalDate = d;
    this.updateModalWeekInfo();
    this.disponibiliteForm.jour = '';
  }

  goToModalToday(): void {
    this.modalDate = new Date();
    this.updateModalWeekInfo();
    this.disponibiliteForm.jour = '';
  }

  /**
ne disponibilité
   */
  openEditDisponibiliteModal(disponibilite: Disponibilite): void {
    this.isEditMode = true;
    this.selectedDisponibilite = disponibilite;
    this.disponibiliteForm = {
      jour: disponibilite.jour,
      heureDebut: disponibilite.heureDebut,
      heureFin: disponibilite.heureFin
    };
    this.showDisponibiliteModal = true;
    this.errorMessage = '';
  }

  /**
   * Valider et ajuster intelligemment l'heure de début
   */
  validateAndAdjustHeureDebut(): void {
    if (!this.disponibiliteForm.heureDebut) return;

    const heure = this.disponibiliteForm.heureDebut;
    const heureMin = '08:00';
    const heureMax = '17:00';
    const pauseDebut = '12:00';
    const pauseFin = '13:00';

    // Si l'heure est avant 8h, ajuster à 8h
    if (heure < heureMin) {
      this.disponibiliteForm.heureDebut = heureMin;
      this.checkAndAdjustPauseOverlap();
      return;
    }

    // Si l'heure est après 17h, ajuster à 17h
    if (heure > heureMax) {
      this.disponibiliteForm.heureDebut = heureMax;
      this.checkAndAdjustPauseOverlap();
      return;
    }

    // Si l'heure est dans la plage interdite 12h-13h, ajuster à 11:00
    if (heure >= pauseDebut && heure < pauseFin) {
      this.disponibiliteForm.heureDebut = '11:00';
      this.checkAndAdjustPauseOverlap();
      return;
    }

    // Si l'heure de fin existe et est inférieure ou égale à l'heure de début, ajuster l'heure de fin
    if (this.disponibiliteForm.heureFin && this.disponibiliteForm.heureDebut >= this.disponibiliteForm.heureFin) {
      const [hours, minutes] = this.disponibiliteForm.heureDebut.split(':').map(Number);
      let newHour = hours;
      let newMinute = minutes + 1;

      if (newMinute >= 60) {
        newMinute = 0;
        newHour += 1;
      }

      // Si la nouvelle heure de fin tombe dans la pause, passer à 13h
      const newHeureFin = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
      if (newHeureFin >= pauseDebut && newHeureFin < pauseFin) {
        this.disponibiliteForm.heureFin = pauseFin;
      } else if (newHour > 17 || (newHour === 17 && newMinute > 0)) {
        // Si on dépasse 17h, ajuster à 17h
        this.disponibiliteForm.heureFin = heureMax;
      } else {
        this.disponibiliteForm.heureFin = newHeureFin;
      }
    }

    // Vérifier si le créneau chevauche la pause de midi
    this.checkAndAdjustPauseOverlap();
  }

  /**
   * Valider et ajuster intelligemment l'heure de fin
   */
  validateAndAdjustHeureFin(): void {
    if (!this.disponibiliteForm.heureFin) return;

    const heure = this.disponibiliteForm.heureFin;
    const heureMin = '08:00';
    const heureMax = '17:00';
    const pauseDebut = '12:00';
    const pauseFin = '13:00';

    // Si l'heure est avant 8h, ajuster à 8h
    if (heure < heureMin) {
      this.disponibiliteForm.heureFin = heureMin;
      this.checkAndAdjustPauseOverlap();
      return;
    }

    // Si l'heure est après 17h, ajuster à 17h
    if (heure > heureMax) {
      this.disponibiliteForm.heureFin = heureMax;
      this.checkAndAdjustPauseOverlap();
      return;
    }

    // Si l'heure est dans la plage interdite 12h-13h, ajuster à 13:00
    if (heure > pauseDebut && heure <= pauseFin) {
      this.disponibiliteForm.heureFin = pauseFin;
      this.checkAndAdjustPauseOverlap();
      return;
    }

    // Si l'heure de début existe et est supérieure ou égale à l'heure de fin, ajuster l'heure de début
    if (this.disponibiliteForm.heureDebut && this.disponibiliteForm.heureFin <= this.disponibiliteForm.heureDebut) {
      const [hours, minutes] = this.disponibiliteForm.heureFin.split(':').map(Number);
      let newHour = hours;
      let newMinute = minutes - 1;

      if (newMinute < 0) {
        newMinute = 59;
        newHour -= 1;
      }

      // Si la nouvelle heure de début tombe dans la pause, passer à 11h
      const newHeureDebut = `${String(newHour).padStart(2, '0')}:${String(newMinute).padStart(2, '0')}`;
      if (newHeureDebut >= pauseDebut && newHeureDebut < pauseFin) {
        this.disponibiliteForm.heureDebut = '11:00';
      } else if (newHour < 8 || (newHour === 8 && newMinute < 0)) {
        // Si on est avant 8h, ajuster à 8h
        this.disponibiliteForm.heureDebut = heureMin;
      } else {
        this.disponibiliteForm.heureDebut = newHeureDebut;
      }
    }

    // Vérifier si le créneau chevauche la pause de midi
    this.checkAndAdjustPauseOverlap();
  }

  /**
   * Vérifier et ajuster automatiquement si le créneau chevauche la pause de midi (12h-13h)
   */
  checkAndAdjustPauseOverlap(): void {
    if (!this.disponibiliteForm.heureDebut || !this.disponibiliteForm.heureFin) return;

    const heureDebut = this.disponibiliteForm.heureDebut;
    const heureFin = this.disponibiliteForm.heureFin;
    const pauseDebut = '12:00';
    const pauseFin = '13:00';

    // Vérifier si le créneau chevauche la pause de midi
    if (heureDebut < pauseFin && heureFin > pauseDebut) {
      // Si le créneau commence avant 12h et se termine après 13h, diviser en deux créneaux
      // Pour simplifier, on ajuste l'heure de fin à 12h si elle dépasse 12h
      if (heureDebut < pauseDebut && heureFin > pauseFin) {
        // Le créneau chevauche complètement la pause, on le limite à 12h
        this.disponibiliteForm.heureFin = pauseDebut;
      } else if (heureDebut >= pauseDebut && heureDebut < pauseFin) {
        // L'heure de début est dans la pause, ajuster à 11h
        this.disponibiliteForm.heureDebut = '11:00';
        // Si l'heure de fin est aussi dans la pause, ajuster à 13h
        if (heureFin <= pauseFin) {
          this.disponibiliteForm.heureFin = pauseFin;
        }
      } else if (heureFin > pauseDebut && heureFin <= pauseFin) {
        // L'heure de fin est dans la pause, ajuster à 12h
        this.disponibiliteForm.heureFin = pauseDebut;
      }
    }
  }

  /**
   * Fermer le modal
   */
  closeDisponibiliteModal(): void {
    this.showDisponibiliteModal = false;
    this.isEditMode = false;
    this.selectedDisponibilite = null;
    this.disponibiliteForm = {
      jour: '',
      heureDebut: '',
      heureFin: ''
    };
    this.errorMessage = '';
  }

  /**
   * Soumettre le formulaire de disponibilité
   */
  submitDisponibiliteForm(): void {
    if (this.isEditMode) {
      this.updateDisponibilite();
    } else {
      this.createDisponibilite();
    }
  }


  /**
   * Drag and Drop handlers
   */
  onDragStart(event: DragEvent, calendarEvent: CalendarEvent): void {
    if (!calendarEvent.isDisponibilite) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.draggedEvent = calendarEvent;
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', calendarEvent.id);
      // Utiliser une image de drag plus simple et moins intrusive
      const dragImage = document.createElement('div');
      dragImage.style.width = '200px';
      dragImage.style.height = '60px';
      dragImage.style.background = calendarEvent.color || '#10b981';
      dragImage.style.border = '2px dashed rgba(255, 255, 255, 0.5)';
      dragImage.style.borderRadius = '4px';
      dragImage.style.padding = '8px';
      dragImage.style.color = 'white';
      dragImage.style.fontSize = '12px';
      dragImage.style.opacity = '0.9';
      dragImage.textContent = `${calendarEvent.startTime} - ${calendarEvent.endTime}`;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      event.dataTransfer.setDragImage(dragImage, 100, 30);
      // Nettoyer immédiatement après
      setTimeout(() => {
        if (document.body.contains(dragImage)) {
          document.body.removeChild(dragImage);
        }
      }, 0);
    }
  }

  onDragEnd(event: DragEvent): void {
    this.draggedEvent = null;
  }

  onDayDragOver(event: DragEvent, day: WeekDay): void {
    if (!this.draggedEvent || !this.draggedEvent.isDisponibilite) {
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = 'none';
      }
      return;
    }

    // Toujours prévenir le comportement par défaut pour permettre le drop
    event.preventDefault();
    event.stopPropagation();

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
      event.dataTransfer.effectAllowed = 'move';
    }

    // Ajouter un style visuel pour indiquer la zone de drop
    // Utiliser requestAnimationFrame pour éviter les déclenchements trop fréquents
    const target = event.currentTarget as HTMLElement;
    if (!target.classList.contains('drag-over')) {
      requestAnimationFrame(() => {
        target.classList.add('drag-over');
      });
    }
  }

  onDayDrop(event: DragEvent, day: WeekDay): void {
    event.preventDefault();
    event.stopPropagation();

    if (!this.draggedEvent || !this.draggedEvent.isDisponibilite) {
      this.draggedEvent = null;
      return;
    }

    const target = event.currentTarget as HTMLElement;
    target.classList.remove('drag-over');

    // Nettoyer toutes les classes drag-over des autres cellules
    document.querySelectorAll('.day-cell.drag-over').forEach(cell => {
      cell.classList.remove('drag-over');
    });

    // Calculer la nouvelle heure basée sur la position Y du drop
    const rect = target.getBoundingClientRect();
    const y = event.clientY - rect.top;

    // Pour la vue semaine avec créneaux de 2h, chaque créneau fait 160px
    const twoHourSlotHeight = 160; // Hauteur d'un créneau de 2 heures
    const hourHeight = 80; // Hauteur d'une heure

    // Trouver dans quel créneau de 2h on se trouve
    const twoHourSlotIndex = Math.floor(y / twoHourSlotHeight);

    // Position relative dans le créneau de 2h (0-160px)
    const positionInTwoHourSlot = y % twoHourSlotHeight;

    // Trouver le créneau horaire correspondant
    let hourIndex = -1;
    let minutesInSlot = 0;

    if (twoHourSlotIndex >= 0 && twoHourSlotIndex < this.timeSlots.length) {
      const timeSlot = this.timeSlots[twoHourSlotIndex];
      const slotStartHour = parseInt(timeSlot.start.split(':')[0]);
      hourIndex = this.hours.findIndex(h => parseInt(h.split(':')[0]) === slotStartHour);

      if (hourIndex !== -1) {
        // Calculer l'heure et les minutes dans le créneau de 2h
        // positionInTwoHourSlot est en pixels (0-160px)
        // 80px = 1 heure
        const hoursInSlot = positionInTwoHourSlot / hourHeight;
        const wholeHours = Math.floor(hoursInSlot);
        const fractionalHours = hoursInSlot - wholeHours;

        // Ajouter les heures complètes
        hourIndex += wholeHours;
        if (hourIndex >= this.hours.length) {
          hourIndex = this.hours.length - 1;
        }

        // Calculer les minutes (fraction d'heure * 60)
        minutesInSlot = Math.round(fractionalHours * 60);
      }
    }

    // Vérifier que l'index est valide
    if (hourIndex >= 0 && hourIndex < this.hours.length) {
      const baseHour = parseInt(this.hours[hourIndex].split(':')[0]);
      let newHour = baseHour;
      let newMinutes = Math.max(0, Math.min(59, minutesInSlot));

      // Calculer la position dans l'heure courante pour l'arrondi
      const positionInHour = positionInTwoHourSlot % hourHeight; // Position dans l'heure courante (0-80px)

      // Si on est dans la deuxième moitié de l'heure (plus de 40px), arrondir à l'heure suivante
      if (positionInHour > 40 && hourIndex < this.hours.length - 1) {
        newHour = parseInt(this.hours[hourIndex + 1].split(':')[0]);
        newMinutes = 0;
      }

      // Calculer la durée de la disponibilité
      const oldStartHour = parseInt(this.draggedEvent.startTime.split(':')[0]);
      const oldStartMin = parseInt(this.draggedEvent.startTime.split(':')[1] || '0');
      const oldEndHour = parseInt(this.draggedEvent.endTime.split(':')[0]);
      const oldEndMin = parseInt(this.draggedEvent.endTime.split(':')[1] || '0');

      const oldStartMinutes = oldStartHour * 60 + oldStartMin;
      const oldEndMinutes = oldEndHour * 60 + oldEndMin;
      const duration = oldEndMinutes - oldStartMinutes;

      // Calculer la nouvelle heure de fin
      let newStartMinutes = newHour * 60 + newMinutes;
      let newEndMinutes = newStartMinutes + duration;

      // Vérifier que la nouvelle heure de fin ne dépasse pas 17h
      const maxMinutes = 17 * 60; // 17h en minutes
      if (newEndMinutes > maxMinutes) {
        newEndMinutes = maxMinutes;
        // Ajuster la durée si nécessaire
        const adjustedDuration = newEndMinutes - newStartMinutes;
        if (adjustedDuration < 30) {
          // Si la durée ajustée est trop courte, ajuster l'heure de début
          newStartMinutes = newEndMinutes - duration;
          newHour = Math.floor(newStartMinutes / 60);
          newMinutes = newStartMinutes % 60;
        }
      }

      const newEndHour = Math.floor(newEndMinutes / 60);
      const newEndMin = newEndMinutes % 60;

      // Formater les heures
      const newStartTime = `${String(newHour).padStart(2, '0')}:${String(newMinutes).padStart(2, '0')}`;
      const newEndTime = `${String(newEndHour).padStart(2, '0')}:${String(newEndMin).padStart(2, '0')}`;

      // Valider les restrictions horaires avant de mettre à jour
      const heureMin = '08:00';
      const heureMax = '17:00';
      const pauseDebut = '12:00';
      const pauseFin = '13:00';

      // Vérifier que les heures sont dans la plage autorisée
      if (newStartTime < heureMin || newEndTime > heureMax) {
        this.toastNotification.createNotification(
          'warning',
          'Restriction horaire',
          'Les disponibilités doivent être comprises entre 8h et 17h.'
        );
        this.draggedEvent = null;
        // Nettoyer les classes drag-over
        document.querySelectorAll('.day-cell.drag-over').forEach(cell => {
          cell.classList.remove('drag-over');
        });
        return;
      }

      // Vérifier que le créneau ne chevauche pas la pause de midi
      if ((newStartTime < pauseFin && newEndTime > pauseDebut)) {
        this.toastNotification.createNotification(
          'warning',
          'Pause de midi',
          'Les disponibilités ne peuvent pas chevaucher la pause de midi (12h-13h).'
        );
        this.draggedEvent = null;
        // Nettoyer les classes drag-over
        document.querySelectorAll('.day-cell.drag-over').forEach(cell => {
          cell.classList.remove('drag-over');
        });
        return;
      }

      // Vérifier si la position a vraiment changé avant de mettre à jour
      const oldStartTime = this.draggedEvent.startTime;
      const oldEndTime = this.draggedEvent.endTime;
      const oldDay = this.draggedEvent.dayOfWeek || day.name;

      // Ne mettre à jour que si la position a changé
      if (newStartTime !== oldStartTime || newEndTime !== oldEndTime || oldDay !== day.name) {
        // Mettre à jour la disponibilité
        const disponibilite = this.disponibilites.find(d => d.idDisponibilite === this.draggedEvent!.id);
        if (disponibilite) {
          // Vérifier si c'est une disponibilité mockée (non sauvegardée)
          const isMockDisponibilite = disponibilite.idDisponibilite.startsWith('mock-');
          
          if (isMockDisponibilite) {
            // Mettre à jour localement sans appeler le backend
            disponibilite.jour = day.name;
            disponibilite.heureDebut = newStartTime;
            disponibilite.heureFin = newEndTime;
            this.processDisponibilites();
            this.updateFilteredEvents();
            this.toastNotification.createNotification(
              'success',
              'Disponibilité déplacée',
              `La disponibilité a été déplacée à ${newStartTime} - ${newEndTime}. N'oubliez pas de la soumettre pour qu'elle soit sauvegardée.`
            );
          } else {
            // Disponibilité sauvegardée - mettre à jour via le backend
            this.selectedDisponibilite = disponibilite;
            this.disponibiliteForm = {
              jour: day.name,
              heureDebut: newStartTime,
              heureFin: newEndTime
            };
            this.isEditMode = true;
            this.errorMessage = ''; // Réinitialiser le message d'erreur
            this.submitDisponibiliteForm();
            this.toastNotification.createNotification(
              'success',
              'Disponibilité déplacée',
              `La disponibilité a été déplacée à ${newStartTime} - ${newEndTime}`
            );
          }
        }
      }
    }

    this.draggedEvent = null;
  }

  onDayDragLeave(event: DragEvent): void {
    // Ne retirer la classe que si on quitte vraiment la cellule (pas juste un enfant)
    const target = event.currentTarget as HTMLElement;
    const relatedTarget = event.relatedTarget as HTMLElement;

    // Vérifier que le curseur quitte vraiment la cellule et ne passe pas juste sur un enfant
    // Utiliser un petit délai pour éviter les clignotements
    if (!target.contains(relatedTarget)) {
      setTimeout(() => {
        // Vérifier à nouveau que le curseur n'est plus dans la cellule
        if (!target.matches(':hover')) {
          target.classList.remove('drag-over');
        }
      }, 50);
    }
  }

  /**
   * Récupérer les jours à afficher selon le mode
   */
  getDaysToDisplay(): WeekDay[] {
    return this.viewMode === 'week' ? this.weekDays : this.monthDays;
  }

  /**
   * Calculer la position de la zone de pause de midi (12h-13h)
   */
  getLunchBreakTop(): number {
    // Trouver l'index de 12:00 dans le tableau hours
    const hourIndex = this.hours.findIndex(h => h === '12:00');
    if (hourIndex === -1) return 0;

    // Position = index * 80px (hauteur d'un créneau)
    return hourIndex * 80;
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

    // Convertir l'emploi du temps en disponibilités pour le tableau de disponibilité
    const availabilityGrid: { [key: string]: 'disponible' | 'prefere' | 'indisponible' | '' } = {};

    if (this.emploiDuTemps.cours && this.emploiDuTemps.cours.length > 0) {
      // Pour chaque cours, déterminer la période (Matin ou Après-midi) et marquer comme disponible
      this.emploiDuTemps.cours.forEach(cours => {
        if (cours.jourSemaine && cours.heureDebut) {
          const hour = parseInt(cours.heureDebut.split(':')[0]);
          const period = hour < 12 ? 'Matin' : 'Après-midi';
          const key = `${cours.jourSemaine}-${period}`;

          // Marquer comme disponible
          availabilityGrid[key] = 'disponible';
        }
      });
    }

    // Stocker dans localStorage pour que la page sync puisse le récupérer
    localStorage.setItem('submittedScheduleAvailabilityGrid', JSON.stringify(availabilityGrid));
    localStorage.setItem('scheduleSubmitted', 'true');

    this.isLoading = false;
    console.log('Emploi du temps soumis, disponibilités mises à jour dans localStorage');

    // Afficher un message de confirmation
    this.toastNotification.success(
      'Emploi du temps soumis',
      'Votre emploi du temps a été soumis. Les disponibilités ont été mises à jour automatiquement dans le tableau de synchronisation.'
    );
  }

  /**
   * Obtenir les événements pour un jour et un créneau horaire (pour l'affichage en créneaux de 2h)
   */
  getEventsForDayAndTimeSlot(day: string, timeSlot: { start: string; end: string }): CalendarEvent[] {
    return this.getAllEventsForDay(day).filter(event => {
      const eventStart = this.parseTime(event.startTime);
      const eventEnd = this.parseTime(event.endTime);
      const slotStart = this.parseTime(timeSlot.start);
      const slotEnd = this.parseTime(timeSlot.end);

      // L'événement chevauche le créneau s'il commence avant la fin du créneau et se termine après le début
      return eventStart < slotEnd && eventEnd > slotStart;
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
   * Calculer la position top d'un événement dans un créneau de 2h
   */
  getEventTopInSlot(event: CalendarEvent, timeSlot: { start: string; end: string }): number {
    const slotStart = this.parseTime(timeSlot.start);
    const eventStart = this.parseTime(event.startTime);

    // Position relative dans le créneau (en minutes)
    const minutesFromSlotStart = Math.max(0, eventStart - slotStart);

    // Convertir en pixels (80px par heure = 1.33px par minute)
    return (minutesFromSlotStart / 60) * 80;
  }

  /**
   * Calculer la hauteur d'un événement dans un créneau de 2h
   */
  getEventHeightInSlot(event: CalendarEvent, timeSlot: { start: string; end: string }): number {
    const eventStart = this.parseTime(event.startTime);
    const eventEnd = this.parseTime(event.endTime);
    const slotStart = this.parseTime(timeSlot.start);
    const slotEnd = this.parseTime(timeSlot.end);

    // Limiter l'événement aux bornes du créneau
    const actualStart = Math.max(eventStart, slotStart);
    const actualEnd = Math.min(eventEnd, slotEnd);

    const duration = actualEnd - actualStart;

    // Convertir en pixels (80px par heure = 1.33px par minute)
    const height = (duration / 60) * 80;

    // Hauteur minimale pour la lisibilité
    return Math.max(40, height);
  }


  /**
   * Soumettre les disponibilités pour qu'elles soient visibles côté admin
   */
  submitAvailabilities(): void {
    if (!this.enseignantId) {
      this.toastNotification.createNotification(
        'error',
        'Erreur',
        'Utilisateur non identifié'
      );
      return;
    }

    // Filtrer uniquement les disponibilités non soumises
    const disponibilitesToSubmit = this.disponibilites.filter(d =>
      d.idDisponibilite && (!(d as any).isSubmitted || (d as any).isSubmitted === false)
    );

    if (disponibilitesToSubmit.length === 0) {
      this.toastNotification.createNotification(
        'warning',
        'Aucune disponibilité',
        'Aucune disponibilité à soumettre. Veuillez d\'abord ajouter des disponibilités.'
      );
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    // Envoyer toutes les disponibilités non soumises au backend
    const createPromises = disponibilitesToSubmit.map(dispo => {
      // Vérifier que toutes les données requises sont présentes
      if (!dispo.date || !dispo.heureDebut || !dispo.heureFin || !dispo.jour) {
        console.error('Données manquantes pour la disponibilité:', dispo);
        return Promise.reject(new Error('Données manquantes pour la disponibilité'));
      }

      // S'assurer que la date est au format YYYY-MM-DD
      let dateStr = dispo.date;
      if (dateStr && dateStr.includes('T')) {
        // Si c'est une date ISO, extraire seulement la partie date
        dateStr = dateStr.split('T')[0];
      }

      const request: CreateDisponibiliteRequest = {
        jour: dispo.jour,
        date: dateStr,
        heureDebut: dispo.heureDebut,
        heureFin: dispo.heureFin,
        utilisateurId: this.enseignantId
      };

      console.log('Envoi de la disponibilité:', request);
      return firstValueFrom(this.reservationService.createDisponibilite(request))
        .then((result) => {
          // Marquer comme soumise après succès
          (dispo as any).isSubmitted = true;
          if (result && result.idDisponibilite) {
            // Mettre à jour l'ID avec celui du backend
            dispo.idDisponibilite = result.idDisponibilite;
          }
          return result;
        });
    });

    Promise.all(createPromises)
      .then(() => {
        this.isLoading = false;
        console.log('Disponibilités soumises avec succès');
        // Recharger les disponibilités pour mettre à jour l'affichage
        this.loadDisponibilites();
        this.toastNotification.createNotification(
          'success',
          'Disponibilités soumises',
          `Vos ${disponibilitesToSubmit.length} disponibilité(s) ont été soumises avec succès. Elles sont maintenant visibles par l'administration.`
        );
      })
      .catch((error) => {
        this.isLoading = false;
        console.error('Erreur lors de la soumission des disponibilités:', error);
        console.error('Détails de l\'erreur:', {
          status: error.status,
          statusText: error.statusText,
          error: error.error,
          message: error.message,
          url: error.url
        });

        // Message d'erreur plus détaillé
        let errorMessage = 'Erreur lors de la soumission. Veuillez réessayer.';
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.status === 500) {
          errorMessage = 'Erreur serveur. Veuillez vérifier que toutes les données sont correctes et réessayer.';
        } else if (error.status === 400) {
          errorMessage = 'Données invalides. Veuillez vérifier les informations saisies.';
        }

        this.toastNotification.createNotification(
          'error',
          'Erreur de soumission',
          errorMessage
        );
      });
  }
}
