import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {

  // Ovi podaci se menjaju kroz formu
  transaction = {
    amount: null,            // Korisnik unosi
    currency: 'RSD',         // Korisnik bira (default RSD)
    paymentMethod: 'CARD',   // Korisnik bira (default CARD)
    
    // Ovi podaci su sistemski (korisnik ih ne vidi/ne menja)
    merchantId: 'prodavnica-auto-rent', 
    merchantOrderId: '',     
    merchantTimestamp: '',
    successUrl: 'http://localhost:4200/success',
    failedUrl: 'http://localhost:4200/failed',
    errorUrl: 'http://localhost:4200/error'
  };

  paymentMethods = [
    { value: 'CARD', label: '💳 Platna Kartica' },
    { value: 'QR', label: '📱 IPS QR Kod' },
    { value: 'PAYPAL', label: '🅿️ PayPal' },
    { value: 'CRYPTO', label: '₿ Kriptovaluta' }
  ];

  responseMessage = '';
  isError = false;

  constructor(private http: HttpClient) {}

  initiatePayment() {
    // 1. Validacija
    if (!this.transaction.amount || this.transaction.amount <= 0) {
      this.isError = true;
      this.responseMessage = 'Molimo unesite validan iznos.';
      return;
    }

    // 2. Popunjavanje sistemskih podataka pre slanja
    this.transaction.merchantOrderId = Math.floor(Math.random() * 1000000).toString(); // Generisemo novi ID narudzbine
    this.transaction.merchantTimestamp = new Date().toISOString(); // Trenutno vreme

    console.log('Šaljem zahtev:', this.transaction);

    // 3. Slanje na Gateway
    this.http.post('http://localhost:8080/core/transactions', this.transaction)
      .subscribe({
        next: (response: any) => {
          console.log('Uspeh:', response);
          this.isError = false;
          // Prikazujemo lepšu poruku korisniku
          this.responseMessage = `✅ Uspešno inicijalizovano! ID Transakcije: ${response.id}`;
          
          // Ovde ćemo kasnije dodati logiku:
          // Ako je CARD -> Redirekcija na Card Servis
          // Ako je PAYPAL -> Redirekcija na PayPal
        },
        error: (error) => {
          console.error('Greška:', error);
          this.isError = true;
          this.responseMessage = '❌ Greška pri komunikaciji sa serverom.';
        }
      });
  }
}