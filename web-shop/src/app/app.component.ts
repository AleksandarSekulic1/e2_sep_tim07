import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { PaymentComponent } from './payment/payment.component'; // <--- DODAJ OVO

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, PaymentComponent], // <--- DODAJ OVO
  template: `
    <h1 style="text-align:center">Dobrodošli u Agenciju za iznajmljivanje vozila [cite: 4]</h1>
    <app-payment></app-payment> `,
  styles: []
})
export class AppComponent {
  title = 'web-shop';
}