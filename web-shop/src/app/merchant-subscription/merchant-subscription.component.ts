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
  successUrl: string = 'http://localhost:4200/success';
  failedUrl: string = 'http://localhost:4200/failed';
  errorUrl: string = 'http://localhost:4200/error';
  // Checkboxes
  bankEnabled: boolean = false;
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
          this.bankEnabled = m.paymentMethods.includes('BANK');
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
    if (this.bankEnabled) methods.push('BANK');
    if (this.paypalEnabled) methods.push('PAYPAL');
    if (this.cryptoEnabled) methods.push('CRYPTO');

    if (methods.length === 0) {
      this.errorMessage = 'You must select at least one payment method.';
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
