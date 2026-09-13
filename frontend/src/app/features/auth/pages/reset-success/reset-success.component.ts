import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

@Component({
  selector: 'app-reset-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './reset-success.component.html',
  styleUrls: ['./reset-success.component.scss']
})
export class ResetSuccessComponent implements OnInit {
  email: string = '';
  countdown: number = 5;
  private countdownInterval: any;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    // Récupérer l'email depuis les query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
    });

    // Démarrer le compte à rebours
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.countdownInterval = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.countdownInterval);
        this.goToLogin();
      }
    }, 1000);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }
}
