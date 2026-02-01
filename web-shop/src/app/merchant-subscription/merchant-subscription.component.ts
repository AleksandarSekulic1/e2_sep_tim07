import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PspService, Merchant } from '../services/psp.service';

@Component({
  selector: 'app-merchant-subscription',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './merchant-subscription.component.html',
  styleUrls: ['./merchant-subscription.component.css']
})
export class MerchantSubscriptionComponent implements OnInit {

  merchantName: string = '';
  successUrl: string = `${window.location.origin}/success`;
  failedUrl: string = `${window.location.origin}/failed`;
  errorUrl: string = `${window.location.origin}/error`;
  // Checkboxes for all 4 payment methods
  cardEnabled: boolean = false;
  qrEnabled: boolean = false;
  paypalEnabled: boolean = false;
  cryptoEnabled: boolean = false;

  registeredMerchant: Merchant | null = null;
  errorMessage: string = '';

  constructor(private pspService: PspService) { }

  ngOnInit(): void {
    // Check if we are already registered
    const storedId = localStorage.getItem('merchantId');
    if (storedId) {
      this.pspService.getMerchant(storedId).subscribe({
        next: (m) => {
          this.registeredMerchant = m;
          this.merchantName = m.name;
          this.successUrl = m.successUrl || this.successUrl;
          this.failedUrl = m.failedUrl || this.failedUrl;
          this.errorUrl = m.errorUrl || this.errorUrl;
          this.cardEnabled = m.paymentMethods.includes('CARD');
          this.qrEnabled = m.paymentMethods.includes('QR');
          this.paypalEnabled = m.paymentMethods.includes('PAYPAL');
          this.cryptoEnabled = m.paymentMethods.includes('CRYPTO');
        },
        error: (err) => {
          console.error("Could not fetch merchant", err);
        }
      });
    }
  }

  onSubmit() {
    this.errorMessage = '';
    const methods: string[] = [];
    if (this.cardEnabled) methods.push('CARD');
    if (this.qrEnabled) methods.push('QR');
    if (this.paypalEnabled) methods.push('PAYPAL');
    if (this.cryptoEnabled) methods.push('CRYPTO');

    if (methods.length === 0) {
      this.errorMessage = 'Morate izabrati bar jedan način plaćanja.';
      return;
    }

    const merchantData: Merchant = {
      name: this.merchantName,
      paymentMethods: methods,
      successUrl: this.successUrl,
      failedUrl: this.failedUrl,
      errorUrl: this.errorUrl,
      // If updating
      merchantId: this.registeredMerchant?.merchantId,
      merchantPassword: this.registeredMerchant?.merchantPassword
    };

    if (this.registeredMerchant) {
      // Update
      this.pspService.updateSubscription(this.registeredMerchant.merchantId!, {
        paymentMethods: methods,
        successUrl: this.successUrl,
        failedUrl: this.failedUrl,
        errorUrl: this.errorUrl
      })
        .subscribe({
          next: (updated) => {
            this.registeredMerchant = updated;
            alert('Subscription updated!');
          },
          error: (err) => this.errorMessage = 'Failed to update subscription.'
        });
    } else {
      // Register
      this.pspService.registerMerchant(merchantData).subscribe({
        next: (newMerchant) => {
          this.registeredMerchant = newMerchant;
          localStorage.setItem('merchantId', newMerchant.merchantId!);
          localStorage.setItem('merchantPassword', newMerchant.merchantPassword!);
          alert('Registration successful! ID saved.');
        },
        error: (err) => this.errorMessage = 'Registration failed.'
      });
    }
  }
}
