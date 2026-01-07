import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-paypal-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './paypal-payment.component.html',
  styleUrls: ['./paypal-payment.component.css']
})
export class PaypalPaymentComponent implements OnInit, OnDestroy {

  paymentId: string = '';
  amount: number = 0;
  merchantOrderId: string = '';
  successUrl: string = '';
  failedUrl: string = '';

  timeLeft: string = '15:00';
  isExpired: boolean = false;
  isExpiringSoon: boolean = false;
  private timerInterval: any;

  paypalData = {
    email: '',
    password: ''
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
    if (amountParam) this.amount = Number(amountParam);

    this.merchantOrderId = this.route.snapshot.queryParamMap.get('merchantOrderId') || '';
    this.successUrl = this.route.snapshot.queryParamMap.get('successUrl') || '';
    this.failedUrl = this.route.snapshot.queryParamMap.get('failedUrl') || '';

    const expiresAtParam = this.route.snapshot.queryParamMap.get('expiresAt');
    if (expiresAtParam) {
      this.startTimer(new Date(expiresAtParam));
    }
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

    // Validacija
    if (!this.paypalData.email || !this.paypalData.password) {
      this.message = "❌ Molimo unesite email i lozinku!";
      return;
    }

    // Simulacija PayPal autentifikacije - generisanje PayerID
    const payerId = this.generatePayerId(this.paypalData.email);

    this.isProcessing = true;
    this.message = "⏳ Proveravanje PayPal naloga...";

    const executeRequest = {
      paymentId: this.paymentId,
      payerId: payerId,
      merchantOrderId: this.merchantOrderId
    };

    this.http.post('/api/paypal/paypal/execute-payment', executeRequest)
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
          this.message = "❌ ODBIJENO: " + (err.error || "Neispravan PayPal nalog");

          setTimeout(() => {
            if (this.failedUrl && !this.isProcessing) {
              window.location.href = decodeURIComponent(this.failedUrl);
            }
          }, 5000);
        }
      });
  }

  cancelPayment() {
    if (this.timerInterval) clearInterval(this.timerInterval);

      this.http.post(`/api/paypal/paypal/cancel-payment?paymentId=${this.paymentId}&merchantOrderId=${this.merchantOrderId}`, {})
      .subscribe({
        next: () => {
          if (this.failedUrl) {
            window.location.href = decodeURIComponent(this.failedUrl);
          } else {
            this.router.navigate(['/failed']);
          }
        },
        error: () => {
          this.router.navigate(['/failed']);
        }
      });
  }

  private generatePayerId(email: string): string {
    // Simulacija PayPal Payer ID generisanja
    // U realnom sistemu PayPal bi vratio ovaj ID nakon autentifikacije
    if (email.includes('invalid')) {
      return 'INVALID'; // Za testiranje neuspešne transakcije
    }
    return 'PAYER-' + email.split('@')[0].toUpperCase();
  }
}
