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
  ipsString: string = '';
  message: string = ''; // Polje za prikaz poruka o uspehu ili greškama
  pollingInterval: any;

  // Koristimo port 8080 jer tvoj API Gateway upravlja CORS-om i rutiranjem
  private baseUrl = 'http://localhost:8080/core';

  constructor(
    private route: ActivatedRoute, 
    private http: HttpClient, 
    private router: Router
  ) {}

  ngOnInit() {
    this.transactionId = this.route.snapshot.paramMap.get('id') || '';
    this.amount = Number(this.route.snapshot.queryParamMap.get('amount') || 0);
    
    // Inicijalno generisanje koda uz proveru limita na backend-u
    this.loadQRCode();
  }

  loadQRCode() {
    this.http.get(`${this.baseUrl}/api/qr/generate/${this.transactionId}`).subscribe({
      next: (res: any) => {
        this.qrCodeBase64 = res.qrCode;
        this.ipsString = res.ipsString; 
        this.startPolling();
      },
      error: (err) => {
        this.message = "❌ Greška: Sistem ne može da generiše kod.";
        console.error("QR Error:", err);
        // Vrati na početnu formu nakon 3 sekunde
        setTimeout(() => this.router.navigate(['/payment-selection']), 3000);
      }
    });
  }

  simulateQRAppPayment() {
  this.http.post(`${this.baseUrl}/api/qr/simulate-pay/${this.transactionId}`, {}).subscribe({
    next: () => {
      this.message = "✅ Uspešno inicijalizovano!";
    },
    error: (err) => {
      // Prikazuje "Plaćanje Neuspešno" vizuelno (kao na tvojoj slici)
      this.message = "❌ Plaćanje odbijeno (Limit 20.000 RSD ili greška)";
      this.qrCodeBase64 = ''; // Skloni QR kod da se vidi greška
      
      // Vraća na početnu formu nakon 3 sekunde
      setTimeout(() => {
        this.router.navigate(['/payment-selection']); 
      }, 3000);
    }
  });
}

  startPolling() {
  this.pollingInterval = setInterval(() => {
    this.http.get(`${this.baseUrl}/transactions/${this.transactionId}`).subscribe({
      next: (res: any) => {
        // SCENARIO 1: Uspešno plaćanje
        if (res.status === 'PAID') { 
          this.stopPolling();
          this.message = "✅ Plaćanje uspešno!";
          setTimeout(() => this.router.navigate(['/success']), 2000);
        } 
        // SCENARIO 2: Odbijeno plaćanje (npr. limit 20k)
        else if (res.status === 'FAILED') {
          this.stopPolling();
          this.message = "❌ Plaćanje odbijeno: " + (res.reason || "Limit prekoračen");
          
          // Sačekaj 3 sekunde da asistent vidi poruku, pa vrati na početak
          setTimeout(() => {
            this.router.navigate(['/failed']);
          }, 3000);
        }
      },
      error: (err) => console.log("Čekam na promenu statusa...")
    });
  }, 3000);
}

  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  ngOnDestroy() {
    this.stopPolling();
  }
}