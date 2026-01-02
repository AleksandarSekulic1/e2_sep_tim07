import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {

  // API Gateway
  private readonly GATEWAY_URL = 'http://localhost:8080';

  constructor(private http: HttpClient) { }

  // 1. Inicijalizacija (Web Shop -> Core Service)
  initiatePayment(paymentRequest: any): Observable<any> {
    return this.http.post(`${this.GATEWAY_URL}/core/transactions/initiate`, paymentRequest);
  }

  // --- OVO JE FALILO ---
  // 2. Izbor Kartice (PSP -> Card Service)
  payWithCard(cardRequest: any): Observable<any> {
    // Šaljemo na Gateway (/card/...), a on prosleđuje Card servisu (/cards/pay)
    return this.http.post(`${this.GATEWAY_URL}/card/cards/pay`, cardRequest);
  }
}