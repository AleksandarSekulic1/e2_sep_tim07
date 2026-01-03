import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-qr-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './qr-payment.component.html',
  styleUrls: ['./qr-payment.component.css']
})
export class QRPaymentComponent implements OnInit, OnDestroy {
  transactionId: string = '';
  qrCodeBase64: string = '';
  amount: number = 0;
  pollingInterval: any;
  ipsString: string = '';

  // Koristimo port 8080 jer tvoj API Gateway upravlja CORS-om i rutiranjem
  private baseUrl = 'http://localhost:8080/core';

  constructor(private route: ActivatedRoute, private http: HttpClient, private router: Router) {}

  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') || '';
    this.amount = Number(this.route.snapshot.queryParamMap.get('amount') || 0);
    
    // Zahtev ide na Gateway: 8080/core/api/qr/generate/...
    this.http.get(`${this.baseUrl}/api/qr/generate/${this.transactionId}`).subscribe({
  next: (res: any) => {
    this.qrCodeBase64 = res.qrCode;
    this.ipsString = res.ipsString; // Prihvatamo string koji smo poslali iz Jave
    this.startPolling();
  }
});
  }

  startPolling() {
    // Proveravamo status svake 3 sekunde kako nalaže mehanizam provere statusa [cite: 107]
    this.pollingInterval = setInterval(() => {
      this.http.get(`${this.baseUrl}/transactions/${this.transactionId}`).subscribe({
        next: (res: any) => {
          if (res.status === 'PAID') { // Čekamo da status postane PAID [cite: 79, 80]
            console.log("💰 Uplata detektovana!");
            clearInterval(this.pollingInterval);
            alert("✅ Plaćanje uspešno skenirano!");
            this.router.navigate(['/success']); // Redirekcija na Success URL [cite: 62, 79]
          }
        },
        error: (err) => console.log("Čekam na uplatu...")
      });
    }, 3000);
  }

  simulateQRAppPayment() {
    // Simuliramo mBanking aplikaciju pozivom na simulator u Core servisu
    this.http.post(`${this.baseUrl}/api/qr/simulate-pay/${this.transactionId}`, {}).subscribe({
      next: () => console.log("🚀 Simulacija uplate uspešno poslata!"),
      error: (err) => console.error("Greška pri simulaciji:", err)
    });
  }

  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }
}