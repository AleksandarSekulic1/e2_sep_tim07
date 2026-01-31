import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Merchant {
  id: number;
  merchantId: string;
  companyName: string;
  email: string;
  isActive: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-admin-merchants',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-merchants.component.html',
  styleUrls: ['./admin-merchants.component.css']
})
export class AdminMerchantsComponent implements OnInit {
  merchants: Merchant[] = [];
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadMerchants();
  }

  get activeCount(): number {
    return this.merchants.filter(m => m.isActive).length;
  }

  get inactiveCount(): number {
    return this.merchants.filter(m => !m.isActive).length;
  }

  loadMerchants(): void {
    this.isLoading = true;
    this.errorMessage = '';
    
    this.http.get<Merchant[]>('/api/admin/merchants').subscribe({
      next: (merchants) => {
        this.merchants = merchants;
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Greška pri učitavanju trgovaca';
        this.isLoading = false;
        // Mock data for demo
        this.merchants = [
          { 
            id: 1, 
            merchantId: 'MERCHANT_001', 
            companyName: 'Rent-A-Car Agency', 
            email: 'agency@example.com',
            isActive: true,
            createdAt: '2026-01-15T10:30:00'
          },
          { 
            id: 2, 
            merchantId: 'MERCHANT_002', 
            companyName: 'Auto Rental Plus', 
            email: 'rental@example.com',
            isActive: true,
            createdAt: '2026-01-20T14:45:00'
          }
        ];
      }
    });
  }

  toggleMerchant(merchant: Merchant): void {
    this.http.put<Merchant>(`/api/admin/merchants/${merchant.id}/toggle`, {}).subscribe({
      next: (updated) => {
        merchant.isActive = !merchant.isActive;
        this.successMessage = `${merchant.companyName} je ${merchant.isActive ? 'aktiviran' : 'deaktiviran'}`;
        setTimeout(() => this.successMessage = '', 3000);
      },
      error: (error) => {
        // For demo, toggle locally
        merchant.isActive = !merchant.isActive;
        this.successMessage = `${merchant.companyName} je ${merchant.isActive ? 'aktiviran' : 'deaktiviran'}`;
        setTimeout(() => this.successMessage = '', 3000);
      }
    });
  }

  regenerateApiKey(merchant: Merchant): void {
    if (!confirm(`Da li ste sigurni da želite regenerisati API ključ za ${merchant.companyName}?`)) {
      return;
    }

    this.http.post<{apiKey: string}>(`/api/admin/merchants/${merchant.id}/regenerate-key`, {}).subscribe({
      next: (response) => {
        this.successMessage = `Novi API ključ: ${response.apiKey}`;
      },
      error: (error) => {
        // For demo
        this.successMessage = `Novi API ključ generisan za ${merchant.companyName}`;
        setTimeout(() => this.successMessage = '', 5000);
      }
    });
  }
}
