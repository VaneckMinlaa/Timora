import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil, map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { RoomService } from '../../../../core/services/room.service';
import { EquipementService } from '../../../../core/services/equipement.service';
import { UserService } from '../../../../core/services/user.service';
import { ConflictService } from '../../../../core/services/conflict.service';
import { AuthUser, Room, Reservation } from '../../../../core/models';
import { Equipement } from '../../../../core/models/equipement.model';
import { TypeSalle } from '../../../../core/models/room.model';
import { DashboardStats, Conflict } from '../../../../core/models/dashboard.model';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { NgApexchartsModule } from 'ng-apexcharts';

interface ChartData {
  name: string;
  percentage: number;
  color: string;
  count?: number;
}

interface HourlyOccupancy {
  hour: string;
  occupancy: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, NgApexchartsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Admin IUSJ';
  userEmail: string = 'admin@iusj.com';
  userProfilePhoto: string | null = null;
  userInitials: string = 'U';
  avatarColor: string = '#2563eb';

  isLoading: boolean = false;
  
  // Statistiques
  stats: DashboardStats = {
    occupancyRate: 0,
    occupancyTrend: 0,
    weeklyConflicts: 0,
    conflictsTrend: 0,
    dailyReservations: 0,
    reservationsTrend: 0,
    activeUsers: 0,
    usersTrend: 0,
    globalOccupancyRate: 0,
    plannedHours: 0,
    plannedHoursTrend: 0,
    availableRooms: 0,
    availableRoomsTrend: 0,
    totalCourses: 0
  };

  // Données pour les diagrammes (ApexCharts)
  public barChartSeries: any[] = [];
  public barChartConfig: any = {};
  
  public donutChartSeries: number[] = [];
  public donutChartConfig: any = {};
  public donutChartLabels: string[] = [];
  public donutChartColors: string[] = [];

  public areaChartSeries: any[] = [];
  public areaChartConfig: any = {};
  
  // Données brutes
  reservations: Reservation[] = [];
  rooms: Room[] = [];
  equipements: Equipement[] = [];
  conflicts: Conflict[] = [];

  // Données de la semaine précédente pour calculer les tendances
  previousWeekReservations: Reservation[] = [];
  previousWeekOccupancy: number = 0;

  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);
  private roomService = inject(RoomService);
  private equipementService = inject(EquipementService);
  private userService = inject(UserService);
  private conflictService = inject(ConflictService);
  private toastService = inject(ToastNotificationService);

  ngOnInit(): void {
    this.initChartConfigs();
    this.loadUserInfo();
    this.loadDashboardData();
  }

  initChartConfigs(): void {
    // 1. Column Chart - Occupancy per Room Type (Replacing simple bar)
    this.barChartConfig = {
      chart: { type: 'bar', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
      plotOptions: { 
        bar: { 
          horizontal: false, 
          columnWidth: '55%', 
          borderRadius: 8,
          distributed: true,
          dataLabels: { position: 'top' }
        } 
      },
      dataLabels: { 
        enabled: true,
        formatter: function (val: number) { return val + '%' },
        offsetY: -20,
        style: { fontSize: '12px', colors: ["#304758"] }
      },
      legend: { show: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: {
        categories: [], // Will be filled dynamically
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#6b7280', fontWeight: 600 } }
      },
      yaxis: { 
        show: true, 
        max: 100,
        labels: { formatter: (val: number) => val + '%' }
      },
      fill: { opacity: 1 },
      tooltip: {
        theme: 'light',
        y: { formatter: (val: number) => val + "% d'occupation" }
      }
    };

    // 2. Radar/Donut mix - Using Donut but with more premium styling
    this.donutChartConfig = {
      chart: { type: 'donut', height: 280 },
      colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
      plotOptions: {
        pie: {
          donut: {
            size: '80%',
            labels: {
              show: true,
              total: {
                show: true,
                label: 'Salles',
                fontSize: '14px',
                color: '#64748b',
                formatter: () => this.rooms.length.toString()
              }
            }
          }
        }
      },
      dataLabels: { enabled: false },
      stroke: { width: 3, colors: ['#fff'] },
      legend: { show: false }
    };

    // 3. Area Chart - Enhanced Activity Over Time
    this.areaChartConfig = {
      chart: { 
        type: 'area', 
        height: 320, 
        toolbar: { show: false }, 
        zoom: { enabled: false },
        sparkline: { enabled: false }
      },
      colors: ['#2563eb', '#10b981'],
      fill: {
        type: 'gradient',
        gradient: { 
          shadeIntensity: 1, 
          opacityFrom: 0.45, 
          opacityTo: 0.05, 
          stops: [20, 100] 
        }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3, dashArray: [0, 5] },
      xaxis: {
        categories: ['8h', '10h', '12h', '14h', '16h', '18h'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#64748b', fontSize: '12px' } }
      },
      yaxis: { 
        labels: { 
          style: { colors: '#64748b' },
          formatter: (val: number) => Math.round(val) + '%'
        } 
      },
      grid: { 
        borderColor: '#f1f5f9',
        strokeDashArray: 4,
        xaxis: { lines: { show: true } },
        yaxis: { lines: { show: true } }
      },
      tooltip: { x: { show: false } }
    };
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.userDisplayName = `${user.firstName} ${user.lastName}`.trim() || 'Utilisateur';
          this.userEmail = user.email || 'admin@iusj.com';
          this.userProfilePhoto = user.profilePhoto || null;
          this.userInitials = getUserInitials(user.firstName, user.lastName);
          this.avatarColor = getUserAvatarColor(user.firstName, user.lastName);
        }
      });
  }

  loadDashboardData(): void {
    this.isLoading = true;
    
    const today = new Date();
    const startOfWeek = new Date(today);
    startOfWeek.setDate(today.getDate() - today.getDay() + 1); // Lundi
    startOfWeek.setHours(0, 0, 0, 0);
    
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6); // Dimanche
    endOfWeek.setHours(23, 59, 59, 999);
    
    const previousWeekStart = new Date(startOfWeek);
    previousWeekStart.setDate(startOfWeek.getDate() - 7);
    
    const previousWeekEnd = new Date(endOfWeek);
    previousWeekEnd.setDate(endOfWeek.getDate() - 7);
    
    const todayStr = this.formatDate(today);
    const startOfWeekStr = this.formatDate(startOfWeek);
    const endOfWeekStr = this.formatDate(endOfWeek);
    const previousWeekStartStr = this.formatDate(previousWeekStart);
    const previousWeekEndStr = this.formatDate(previousWeekEnd);

    forkJoin({
      reservations: this.reservationService.getAllReservations().pipe(
        catchError(() => of([] as Reservation[]))
      ),
      reservationsThisWeek: this.reservationService.getReservationsByDateRange(startOfWeekStr, endOfWeekStr).pipe(
        catchError(() => of([] as Reservation[]))
      ),
      reservationsPreviousWeek: this.reservationService.getReservationsByDateRange(previousWeekStartStr, previousWeekEndStr).pipe(
        catchError(() => of([] as Reservation[]))
      ),
      reservationsToday: this.reservationService.getReservationsByDateRange(todayStr, todayStr).pipe(
        catchError(() => of([] as Reservation[]))
      ),
      rooms: this.roomService.getAllRooms().pipe(
        catchError(() => of([] as Room[]))
      ),
      equipements: this.equipementService.getAllEquipements().pipe(
        catchError(() => of([] as Equipement[]))
      ),
      userStats: this.userService.getUserStatistics().pipe(
        catchError(() => of({ totalUsers: 0, activeUsers: 0, admins: 0, managers: 0, regularUsers: 0 }))
      ),
      conflictStats: this.conflictService.getConflictStats().pipe(
        catchError(() => of({ 
          totalConflicts: 0, 
          pendingConflicts: 0, 
          resolvedConflicts: 0, 
          ignoredConflicts: 0,
          resolvedThisWeek: 0,
          detectedThisWeek: 0,
          conflictsByType: {},
          conflictsBySeverity: {}
        }))
      )
    }).pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (data) => {
        this.reservations = data.reservations;
        this.rooms = data.rooms;
        this.equipements = data.equipements;
        this.previousWeekReservations = data.reservationsPreviousWeek;
        
        this.calculateStatistics(data);
        this.calculateRoomTypesChart(data);
        this.calculateHourlyOccupancy(data.reservationsThisWeek || []);
        this.calculateConflicts(data.conflictStats);
        
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Erreur lors du chargement des données du dashboard:', err);
        this.toastService.error('Erreur', 'Impossible de charger les données du dashboard.');
        this.isLoading = false;
      }
    });
  }

  calculateStatistics(dashboardData: any): void {
    // Statistiques de base
    this.stats.activeUsers = dashboardData.userStats.activeUsers || 0;
    this.stats.totalCourses = this.reservations.length;
    
    // Réservations d'aujourd'hui
    const todayReservations = dashboardData.reservationsToday || [];
    this.stats.dailyReservations = todayReservations.length;
    
    // Calcul du taux d'occupation du JOUR (plus pertinent pour un dashboard)
    const totalRooms = this.rooms.length;
    if (totalRooms > 0) {
      const reservedRoomsToday = new Set(
        (dashboardData.reservationsToday || []).map((r: any) => r.salleId || r.roomId).filter((id: any) => id)
      ).size;
      this.stats.occupancyRate = Math.round((reservedRoomsToday / totalRooms) * 100);
      this.stats.globalOccupancyRate = this.stats.occupancyRate;
    }
    
    // Salles libres actuellement
    const now = new Date();
    const currentlyReserved = this.reservations.filter(r => {
      const status = r.statut || r.status;
      if (status !== 'CONFIRME') return false;
      
      // Gérer les deux formats de date/heure
      if (r.date && r.heureDebut && r.heureFin) {
        // Format backend
        const reservationDate = new Date(r.date);
        const [startHour, startMin] = r.heureDebut.split(':').map(Number);
        const [endHour, endMin] = r.heureFin.split(':').map(Number);
        const start = new Date(reservationDate);
        start.setHours(startHour, startMin, 0, 0);
        const end = new Date(reservationDate);
        end.setHours(endHour, endMin, 0, 0);
        return start <= now && now <= end;
      } else if (r.startDateTime && r.endDateTime) {
        // Format frontend
        const start = new Date(r.startDateTime);
        const end = new Date(r.endDateTime);
        return start <= now && now <= end;
      }
      return false;
    }).map(r => r.salleId || r.roomId).filter(id => id);
    
    const availableRoomsCount = totalRooms - new Set(currentlyReserved).size;
    this.stats.availableRooms = Math.max(0, availableRoomsCount);
    
    // Heures planifiées (calcul basé sur la durée des réservations)
    const plannedHours = this.reservations.reduce((total, res) => {
      let duration = 0;
      if (res.heureDebut && res.heureFin) {
        const [startHour, startMin] = res.heureDebut.split(':').map(Number);
        const [endHour, endMin] = res.heureFin.split(':').map(Number);
        duration = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
      } else if (res.startDateTime && res.endDateTime) {
        duration = (new Date(res.endDateTime).getTime() - new Date(res.startDateTime).getTime()) / (1000 * 60 * 60);
      }
      return total + duration;
    }, 0);

    this.stats.plannedHours = Math.round(plannedHours);

    // Calcul des tendances pour les heures planifiées
    const previousPlannedHours = this.previousWeekReservations.reduce((total, res) => {
      let duration = 0;
      if (res.heureDebut && res.heureFin) {
        const [startHour, startMin] = res.heureDebut.split(':').map(Number);
        const [endHour, endMin] = res.heureFin.split(':').map(Number);
        duration = ((endHour * 60 + endMin) - (startHour * 60 + startMin)) / 60;
      } else if (res.startDateTime && res.endDateTime) {
        duration = (new Date(res.endDateTime).getTime() - new Date(res.startDateTime).getTime()) / (1000 * 60 * 60);
      }
      return total + duration;
    }, 0);
    
    if (previousPlannedHours > 0) {
      this.stats.plannedHoursTrend = Math.round(((plannedHours - previousPlannedHours) / previousPlannedHours) * 100);
    }
    
    // Calcul des tendances
    const thisWeekCount = (dashboardData.reservationsThisWeek || []).length;
    const previousWeekCount = this.previousWeekReservations.length;
    if (previousWeekCount > 0) {
      this.stats.reservationsTrend = Math.round(((thisWeekCount - previousWeekCount) / previousWeekCount) * 100);
    } else if (thisWeekCount > 0) {
      this.stats.reservationsTrend = 100;
    }
    
    // Taux d'occupation de la semaine précédente
    if (this.rooms.length > 0 && this.previousWeekReservations.length > 0) {
      const previousWeekReservedRooms = new Set(
        this.previousWeekReservations.map(r => r.salleId || r.roomId).filter(id => id)
      ).size;
      this.previousWeekOccupancy = Math.round((previousWeekReservedRooms / this.rooms.length) * 100);
      this.stats.occupancyTrend = this.stats.globalOccupancyRate - this.previousWeekOccupancy;
    }
    
    // Occupancy rate (utiliser le global)
    this.stats.occupancyRate = this.stats.globalOccupancyRate;
    
    // Conflits (basés sur le statut)
    const conflicts = this.reservations.filter(r => 
      (r.statut === 'CONFLIT') || (r.status === 'CONFLIT')
    );
    this.stats.weeklyConflicts = conflicts.length;
    
    // Calcul du trend pour les conflits
    const previousWeekConflicts = this.previousWeekReservations.filter(r => 
      (r.statut === 'CONFLIT') || (r.status === 'CONFLIT')
    ).length;
    this.stats.conflictsTrend = conflicts.length - previousWeekConflicts;

    // Tendance utilisateurs (Simulation basée sur le ratio actifs/total si pas d'historique)
    const totalUsers = dashboardData.userStats.totalUsers || 1;
    this.stats.usersTrend = Math.round((this.stats.activeUsers / totalUsers) * 10); // Croissance proportionnelle
  }

  calculateRoomTypesChart(dashboardData: any): void {
    if (this.rooms.length === 0) {
      this.barChartSeries = [{ name: 'Amphi', data: [0] }, { name: 'Cours', data: [0] }];
      this.donutChartSeries = [100];
      this.donutChartLabels = ['Vide'];
      this.donutChartConfig.colors = ['#e5e7eb'];
      this.barChartConfig.colors = ['#e5e7eb', '#e5e7eb'];
      return;
    }

    const typeCounts: { [key: string]: number } = {};
    const typeColors: { [key: string]: string } = {
      'AMPHI': '#2563eb',
      'TD': '#22d3ee',
      'LABORATOIRE': '#fbbf24',
      'COURS': '#10b981'
    };

    // Compter les salles par type
    this.rooms.forEach(room => {
      const type = room.typeSalle || 'COURS';
      typeCounts[type] = (typeCounts[type] || 0) + 1;
    });

    // Calculer les pourcentages et préparer les données
    const totalRooms = this.rooms.length;
    const typeLabels: { [key: string]: string } = {
      'AMPHI': 'Amphi',
      'TD': 'Salle TD',
      'LABORATOIRE': 'Laboratoire',
      'COURS': 'Cours'
    };

    const typesList = Object.keys(typeCounts).sort((a, b) => typeCounts[b] - typeCounts[a]);
    
    const donutValues: number[] = [];
    const donutColors: string[] = [];
    const donutLabels: string[] = [];

    typesList.forEach(type => {
      const percentage = Math.round((typeCounts[type] / totalRooms) * 100);
      const color = typeColors[type] || '#2563eb';
      const label = typeLabels[type] || type;

      donutValues.push(percentage);
      donutColors.push(color);
      donutLabels.push(label);
    });

    // For Column Chart: Occupation de la SEMAINE par type
    this.barChartSeries = [{
      name: 'Occupation par type',
      data: typesList.map(type => {
        const roomsOfType = this.rooms.filter(r => (r.typeSalle || 'COURS') === type).map(r => r.idSalle || r.id);
        const reservedRoomsOfType = new Set(
          (dashboardData.reservationsThisWeek || []).filter((res: any) => roomsOfType.includes(res.salleId || res.roomId)).map((res: any) => res.salleId || res.roomId)
        ).size;
        return roomsOfType.length > 0 ? Math.round((reservedRoomsOfType / roomsOfType.length) * 100) : 0;
      })
    }];
    this.barChartConfig.xaxis.categories = typesList.map(t => typeLabels[t] || t);
    
    this.donutChartSeries = donutValues;
    this.donutChartConfig.colors = donutColors;
    this.donutChartLabels = donutLabels;
  }

  calculateHourlyOccupancy(reservations: Reservation[]): void {
    const hourlyCounts: { [key: number]: number } = {};
    
    // Initialiser tous les créneaux horaires
    [8, 10, 12, 14, 16, 18].forEach(hour => {
      hourlyCounts[hour] = 0;
    });

    // Compter les réservations par heure de début
    reservations.forEach(reservation => {
      let hour: number | null = null;
      
      // Gérer les deux formats possibles
      if (reservation.heureDebut) {
        // Format backend : "HH:mm"
        const [h, m] = reservation.heureDebut.split(':').map(Number);
        hour = h;
      } else if (reservation.startDateTime) {
        // Format frontend : ISO datetime string
        const startDate = new Date(reservation.startDateTime);
        hour = startDate.getHours();
      }
      
      if (hour !== null) {
        // Trouver le créneau horaire le plus proche
        const slots = [8, 10, 12, 14, 16, 18];
        const closestSlot = slots.reduce((prev, curr) => {
          return Math.abs(curr - hour!) < Math.abs(prev - hour!) ? curr : prev;
        });
        
        hourlyCounts[closestSlot] = (hourlyCounts[closestSlot] || 0) + 1;
      }
    });

    // Calculer les pourcentages pour le graphique
    const maxCount = Math.max(...Object.values(hourlyCounts), 1);
    
    const areaData = [8, 10, 12, 14, 16, 18].map(hour => {
      return maxCount > 0 ? Math.round((hourlyCounts[hour] / maxCount) * 100) : 0;
    });

    // Calculer les données pour la semaine précédente (VRAIES DONNÉES)
    const prevHourlyCounts: { [key: number]: number } = {};
    [8, 10, 12, 14, 16, 18].forEach(hour => prevHourlyCounts[hour] = 0);

    this.previousWeekReservations.forEach(res => {
      let hour: number | null = null;
      if (res.heureDebut) hour = parseInt(res.heureDebut.split(':')[0]);
      else if (res.startDateTime) hour = new Date(res.startDateTime).getHours();
      
      if (hour !== null) {
        const slots = [8, 10, 12, 14, 16, 18];
        const closestSlot = slots.reduce((prev, curr) => Math.abs(curr - hour!) < Math.abs(prev - hour!) ? curr : prev);
        prevHourlyCounts[closestSlot]++;
      }
    });

    const prevMaxCount = Math.max(...Object.values(prevHourlyCounts), 1);
    const prevAreaData = [8, 10, 12, 14, 16, 18].map(hour => {
      return prevMaxCount > 0 ? Math.round((prevHourlyCounts[hour] / prevMaxCount) * 100) : 0;
    });

    this.areaChartSeries = [
      {
        name: 'Semaine Actuelle',
        data: areaData
      },
      {
        name: 'Semaine Précédente',
        data: prevAreaData
      }
    ];
  }

  calculateConflicts(conflictStats: any): void {
    // Utiliser les vraies stats des conflits
    this.stats.weeklyConflicts = conflictStats.detectedThisWeek || 0;
    this.stats.conflictsTrend = conflictStats.detectedThisWeek - (conflictStats.totalConflicts - conflictStats.detectedThisWeek);
    
    // Créer une liste de conflits pour l'affichage (top 10 pending)
    this.conflicts = [];
    
    // Note: Pour afficher les vrais conflits dans le tableau, il faudrait faire un appel séparé
    // Pour l'instant, on affiche juste les stats
  }

  getRoomName(roomId: string): string {
    if (!roomId) return 'Salle inconnue';
    const room = this.rooms.find(r => (r.idSalle || r.id) === roomId);
    return room?.nomsalle || room?.name || `Salle ${roomId.substring(0, 8)}`;
  }

  formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  formatDateDisplay(date: Date): string {
    if (!date || isNaN(date.getTime())) return '';
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    return `${day}/${month}`;
  }

  formatTimeRange(start: string, end: string): string {
    if (!start || !end) return '';
    try {
      const startDate = new Date(start);
      const endDate = new Date(end);
      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) return '';
      const startTime = `${startDate.getHours().toString().padStart(2, '0')}:${startDate.getMinutes().toString().padStart(2, '0')}`;
      const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
      return `${startTime}-${endTime}`;
    } catch {
      return '';
    }
  }

  // FIN


   toggleSidebar(): void {
     console.log('Toggle sidebar');
     // TODO: Implement sidebar toggle for mobile
   }

   onSearch(): void {
     console.log('Search clicked');
     // TODO: Implement search functionality
   }

   onNotifications(): void {
     console.log('Notifications clicked');
     // TODO: Open notifications panel
   }

   onResolveConflict(conflict: Conflict): void {
     console.log('Resolve conflict:', conflict);
     // TODO: Open conflict resolution modal
   }
}
