import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  template: `
    <div style="text-align:center; margin-top: 50px;">
      <h1>Dobrodošao u Web Shop!</h1>
      <button (click)="testConnection()" style="padding: 10px 20px; font-size: 16px; cursor: pointer;">
        TESTIRAJ KONEKCIJU SA GATEWAY-OM
      </button>
    </div>
  `,
  styles: []
})
export class AppComponent {
  title = 'web-shop';

  testConnection() {
    // Ovo je jednostavan JavaScript fetch poziv ka tvom Gateway-u
    fetch('http://localhost:8080/core/test')
      .then(response => response.text())
      .then(data => alert('USPEH! Odgovor sa bekenda: ' + data))
      .catch(error => alert('GREŠKA: ' + error));
  }
}