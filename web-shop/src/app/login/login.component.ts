import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { finalize } from 'rxjs/operators';
import { AuthService, LoginRequest } from '../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginData: LoginRequest = {
    usernameOrEmail: '',
    password: ''
  };

  isLoading = false;
  errorMessage = '';
  successMessage = '';
  returnUrl = '/';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    // If already logged in, redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/';
  }

  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.loginData.usernameOrEmail?.trim()) {
      this.errorMessage = 'Unesite korisničko ime ili email';
      return;
    }

    if (!this.loginData.password) {
      this.errorMessage = 'Unesite lozinku';
      return;
    }

    this.isLoading = true;

    this.authService.login(this.loginData)
      .pipe(finalize(() => this.isLoading = false))
      .subscribe({
        next: (response) => {
          this.successMessage = 'Prijava uspešna!';
          setTimeout(() => {
            this.router.navigate([this.returnUrl]);
          }, 500);
        },
        error: (error) => {
          this.errorMessage = this.parseErrorMessage(error);
        }
      });
  }

  private parseErrorMessage(error: any): string {
    if (error.error) {
      if (typeof error.error === 'string') {
        return error.error;
      }
      if (error.error.error) {
        return error.error.error;
      }
      if (error.error.message) {
        return error.error.message;
      }
    }
    if (error.status === 0) {
      return 'Nije moguće povezati se sa serverom. Proverite internet konekciju.';
    }
    if (error.status === 401) {
      return 'Pogrešno korisničko ime ili lozinka.';
    }
    if (error.status === 423) {
      return 'Nalog je zaključan. Pokušajte ponovo kasnije.';
    }
    return 'Prijava nije uspela. Proverite unete podatke.';
  }
}
