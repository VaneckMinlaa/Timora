import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';

@Component({
  selector: 'app-room-list',
  standalone: true,
  imports: [CommonModule, Sidebar, TeacherHeaderComponent],
  templateUrl: './room-list.component.html',
  styleUrls: ['./room-list.component.scss']
})
export class RoomListComponent {}
