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

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService
  ) {}

  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') || '';
    
    // --- IZMENA: Hvatamo iznos iz URL-a ---
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    if (amountParam) {
      this.amount = Number(amountParam); // Ako postoji u linku, koristi taj (npr. 2000)
    } else {
      this.amount = 5000; // Ako ne postoji, koristi default
    }
    
    console.log("Stigli na PSP. ID:", this.transactionId, "Iznos:", this.amount);
  }

  chooseCard() {
    console.log("Biramo plaćanje karticom...");
    
    const request = {
      merchantOrderId: this.transactionId,
      amount: this.amount, // --- IZMENA: Šaljemo onaj iznos koji smo uhvatili (2000)
      currency: "RSD",
      merchantTimestamp: new Date().toISOString()
    };

    this.paymentService.payWithCard(request).subscribe({
      next: (response: any) => {
        if (response.paymentUrl) {
          window.location.href = response.paymentUrl;
        }
      },
      error: (err: any) => {
        console.error("Greška:", err);
        alert("Greška: Card servis ili Banka nisu dostupni.");
      }
    });
  }
}