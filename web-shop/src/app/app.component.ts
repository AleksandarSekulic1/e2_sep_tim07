import { Component } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'; // <--- OBAVEZNO DODAJ OVO
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive], // <--- I OVDE
  templateUrl: './app.component.html', // Prebacujemo HTML u poseban fajl da bude čistije
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'web-shop';
}