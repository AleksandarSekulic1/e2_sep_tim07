import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../services/payment.service';

@Component({
  selector: 'app-payment-methods',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './payment-methods.component.html',
  styleUrls: ['./payment-methods.component.css']
})
export class PaymentMethodsComponent implements OnInit {

  transactionId: string = '';
  amount: number = 0; // Ovde bismo idealno učitali iznos sa backenda, za sad može biti placeholder
  successUrl: string = '';
  failedUrl: string = '';

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') || '';
    
    // Hvatamo iznos
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    this.amount = amountParam ? Number(amountParam) : 5000;

    // --- IZMENA: Hvatamo URL-ove za povratak ---
    this.successUrl = this.route.snapshot.queryParamMap.get('successUrl') || 'http://localhost:4200/success';
    this.failedUrl = this.route.snapshot.queryParamMap.get('failedUrl') || 'http://localhost:4200/failed';
    
    console.log("PSP Podaci:", { id: this.transactionId, amount: this.amount, success: this.successUrl });
  }

  chooseCard() {
    console.log("Biramo plaćanje karticom...");
    
    const request = {
      merchantOrderId: this.transactionId,
      amount: this.amount,
      currency: "RSD",
      merchantTimestamp: new Date().toISOString()
    };

    this.paymentService.payWithCard(request).subscribe({
      next: (response: any) => {
        if (response.paymentUrl) {
          // --- IZMENA: Na link Banke "lepimo" naše success/failed linkove ---
          // Ovo radimo OVDE da ne bismo morali da menjamo Java kod
          const bankUrl = `${response.paymentUrl}&successUrl=${this.successUrl}&failedUrl=${this.failedUrl}`;
          
          window.location.href = bankUrl;
        }
      },
      error: (err: any) => {
        console.error("Greška:", err);
        alert("Greška: Card servis ili Banka nisu dostupni.");
      }
    });
  }

  chooseQR() {
  console.log("Biramo plaćanje QR kodom...");
  // Preusmeravamo na novu komponentu koju ćemo sad napraviti
  window.location.href = `http://localhost:4200/qr-payment/${this.transactionId}?amount=${this.amount}`;
}

}