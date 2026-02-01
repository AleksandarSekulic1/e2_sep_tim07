import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { PaymentService } from '../services/payment.service';
import { HttpClient } from '@angular/common/http';
import { PspService, Merchant } from '../services/psp.service';

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
  currency: string = 'RSD';
  successUrl: string = '';
  failedUrl: string = '';

  // Subscription-based flags - separated for all 4 methods
  cardAllowed: boolean = false;
  qrAllowed: boolean = false;
  paypalAllowed: boolean = false;
  cryptoAllowed: boolean = false;
  loading: boolean = true;

  constructor(
    private route: ActivatedRoute,
    private paymentService: PaymentService,
    private http: HttpClient,
    private pspService: PspService
  ) {}

  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') || '';

    // Capture query params just in case (fallback)
    const amountParam = this.route.snapshot.queryParamMap.get('amount');
    if (amountParam) this.amount = Number(amountParam);

    this.currency = this.route.snapshot.queryParamMap.get('currency') || this.currency;
    this.successUrl = this.route.snapshot.queryParamMap.get('successUrl') || `${window.location.origin}/success`;
    this.failedUrl = this.route.snapshot.queryParamMap.get('failedUrl') || `${window.location.origin}/failed`;

    // Fetch Transaction details to check Merchant config
    if (this.transactionId) {
      this.http.get<any>(`/api/core/transactions/${this.transactionId}`).subscribe({
         next: (tx) => {
           this.amount = tx.amount;
           this.currency = tx.currency;
           
           // Check if merchantId exists
           if (tx.merchantId) {
             // Fetch merchant allowed methods + URLs without exposing password
             this.pspService.getAllowedMethods(tx.merchantId).subscribe({
               next: (methodsResponse: any) => {
                 this.filterMethods(methodsResponse);
                 this.successUrl = methodsResponse.successUrl || this.successUrl;
                 this.failedUrl = methodsResponse.failedUrl || this.failedUrl;
                 this.loading = false;
               },
               error: () => {
                 // If merchant not found, enable all methods as fallback
                 console.log('Merchant not found, enabling all payment methods');
                 this.enableAllMethods();
                 this.loading = false;
               }
             });
           } else {
             // No merchantId in transaction, enable all methods
             console.log('No merchantId in transaction, enabling all payment methods');
             this.enableAllMethods();
             this.loading = false;
           }
         },
         error: (err) => {
           console.error("Failed to load tx", err);
           // Enable all methods as fallback
           this.enableAllMethods();
           this.loading = false;
         }
       });
    } else {
      // No transaction ID, enable all methods
      this.enableAllMethods();
      this.loading = false;
    }

    console.log("PSP Podaci:", { id: this.transactionId, amount: this.amount, currency: this.currency, success: this.successUrl });
  }

  enableAllMethods(): void {
    this.cardAllowed = true;
    this.qrAllowed = true;
    this.paypalAllowed = true;
    this.cryptoAllowed = true;
  }

  filterMethods(merchant: Merchant | any) {
    if (!merchant.paymentMethods || merchant.paymentMethods.length === 0) {
      // If no methods configured, enable all as fallback
      this.enableAllMethods();
      return;
    }
    this.cardAllowed = merchant.paymentMethods.includes('CARD');
    this.qrAllowed = merchant.paymentMethods.includes('QR');
    this.paypalAllowed = merchant.paymentMethods.includes('PAYPAL');
    this.cryptoAllowed = merchant.paymentMethods.includes('CRYPTO');
  }

  chooseCard() {
    console.log("Biramo plaćanje karticom...");

    const request = {
      // 1. pspTransactionId šaljemo Card servisu da bi on znao koju
      //    transakciju u bazi da ažurira na metodu "CARD"
      pspTransactionId: this.transactionId,

      // 2. merchantOrderId šaljemo Banki. UKLONJEN JE PREFIKS "ORDER-"
      //    tako da Banka vraća čist ID (npr. "105") Core servisu.
      //    Bez ovoga Core servis ne može da nađe transakciju i status ostaje CREATED.
      merchantOrderId: this.transactionId,

      amount: this.amount,
      currency: this.currency,
      merchantTimestamp: new Date().toISOString()
    };

    console.log("🚀 Šaljem ispravljen zahtev Card servisu:", request);

    this.paymentService.payWithCard(request).subscribe({
      next: (response: any) => {
        if (response.paymentUrl) {
          // Na link Banke lepimo success/failed linkove radi lakšeg povratka
          const bankUrl = `${response.paymentUrl}&successUrl=${this.successUrl}&failedUrl=${this.failedUrl}`;
          console.log("🔗 Preusmeravam na Banku:", bankUrl);
          window.location.href = bankUrl;
        }
      },
      error: (err: any) => {
        console.error("❌ Greška pri inicijalizaciji plaćanja:", err);
        alert("Greška: Card servis ili Banka nisu dostupni.");
      }
    });
  }

  chooseQR() {
    console.log("Biramo plaćanje QR kodom...");
    // Preusmeravamo na novu komponentu koju ćemo sad napraviti
    window.location.href = `/qr-payment/${this.transactionId}?amount=${this.amount}`;
  }

  choosePayPal() {
    // PayPal doesn't support RSD
    if (this.currency === 'RSD') {
      alert('PayPal ne podržava RSD valutu. Molimo izaberite drugi način plaćanja.');
      return;
    }

    console.log("Biramo plaćanje putem PayPal-a...");

    const request = {
      pspTransactionId: this.transactionId,
      merchantOrderId: this.transactionId,
      amount: this.amount,
      currency: this.currency,
      merchantTimestamp: new Date().toISOString()
    };

    console.log("🚀 Šaljem zahtev PayPal servisu:", request);

    this.paymentService.payWithPayPal(request).subscribe({
      next: (response: any) => {
        if (response.approvalUrl) {
          const paypalUrl = `${response.approvalUrl}&successUrl=${this.successUrl}&failedUrl=${this.failedUrl}`;
          console.log("🔗 Preusmeravam na PayPal:", paypalUrl);
          window.location.href = paypalUrl;
        }
      },
      error: (err: any) => {
        console.error("❌ Greška pri inicijalizaciji PayPal plaćanja:", err);
        alert("Greška: PayPal servis nije dostupan.");
      }
    });
  }

  chooseCrypto() {
    console.log("Biramo plaćanje kriptovalutom (Ethereum Sepolia - brže potvrde!)...");

    const request = {
      pspTransactionId: this.transactionId,
      merchantOrderId: this.transactionId,
      amount: this.amount,
      currency: this.currency,
      cryptoType: "ETH", // Use Ethereum Sepolia for faster confirmations (~12 seconds)
      merchantTimestamp: new Date().toISOString()
    };

    this.paymentService.payWithCrypto(request).subscribe({
      next: (response: any) => {
        const params = new URLSearchParams({
          address: response.address,
          amountCrypto: response.cryptoAmount.toString(),
          fiat: `${response.fiatAmount} ${response.fiatCurrency}`,
          qr: response.qrData,
          network: response.network,
          cryptoType: response.cryptoType,
          privateKeyWif: response.privateKeyWif
        });
        window.location.href = `/crypto-payment/${this.transactionId}?${params.toString()}`;
      },
      error: (err: any) => {
        console.error("❌ Greška pri inicijalizaciji Crypto plaćanja:", err);
        alert("Greška: Crypto servis nije dostupan.");
      }
    });
  }
}
