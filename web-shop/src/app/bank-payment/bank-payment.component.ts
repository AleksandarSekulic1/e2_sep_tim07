import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-bank-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bank-payment.component.html',
  styleUrls: ['./bank-payment.component.css']
})
export class BankPaymentComponent implements OnInit, OnDestroy {

  paymentId: string = '';
  cardType: string = '';
  successUrl: string = '';
  failedUrl: string = '';
  
  timeLeft: string = '15:00';
  isExpired: boolean = false;
  isExpiringSoon: boolean = false;
  private timerInterval: any;

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
  isProcessing = false;

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit() {
    this.paymentId = this.route.snapshot.paramMap.get('paymentId') || '';
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    if (amountParam) this.cardData.amount = Number(amountParam);

    const orderIdParam = this.route.snapshot.queryParamMap.get('merchantOrderId');
    if (orderIdParam) this.cardData.merchantOrderId = orderIdParam;

    const expiresAtParam = this.route.snapshot.queryParamMap.get('expiresAt');
    if (expiresAtParam) {
      this.startTimer(new Date(expiresAtParam));
    }

    this.successUrl = this.route.snapshot.queryParamMap.get('successUrl') || '';
    this.failedUrl = this.route.snapshot.queryParamMap.get('failedUrl') || '';
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
  }

  startTimer(expiryDate: Date) {
    this.timerInterval = setInterval(() => {
      const now = new Date().getTime();
      const distance = expiryDate.getTime() - now;

      if (distance < 0) {
        clearInterval(this.timerInterval);
        this.isExpired = true;
        this.timeLeft = '00:00';
        this.message = "❌ Sesija je istekla!";
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      this.timeLeft = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      this.isExpiringSoon = minutes < 2;
    }, 1000);
  }

  submitPayment() {
    if (this.isProcessing || this.isExpired) return;

    // --- KLJUČNA ISPRAVKA: Čišćenje PAN-a pre slanja ---
    // Ovo osigurava da backend dobije samo cifre, što je neophodno za LuhnCheck
    const cleanData = {
      ...this.cardData,
      pan: this.cardData.pan.replace(/\D/g, '') // Briše sve što nije broj
    };

    this.isProcessing = true;
    this.message = "⏳ Obrada transakcije...";

    this.http.post('http://localhost:8080/bank/api/bank/pay', cleanData)
      .subscribe({
        next: (res: any) => {
          this.isSuccess = true;
          this.message = "✅ PLAĆANJE USPEŠNO! Preusmeravanje...";
          if (this.timerInterval) clearInterval(this.timerInterval);
          
          setTimeout(() => {
             if (this.successUrl) {
               window.location.href = decodeURIComponent(this.successUrl);
             } else {
               this.router.navigate(['/transactions']);
             }
          }, 3000);
        },
        error: (err) => {
          this.isSuccess = false;
          this.isProcessing = false;
          // err.error bi trebao da sadrži "Neispravan broj kartice" ako Luhn ne prođe
          this.message = "❌ ODBIJENO: " + (err.error || "Sistemska greška");
          
          setTimeout(() => {
            if (this.failedUrl && !this.isProcessing) {
              window.location.href = decodeURIComponent(this.failedUrl);
            }
          }, 5000); // Produženo na 5s da korisnik vidi razlog (npr. LUHN_FAILED)
        }
      });
  }

  detectCardType() {
    // Čistimo PAN samo za potrebe detekcije vizuelnog tipa
    const pan = this.cardData.pan ? this.cardData.pan.replace(/\D/g, '') : '';
    
    if (!pan) {
      this.cardType = '';
      return;
    }

    if (pan.startsWith('4')) {
      this.cardType = 'visa';
    } else if (pan.startsWith('5') || pan.startsWith('2')) {
      this.cardType = 'mastercard';
    } else if (pan.startsWith('9')) {
      this.cardType = 'dina';
    } else {
      this.cardType = '';
    }
  } 
}