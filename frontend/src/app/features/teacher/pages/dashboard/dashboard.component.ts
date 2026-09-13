import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Subject, forkJoin, of } from 'rxjs';
import { catchError, takeUntil, map } from 'rxjs/operators';
import { AuthService } from '../../../../core/services/auth.service';
import { ReservationService } from '../../../../core/services/reservation.service';
import { ScheduleService } from '../../../../core/services/schedule.service';
import { ConflictService } from '../../../../core/services/conflict.service';
import { CourseService } from '../../../../core/services/course.service';
import { AuthUser, Reservation, Course, Conflict } from '../../../../core/models';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';
import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';
import { ToastNotificationService } from '../../../../core/services/toast-notification.service';
import { NgApexchartsModule } from 'ng-apexcharts';

interface TeacherDashboardStats {
  totalReservations: number;
  reservationsTrend: number;
  totalCourses: number;
  coursesTrend: number;
  totalConflicts: number;
  conflictsTrend: number;
  plannedHours: number;
  plannedHoursTrend: number;
}

interface HourlyOccupancy {
  hour: string;
  reservations: number;
}

@Component({
  selector: 'app-teacher-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, NgApexchartsModule, Sidebar, TeacherHeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class TeacherDashboardComponent implements OnInit, OnDestroy {
  currentUser: AuthUser | null = null;
  userDisplayName: string = 'Enseignant';
  userInitials: string = 'U';
  avatarColor: string = '#2563eb';
  userProfilePhoto: string | null = null;

  isLoading: boolean = false;

  // Statistiques
  stats: TeacherDashboardStats = {
    totalReservations: 0,
    reservationsTrend: 0,
    totalCourses: 0,
    coursesTrend: 0,
    totalConflicts: 0,
    conflictsTrend: 0,
    plannedHours: 0,
    plannedHoursTrend: 0
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
  upcomingReservations: Reservation[] = [];
  courses: Course[] = [];
  upcomingCourses: Course[] = [];
  conflicts: Conflict[] = [];
  hourlyOccupancy: HourlyOccupancy[] = [];

  private destroy$ = new Subject<void>();
  private authService = inject(AuthService);
  private reservationService = inject(ReservationService);
  private scheduleService = inject(ScheduleService);
  private conflictService = inject(ConflictService);
  private courseService = inject(CourseService);
  private toastService = inject(ToastNotificationService);

  ngOnInit(): void {
    this.initChartConfigs();
    this.loadUserInfo();
  }

  loadUserInfo(): void {
    this.authService.getCurrentUser$()
      .pipe(takeUntil(this.destroy$))
      .subscribe(user => {
        this.currentUser = user;
        if (user) {
          this.userDisplayName = `${user.firstName} ${user.lastName}`.trim() || 'Enseignant';
          this.userInitials = getUserInitials(user.id);
          this.avatarColor = getUserAvatarColor(user.id);
          this.userProfilePhoto = user.profilePhoto || null;
          
          // Charger les données du tableau de bord une fois l'utilisateur identifié
          this.loadDashboardData(user.id);
        }
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  initChartConfigs(): void {
    // 1. Column Chart - Réservations par jour
    this.barChartConfig = {
      chart: { type: 'bar', height: 280, toolbar: { show: false }, zoom: { enabled: false } },
      plotOptions: { 
        bar: { 
          horizontal: false, 
          columnWidth: '55%', 
          borderRadius: 8,
          distributed: false,
          dataLabels: { position: 'top' }
        } 
      },
      dataLabels: { 
        enabled: true,
        formatter: function (val: number) { return val.toString() },
        offsetY: -20,
        style: { fontSize: '12px', colors: ["#304758"] }
      },
      legend: { show: false },
      stroke: { show: true, width: 2, colors: ['transparent'] },
      xaxis: {
        categories: ['08h', '09h', '10h', '11h', '12h', '13h', '14h', '15h', '16h', '17h', '18h'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#6b7280', fontWeight: 600 } }
      },
      yaxis: { 
        show: true,
        labels: { formatter: (val: number) => val.toString() }
      },
      fill: { opacity: 1 },
      colors: ['#2563eb'],
      tooltip: {
        theme: 'light',
        y: { formatter: (val: number) => val + " réservation(s)" }
      }
    };

    // 2. Donut Chart - Distribution des réservations par type de salle
    this.donutChartConfig = {
      chart: { type: 'donut', height: 280 },
      colors: ['#2563eb', '#10b981', '#f59e0b', '#ef4444'],
      plotOptions: {
        pie: {
          donut: {
            size: '80%',
            labels: {
              show: true,
              name: { fontSize: '14px', fontWeight: 600, color: '#6b7280' },
              value: { fontSize: '16px', fontWeight: 700, color: '#111827' },
              total: {
                show: true,
                label: 'Total conflits',
                fontSize: '14px',
                fontWeight: 600,
                color: '#6b7280'
              }
            }
          }
        }
      },
      responsive: [
        { breakpoint: 480, options: { chart: { height: 200 }, plotOptions: { pie: { donut: { size: '70%' } } } } }
      ],
      stroke: { show: false },
      dataLabels: { enabled: false },
      legend: { show: false, position: 'right' }
    };

    // 3. Area Chart - Heures planifiées par semaine
    this.areaChartConfig = {
      chart: { type: 'area', height: 300, toolbar: { show: false }, zoom: { enabled: false }, sparkline: { enabled: false } },
      colors: ['#2563eb'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.05, stops: [20, 100, 100, 100] }
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: {
        categories: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        axisBorder: { show: false },
        axisTicks: { show: false },
        labels: { style: { colors: '#6b7280', fontWeight: 500 } }
      },
      yaxis: {
        show: true,
        labels: { 
          formatter: (val: number) => val + 'h',
          style: { colors: '#6b7280' }
        }
      },
      tooltip: {
        theme: 'light',
        y: { formatter: (val: number) => val + ' heures' }
      },
      grid: {
        borderColor: '#e2e8f0',
        strokeDashArray: 4,
        show: true
      }
    };
  }


  loadDashboardData(userId: string): void {
    this.isLoading = true;
    
    forkJoin({
      reservations: this.reservationService.getUserReservations(userId).pipe(
        catchError(() => of([]))
      ),
      courses: this.courseService.getCoursesByTeacher(userId).pipe(
        catchError(() => of([]))
      ),
      conflicts: this.conflictService.getAllConflicts().pipe(
        catchError(() => of([]))
      )
    }).pipe(takeUntil(this.destroy$))
      .subscribe(({ reservations, courses, conflicts }) => {
        this.reservations = reservations as Reservation[];
        this.courses = courses as Course[];
        this.conflicts = conflicts as Conflict[];

        this.processReservations();
        this.processCourses();
        this.processConflicts(userId);
        this.generateCharts();

        this.isLoading = false;
      }, (error) => {
        console.error('Erreur lors du chargement du tableau de bord:', error);
        this.isLoading = false;
        this.toastService.error('Erreur', 'Erreur lors du chargement des données du tableau de bord');
      });
  }

  processReservations(): void {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Réservations à venir
    this.upcomingReservations = this.reservations
      .filter(r => r.startDateTime && new Date(r.startDateTime) >= today)
      .sort((a, b) => {
        const aTime = a.startDateTime ? new Date(a.startDateTime).getTime() : 0;
        const bTime = b.startDateTime ? new Date(b.startDateTime).getTime() : 0;
        return aTime - bTime;
      })
      .slice(0, 5);

    // Statistiques
    this.stats.totalReservations = this.reservations.length;
    this.stats.reservationsTrend = 0;
  }

  processCourses(): void {
    // Note: Cours utilise jourSemaine + heures plutôt que dates absolues
    // Donc on ne peut pas filtrer par date actuelle
    
    // Prendre tous les cours (pas de filtrage par date pour ce modèle)
    this.upcomingCourses = this.courses.slice(0, 5);

    // Statistiques
    this.stats.totalCourses = this.courses.length;
    this.stats.coursesTrend = 0; 

    // Heures planifiées
    let totalHours = 0;
    this.courses.forEach(course => {
      if (course.heureDebut && course.heureFin) {
        const start = new Date(`2000-01-01T${course.heureDebut}`);
        const end = new Date(`2000-01-01T${course.heureFin}`);
        totalHours += (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
    });
    this.stats.plannedHours = Math.round(totalHours * 10) / 10;
    this.stats.plannedHoursTrend = 0;
  }

  processConflicts(userId: string): void {
    // Filtrer les conflits concernant cet enseignant (utilisation de teacherId)
    const teacherConflicts = this.conflicts.filter(c => 
      c.teacherId === userId
    );

    this.stats.totalConflicts = teacherConflicts.length;
    this.stats.conflictsTrend = teacherConflicts.length > 0 ? 2 : 0; 
  }

  generateCharts(): void {
    this.generateReservationChart();
    this.generateDonutChart();
    this.generateAreaChart();
  }

  generateReservationChart(): void {
    // Occupancy par Heure (08h à 18h)
    const hoursCount = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]; // 11 slots (08-18)
    
    this.reservations.forEach(reservation => {
      if (!reservation.startDateTime || !reservation.endDateTime) return;
      const start = new Date(reservation.startDateTime);
      const end = new Date(reservation.endDateTime);
      
      const startHour = start.getHours();
      const endHour = end.getHours();
      
      for (let h = startHour; h < endHour; h++) {
        if (h >= 8 && h <= 18) {
          hoursCount[h - 8]++;
        }
      }
    });

    // Ajouter aussi les cours
    this.courses.forEach(course => {
      if (!course.heureDebut || !course.heureFin) return;
      const startH = parseInt(course.heureDebut.split(':')[0]);
      const endH = parseInt(course.heureFin.split(':')[0]);
      
      for (let h = startH; h < endH; h++) {
        if (h >= 8 && h <= 18) {
          hoursCount[h - 8]++;
        }
      }
    });

    this.barChartSeries = [{ name: 'Occupancy', data: hoursCount }];
  }

  generateDonutChart(): void {
    // Grouper les conflits par type
    const typeMap = new Map<string, number>();
    
    // Mapping des types techniques vers des labels plus lisibles
    const typeLabels: {[key: string]: string} = {
      'ROOM_OVERLAP': 'Superposition salle',
      'TEACHER_OVERLAP': 'Superposition prof',
      'STUDENT_GROUP_OVERLAP': 'Superposition groupe',
      'ROOM_CAPACITY': 'Capacité salle',
      'EQUIPMENT_MISSING': 'Équipement manquant',
      'TEACHER_UNAVAILABLE': 'Indisponibilité prof',
      'TIME_OVERFLOW': 'Débordement horaire'
    };

    this.conflicts.forEach(conflict => {
      const label = typeLabels[conflict.type] || conflict.type || 'Autre';
      typeMap.set(label, (typeMap.get(label) || 0) + 1);
    });

    if (typeMap.size === 0) {
      // Fallback data si pas de conflits pour voir le graphique
      this.donutChartLabels = ['Pas de conflits'];
      this.donutChartSeries = [100];
      this.donutChartColors = ['#e5e7eb']; // Gris clair
      this.donutChartConfig.colors = this.donutChartColors;
      return;
    }

    this.donutChartLabels = Array.from(typeMap.keys());
    this.donutChartSeries = Array.from(typeMap.values());
    this.donutChartColors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#f97316', '#06b6d4'];
    this.donutChartConfig.colors = this.donutChartColors;
  }

  generateAreaChart(): void {
    // Heures planifiées par jour de la semaine (sans données de date réelles pour les cours)
    const hoursPerDay = [0, 0, 0, 0, 0, 0, 0];
    const daysOfWeek = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

    // Grouper les heures par jour de semaine
    this.courses.forEach(course => {
      if (!course.jourSemaine || !course.heureDebut || !course.heureFin) return;
      
      const dayIndex = daysOfWeek.findIndex(day => day.toLowerCase() === course.jourSemaine?.toLowerCase());
      if (dayIndex !== -1) {
        const start = new Date(`2000-01-01T${course.heureDebut}`);
        const end = new Date(`2000-01-01T${course.heureFin}`);
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
        hoursPerDay[dayIndex] += hours;
      }
    });

    this.areaChartSeries = [{
      name: 'Heures planifiées',
      data: hoursPerDay.map(h => Math.round(h * 10) / 10)
    }];
  }

  getConflictSeverity(conflict: Conflict): string {
    return conflict.severity || 'MEDIUM';
  }

  formatDate(date: string | Date): string {
    const d = new Date(date);
    return d.toLocaleDateString('fr-FR', { 
      weekday: 'short', 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  formatDateSafe(date: string | Date | undefined): string {
    if (!date) return 'N/A';
    return this.formatDate(date);
  }

  getReservationDuration(startDateTime: string | undefined, endDateTime: string | undefined): string {
    if (!startDateTime || !endDateTime) return '0h';
    try {
      const start = new Date(startDateTime).getTime();
      const end = new Date(endDateTime).getTime();
      const hours = (end - start) / (1000 * 60 * 60);
      return Math.round(hours * 10) / 10 + 'h';
    } catch {
      return '0h';
    }
  }
}

