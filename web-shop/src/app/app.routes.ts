import { Routes } from '@angular/router';
import { PaymentComponent } from './payment/payment.component';
import { TransactionListComponent } from './transaction-list/transaction-list.component';
import { PaymentMethodsComponent } from './payment-methods/payment-methods.component';
import { BankPaymentComponent } from './bank-payment/bank-payment.component';
import { SuccessComponent } from './success/success.component';
import { FailedComponent } from './failed/failed.component';
import { QRPaymentComponent } from './qr-payment/qr-payment.component';
import { PaypalPaymentComponent } from './paypal-payment/paypal-payment.component';
import { CryptoPaymentComponent } from './crypto-payment/crypto-payment.component';
import { MerchantSubscriptionComponent } from './merchant-subscription/merchant-subscription.component';
import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { AuditLogsComponent } from './audit-logs/audit-logs.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  // Public routes - available to everyone
  { path: '', redirectTo: 'payment', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },

  // Public browsing (viewing products, prices)
  { path: 'payment', component: PaymentComponent },
  { path: 'payment-methods/:id', component: PaymentMethodsComponent },

  // Payment flow routes - require CUSTOMER authentication
  {
    path: 'bank-payment/:paymentId',
    component: BankPaymentComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'qr-payment/:id',
    component: QRPaymentComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'paypal-payment/:paymentId',
    component: PaypalPaymentComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },
  {
    path: 'crypto-payment/:id',
    component: CryptoPaymentComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },

  // Result pages
  { path: 'success', component: SuccessComponent },
  { path: 'failed', component: FailedComponent },

  // Protected CUSTOMER routes - purchase history and rentals
  {
    path: 'transactions',
    component: TransactionListComponent,
    canActivate: [AuthGuard],
    data: { roles: ['CUSTOMER'] }
  },

  // SUPER_ADMIN only routes
  {
    path: 'admin/audit-logs',
    component: AuditLogsComponent,
    canActivate: [AuthGuard],
    data: { roles: ['SUPER_ADMIN'] }
  },

  // Merchant subscription (for merchants to set up their API keys)
  {
    path: 'merchant-subscription',
    component: MerchantSubscriptionComponent,
    canActivate: [AuthGuard]
  }
];
