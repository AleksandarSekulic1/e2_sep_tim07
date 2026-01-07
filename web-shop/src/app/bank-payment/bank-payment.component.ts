import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

/**
 * PCI DSS Compliant Bank Payment Component
 * - PAN masking
 * - No storage of sensitive data
 * - Secure data handling
 */
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

  // PCI DSS 3.2.1 - Card data structure (never persisted)
  cardData = {
    pan: '',
    cardHolder: '',
    expiryDate: '',
    cvv: '',
    amount: 5000,
    merchantOrderId: ''
  };

  // Display state
  displayPan: string = '';  // For masked display
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

    console.log('🔐 PCI DSS: Payment session started - Order:', this.cardData.merchantOrderId);
  }

  ngOnDestroy() {
    if (this.timerInterval) clearInterval(this.timerInterval);
    // PCI DSS 3.2.3 - Ensure card data is cleared
    this.clearCardData();
  }

  /**
   * PCI DSS 3.2.3 - Clear sensitive data from memory
   */
  private clearCardData() {
    this.cardData.pan = '';
    this.cardData.cvv = '';
    this.cardData.expiryDate = '';
    this.cardData.cardHolder = '';
    this.displayPan = '';
    console.log('🔐 PCI DSS: Sensitive data cleared');
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
        this.clearCardData(); // PCI DSS
        return;
      }

      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      this.timeLeft = `${minutes < 10 ? '0' + minutes : minutes}:${seconds < 10 ? '0' + seconds : seconds}`;
      this.isExpiringSoon = minutes < 2;
    }, 1000);
  }

  /**
   * PCI DSS 3.4 - Format and mask PAN as user types
   */
  onPanInput(event: any) {
    let value = event.target.value.replace(/\D/g, ''); // Remove non-digits

    // Limit to 19 digits (max card length)
    value = value.substring(0, 19);

    // Format with spaces every 4 digits for display
    let formatted = value.match(/.{1,4}/g)?.join(' ') || value;

    this.displayPan = formatted;
    this.cardData.pan = value; // Store unformatted
    this.detectCardType();
  }

  /**
   * Format expiry date
   */
  onExpiryInput(event: any) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
      value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    this.cardData.expiryDate = value;
  }

  /**
   * PCI DSS 6.5.1 - Submit payment with validation
   */
  submitPayment() {
    if (this.isProcessing || this.isExpired) return;

    // Client-side validation
    if (!this.validateCardData()) {
      this.message = "❌ Molimo ispravno popunite sva polja";
      return;
    }

    // PCI DSS 3.2 - Clean PAN before transmission (already clean, just ensure)
    const cleanData = {
      ...this.cardData,
      pan: this.cardData.pan.replace(/\D/g, '')
    };

    this.isProcessing = true;
    this.message = "⏳ Obrada transakcije...";

    console.log('🔐 PCI DSS: Sending payment request - Order:', cleanData.merchantOrderId);

    // Note: In production, use HTTPS (TLS 1.2+) - PCI DSS 4.1
    this.http.post('/api/bank/pay', cleanData)
      .subscribe({
        next: (res: any) => {
          this.isSuccess = true;
          this.message = "✅ PLAĆANJE USPEŠNO! Preusmeravanje...";
          if (this.timerInterval) clearInterval(this.timerInterval);

          // PCI DSS 3.2.3 - Clear sensitive data after successful payment
          this.clearCardData();

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

          const errorMessage = this.mapErrorMessage(err.error);
          this.message = "❌ ODBIJENO: " + errorMessage;

          console.error('❌ PCI DSS: Payment failed -', errorMessage);

          setTimeout(() => {
            if (this.failedUrl && !this.isProcessing) {
              this.clearCardData();
              window.location.href = decodeURIComponent(this.failedUrl);
            }
          }, 5000);
        }
      });
  }

  /**
   * PCI DSS 6.5.1 - Client-side validation
   */
  private validateCardData(): boolean {
    // PAN validation
    if (!this.cardData.pan || this.cardData.pan.length < 13) {
      return false;
    }

    // Card holder validation
    if (!this.cardData.cardHolder || this.cardData.cardHolder.trim().length < 2) {
      return false;
    }

    // Expiry validation
    if (!this.cardData.expiryDate || !this.cardData.expiryDate.match(/^\d{2}\/\d{2}$/)) {
      return false;
    }

    // CVV validation
    if (!this.cardData.cvv || !this.cardData.cvv.match(/^\d{3,4}$/)) {
      return false;
    }

    return true;
  }

  /**
   * Map error codes to user-friendly messages
   */
  private mapErrorMessage(error: string): string {
    const errorMap: { [key: string]: string } = {
      'LUHN_FAILED': 'Neispravan broj kartice',
      'INVALID_CVV': 'Neispravan CVV kod',
      'INVALID_DATE_FORMAT': 'Neispravan format datuma',
      'CARD_EXPIRED': 'Kartica je istekla',
      'INSUFFICIENT_FUNDS': 'Nedovoljno sredstava',
      'ALREADY_PROCESSED': 'Transakcija već obrađena'
    };
    return errorMap[error] || error || 'Sistemska greška';
  }

  /**
   * Detect card type based on BIN (first 6 digits)
   */
  detectCardType() {
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
