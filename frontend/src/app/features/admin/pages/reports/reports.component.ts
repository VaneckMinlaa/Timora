import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { User, UserRole, UserFilter, CreateUserRequest, UpdateUserRequest, School } from '../../../../core/models/user.model';
import { UserService } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { AuthUser } from '../../../../core/models';

import { getUserInitials, getUserAvatarColor } from '../../../../core/utils/user.utils';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './reports.component.html',
  styleUrls: ['./reports.component.scss']
})
export class ReportsComponent {
  userInitials: string = 'TI';
      userDisplayName: string = 'Timora IUSJC';
      userEmail: string = 'vaneck.minlaa@gmail.com';
      avatarColor: string = '#2563eb';

      toggleSidebar(): void {
          console.log('Toggle sidebar');
        }

        onSearch(): void {
          console.log('Search clicked');
        }

        onNotifications(): void {
          console.log('Notifications clicked');
        }
  }
