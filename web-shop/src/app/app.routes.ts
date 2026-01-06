import { Routes } from '@angular/router';
import { PaymentComponent } from './payment/payment.component';
import { TransactionListComponent } from './transaction-list/transaction-list.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component'; // <--- IMPORTUJ OVO
import { BankPaymentComponent } from './bank-payment/bank-payment.component'; // <--- IMPORT
import { SuccessComponent } from './success/success.component';
import { FailedComponent } from './failed/failed.component';
import { QRPaymentComponent } from './qr-payment/qr-payment.component'; // <--- IMPORTUJ OVO
import { PaypalPaymentComponent } from './paypal-payment/paypal-payment.component'; // <--- IMPORT PayPal
import { CryptoPaymentComponent } from './crypto-payment/crypto-payment.component';
import { MerchantSubscriptionComponent } from './merchant-subscription/merchant-subscription.component';

export const routes: Routes = [
  { path: '', redirectTo: 'payment', pathMatch: 'full' }, // Početna strana vodi na plaćanje
  { path: 'payment', component: PaymentComponent },
  { path: 'merchant-subscription', component: MerchantSubscriptionComponent }, // <--- Admin/Setup page
  { path: 'payment-methods/:id', component: PaymentMethodsComponent },
  { path: 'bank-payment/:paymentId', component: BankPaymentComponent },
  { path: 'transactions', component: TransactionListComponent },
  { path: 'success', component: SuccessComponent },
  { path: 'failed', component: FailedComponent },
  { path: 'qr-payment/:id', component: QRPaymentComponent },
  { path: 'paypal-payment/:paymentId', component: PaypalPaymentComponent },
  { path: 'crypto-payment/:id', component: CryptoPaymentComponent }
];
