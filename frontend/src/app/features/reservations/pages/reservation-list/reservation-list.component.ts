import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subject, of } from 'rxjs';
import { takeUntil, catchError, map } from 'rxjs/operators';
import { Sidebar } from '../../../sidebar/sidebar';
import { AuthService } from '../../../../core/services/auth.service';
import { RoomService } from '../../../../core/services/room.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { AuthUser, Room, Reservation, CreateReservationRequest, RoomSuggestion, RoomAvailability, Equipement } from '../../../../core/models';
import { EquipementService } from '../../../../core/services/equipement.service';

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
  fullDate?: Date;
}

interface WeekDay {
  name: string;
  shortName: string;
  date: string;
  fullDate: Date;
  isToday: boolean;
}

@Component({
  selector: 'app-reservation-list',
  standalone: true,
  imports: [CommonModule, FormsModule, Sidebar],
  templateUrl: './reservation-list.component.html',
  styleUrls: ['./reservation-list.component.scss']
})
export class ReservationListComponent implements OnInit, OnDestroy {
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
  roomSearchQuery: string = '';
  filteredRoomsForSidebar: Room[] = [];

  // View mode
  viewMode: 'day' | 'week' | 'month' = 'week';

  // Rooms
  rooms: Room[] = [];
  filteredRooms: Room[] = [];

  // Reservations
  reservations: Reservation[] = [];
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
  showDetailsModal: boolean = false;
  selectedEvent: CalendarEvent | null = null;
  reservationForm = {
    roomId: '',
    date: '',
    startTime: '',
    endTime: '',
    purpose: '',
    numberOfParticipants: 1,
    typeCours: '', // Type de cours pour assignation automatique
    equipementId: '' // Added for equipment selection
  };

  // Equipements
  equipements: Equipement[] = [];
  filteredEquipements: Equipement[] = [];

  // Assignment mode
  useAutoAssignment: boolean = true; // Mode assignation automatique activé par défaut
  loadingSuggestions: boolean = false; // Indicateur de chargement des suggestions
  roomSuggestions: RoomSuggestion[] = []; // Liste des suggestions de salles
  showSuggestions: boolean = false; // Afficher ou non la zone de suggestions
  reservationError: string | null = null; // Message d'erreur pour la réservation

  // Room availability status
  roomAvailabilityStatus: Map<string, boolean> = new Map();
  roomAvailabilityDetails: Map<string, RoomAvailability> = new Map();
  checkingAvailability: boolean = false;

  // Types de cours pour assignation automatique
  courseTypes = [
    { value: 'COURS_MAGISTRAL', label: 'Cours Magistral (CM)' },
    { value: 'TD', label: 'Travaux Dirigés (TD)' },
    { value: 'TP', label: 'Travaux Pratiques (TP)' },
    { value: 'EXAMEN', label: 'Examen' }
  ];

  departments = ['Tous les départements', 'Informatique', 'Sciences de Gestion'];
  roomTypes = ['Tous les types', 'Amphithéâtre', 'Salle de TP', 'Salle standard'];

  constructor(
    private authService: AuthService,
    private roomService: RoomService,
    private reservationService: ReservationService,
    private equipementService: EquipementService,
    private toastNotification: ToastNotificationService,
    private router: Router
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

    const current = new Date(this.currentDate);
    const dayOfWeek = current.getDay();
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
          return of(this.getMockRooms());
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (rooms: Room[]) => {
          this.rooms = rooms;
          this.filteredRooms = [...rooms];
          this.filteredRoomsForSidebar = [...rooms];
          this.applyFilters();
          this.isLoading = false;
        }
      });
  }

  /**
   * Charger les réservations
   */
  loadReservations(): void {
    if (this.weekDays.length === 0) {
      this.initializeCalendar();
      if (this.weekDays.length === 0) return;
    }

    if (!this.userId) {
      console.warn('Aucun userId disponible pour charger les réservations');
      this.isLoading = false;
      return;
    }

    const startDate = this.weekDays[0].fullDate;
    const endDate = this.weekDays[6].fullDate;

    const startDateStr = this.formatDateForApi(startDate);
    const endDateStr = this.formatDateForApi(endDate);

    console.log('Chargement des réservations pour userId:', this.userId);
    console.log('Plage de dates:', startDateStr, 'à', endDateStr);

    this.isLoading = true;
    // Charger les réservations de l'utilisateur pour la plage de dates
    // Note: getReservationsByDateRange ne filtre pas par utilisateur, donc on filtre côté frontend
    this.reservationService.getReservationsByDateRange(startDateStr, endDateStr)
      .pipe(
        map(reservations => {
          // Filtrer par utilisateur connecté
          const userReservations = reservations.filter(r =>
            (r.utilisateurId === this.userId || r.userId === this.userId)
          );
          console.log('Réservations filtrées pour l\'utilisateur:', userReservations.length);
          return userReservations;
        }),
        catchError((error) => {
          console.error('Erreur lors du chargement des réservations:', error);
          // En cas d'erreur, essayer de charger les réservations de l'utilisateur directement
          if (this.userId) {
            return this.reservationService.getUserReservations(this.userId).pipe(
              map(reservations => {
                // Filtrer par plage de dates côté frontend
                const filtered = reservations.filter(r => {
                  const reservationDate = this.getReservationDateFromReservation(r);
                  if (!reservationDate) return false;
                  const date = new Date(reservationDate);
                  return date >= startDate && date <= endDate;
                });
                return filtered;
              }),
              catchError(() => {
                console.warn('Impossible de charger les réservations, utilisation de données mock');
                return of(this.getMockReservations());
              })
            );
          }
          return of(this.getMockReservations());
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (reservations: Reservation[]) => {
          console.log('Réservations reçues du service:', reservations);
          console.log('Nombre de réservations:', reservations.length);
          this.reservations = reservations;
          this.processReservations();
          this.isLoading = false;
        },
        error: (error) => {
          console.error('Erreur lors du chargement des réservations:', error);
          this.isLoading = false;
        }
      });
  }

  /**
   * Obtenir la date d'une réservation pour le filtrage
   */
  private getReservationDateFromReservation(reservation: Reservation): string | null {
    if (reservation.startDateTime) {
      return reservation.startDateTime.split('T')[0];
    }
    if (reservation.date) {
      return reservation.date;
    }
    return null;
  }

  /**
   * Traiter les réservations pour créer les événements calendrier
   */
  processReservations(): void {
    console.log('=== Processing reservations ===');
    console.log('Nombre de réservations à traiter:', this.reservations.length);
    console.log('Réservations brutes:', JSON.stringify(this.reservations, null, 2));
    console.log('Jours de la semaine:', this.weekDays.map(d => ({ name: d.name, date: this.formatDateForApi(d.fullDate) })));

    if (this.reservations.length === 0) {
      console.warn('Aucune réservation à traiter');
      this.calendarEvents = [];
      this.applyFilters();
      return;
    }

    this.calendarEvents = this.reservations
      .map((reservation, index) => {
        console.log(`\n--- Traitement réservation ${index + 1}/${this.reservations.length} ---`);
        console.log('Réservation:', JSON.stringify(reservation, null, 2));

        // Vérifier les données disponibles
        const hasStartEndDateTime = reservation.startDateTime && reservation.endDateTime;
        const hasDateAndTime = reservation.date && reservation.heureDebut && reservation.heureFin;

        console.log('Données disponibles:', {
          hasStartEndDateTime,
          hasDateAndTime,
          startDateTime: reservation.startDateTime,
          endDateTime: reservation.endDateTime,
          date: reservation.date,
          heureDebut: reservation.heureDebut,
          heureFin: reservation.heureFin
        });

        if (!hasStartEndDateTime && !hasDateAndTime) {
          console.warn('Reservation filtrée - données invalides:', reservation);
          return null;
        }

        let startDate: Date;
        let endDate: Date;

        try {
          // Priorité au format ISO combiné (startDateTime/endDateTime)
          if (hasStartEndDateTime && reservation.startDateTime && reservation.endDateTime) {
            console.log('Utilisation du format ISO (startDateTime/endDateTime)');
            startDate = new Date(reservation.startDateTime);
            endDate = new Date(reservation.endDateTime);
          } else if (hasDateAndTime && reservation.date && reservation.heureDebut && reservation.heureFin) {
            // Sinon, construire à partir de date + heure
            console.log('Construction à partir de date + heure séparées');
            const dateStr = reservation.date.toString().trim();
            const heureDebutStr = reservation.heureDebut.toString().trim();
            const heureFinStr = reservation.heureFin.toString().trim();

            // Extraire heures et minutes (ignorer les secondes si présentes)
            const startTimeParts = heureDebutStr.split(':').slice(0, 2).map(Number);
            const endTimeParts = heureFinStr.split(':').slice(0, 2).map(Number);

            console.log('Parsing des heures:', {
              heureDebutStr,
              heureFinStr,
              startTimeParts,
              endTimeParts
            });

            if (startTimeParts.length < 2 || endTimeParts.length < 2 ||
                isNaN(startTimeParts[0]) || isNaN(startTimeParts[1]) ||
                isNaN(endTimeParts[0]) || isNaN(endTimeParts[1])) {
              console.error('Format d\'heure invalide:', { heureDebutStr, heureFinStr });
              return null;
            }

            const [startHour, startMin] = startTimeParts;
            const [endHour, endMin] = endTimeParts;

            // Créer la date avec la date + heure (format ISO)
            const isoStartStr = `${dateStr}T${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}:00`;
            const isoEndStr = `${dateStr}T${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}:00`;

            console.log('Construction dates ISO:', { isoStartStr, isoEndStr });

            startDate = new Date(isoStartStr);
            endDate = new Date(isoEndStr);
          } else {
            console.warn('Reservation sans données de date/heure valides:', reservation);
            return null;
          }

          console.log('Dates parsées:', {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            startDateValid: !isNaN(startDate.getTime()),
            endDateValid: !isNaN(endDate.getTime())
          });

          if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            console.error('Dates invalides après parsing:', { startDate, endDate, reservation });
            return null;
          }

          const dayIndex = this.getDayIndex(startDate);
          console.log('Index du jour dans la semaine:', dayIndex);

          if (dayIndex === -1) {
            const weekStart = this.weekDays[0]?.fullDate ? this.formatDateForApi(this.weekDays[0].fullDate) : 'N/A';
            const weekEnd = this.weekDays[6]?.fullDate ? this.formatDateForApi(this.weekDays[6].fullDate) : 'N/A';
            console.warn('Reservation hors de la semaine affichée:', {
              reservationDate: this.formatDateForApi(startDate),
              weekStart,
              weekEnd
            });
            return null;
          }

          const day = this.weekDays[dayIndex];
          const purpose = reservation.purpose || reservation.coursNom || 'Réservation';
          const type = this.getEventType(purpose);
          const roomId = reservation.roomId || reservation.salleId;
          const room = roomId ? this.rooms.find(r => (r.id || r.idSalle) === roomId) : null;
          const status = reservation.status || reservation.statut || 'EN_ATTENTE';

          const event: CalendarEvent = {
            id: reservation.id || reservation.idDemandeReservation || `event-${index}`,
            title: purpose,
            type: type,
            roomName: room ? (room.name || room.nomsalle || 'Salle inconnue') : (reservation.salleNom || 'Salle inconnue'),
            dayOfWeek: day.name,
            date: this.formatDateForApi(startDate),
            fullDate: startDate,
            startTime: this.formatTime(startDate),
            endTime: this.formatTime(endDate),
            color: this.getColorForType(type),
            reservation: reservation
          };

          console.log(' Événement calendrier créé:', event);
          return event;
        } catch (error) {
          console.error(' Erreur lors du traitement de la réservation:', error, reservation);
          return null;
        }
      })
      .filter(event => event !== null) as CalendarEvent[];

    console.log(`\n=== ${this.calendarEvents.length} événements calendrier créés ===`);
    console.log('Événements:', this.calendarEvents);
    this.applyFilters();
  }

  getDayIndex(date: Date): number {
    const dateStr = this.formatDateForApi(date);
    return this.weekDays.findIndex(day =>
      this.formatDateForApi(day.fullDate) === dateStr
    );
  }

  getEventType(purpose: string): 'cours' | 'examen' | 'reunion' | 'tp' {
    const lower = purpose.toLowerCase();
    if (lower.includes('examen')) return 'examen';
    if (lower.includes('tp') || lower.includes('travaux pratiques')) return 'tp';
    if (lower.includes('réunion') || lower.includes('reunion')) return 'reunion';
    return 'cours';
  }

  getColorForType(type: 'cours' | 'examen' | 'reunion' | 'tp'): string {
    const colors = {
      'cours': '#3b82f6',
      'tp': '#10b981',
      'reunion': '#fbbf24',
      'examen': '#f97316'
    };
    return colors[type];
  }

  /**
   * Obtenir le label du statut pour affichage
   */
  getStatusLabel(status: string | undefined): string {
    if (!status) return 'En attente';

    const statusMap: { [key: string]: string } = {
      'EN_ATTENTE': 'En attente',
      'CONFIRME': 'Confirmé',
      'ANNULEE': 'Annulé',
      'CONFLIT': 'Conflit'
    };

    return statusMap[status.toUpperCase()] || status;
  }

  formatDateForApi(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Obtenir la date d'aujourd'hui au format YYYY-MM-DD pour l'attribut min du champ date
   */
  getTodayDateString(): string {
    return this.formatDateForApi(new Date());
  }

  formatTime(date: Date): string {
    if (!date || isNaN(date.getTime())) {
      console.error('formatTime: date invalide', date);
      return '00:00';
    }
    try {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${hours}:${minutes}`;
    } catch (error) {
      console.error('Erreur dans formatTime:', error, date);
      return '00:00';
    }
  }

  applyFilters(): void {
    let filtered = [...this.calendarEvents];

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(event =>
        event.title.toLowerCase().includes(query) ||
        event.roomName.toLowerCase().includes(query)
      );
    }

    if (this.capacityFilter) {
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

  goToToday(): void {
    this.currentDate = new Date();
    this.initializeCalendar();
    this.loadReservations();
  }

  getEventsForDay(day: WeekDay): CalendarEvent[] {
    const dayDateStr = this.formatDateForApi(day.fullDate);
    const events = this.filteredEvents.filter(event => {
      const match = event.date === dayDateStr;
      if (match) {
        console.log(` Événement trouvé pour ${day.name} ${dayDateStr}:`, event);
      }
      return match;
    });
    if (events.length === 0 && this.filteredEvents.length > 0) {
      console.log(` Aucun événement pour ${day.name} ${dayDateStr}. Événements disponibles:`,
        this.filteredEvents.map(e => ({ date: e.date, title: e.title })));
    }
    return events;
  }

  getEventTop(event: CalendarEvent): number {
    const [hours, minutes] = event.startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes;
    const startMinutes = 8 * 60;
    const offsetMinutes = totalMinutes - startMinutes;
    return (offsetMinutes / 60) * 6;
  }

  getEventHeight(event: CalendarEvent): number {
    const [startHours, startMinutes] = event.startTime.split(':').map(Number);
    const [endHours, endMinutes] = event.endTime.split(':').map(Number);
    const startTotal = startHours * 60 + startMinutes;
    const endTotal = endHours * 60 + endMinutes;
    const duration = endTotal - startTotal;
    return (duration / 60) * 6;
  }

  onEventClick(event: CalendarEvent): void {
    console.log('Event clicked:', event);
    this.selectedEvent = event;
    this.showDetailsModal = true;
  }

  closeDetailsModal(): void {
    this.showDetailsModal = false;
    this.selectedEvent = null;
  }

  deleteReservation(id: string | number | undefined): void {
    if (!id) return;
    if (confirm('Êtes-vous sûr de vouloir annuler cette réservation ?')) {
      this.reservationService.deleteReservation(id.toString()).subscribe({
        next: () => {
          this.closeDetailsModal();
          this.loadReservations();
          // Logique pour rafraîchir la liste ou afficher un toast
        },
        error: (err) => {
          console.error('Error deleting reservation:', err);
          this.reservationError = "Erreur lors de la suppression de la réservation.";
        }
      });
    }
  }

  getColorWithOpacity(color: string, opacity: number): string {
    const hex = color.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }

  toggleReservationPanel(): void {
    if (this.showReservationModal) {
      this.closeReservationModal();
    } else {
      this.openReservationPanel();
    }
  }

  openReservationPanel(): void {
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
    
    this.useAutoAssignment = true;
    this.reservationError = '';
    this.roomSuggestions = [];
    this.showSuggestions = false;
  }

  closeReservationModal(): void {
    this.showReservationModal = false;
    this.reservationError = '';
    this.roomSuggestions = [];
    this.showSuggestions = false;
    this.useAutoAssignment = true;
  }

  /**
   * Basculer entre mode manuel et assignation automatique
   */
  toggleAutoAssignment(): void {
    // Note: useAutoAssignment est déjà mis à jour par ngModel
    if (this.useAutoAssignment) {
      this.reservationForm.roomId = ''; // Réinitialiser la sélection manuelle
      this.loadRoomSuggestions();
    } else {
      this.roomSuggestions = [];
      this.showSuggestions = false;
      this.checkRoomAvailability();
    }
  }

  /**
   * Gérer le changement de date/heure pour vérifier la disponibilité
   */
  onDateTimeChange(): void {
    if (this.showReservationModal && this.reservationForm.date &&
        this.reservationForm.startTime && this.reservationForm.endTime) {
      if (this.useAutoAssignment && this.reservationForm.typeCours && this.reservationForm.numberOfParticipants) {
        this.loadRoomSuggestions();
      } else if (!this.useAutoAssignment) {
        this.checkRoomAvailability();
      }
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
   * Charger les équipements
   */
  loadEquipements(): void {
    this.equipementService.getAllEquipements()
      .pipe(
        catchError((error: any) => {
          console.error('Erreur lors du chargement des équipements:', error);
          return of([]);
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (equipements: Equipement[]) => {
          this.equipements = equipements;
          this.filteredEquipements = [...equipements];
        }
      });
  }

  /**
   * Filtrer les équipements disponibles pour le créneau
   */
  getEquipementsDisponibles(): Equipement[] {
    // Dans cette version simplifiée, on retourne tous les équipements qui ne sont pas défectueux
    // Une logique plus avancée vérifierait les réservations d'équipements existantes
    return this.equipements.filter(e => e.statut !== 'DEFECTUEUX');
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
          this.checkingAvailability = false;
          return of([]);
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
   * Vérifier si une salle est disponible
   */
  isRoomAvailable(roomId: string): boolean {
    return this.roomAvailabilityStatus.get(roomId) ?? true; // Par défaut, considérer comme disponible
  }

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

    // Valider que la date n'est pas passée
    const selectedDate = new Date(this.reservationForm.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate < today) {
      this.toastNotification.createNotification(
        'error',
        'Erreur',
        'Impossible de réserver une salle à une date déjà passée'
      );
      return;
    }

    // Valider que l'heure de fin est après l'heure de début
    const startTime = this.reservationForm.startTime.split(':').map(Number);
    const endTime = this.reservationForm.endTime.split(':').map(Number);
    const startMinutes = startTime[0] * 60 + startTime[1];
    const endMinutes = endTime[0] * 60 + endTime[1];

    if (endMinutes <= startMinutes) {
      this.toastNotification.createNotification(
        'error',
        'Erreur',
        'L\'heure de fin doit être supérieure à l\'heure de début'
      );
      return;
    }

    const startDateTime = `${this.reservationForm.date}T${this.reservationForm.startTime}:00`;
    const endDateTime = `${this.reservationForm.date}T${this.reservationForm.endTime}:00`;

    const request: CreateReservationRequest & { utilisateurId?: string; userId?: string } = {
      startDateTime: startDateTime,
      endDateTime: endDateTime,
      purpose: this.reservationForm.purpose,
      numberOfParticipants: this.reservationForm.numberOfParticipants,
      utilisateurId: this.userId || this.currentUser?.id || '',
      userId: this.userId || this.currentUser?.id || ''
    };

    // Ajouter les informations de salle et de type de cours
    if (this.reservationForm.roomId) {
      request.roomId = this.reservationForm.roomId;
    }
    
    if (this.reservationForm.typeCours) {
      request.typeCours = this.reservationForm.typeCours;
    }
    if (!request.utilisateurId) {
      this.toastNotification.createNotification(
        'error',
        'Erreur',
        'Impossible de créer la réservation : utilisateur non identifié'
      );
      this.isLoading = false;
      return;
    }

    this.isLoading = true;
    this.reservationService.createReservation(request)
      .pipe(
        takeUntil(this.destroy$),
        catchError((error: any) => {
          console.error('Erreur lors de la création de la réservation:', error);
          this.toastNotification.createNotification(
            'error',
            'Erreur',
            error.error?.message || 'Impossible de créer la réservation. Veuillez réessayer.'
          );
          this.isLoading = false;
          return of(null);
        })
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

  onRoomTypeChange(): void {
    this.applyFilters();
  }

  onCapacityChange(): void {
    this.applyFilters();
  }

  onSearch(): void {
    this.applyFilters();
  }

  navigateToCreateReservation(): void {
    this.router.navigate(['/reservations/create']);
  }

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

  getMockReservations(): Reservation[] {
    if (this.weekDays.length === 0) return [];

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

  /**
   * Vérifier si une salle est disponible maintenant (pour l'affichage dans la sidebar)
   */
  isRoomAvailableNow(roomId: string): boolean {
    if (!roomId) return true;

    const now = new Date();

    // Vérifier si la salle est réservée en ce moment (seulement les réservations confirmées)
    const hasCurrentReservation = this.reservations.some(reservation => {
      const reservationRoomId = reservation.roomId || reservation.salleId;
      if (reservationRoomId !== roomId) return false;

      // Ne considérer que les réservations confirmées/validées
      const status = reservation.status || reservation.statut || '';
      if (status !== 'CONFIRME') {
        return false;
      }

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
   * Obtenir les créneaux horaires libres pour une salle aujourd'hui
   */
  getAvailableTimeSlots(roomId: string): string[] {
    if (!roomId) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = this.formatDateForApi(today);

    // Créneaux horaires standards (8h-18h)
    const allSlots = [
      { start: '08:00', end: '10:00' },
      { start: '10:00', end: '12:00' },
      { start: '13:00', end: '15:00' },
      { start: '15:00', end: '17:00' },
      { start: '17:00', end: '18:00' }
    ];

    // Récupérer les réservations confirmées pour cette salle aujourd'hui
    const confirmedReservations = this.reservations.filter((reservation: any) => {
      const reservationRoomId = reservation.roomId || reservation.salleId;
      if (reservationRoomId !== roomId) return false;

      // Ne considérer que les réservations confirmées/validées
      const status = reservation.status || reservation.statut || '';
      if (status !== 'CONFIRME') {
        return false;
      }

      const reservationDate = reservation.startDateTime
        ? reservation.startDateTime.split('T')[0]
        : reservation.date;

      return reservationDate === todayStr;
    });

    // Filtrer les créneaux occupés
    const availableSlots = allSlots.filter((slot: any) => {
      const [startHour, startMin] = slot.start.split(':').map(Number);
      const [endHour, endMin] = slot.end.split(':').map(Number);
      const slotStart = startHour * 60 + startMin;
      const slotEnd = endHour * 60 + endMin;

      const isOccupied = confirmedReservations.some((reservation: any) => {
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

        const resStartMinutes = reservationStart.getHours() * 60 + reservationStart.getMinutes();
        const resEndMinutes = reservationEnd.getHours() * 60 + reservationEnd.getMinutes();

        // Vérifier le chevauchement
        return resStartMinutes < slotEnd && resEndMinutes > slotStart;
      });

      return !isOccupied;
    });

    return availableSlots.map((slot: any) => `${slot.start}-${slot.end}`);
  }

  /**
   * Filtrer les salles pour la sidebar
   */
  onRoomSearch(): void {
    if (!this.roomSearchQuery || this.roomSearchQuery.trim() === '') {
      this.filteredRoomsForSidebar = [...this.rooms];
      return;
    }

    const query = this.roomSearchQuery.toLowerCase().trim();
    this.filteredRoomsForSidebar = this.rooms.filter((room: any) => {
      const roomName = (room.name || room.nomsalle || '').toLowerCase();
      const roomId = (room.id || room.idSalle || '').toLowerCase();
      return roomName.includes(query) || roomId.includes(query);
    });
  }
}
