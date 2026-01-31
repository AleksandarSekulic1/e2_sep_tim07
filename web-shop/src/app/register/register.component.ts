import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService, RegisterRequest } from '../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  registerData: RegisterRequest = {
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  };
  
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    // If already logged in, redirect
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/']);
    }
  }

  onSubmit(): void {
    // Clear previous messages
    this.errorMessage = '';
    this.successMessage = '';

    // Validation
    if (!this.registerData.username?.trim()) {
      this.errorMessage = 'Korisničko ime je obavezno';
      return;
    }

    if (this.registerData.username.length < 3) {
      this.errorMessage = 'Korisničko ime mora imati najmanje 3 karaktera';
      return;
    }

    if (!this.registerData.email?.trim()) {
      this.errorMessage = 'Email adresa je obavezna';
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.registerData.email)) {
      this.errorMessage = 'Unesite ispravnu email adresu';
      return;
    }

    if (!this.registerData.password) {
      this.errorMessage = 'Lozinka je obavezna';
      return;
    }

    if (this.registerData.password.length < 8) {
      this.errorMessage = 'Lozinka mora imati najmanje 8 karaktera';
      return;
    }

    // Password strength validation
    const hasUpperCase = /[A-Z]/.test(this.registerData.password);
    const hasLowerCase = /[a-z]/.test(this.registerData.password);
    const hasNumbers = /\d/.test(this.registerData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(this.registerData.password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      this.errorMessage = 'Lozinka mora sadržati veliko slovo, malo slovo, broj i specijalni karakter';
      return;
    }

    if (!this.confirmPassword) {
      this.errorMessage = 'Potvrdite lozinku';
      return;
    }

    if (this.registerData.password !== this.confirmPassword) {
      this.errorMessage = 'Lozinke se ne podudaraju';
      return;
    }

    this.isLoading = true;

    this.authService.register(this.registerData).subscribe({
      next: (response) => {
        this.isLoading = false;
        this.successMessage = 'Registracija uspešna! Preusmeravanje...';
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 1000);
      },
      error: (error) => {
        this.isLoading = false;
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
      if (error.error.errors && Array.isArray(error.error.errors)) {
        return error.error.errors.join(', ');
      }
    }
    if (error.status === 0) {
      return 'Nije moguće povezati se sa serverom. Proverite internet konekciju.';
    }
    if (error.status === 400) {
      return 'Neispravan zahtev. Proverite unete podatke.';
    }
    if (error.status === 409) {
      return 'Korisničko ime ili email već postoji.';
    }
    return 'Registracija nije uspela. Pokušajte ponovo.';
  }
}
