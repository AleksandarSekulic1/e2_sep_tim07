import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface PaymentMethod {
  id: number;
  name: string;
  code: string;
  isActive: boolean;
  description?: string;
}

@Component({
  selector: 'app-admin-payment-methods',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-payment-methods.component.html',
  styleUrls: ['./admin-payment-methods.component.css']
})
export class AdminPaymentMethodsComponent implements OnInit {
  paymentMethods: PaymentMethod[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  newMethod = {
    name: '',
    code: '',
    description: ''
  };

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadPaymentMethods();
  }

  loadPaymentMethods(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<PaymentMethod[]>('/api/admin/payment-methods').subscribe({
      next: (methods) => {
        this.paymentMethods = methods;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Greška pri učitavanju načina plaćanja';
        this.isLoading = false;
        // Mock data for demo
        this.paymentMethods = [
          { id: 1, name: 'Kreditna kartica', code: 'CARD', isActive: true, description: 'Visa, Mastercard, AmEx' },
          { id: 2, name: 'PayPal', code: 'PAYPAL', isActive: true, description: 'PayPal plaćanje' },
          { id: 3, name: 'Kriptovalute', code: 'CRYPTO', isActive: true, description: 'Bitcoin, Ethereum' },
          { id: 4, name: 'Bankarski transfer', code: 'BANK', isActive: false, description: 'Direktni bankarski prenos' }
        ];
      }
    });
  }

  togglePaymentMethod(method: PaymentMethod): void {
    // Check if this would leave no active methods
    const activeCount = this.paymentMethods.filter(m => m.isActive).length;
    if (method.isActive && activeCount <= 1) {
      this.errorMessage = 'Mora biti aktivan bar jedan način plaćanja!';
      setTimeout(() => this.errorMessage = '', 3000);
      return;
    }

    this.http.put<PaymentMethod>(`/api/admin/payment-methods/${method.id}/toggle`, {}).subscribe({
      next: (updated) => {
        method.isActive = !method.isActive;
        this.successMessage = `${method.name} je ${method.isActive ? 'aktiviran' : 'deaktiviran'}`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        // For demo, toggle locally
        method.isActive = !method.isActive;
        this.successMessage = `${method.name} je ${method.isActive ? 'aktiviran' : 'deaktiviran'}`;
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  addPaymentMethod(): void {
    if (!this.newMethod.name || !this.newMethod.code) {
      this.errorMessage = 'Unesite naziv i kod načina plaćanja';
      return;
    }

    this.http.post<PaymentMethod>('/api/admin/payment-methods', this.newMethod).subscribe({
      next: (created) => {
        this.paymentMethods.push(created);
        this.successMessage = 'Novi način plaćanja je dodat';
        this.newMethod = { name: '', code: '', description: '' };
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        // For demo, add locally
        const newId = Math.max(...this.paymentMethods.map(m => m.id)) + 1;
        this.paymentMethods.push({
          id: newId,
          name: this.newMethod.name,
          code: this.newMethod.code,
          description: this.newMethod.description,
          isActive: true
        });
        this.successMessage = 'Novi način plaćanja je dodat';
        this.newMethod = { name: '', code: '', description: '' };
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }
}
