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

  // --- IZMENA: cardType je sada samostalna promenljiva (za UI) ---
  cardType: string = ''; 

  // Ovi podaci se menjaju kroz formu
  transaction: any = { // Dodao sam ': any' da TypeScript ne gnjavi previse
    amount: null,            
    currency: 'RSD',        
    paymentMethod: 'CARD',   
    
    // Ovi podaci su sistemski
    merchantId: 'prodavnica-auto-rent', 
    merchantOrderId: '',     
    merchantTimestamp: '',
    successUrl: 'http://localhost:4200/success',
    failedUrl: 'http://localhost:4200/failed',
    errorUrl: 'http://localhost:4200/error',
    pan: '',
    cardHolder: '',
    expiryDate: '',
    cvv: ''
    // cardType smo sklonili odavde jer ne ide na server
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
    this.transaction.merchantOrderId = Math.floor(Math.random() * 1000000).toString(); 
    this.transaction.merchantTimestamp = new Date().toISOString(); 

    console.log('Šaljem zahtev:', this.transaction);

    // 3. Slanje na Gateway
    this.http.post('http://localhost:8080/core/transactions', this.transaction)
      .subscribe({
        next: (response: any) => {
          console.log('Uspeh:', response);
          this.isError = false;
          this.responseMessage = `✅ Uspešno inicijalizovano! ID Transakcije: ${response.id}`;
        },
        error: (error) => {
          console.error('Greška:', error);
          this.isError = true;
          this.responseMessage = '❌ Greška pri komunikaciji sa serverom.';
        }
      });
  }

  // --- FUNKCIJA ZA PREPOZNAVANJE KARTICE ---
  detectCardType() {
    const pan = this.transaction.pan;
    
    // Resetujemo ako je prazno
    if (!pan) {
      this.cardType = '';
      return;
    }

    // Visa počinje sa 4
    if (pan.startsWith('4')) {
      this.cardType = 'visa';
    } 
    // Mastercard počinje sa 5 ili 2
    else if (pan.startsWith('5') || pan.startsWith('2')) {
      this.cardType = 'mastercard';
    } 
    else {
      this.cardType = '';
    }
  }
}