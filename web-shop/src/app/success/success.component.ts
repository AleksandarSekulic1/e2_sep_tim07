import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/**
 * Success page now captures the PayPal order after user approval.
 * PayPal redirects with query params: token (orderId) and PayerID.
 */
@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success.component.html',
  styleUrl: './success.component.css'
})
export class SuccessComponent implements OnInit {
  status: 'idle' | 'processing' | 'success' | 'failed' = 'idle';
  message = '';

  private readonly GATEWAY_URL = '/api';

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('SuccessComponent loaded. Params:', this.route.snapshot.queryParams);
    const paymentId = this.route.snapshot.queryParamMap.get('token'); // PayPal returns token=orderId
    // For Orders v2 redirect, PayerID might be absent; do not block capture if missing
    const payerId = this.route.snapshot.queryParamMap.get('PayerID');
    const merchantOrderId = this.route.snapshot.queryParamMap.get('merchantOrderId');

    // If no PayPal token, this is payment by other method (card/bank) that was already confirmed
    if (!paymentId) {
      console.log('No PayPal token found, assuming alternative payment method success.');
      this.status = 'success';
      this.message = '✅ Plaćanje uspešno potvrđeno!';
      setTimeout(() => this.router.navigate(['/transactions']), 2500);
      return;
    }

    this.capturePayment(paymentId, payerId || '', merchantOrderId);
  }

  private capturePayment(paymentId: string, payerId: string, merchantOrderId: string | null) {
    this.status = 'processing';
    this.message = '⏳ Potvrđujem PayPal uplatu...';

    const body = {
      paymentId,
      payerId,
      merchantOrderId: merchantOrderId || paymentId
    };

    this.http.post(`${this.GATEWAY_URL}/paypal/paypal/execute-payment`, body)
      .subscribe({
        next: () => {
          this.status = 'success';
          this.message = '✅ Plaćanje uspešno potvrđeno!';
          setTimeout(() => this.router.navigate(['/transactions']), 2500);
        },
        error: (err) => {
          console.error('PayPal capture failed', err);
          this.status = 'failed';
          this.message = '❌ Greška pri potvrdi plaćanja. Pokušajte ponovo.';
        }
      });
  }
}
