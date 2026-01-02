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
  // Podaci koje korisnik unosi (PAN, CVV...)
  cardData = {
    pan: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    amount: 5000 // Ovo bi trebalo da stigne sa backenda, ali za sad hardkodujemo
  };

  message = '';
  isSuccess = false;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit() {
    this.paymentId = this.route.snapshot.paramMap.get('paymentId') || '';

    // --- IZMENA: Čitamo iznos koji nam je Backend poslao kroz link ---
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    
    if (amountParam) {
      this.cardData.amount = Number(amountParam); // Upisujemo pravi iznos (2000)
    }
    
    console.log("Banka učitala iznos:", this.cardData.amount);
  }

  submitPayment() {
    console.log("Šaljem podatke Banci...", this.cardData);

    // Šaljemo direktno na Bank Service (preko Gateway-a na /bank/...)
    this.http.post('http://localhost:8080/bank/api/bank/pay', this.cardData)
      .subscribe({
        next: (res) => {
          this.isSuccess = true;
          this.message = "✅ PLAĆANJE USPEŠNO IZVRŠENO!";
          // Ovde bi posle par sekundi trebalo vratiti korisnika na Web Shop
        },
        error: (err) => {
          this.isSuccess = false;
          this.message = "❌ PLAĆANJE ODBIJENO: " + (err.error || "Nepoznata greška");
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