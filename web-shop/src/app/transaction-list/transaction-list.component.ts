import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms'; // <--- OBAVEZNO DODAJ OVO

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule], // <--- I OVDE
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit {
  
  transactions: any[] = [];         // Svi podaci iz baze
  filteredTransactions: any[] = []; // Podaci koji se vide na ekranu
  searchText: string = '';          // Tekst koji korisnik kuca

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    this.http.get<any[]>('http://localhost:8080/core/transactions')
      .subscribe({
        next: (data) => {
          this.transactions = data;
          this.filteredTransactions = data; // U početku prikazujemo sve
          console.log('Stigle transakcije:', data);
        },
        error: (err) => console.error('Greška:', err)
      });
  }

  // Ova metoda se poziva svaki put kad ukucaš slovo
  filterData() {
    const term = this.searchText.toLowerCase();
    
    this.filteredTransactions = this.transactions.filter(t => 
      // Pretražujemo po ID-u, Iznosu, Statusu ili Metodi
      t.merchantOrderId?.toLowerCase().includes(term) ||
      t.amount?.toString().includes(term) ||
      t.status?.toLowerCase().includes(term) ||
      t.paymentMethod?.toLowerCase().includes(term)
    );
  }
}