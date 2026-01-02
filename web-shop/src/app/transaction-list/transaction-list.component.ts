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
  selectedTransaction: any = null;
  isModalOpen: boolean = false;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTransactions();
  }

  loadTransactions() {
    // Vraćamo se na port 8080 (Gateway) jer on ima podešen CORS
    // Dodajemo ?t=... na kraj da nateramo browser da uvek vuče nove podatke sa servera
    const timestamp = new Date().getTime();
    this.http.get<any[]>(`http://localhost:8080/core/transactions?t=${timestamp}`)
      .subscribe({
        next: (data) => {
          // Sortiramo tako da najnovija transakcija (sa najvećim ID-jem) bude prva
          this.transactions = data.sort((a, b) => b.id - a.id);
          this.filteredTransactions = [...this.transactions];
          console.log('✅ Podaci stigli sa servera:', data);
        },
        error: (err) => {
          console.error('❌ Greška pri učitavanju preko Gateway-a:', err);
          // Ako Gateway ne radi, pokušaj direktno (ali ovo će verovatno biti blokirano)
          alert("Problem sa API Gateway-om. Proveri da li je startovan port 8080.");
        }
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

  // DODAJ OVE METODE NA KRAJ KLASE
  openModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedTransaction = null;
  }

}