import { Routes } from '@angular/router';
import { PaymentComponent } from './payment/payment.component';
import { TransactionListComponent } from './transaction-list/transaction-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'payment', pathMatch: 'full' }, // Početna strana vodi na plaćanje
  { path: 'payment', component: PaymentComponent },
  { path: 'transactions', component: TransactionListComponent }
];