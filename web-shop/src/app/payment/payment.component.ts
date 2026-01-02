import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PaymentService } from '../services/payment.service'; // <--- Importuj servis

@Component({
  selector: 'app-payment',
  standalone: true,
  imports: [CommonModule, FormsModule], // HttpClientModule više ne treba ovde jer je u app.config
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.css']
})
export class PaymentComponent {

  // Podaci za inicijalizaciju (Tabela 1 iz specifikacije)
  transaction: any = {
    amount: 5000,            // Podrazumevana vrednost
    currency: 'RSD',        
    merchantId: '12345',     // Mora se poklapati sa onim u bazi (ako proveravaš)
    merchantPassword: 'password', 
    merchantOrderId: '',     
    merchantTimestamp: '',
    successUrl: 'http://localhost:4200/success',
    failedUrl: 'http://localhost:4200/failed',
    errorUrl: 'http://localhost:4200/error'
  };

  responseMessage = '';
  isError = false;

  // Ubacujemo servis u konstruktor
  constructor(private paymentService: PaymentService) {}

  initiatePayment() {
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
           // --- IZMENA OVDE: Dodajemo iznos na kraj linka ---
           const finalUrl = `${response.paymentUrl}?amount=${this.transaction.amount}`;
           
           console.log("Preusmeravam na:", finalUrl);
           window.location.href = finalUrl;
        }
      },
      error: (error) => {
        console.error('Greška:', error);
        this.isError = true;
        this.responseMessage = '❌ Greška pri komunikaciji sa serverom (Proveri API Gateway).';
      }
    });
  }
}