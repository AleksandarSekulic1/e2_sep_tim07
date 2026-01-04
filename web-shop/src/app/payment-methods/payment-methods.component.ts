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
      // 1. pspTransactionId šaljemo Card servisu da bi on znao koju
      //    transakciju u bazi da ažurira na metodu "CARD"
      pspTransactionId: this.transactionId,

      // 2. merchantOrderId šaljemo Banki. UKLONJEN JE PREFIKS "ORDER-"
      //    tako da Banka vraća čist ID (npr. "105") Core servisu.
      //    Bez ovoga Core servis ne može da nađe transakciju i status ostaje CREATED.
      merchantOrderId: this.transactionId,

      amount: this.amount,
      currency: "RSD",
      merchantTimestamp: new Date().toISOString()
    };

    console.log("🚀 Šaljem ispravljen zahtev Card servisu:", request);

    this.paymentService.payWithCard(request).subscribe({
      next: (response: any) => {
        if (response.paymentUrl) {
          // Na link Banke lepimo success/failed linkove radi lakšeg povratka
          const bankUrl = `${response.paymentUrl}&successUrl=${this.successUrl}&failedUrl=${this.failedUrl}`;
          console.log("🔗 Preusmeravam na Banku:", bankUrl);
          window.location.href = bankUrl;
        }
      },
      error: (err: any) => {
        console.error("❌ Greška pri inicijalizaciji plaćanja:", err);
        alert("Greška: Card servis ili Banka nisu dostupni.");
      }
    });
  }

  chooseQR() {
    console.log("Biramo plaćanje QR kodom...");
    // Preusmeravamo na novu komponentu koju ćemo sad napraviti
    window.location.href = `http://localhost:4200/qr-payment/${this.transactionId}?amount=${this.amount}`;
  }

  choosePayPal() {
    console.log("Biramo plaćanje putem PayPal-a...");

    const request = {
      pspTransactionId: this.transactionId,
      merchantOrderId: this.transactionId,
      amount: this.amount,
      currency: "RSD",
      merchantTimestamp: new Date().toISOString()
    };

    console.log("🚀 Šaljem zahtev PayPal servisu:", request);

    this.paymentService.payWithPayPal(request).subscribe({
      next: (response: any) => {
        if (response.approvalUrl) {
          const paypalUrl = `${response.approvalUrl}&successUrl=${this.successUrl}&failedUrl=${this.failedUrl}`;
          console.log("🔗 Preusmeravam na PayPal:", paypalUrl);
          window.location.href = paypalUrl;
        }
      },
      error: (err: any) => {
        console.error("❌ Greška pri inicijalizaciji PayPal plaćanja:", err);
        alert("Greška: PayPal servis nije dostupan.");
      }
    });
  }

}
