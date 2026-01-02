import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; // Obavezno za ngIf, ngFor
import { FormsModule } from '@angular/forms';   // Obavezno za ngModel
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule], // Dodaj module ovde
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {

  // Model podataka koji šaljemo
  transaction = {
    merchantId: 'prodavnica-123', // Hardkodovano za sada (simulacija)
    merchantOrderId: Math.floor(Math.random() * 100000).toString(), // Random ID
    amount: 100.00,
    currency: 'RSD',
    paymentMethod: 'CARD', // Default
    merchantTimestamp: new Date().toISOString(),
    successUrl: 'http://localhost:4200/success',
    failedUrl: 'http://localhost:4200/failed',
    errorUrl: 'http://localhost:4200/error'
  };

  // Opcije za plaćanje [cite: 13]
  paymentMethods = [
    { value: 'CARD', label: 'Platna Kartica' },
    { value: 'QR', label: 'IPS QR Kod' },
    { value: 'PAYPAL', label: 'PayPal' },
    { value: 'CRYPTO', label: 'Kriptovaluta' }
  ];

  responseMessage = '';

  constructor(private http: HttpClient) {}

  initiatePayment() {
    console.log('Šaljem zahtev:', this.transaction);

    // Šaljemo na Gateway -> Core Service
    this.http.post('http://localhost:8080/core/transactions', this.transaction)
      .subscribe({
        next: (response: any) => {
          console.log('Uspeh:', response);
          this.responseMessage = 'Inicijalizovano! ID Transakcije: ' + response.id;
          // Ovde ćemo kasnije dodati redirekciju na Card/PayPal servis
        },
        error: (error) => {
          console.error('Greška:', error);
          this.responseMessage = 'Greška pri komunikaciji: ' + error.message;
        }
      });
  }
}