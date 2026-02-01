import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService, User } from './services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'web-shop';

  constructor(public authService: AuthService) {}

  get isAuthenticated(): boolean {
    return this.authService.isAuthenticated();
  }

  get currentUser(): User | null {
    return this.authService.getCurrentUser();
  }

  get isCustomer(): boolean {
    return this.authService.isCustomer();
  }

  get isSuperAdmin(): boolean {
    return this.authService.isSuperAdmin();
  }

  logout(): void {
    this.authService.logout();
  }
}
