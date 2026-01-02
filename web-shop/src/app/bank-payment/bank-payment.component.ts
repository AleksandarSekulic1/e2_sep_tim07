import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router'; // Dodali smo Router
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-bank-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-payment.component.html',
  styleUrls: ['./bank-payment.component.css']
})
export class BankPaymentComponent implements OnInit {

  paymentId: string = '';
  cardType: string = '';
  successUrl: string = '';
  failedUrl: string = '';
  
  // Podaci koje korisnik unosi
  cardData = {
    pan: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    amount: 5000,
    merchantOrderId: ''
  };

  message = '';
  isSuccess = false;
  isProcessing = false; // <--- NOVO: Sprečava duple klikove

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private router: Router // Injektovan ruter
  ) {}

  ngOnInit() {
    this.paymentId = this.route.snapshot.paramMap.get('paymentId') || '';

    // Hvatamo parametre iz URL-a
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    if (amountParam) this.cardData.amount = Number(amountParam);

    const orderIdParam = this.route.snapshot.queryParamMap.get('merchantOrderId');
    if (orderIdParam) {
        this.cardData.merchantOrderId = orderIdParam;
    }

    // Čuvamo URL-ove za povratak na WebShop
    this.successUrl = this.route.snapshot.queryParamMap.get('successUrl') || '';
    this.failedUrl = this.route.snapshot.queryParamMap.get('failedUrl') || '';
  }

  submitPayment() {
    if (this.isProcessing) return; // Blokiraj ako je već u toku

    this.isProcessing = true;
    this.message = "⏳ Obrada transakcije...";

    console.log("Šaljem podatke Banci...", this.cardData);

    // Šaljemo podatke na Bank service
    this.http.post('http://localhost:8080/bank/api/bank/pay', this.cardData)
      .subscribe({
        next: (res: any) => {
          this.isSuccess = true;
          this.message = "✅ PLAĆANJE USPEŠNO! Preusmeravanje na WebShop...";
          
          // Sačekaj 3 sekunde da korisnik vidi poruku, pa redirekcija
          setTimeout(() => {
             if (this.successUrl) {
               window.location.href = decodeURIComponent(this.successUrl);
             } else {
               // Fallback ako WebShop nije poslao URL
               this.router.navigate(['/transactions']);
             }
          }, 3000);
        },
        error: (err) => {
          this.isSuccess = false;
          this.isProcessing = false; // Dozvoli ponovni pokušaj na ovoj formi ako je banka vratila grešku
          
          // Prikaz greške (npr. INVALID_CVV, CARD_EXPIRED)
          this.message = "❌ PLAĆANJE ODBIJENO: " + (err.error || "Sistemska greška");
          
          // Opciono: Redirekcija na failedUrl nakon 3 sekunde
          setTimeout(() => {
            if (this.failedUrl) {
              window.location.href = decodeURIComponent(this.failedUrl);
            }
          }, 3000);
        }
      });
  }

  detectCardType() {
    const pan = this.cardData.pan ? this.cardData.pan.replace(/\s+/g, '') : '';
    if (!pan) {
      this.cardType = '';
      return;
    }

    // Dinamički logo (Tačka 4.a)
    if (pan.startsWith('4')) {
      this.cardType = 'visa';
    } else if (pan.startsWith('5') || pan.startsWith('2')) {
      this.cardType = 'mastercard';
    } else {
      this.cardType = '';
    }
  }   
}