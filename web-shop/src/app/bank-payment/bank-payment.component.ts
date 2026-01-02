import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
  // Podaci koje korisnik unosi (PAN, CVV...)
  cardData = {
    pan: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    amount: 5000,
    merchantOrderId: '' // <--- NOVO POLJE
  };

  message = '';
  isSuccess = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.paymentId = this.route.snapshot.paramMap.get('paymentId') || '';

    // Hvatamo iznos
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    if (amountParam) this.cardData.amount = Number(amountParam);

    // --- IZMENA: Hvatamo i ID transakcije ---
    const orderIdParam = this.route.snapshot.queryParamMap.get('merchantOrderId');
    if (orderIdParam) {
        this.cardData.merchantOrderId = orderIdParam;
        console.log("ID Transakcije uhvaćen:", this.cardData.merchantOrderId);
    }

    this.successUrl = this.route.snapshot.queryParamMap.get('successUrl') || '';
    this.failedUrl = this.route.snapshot.queryParamMap.get('failedUrl') || '';
  }

  submitPayment() {
    console.log("Šaljem podatke Banci...", this.cardData);

    this.http.post('http://localhost:8080/bank/api/bank/pay', this.cardData)
      .subscribe({
        next: (res) => {
          this.isSuccess = true;
          this.message = "✅ PLAĆANJE USPEŠNO IZVRŠENO! Preusmeravanje...";
          
          // --- IZMENA: Tajmer od 3 sekunde pa redirekcija ---
          setTimeout(() => {
             if (this.successUrl) {
               console.log("Vraćam na Web Shop:", this.successUrl);
               // Moramo dekodirati URL pre upotrebe (jer smo ga enkodirali na početku)
               window.location.href = decodeURIComponent(this.successUrl);
             } else {
               alert("Nemam gde da te vratim! (successUrl fali)");
             }
          }, 3000); // 3000ms = 3 sekunde
        },
        error: (err) => {
          this.isSuccess = false;
          this.message = "❌ PLAĆANJE ODBIJENO: " + (err.error || "Greška");
          
          // Opciono: Možeš i ovde staviti tajmer za failedUrl ako želiš
        }
      });
  }

  detectCardType() {
    // Čistimo razmake da bi provera radila lako
    const pan = this.cardData.pan ? this.cardData.pan.replace(/\s+/g, '') : '';
    
    if (!pan) {
      this.cardType = '';
      return;
    }

    if (pan.startsWith('4')) {
      this.cardType = 'visa';
    } else if (pan.startsWith('5') || pan.startsWith('2')) {
      this.cardType = 'mastercard';
    } else {
      this.cardType = '';
    }
  }  
}