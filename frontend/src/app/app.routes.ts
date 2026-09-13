import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./features/home/pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'auth/forgot-password',
    loadComponent: () => import('./features/auth/pages/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent)
  },
  {
    path: 'auth/verify-reset-code',
    loadComponent: () => import('./features/auth/pages/verify-reset-code/verify-reset-code.component').then(m => m.VerifyResetCodeComponent)
  },
  {
    path: 'auth/reset-success',
    loadComponent: () => import('./features/auth/pages/reset-success/reset-success.component').then(m => m.ResetSuccessComponent)
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent as any),
    data: { role: 'USER', redirect: true }
  },
  {
    path: 'rooms',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/rooms/pages/room-list/room-list.component').then(m => m.RoomListComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/rooms/pages/room-detail/room-detail.component').then(m => m.RoomDetailComponent)
      }
    ],
    data: { role: 'USER' }
  },
  {
    path: 'reservations',
    canActivate: [authGuard],
    children: [
      {
        path: '',
        loadComponent: () => import('./features/reservations/pages/reservation-list/reservation-list.component').then(m => m.ReservationListComponent)
      },
      {
        path: 'create',
        loadComponent: () => import('./features/reservations/pages/create-reservation/create-reservation.component').then(m => m.CreateReservationComponent)
      },
      {
        path: ':id',
        loadComponent: () => import('./features/reservations/pages/reservation-detail/reservation-detail.component').then(m => m.ReservationDetailComponent)
      }
    ],
    data: { role: 'USER' }
  },
  {
    path: 'profile',
    canActivate: [authGuard],
    loadComponent: () => import('./features/profile/pages/profile/profile.component').then(m => m.ProfileComponent),
    data: { role: 'USER' }
  },

  {
    path: 'admin',
    canActivate: [authGuard],
    loadComponent: () => import('./features/admin/admin-layout/admin-layout').then(m => m.AdminLayoutComponent),
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/admin/pages/dashboard/dashboard.component').then(m => m.DashboardComponent as any)
      },
      {
        path: 'users',
        loadComponent: () => import('./features/admin/pages/user-management/user-management.component').then(m => m.Users)
      },
      {
        path: 'students',
        loadComponent: () => import('./features/admin/pages/student-management/student-management.component').then(m => m.StudentManagement)
      },
      {
        path: 'rooms',
        loadComponent: () => import('./features/admin/pages/room-management/room-management.component').then(m => m.RoomManagementComponent)
      },
      {
        path: 'reservations',
        loadComponent: () => import('./features/admin/pages/reservation-management/reservation-management.component').then(m => m.ReservationManagementComponent)
      },
      {
        path: 'courses',
        loadComponent: () => import('./features/admin/pages/courses/courses.component').then(m => m.CoursesComponent)
      },
      {
        path: 'structure',
        loadComponent: () => import('./features/admin/pages/department-management/department-management.component').then(m => m.DepartmentManagementComponent)
      },
      {
        path: 'ecoles',
        loadComponent: () => import('./features/admin/pages/ecole-management/ecole-management.component').then(m => m.EcoleManagementComponent)
      },
      {
        path: 'resources',
        loadComponent: () => import('./features/admin/pages/resources/resources.component').then(m => m.ResourcesComponent)
      },
      {
        path: 'schedules',
        loadComponent: () => import('./features/admin/pages/schedule-management/schedule-management.component').then(m => m.ScheduleManagementComponent)
      },
      {
        path: 'reports',
        loadComponent: () => import('./features/admin/pages/reports/reports.component').then(m => m.ReportsComponent)
      },
      {
        path: 'conflicts',
        loadComponent: () => import('./features/admin/pages/conflicts/conflicts.component').then(m => m.ConflictsComponent)
      }
    ],
    data: { role: 'ADMIN' }
  },
  {
    path: 'teacher',
    canActivate: [authGuard],
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./features/teacher/pages/dashboard/dashboard.component').then(m => m.TeacherDashboardComponent)
      },
      {
        path: 'schedules',
        loadComponent: () => import('./features/teacher/pages/schedules/schedules.component').then(m => m.TeacherSchedulesComponent)
      }
    ],
    data: { role: 'USER' }
  },
  {
    path: 'calendar',
    canActivate: [authGuard],
    children: [
      {
        path: 'sync',
        loadComponent: () => import('./features/calendar/pages/sync/sync.component').then(m => m.CalendarSyncComponent)
      }
    ],
    data: { role: 'USER' }
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/pages/notifications/notifications.component').then(m => m.NotificationsComponent),
    data: { role: 'USER' }
  },
  {
    path: '**',
    redirectTo: '/login'
  }
];
