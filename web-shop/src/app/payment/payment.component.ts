import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {

  // Default merchant credentials (Agencija za iznajmljivanje vozila)
  private readonly DEFAULT_MERCHANT_ID = 'AGENCY_001';
  private readonly DEFAULT_MERCHANT_PASSWORD = 'MerchantPass123!';

  // Podaci za inicijalizaciju (Tabela 1 iz specifikacije)
  transaction: any = {
    amount: 5000,            // Podrazumevana vrednost
    currency: 'RSD',
    merchantId: '',          // Učitavamo iz LocalStorage ili koristimo default
    merchantPassword: '',
    merchantOrderId: '',
    merchantTimestamp: '',
    successUrl: `${window.location.origin}/success`,
    failedUrl: `${window.location.origin}/failed`,
    errorUrl: `${window.location.origin}/error`
  };

  responseMessage = '';
  isError = false;

  constructor(
    private paymentService: PaymentService,
    public authService: AuthService,
    private router: Router
  ) {
    // Učitavanje merchant kredencijala iz LocalStorage ili koristi default
    const storedId = localStorage.getItem('merchantId');
    const storedPass = localStorage.getItem('merchantPassword');

    if (!storedId || !storedPass) {
      // Use default merchant (Agencija za iznajmljivanje vozila)
      console.log('ℹ️ Using default merchant: ' + this.DEFAULT_MERCHANT_ID);
      this.transaction.merchantId = this.DEFAULT_MERCHANT_ID;
      this.transaction.merchantPassword = this.DEFAULT_MERCHANT_PASSWORD;
      // Optionally save to localStorage
      localStorage.setItem('merchantId', this.DEFAULT_MERCHANT_ID);
      localStorage.setItem('merchantPassword', this.DEFAULT_MERCHANT_PASSWORD);
    } else {
      this.transaction.merchantId = storedId;
      this.transaction.merchantPassword = storedPass;
    }
  }

  initiatePayment() {
    // Check authentication before allowing payment
    if (!this.authService.isAuthenticated()) {
      this.isError = true;
      this.responseMessage = '🔐 Morate biti prijavljeni da biste izvršili rezervaciju.';
      setTimeout(() => {
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/payment' } });
      }, 1500);
      return;
    }

    // 1. Validacija
    if (!this.transaction.amount || this.transaction.amount <= 0) {
      this.isError = true;
      this.responseMessage = 'Molimo unesite validan iznos.';
      return;
    }

    // 2. Popunjavanje sistemskih podataka
    this.transaction.merchantOrderId = Math.floor(Math.random() * 1000000).toString();
    this.transaction.merchantTimestamp = new Date().toISOString();

    console.log('Šaljem zahtev ka Core servisu...', this.transaction);

    // 3. Poziv servisa
    this.paymentService.initiatePayment(this.transaction).subscribe({
      next: (response: any) => {
        console.log('Uspeh:', response);
        this.isError = false;

        if (response.paymentUrl) {
           // --- IZMENA: Šaljemo i successUrl i failedUrl kroz link ---
           // Koristimo encodeURIComponent da specijalni znaci (://) ne pokvare link
           const sUrl = encodeURIComponent(this.transaction.successUrl);
           const fUrl = encodeURIComponent(this.transaction.failedUrl);

           const finalUrl = `${response.paymentUrl}?amount=${this.transaction.amount}&currency=${this.transaction.currency}&successUrl=${sUrl}&failedUrl=${fUrl}`;

           console.log("Preusmeravam na:", finalUrl);
           window.location.href = finalUrl;
        }
      },
      error: (error) => {
        console.error('Greška:', error);
        this.isError = true;
        if (error.status === 401) {
          this.responseMessage = '🔐 Sesija je istekla. Molimo prijavite se ponovo.';
          setTimeout(() => {
            this.router.navigate(['/login']);
          }, 1500);
        } else {
          this.responseMessage = '❌ Greška pri komunikaciji sa serverom (Proveri API Gateway).';
        }
      }
    });
  }
}
