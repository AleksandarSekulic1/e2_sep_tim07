import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Merchant {
  merchantId?: string;
  merchantPassword?: string;
  name: string;
  paymentMethods: string[];
  successUrl?: string;
  failedUrl?: string;
  errorUrl?: string;
}

@Injectable({
  providedIn: 'root'
})
export class PspService {
  private apiUrl = '/api/core/merchants';

  constructor(private http: HttpClient) { }

  registerMerchant(merchant: Merchant): Observable<Merchant> {
    return this.http.post<Merchant>(`${this.apiUrl}/register`, merchant);
  }

  getMerchant(merchantId: string): Observable<Merchant> {
    return this.http.get<Merchant>(`${this.apiUrl}/${merchantId}`);
  }

  updateSubscription(merchantId: string, payload: { paymentMethods: string[]; successUrl: string; failedUrl: string; errorUrl: string; }): Observable<Merchant> {
    return this.http.put<Merchant>(`${this.apiUrl}/${merchantId}/subscription`, payload);
  }

  getAllowedMethods(merchantId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${merchantId}/methods`);
  }
}
