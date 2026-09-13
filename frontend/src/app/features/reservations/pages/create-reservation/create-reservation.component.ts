import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, forkJoin, Observable } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';
import { AuthService } from '../../../../core/services/auth.service';
import { RoomService } from '../../../../core/services/room.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { EquipementService } from '../../../../core/services/equipement.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { AuthUser, Room, Reservation, CreateReservationRequest, RoomSuggestion, RoomAvailability, Equipement } from '../../../../core/models';

interface CalendarEvent {
  id: string;
  title: string;
  type: 'cours' | 'examen' | 'reunion' | 'tp';
  roomName: string;
  dayOfWeek: string;
  date: string;
  startTime: string;
  endTime: string;
  color: string;
  reservation?: Reservation;
}

interface WeekDay {
  name: string;
  shortName: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
}

@Component({
  selector: 'app-create-reservation',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create-reservation.component.html',
  styleUrls: ['./create-reservation.component.scss']
})
export class CreateReservationComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // User info
  currentUser: AuthUser | null = null;
  userId: string = '';

  // Calendar data
  currentDate: Date = new Date();
  currentMonth: string = '';
  currentYear: number = 2024;
  weekDays: WeekDay[] = [];
  calendarEvents: CalendarEvent[] = [];
  filteredEvents: CalendarEvent[] = [];

  // Filters
  searchQuery: string = '';
  selectedDepartment: string = 'Tous les départements';
  selectedRoomType: string = 'Tous les types';
  capacityFilter: number | null = null;

  // View mode
  viewMode: 'day' | 'week' | 'month' = 'week';

  // Rooms
  rooms: Room[] = [];
  filteredRooms: Room[] = [];

  // Reservations
  reservations: Reservation[] = [];
  equipements: Equipement[] = [];
  isLoading: boolean = false;

  // Time slots
  timeSlots = [
    { start: '08:00', label: '08:00' },
    { start: '10:00', label: '10:00' },
    { start: '12:00', label: '12:00' },
    { start: '14:00', label: '14:00' },
    { start: '16:00', label: '16:00' },
    { start: '18:00', label: '18:00' }
  ];

  // Modal state
  showReservationModal: boolean = false;
  reservationForm = {
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    numberOfParticipants: 1,
    typeCours: '', // Type de cours pour assignation automatique
    equipementId: '' // Optionnel: réservation d'équipement
  };

  // Assignment mode
  useAutoAssignment: boolean = false; // Mode assignation automatique

  // Room availability status
  roomAvailabilityStatus: Map<string, boolean> = new Map();
  roomAvailabilityDetails: Map<string, RoomAvailability> = new Map();
  checkingAvailability: boolean = false;
  reservationError: string = '';

  // Room suggestions
  roomSuggestions: RoomSuggestion[] = [];
  loadingSuggestions: boolean = false;
  isSearchingSuggestions: boolean = false; // Added for HTML compatibility
  showSuggestions: boolean = false;
  isSubmittingReservation: boolean = false; // Added for HTML compatibility

  departments = ['Tous les départements', 'Informatique', 'Sciences de Gestion'];
  roomTypes = ['Tous les types', 'Amphithéâtre', 'Salle de TP', 'Salle standard'];
  
  // Types de cours pour assignation automatique
  courseTypes = [
    { value: 'COURS_MAGISTRAL', label: 'Cours Magistral (CM)' },
    { value: 'TD', label: 'Travaux Dirigés (TD)' },
    { value: 'TP', label: 'Travaux Pratiques (TP)' },
    { value: 'EXAMEN', label: 'Examen' }
  ];

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private equipementService: EquipementService,
    private reservationService: ReservationService,
    private toastNotification: ToastNotificationService
  ) {}

  ngOnInit(): void {
    // Initialiser le calendrier immédiatement pour afficher l'interface
    this.initializeCalendar();
    this.loadRooms();
    this.loadEquipements();

    // Charger les données utilisateur
    this.authService.getCurrentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user?.id) {
          this.userId = user.id;
          this.loadReservations();
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Initialiser le calendrier
   */
  initializeCalendar(): void {
    this.updateMonthLabel();
    this.updateWeekDays();
  }

  /**
   * Mettre à jour le label du mois
   */
  updateMonthLabel(): void {
    const monthNames = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
      'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
    this.currentMonth = monthNames[this.currentDate.getMonth()];
    this.currentYear = this.currentDate.getFullYear();
  }

  /**
   * Mettre à jour les jours de la semaine
   */
  updateWeekDays(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Créer une nouvelle date pour éviter de modifier this.currentDate directement
    const current = new Date(this.currentDate);
    const dayOfWeek = current.getDay();
    // Calculer le lundi de la semaine
    const diff = current.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(current.getFullYear(), current.getMonth(), diff);
    monday.setHours(0, 0, 0, 0);

    const dayNames = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
    const dayShortNames = ['LUN', 'MAR', 'MER', 'JEU', 'VEN', 'SAM', 'DIM'];

    this.weekDays = [];
    for (let i = 0; i < 7; i++) {
      const date = new Date(monday);
      date.setDate(monday.getDate() + i);
      date.setHours(0, 0, 0, 0);
      const isToday = date.getTime() === today.getTime();

      this.weekDays.push({
        name: dayNames[i],
        shortName: dayShortNames[i],
        date: date.getDate().toString(),
        fullDate: new Date(date),
        isToday: isToday
      });
    }
  }

  /**
   * Charger les salles
   */
  loadRooms(): void {
    this.isLoading = true;
    this.roomService.getAllRooms()
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des salles:', error);
          // Données mockées pour le développement
          return of(this.getMockRooms());
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (rooms: Room[]) => {
          this.rooms = rooms;
          this.filteredRooms = [...rooms];
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger les équipements disponibles
   */
  loadEquipements(): void {
    // On ne veut que les équipements disponibles au moment de la demande
    this.equipementService.getAllEquipements({ statut: 'DISPONIBLE' })
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des équipements:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (equipements: Equipement[]) => {
          this.equipements = equipements;
        }
      });
  }

  /**
   * Charger les réservations
   */
  loadReservations(): void {
    if (this.weekDays.length === 0) {
      // Si weekDays n'est pas encore initialisé, réinitialiser le calendrier
      this.initializeCalendar();
      if (this.weekDays.length === 0) return;
    }

    // Calculer les dates de début et fin de la semaine
    const startDate = this.weekDays[0].fullDate;
    const endDate = this.weekDays[6].fullDate;

    const startDateStr = this.formatDateForApi(startDate);
    const endDateStr = this.formatDateForApi(endDate);

    this.isLoading = true;
    this.reservationService.getReservationsByDateRange(startDateStr, endDateStr)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des réservations:', error);
          // Données mockées pour le développement
          const mockReservations = this.getMockReservations();
          return of(mockReservations);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reservations: Reservation[]) => {
          this.reservations = reservations;
          this.processReservations();
          // Re-vérifier la disponibilité si le modal est ouvert
          if (this.showReservationModal) {
            this.checkRoomAvailability();
          }
          this.isLoading = false;
        }
      });
  }

  /**
   * Traiter les réservations pour créer les événements calendrier
   */
  processReservations(): void {
    this.calendarEvents = this.reservations
      .filter(reservation => {
        // Filtrer les réservations avec des données valides
        if (reservation.startDateTime && reservation.endDateTime) return true;
        if (reservation.date && reservation.heureDebut && reservation.heureFin) return true;
        return false;
      })
      .map(reservation => {
        let startDate: Date;
        let endDate: Date;

        // Gérer les deux formats
        if (reservation.startDateTime && reservation.endDateTime) {
          startDate = new Date(reservation.startDateTime);
          endDate = new Date(reservation.endDateTime);
        } else if (reservation.date && reservation.heureDebut && reservation.heureFin) {
          // Format backend : combiner date + heure
          const [startHour, startMin] = reservation.heureDebut.split(':').map(Number);
          const [endHour, endMin] = reservation.heureFin.split(':').map(Number);
          startDate = new Date(reservation.date);
          startDate.setHours(startHour, startMin, 0, 0);
          endDate = new Date(reservation.date);
          endDate.setHours(endHour, endMin, 0, 0);
        } else {
          return null;
        }

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          return null;
        }

        const dayIndex = this.getDayIndex(startDate);
        if (dayIndex === -1) return null;

        const day = this.weekDays[dayIndex];
        const purpose = reservation.purpose || reservation.coursNom || 'Réservation';
        const type = this.getEventType(purpose);
        const roomId = reservation.roomId || reservation.salleId;
        const room = roomId ? this.rooms.find(r => (r.id || r.idSalle) === roomId) : null;

      return {
        id: reservation.id || reservation.idDemandeReservation || '',
        title: purpose,
        type: type,
        roomName: room ? (room.name || room.nomsalle || 'Salle inconnue') : 'Salle inconnue',
        dayOfWeek: day.name,
        date: this.formatDateForApi(startDate),
        startTime: this.formatTime(startDate),
        endTime: this.formatTime(endDate),
        color: this.getColorForType(type),
        reservation: reservation
      };
    }).filter(event => event !== null) as CalendarEvent[];

    this.applyFilters();
  }

  /**
   * Obtenir l'index du jour dans la semaine
   */
  getDayIndex(date: Date): number {
    const dateStr = this.formatDateForApi(date);
    return this.weekDays.findIndex(day =>
      this.formatDateForApi(day.fullDate) === dateStr
    );
  }

  /**
   * Obtenir le type d'événement à partir du purpose
   */
  getEventType(purpose: string): 'cours' | 'examen' | 'reunion' | 'tp' {
    const lower = purpose.toLowerCase();
    if (lower.includes('examen')) return 'examen';
    if (lower.includes('tp') || lower.includes('travaux pratiques')) return 'tp';
    if (lower.includes('réunion') || lower.includes('reunion')) return 'reunion';
    return 'cours';
  }

  /**
   * Obtenir la couleur selon le type
   */
  getColorForType(type: 'cours' | 'examen' | 'reunion' | 'tp'): string {
    const colors = {
      'cours': '#3b82f6', // blue
      'tp': '#10b981', // green
      'reunion': '#fbbf24', // yellow
      'examen': '#f97316' // orange
    };
    return colors[type];
  }

  /**
   * Formater une date au format YYYY-MM-DD
   */
  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Formater une heure au format HH:mm
   */
  formatTime(date: Date): string {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Appliquer les filtres
   */
  applyFilters(): void {
    let filtered = [...this.calendarEvents];

    // Filtre par recherche
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.roomName.toLowerCase().includes(query)
      );
    }

    // Filtre par capacité (si applicable)
    if (this.capacityFilter) {
      // Filtrer les salles, puis les événements
      const availableRooms = this.rooms.filter(r => {
        const capacity = r.capacity || r.capacite;
        return capacity !== undefined && capacity >= this.capacityFilter!;
      });
      const availableRoomIds = availableRooms.map(r => r.id || r.idSalle).filter(id => id !== undefined);
      filtered = filtered.filter(event => {
        if (!event.reservation) return false;
        const eventRoomId = event.reservation.roomId || event.reservation.salleId;
        return eventRoomId && availableRoomIds.includes(eventRoomId);
      });
    }

    this.filteredEvents = filtered;
  }

  /**
   * Changer de période (précédente/suivante)
   */
  previousWeek(): void {
    this.currentDate.setDate(this.currentDate.getDate() - 7);
    this.updateMonthLabel();
    this.updateWeekDays();
    this.loadReservations();
  }

  nextWeek(): void {
    this.currentDate.setDate(this.currentDate.getDate() + 7);
    this.updateMonthLabel();
    this.updateWeekDays();
    this.loadReservations();
  }

  /**
   * Obtenir les événements pour un jour
   */
  getEventsForDay(day: WeekDay): CalendarEvent[] {
    return this.filteredEvents.filter(event => {
      return event.date === this.formatDateForApi(day.fullDate);
    });
  }

  /**
   * Calculer la position top d'un événement en rem
   * Dans le HTML fourni, les événements sont positionnés avec top en rem
   * Chaque créneau de 2h = 12rem (h-24)
   */
  getEventTop(event: CalendarEvent): number {
    const [hours, minutes] = event.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;

    // Commencer à 8h (480 minutes)
    const startMinutes = 8 * 60;
    const offsetMinutes = totalMinutes - startMinutes;

    // 1 heure = 6rem (h-24 / 2 = 12rem / 2 = 6rem)
    // Convertir en rem (1rem = 16px, donc 6rem = 96px)
    return (offsetMinutes / 60) * 6; // Retourne en rem
  }

  /**
   * Calculer la hauteur d'un événement en rem
   */
  getEventHeight(event: CalendarEvent): number {
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);

    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;

    const duration = endTotal - startTotal;

    // 1 heure = 6rem
    return (duration / 60) * 6; // Retourne en rem
  }

  /**
   * Ouvrir le modal de réservation
   */
  openReservationModal(): void {
    this.showReservationModal = true;
    const defaultDate = this.weekDays && this.weekDays.length > 0
      ? this.formatDateForApi(this.weekDays[0].fullDate)
      : this.formatDateForApi(new Date());
    this.reservationForm = {
      roomId: '',
      date: defaultDate,
      startTime: '08:00',
      endTime: '10:00',
      purpose: '',
      numberOfParticipants: 1,
      typeCours: '',
      equipementId: ''
    };
    // Activer l'assignation automatique par défaut
    this.useAutoAssignment = true;
    this.reservationError = '';
    this.roomSuggestions = [];
    this.showSuggestions = false;
    // Ne pas vérifier la disponibilité en mode automatique (sera fait lors du chargement des suggestions)
  }

  /**
   * Fermer le modal de réservation
   */
  closeReservationModal(): void {
    this.showReservationModal = false;
    this.reservationError = '';
    this.roomAvailabilityStatus.clear();
    this.roomAvailabilityDetails.clear();
    this.roomSuggestions = [];
    this.showSuggestions = false;
    this.useAutoAssignment = false;
    this.reservationForm.equipementId = '';
  }

  /**
   * Gérer le changement de date/heure pour vérifier la disponibilité
   */
  onDateTimeChange(): void {
    if (this.showReservationModal && this.reservationForm.date &&
        this.reservationForm.startTime && this.reservationForm.endTime) {
      this.checkRoomAvailability();
      this.loadEquipements(); // Recharger pour voir les équipements libres
      // Si on est en mode assignation automatique, recharger les suggestions
      if (this.useAutoAssignment && this.reservationForm.typeCours && this.reservationForm.numberOfParticipants) {
        this.loadRoomSuggestions();
      }
    }
  }

  /**
   * Basculer entre mode manuel et assignation automatique
   */
  toggleAutoAssignment(value: boolean): void {
    this.useAutoAssignment = value;
    this.reservationError = '';
    
    if (value) {
      // Si on passe en auto, on réinitialise la salle car l'IA va suggérer
      this.reservationForm.roomId = '';
      this.roomSuggestions = [];
      this.loadRoomSuggestions();
    } else {
      this.roomSuggestions = [];
      this.showSuggestions = false;
    }
  }

  /**
   * Sélectionner une suggestion de l'IA
   */
  selectSuggestion(suggestion: RoomSuggestion): void {
    this.reservationForm.roomId = suggestion.roomId;
    this.reservationError = '';
  }

  /**
   * Vérifier si le formulaire est valide
   */
  isFormValid(): boolean {
    const { purpose, numberOfParticipants, date, startTime, endTime } = this.reservationForm;
    
    const basicInfoValid = purpose && numberOfParticipants > 0 && date && startTime && endTime;
    
    if (this.useAutoAssignment) {
      return !!(basicInfoValid && this.reservationForm.typeCours && this.reservationForm.roomId);
    } else {
      return !!(basicInfoValid && this.reservationForm.roomId);
    }
  }

  /**
   * Charger les suggestions de salles
   */
  loadRoomSuggestions(): void {
    if (!this.reservationForm.typeCours || !this.reservationForm.numberOfParticipants ||
        !this.reservationForm.date || !this.reservationForm.startTime || !this.reservationForm.endTime) {
      return;
    }

    this.loadingSuggestions = true;
    this.reservationService.suggestRooms(
      this.reservationForm.typeCours,
      this.reservationForm.numberOfParticipants,
      this.reservationForm.date,
      this.reservationForm.startTime,
      this.reservationForm.endTime
    )
      .pipe(
        catchError((error) => {
          console.error('Erreur lors du chargement des suggestions:', error);
          this.toastNotification.createNotification(
            'error',
            'Erreur',
            'Impossible de charger les suggestions de salles'
          );
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (suggestions: RoomSuggestion[]) => {
          this.roomSuggestions = suggestions;
          this.showSuggestions = true;
          this.loadingSuggestions = false;
          
          // Si des suggestions sont disponibles, sélectionner automatiquement la première
          if (suggestions.length > 0 && suggestions[0].suitable) {
            this.reservationForm.roomId = suggestions[0].roomId;
          }
        }
      });
  }

  /**
   * Sélectionner une salle depuis les suggestions
   */
  selectSuggestedRoom(roomId: string): void {
    this.reservationForm.roomId = roomId;
  }

  /**
   * Vérifier la disponibilité de toutes les salles pour le créneau sélectionné (en temps réel)
   */
  checkRoomAvailability(): void {
    if (!this.reservationForm.date || !this.reservationForm.startTime || !this.reservationForm.endTime) {
      this.checkingAvailability = false;
      return;
    }

    this.checkingAvailability = true;

    // Utiliser l'API de disponibilité en temps réel
    this.reservationService.getAllRoomsRealTimeAvailability(
      this.reservationForm.date,
      this.reservationForm.startTime,
      this.reservationForm.endTime
    )
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la vérification de disponibilité en temps réel:', error);
          // Fallback vers l'ancienne méthode
          return this.checkRoomAvailabilityFallback();
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (availabilities: RoomAvailability[]) => {
          availabilities.forEach(availability => {
            this.roomAvailabilityStatus.set(availability.roomId, availability.available);
            this.roomAvailabilityDetails.set(availability.roomId, availability);
          });
          this.checkingAvailability = false;
        },
        error: (error) => {
          console.error('Erreur lors de la vérification de disponibilité:', error);
          this.checkingAvailability = false;
        }
      });
  }

  /**
   * Fallback pour la vérification de disponibilité (ancienne méthode)
   */
  checkRoomAvailabilityFallback(): Observable<RoomAvailability[]> {
    if (!this.rooms || this.rooms.length === 0) {
      return of([]);
    }

    const startDateTime = `${this.reservationForm.date}T${this.reservationForm.startTime}:00`;
    const endDateTime = `${this.reservationForm.date}T${this.reservationForm.endTime}:00`;

    const availabilityChecks = this.rooms
      .map(room => {
        const roomId = room.id || room.idSalle;
        if (!roomId) return null;

        return this.reservationService.checkAvailability(roomId, startDateTime, endDateTime)
          .pipe(
            catchError(() => {
              const isAvailable = this.checkRoomAvailabilityLocal(roomId, startDateTime, endDateTime);
              return of(isAvailable);
            }),
            map(isAvailable => ({
              roomId,
              roomName: room.name || room.nomsalle || 'Salle inconnue',
              available: isAvailable,
              date: this.reservationForm.date,
              startTime: this.reservationForm.startTime,
              endTime: this.reservationForm.endTime
            } as RoomAvailability))
          );
      })
      .filter(check => check !== null) as any[];

    return availabilityChecks.length > 0 ? forkJoin(availabilityChecks) : of([]);
  }

  /**
   * Vérifier la disponibilité à partir des réservations déjà chargées
   */
  checkAvailabilityFromReservations(): void {
    if (!this.reservationForm.date || !this.reservationForm.startTime || !this.reservationForm.endTime) {
      return;
    }

    const selectedDate = new Date(this.reservationForm.date);
    const [startHour, startMin] = this.reservationForm.startTime.split(':').map(Number);
    const [endHour, endMin] = this.reservationForm.endTime.split(':').map(Number);

    const requestedStart = new Date(selectedDate);
    requestedStart.setHours(startHour, startMin, 0, 0);

    const requestedEnd = new Date(selectedDate);
    requestedEnd.setHours(endHour, endMin, 0, 0);

    // Pour chaque salle, vérifier si elle a une réservation qui chevauche
    this.rooms.forEach(room => {
      const roomId = room.id || room.idSalle;
      if (!roomId) return;

      const hasConflict = this.reservations.some(reservation => {
        const reservationRoomId = reservation.roomId || reservation.salleId;
        if (reservationRoomId !== roomId) return false;

        let reservationStart: Date;
        let reservationEnd: Date;

        if (reservation.startDateTime && reservation.endDateTime) {
          reservationStart = new Date(reservation.startDateTime);
          reservationEnd = new Date(reservation.endDateTime);
        } else if (reservation.date && reservation.heureDebut && reservation.heureFin) {
          const [rStartHour, rStartMin] = reservation.heureDebut.split(':').map(Number);
          const [rEndHour, rEndMin] = reservation.heureFin.split(':').map(Number);
          reservationStart = new Date(reservation.date);
          reservationStart.setHours(rStartHour, rStartMin, 0, 0);
          reservationEnd = new Date(reservation.date);
          reservationEnd.setHours(rEndHour, rEndMin, 0, 0);
        } else {
          return false;
        }

        // Vérifier le chevauchement
        return reservationStart < requestedEnd && reservationEnd > requestedStart;
      });

      // Si pas de conflit trouvé localement, considérer comme disponible
      // L'API confirmera ou infirmera
      if (!hasConflict) {
        this.roomAvailabilityStatus.set(roomId, true);
      } else {
        this.roomAvailabilityStatus.set(roomId, false);
      }
    });
  }

  /**
   * Vérifier la disponibilité localement (pour fallback)
   */
  checkRoomAvailabilityLocal(roomId: string, startDateTime: string, endDateTime: string): boolean {
    const requestedStart = new Date(startDateTime);
    const requestedEnd = new Date(endDateTime);

    const hasConflict = this.reservations.some(reservation => {
      const reservationRoomId = reservation.roomId || reservation.salleId;
      if (reservationRoomId !== roomId) return false;

      let reservationStart: Date;
      let reservationEnd: Date;

      if (reservation.startDateTime && reservation.endDateTime) {
        reservationStart = new Date(reservation.startDateTime);
        reservationEnd = new Date(reservation.endDateTime);
      } else if (reservation.date && reservation.heureDebut && reservation.heureFin) {
        const [rStartHour, rStartMin] = reservation.heureDebut.split(':').map(Number);
        const [rEndHour, rEndMin] = reservation.heureFin.split(':').map(Number);
        reservationStart = new Date(reservation.date);
        reservationStart.setHours(rStartHour, rStartMin, 0, 0);
        reservationEnd = new Date(reservation.date);
        reservationEnd.setHours(rEndHour, rEndMin, 0, 0);
      } else {
        return false;
      }

      return reservationStart < requestedEnd && reservationEnd > requestedStart;
    });

    return !hasConflict;
  }

  /**
   * Vérifier si une salle est disponible
   */
  isRoomAvailable(roomId: string): boolean {
    return this.roomAvailabilityStatus.get(roomId) ?? true; // Par défaut, considérer comme disponible
  }

  /**
   * Vérifier si une salle est disponible maintenant (pour l'affichage dans la sidebar)
   */
  isRoomAvailableNow(roomId: string): boolean {
    if (!roomId) return true;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    // Vérifier si la salle est réservée en ce moment
    const hasCurrentReservation = this.reservations.some(reservation => {
      const reservationRoomId = reservation.roomId || reservation.salleId;
      if (reservationRoomId !== roomId) return false;

      let reservationStart: Date;
      let reservationEnd: Date;

      if (reservation.startDateTime && reservation.endDateTime) {
        reservationStart = new Date(reservation.startDateTime);
        reservationEnd = new Date(reservation.endDateTime);
      } else if (reservation.date && reservation.heureDebut && reservation.heureFin) {
        const [rStartHour, rStartMin] = reservation.heureDebut.split(':').map(Number);
        const [rEndHour, rEndMin] = reservation.heureFin.split(':').map(Number);
        reservationStart = new Date(reservation.date);
        reservationStart.setHours(rStartHour, rStartMin, 0, 0);
        reservationEnd = new Date(reservation.date);
        reservationEnd.setHours(rEndHour, rEndMin, 0, 0);
      } else {
        return false;
      }

      // Vérifier si maintenant est dans le créneau de réservation
      return now >= reservationStart && now <= reservationEnd;
    });

    return !hasCurrentReservation;
  }

  /**
   * Obtenir le libellé de l'option de salle avec indicateur de statut
   */
  getRoomOptionLabel(room: Room): string {
    const roomId = room.id || room.idSalle || '';
    const roomName = room.name || room.nomsalle || 'Salle inconnue';
    const ecole = room.ecole || '';
    const capacity = room.capacity || room.capacite || 0;

    // Si on a les informations de date/heure, afficher le statut
    if (this.reservationForm.date && this.reservationForm.startTime && this.reservationForm.endTime) {
      const isAvailable = this.isRoomAvailable(roomId);
      const statusIndicator = isAvailable ? ' Libre' : ' Réservée';
      return `${statusIndicator} ${roomName} - ${ecole} (Capacité: ${capacity})`;
    }

    // Sinon, afficher sans indicateur
    return `${roomName} - ${ecole} (Capacité: ${capacity})`;
  }

  /**
   * Créer une réservation
   */
  createReservation(): void {
    if (!this.reservationForm.date ||
        !this.reservationForm.startTime || !this.reservationForm.endTime ||
        !this.reservationForm.purpose) {
      this.toastNotification.createNotification(
        'error',
        'Erreur',
        'Veuillez remplir tous les champs obligatoires'
      );
      return;
    }

    // Si assignation automatique, vérifier que typeCours et numberOfParticipants sont fournis
    if (this.useAutoAssignment) {
      if (!this.reservationForm.typeCours || !this.reservationForm.numberOfParticipants) {
        this.toastNotification.createNotification(
          'error',
          'Erreur',
          'Pour l\'assignation automatique, le type de cours et le nombre de participants sont obligatoires'
        );
        return;
      }
    } else {
      // Mode manuel : vérifier que roomId est fourni
      if (!this.reservationForm.roomId) {
        this.toastNotification.createNotification(
          'error',
          'Erreur',
          'Veuillez sélectionner une salle'
        );
        return;
      }

      // Vérifier la disponibilité de la salle sélectionnée
      const isAvailable = this.isRoomAvailable(this.reservationForm.roomId);
      if (!isAvailable) {
        this.reservationError = 'Cette salle est déjà réservée pour le créneau sélectionné. Veuillez choisir une autre salle.';
        this.toastNotification.createNotification(
          'error',
          'Salle non disponible',
          'Cette salle est déjà réservée pour le créneau sélectionné. Veuillez choisir une autre salle.'
        );
        return;
      }
    }

    const startDateTime = `${this.reservationForm.date}T${this.reservationForm.startTime}:00`;
    const endDateTime = `${this.reservationForm.date}T${this.reservationForm.endTime}:00`;

    const request: CreateReservationRequest = {
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      purpose: this.reservationForm.purpose,
      numberOfParticipants: this.reservationForm.numberOfParticipants,
      equipementId: this.reservationForm.equipementId || undefined
    };

    // Ajouter roomId seulement si mode manuel
    if (!this.useAutoAssignment && this.reservationForm.roomId) {
      request.roomId = this.reservationForm.roomId;
    }

    // Ajouter typeCours si assignation automatique
    if (this.useAutoAssignment && this.reservationForm.typeCours) {
      request.typeCours = this.reservationForm.typeCours;
    }

    this.isLoading = true;
    this.reservationError = '';
    this.reservationService.createReservation(request)
      .pipe(
        catchError((error) => {
          console.error('Erreur lors de la création de la réservation:', error);
          let errorMessage = 'Impossible de créer la réservation. Veuillez réessayer.';
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else if (error.status === 409) {
            errorMessage = 'Cette salle est déjà réservée pour le créneau sélectionné. Veuillez choisir une autre salle.';
          } else if (error.status === 404 && this.useAutoAssignment) {
            errorMessage = 'Aucune salle disponible pour les critères sélectionnés. Veuillez ajuster vos critères.';
          }
          this.reservationError = errorMessage;
          this.toastNotification.createNotification(
            'error',
            'Erreur',
            errorMessage
          );
          this.isLoading = false;
          return of(null);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reservation) => {
          if (reservation) {
            const message = this.useAutoAssignment 
              ? `La réservation a été créée avec succès. Salle assignée: ${reservation.salleNom || 'N/A'}`
              : 'La réservation a été créée avec succès';
            this.toastNotification.createNotification(
              'success',
              'Succès',
              message
            );
            this.closeReservationModal();
            this.loadReservations();
          }
          this.isLoading = false;
        }
      });
  }

  /**
   * Filtrer les salles par type
   */
  onRoomTypeChange(): void {
    this.applyFilters();
  }

  /**
   * Filtrer par capacité
   */
  onCapacityChange(): void {
    this.applyFilters();
  }

  /**
   * Rechercher
   */
  onSearch(): void {
    this.applyFilters();
  }

  /**
   * Données mockées pour le développement
   */
  getMockRooms(): Room[] {
    return [
      {
        id: '1',
        name: 'Salle TPI-02',
        description: 'Salle de TP Informatique',
        capacity: 30,
        ecole: 'Bâtiment A',
        amenities: ['Ordinateurs', 'Projecteur'],
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        name: 'Amphi 100',
        description: 'Amphithéâtre principal',
        capacity: 200,
        ecole: 'Bâtiment B',
        amenities: ['Micro', 'Projecteur'],
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        name: 'Salle S-05',
        description: 'Salle standard',
        capacity: 50,
        ecole: 'Bâtiment A',
        amenities: ['Projecteur'],
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        name: 'Salle de Conf.',
        description: 'Salle de conférence',
        capacity: 20,
        ecole: 'Bâtiment C',
        amenities: ['Visioconférence'],
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        name: 'Salle TPI-01',
        description: 'Salle de TP Informatique',
        capacity: 25,
        ecole: 'Bâtiment A',
        amenities: ['Ordinateurs'],
        isAvailable: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }

  /**
   * Obtenir une couleur avec opacité
   */
  getColorWithOpacity(color: string, opacity: number): string {
    // Convertir hex en rgb
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  /**
   * Données mockées pour les réservations
   */
  getMockReservations(): Reservation[] {
    if (this.weekDays.length === 0) return [];

    // Utiliser les dates réelles de la semaine courante
    const monday = new Date(this.weekDays[0].fullDate);
    const tuesday = new Date(this.weekDays[1].fullDate);
    const wednesday = new Date(this.weekDays[2].fullDate);
    const thursday = new Date(this.weekDays[3].fullDate);

    return [
      {
        id: '1',
        roomId: '1',
        userId: this.userId || 'user1',
        startDateTime: new Date(monday.setHours(8, 0, 0, 0)).toISOString(),
        endDateTime: new Date(monday.setHours(10, 0, 0, 0)).toISOString(),
        purpose: 'TP: Algorithmique',
        status: 'CONFIRME',
        numberOfParticipants: 25,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '2',
        roomId: '2',
        userId: this.userId || 'user1',
        startDateTime: new Date(monday.setHours(10, 0, 0, 0)).toISOString(),
        endDateTime: new Date(monday.setHours(12, 0, 0, 0)).toISOString(),
        purpose: 'Examen: Maths',
        status: 'CONFIRME',
        numberOfParticipants: 150,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '3',
        roomId: '3',
        userId: this.userId || 'user1',
        startDateTime: new Date(wednesday.setHours(8, 0, 0, 0)).toISOString(),
        endDateTime: new Date(wednesday.setHours(10, 0, 0, 0)).toISOString(),
        purpose: 'CM: Droit',
        status: 'CONFIRME',
        numberOfParticipants: 45,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '4',
        roomId: '4',
        userId: this.userId || 'user1',
        startDateTime: new Date(wednesday.setHours(11, 0, 0, 0)).toISOString(),
        endDateTime: new Date(wednesday.setHours(14, 0, 0, 0)).toISOString(),
        purpose: 'Réunion Dépt.',
        status: 'CONFIRME',
        numberOfParticipants: 15,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: '5',
        roomId: '5',
        userId: this.userId || 'user1',
        startDateTime: new Date(thursday.setHours(8, 0, 0, 0)).toISOString(),
        endDateTime: new Date(thursday.setHours(10, 0, 0, 0)).toISOString(),
        purpose: 'TP: Réseaux',
        status: 'CONFIRME',
        numberOfParticipants: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
  }
}
