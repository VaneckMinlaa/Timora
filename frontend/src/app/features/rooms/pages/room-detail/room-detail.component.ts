import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Sidebar } from '../../../sidebar/sidebar';
import { TeacherHeaderComponent } from '../../../../core/components/teacher-header/teacher-header.component';

@Component({
  selector: 'app-room-detail',
  standalone: true,
  imports: [CommonModule, Sidebar, TeacherHeaderComponent],
  templateUrl: './room-detail.component.html',
  styleUrls: ['./room-detail.component.scss']
})
export class RoomDetailComponent {
  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      // Room ID is available in params['id']
    });
  }
}
