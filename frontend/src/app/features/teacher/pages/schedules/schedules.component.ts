import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';
import { ScheduleManagementComponent } from './schedules';

@Component({
  selector: 'app-teacher-schedules',
  standalone: true,
  imports: [CommonModule, Sidebar, TeacherHeaderComponent, ScheduleManagementComponent],
  template: `
    <div class="dashboard-layout">
      <!-- Sidebar -->
      <app-sidebar></app-sidebar>

      <!-- Main Content -->
      <div class="dashboard-container">
        <!-- Header -->
        <app-teacher-header pageTitle="Emploi du Temps et Disponibilité"></app-teacher-header>

        <!-- Main Content -->
        <main class="dashboard-main">
          <app-schedule-management></app-schedule-management>
        </main>
      </div>
    </div>
  `,
  styles: [`
    /* Layout avec Sidebar */
    .dashboard-layout {
      display: flex;
      min-height: 100vh;
      background: var(--bg-gradient);
    }

    .dashboard-container {
      font-family: 'Inter', sans-serif;
      flex: 1;
      display: flex;
      flex-direction: column;
      background: var(--bg-gradient);
      overflow-x: auto;
      min-width: 0;
    }

    .dashboard-main {
      flex: 1;
      padding: 0;
      padding-top: 72px; /* Compenser le header fixe */
      display: flex;
      flex-direction: column;
      gap: 0;
      overflow-y: auto;
    }

    .teacher-schedules {
      width: 100%;
    }
  `]
})
export class TeacherSchedulesComponent {}

