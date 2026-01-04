import { Component, OnInit, OnDestroy } from '@angular/core'; // Dodato OnDestroy
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-transaction-list',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './transaction-list.component.html',
  styleUrls: ['./transaction-list.component.css']
})
export class TransactionListComponent implements OnInit, OnDestroy {

  transactions: any[] = [];
  filteredTransactions: any[] = [];
  searchText: string = '';
  selectedTransaction: any = null;
  isModalOpen: boolean = false;
  pollingInterval: any; // Dodata varijabla za interval

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.loadTransactions();
    // Pokrećemo automatsko osvežavanje svakih 5 sekundi
    this.pollingInterval = setInterval(() => {
      this.loadTransactions();
    }, 5000);
  }

  // Obavezno čišćenje intervala kada korisnik napusti stranicu
  ngOnDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
  }

  loadTransactions() {
    const timestamp = new Date().getTime();
    this.http.get<any[]>(`http://localhost:8084/core/transactions?t=${timestamp}`)
      .subscribe({
        next: (data) => {
          const sortedData = data.sort((a, b) => b.id - a.id);

          // --- DODATO ZA DEBAGOVANJE ---
          // Ovo će ti u konzoli ispisati tabelu. Klikni na strelicu pored objekta da vidiš polja.
          console.log('--- NOVI PODACI SA SERVERA ---');
          console.table(sortedData);
          // -----------------------------

          if (this.isModalOpen && this.selectedTransaction) {
            const updated = sortedData.find(t => t.id === this.selectedTransaction.id);
            if (updated) this.selectedTransaction = updated;
          }

          this.transactions = sortedData;
          this.filterData();
        },
        error: (err) => {
          console.error('❌ Greška pri učitavanju:', err);
        }
      });
  }

  filterData() {
    const term = this.searchText.toLowerCase();
    this.filteredTransactions = this.transactions.filter(t =>
      t.id?.toString().includes(term) ||
      t.merchantOrderId?.toLowerCase().includes(term) ||
      t.amount?.toString().includes(term) ||
      t.status?.toLowerCase().includes(term) ||
      t.paymentMethod?.toLowerCase().includes(term)
    );
  }

  openModal(transaction: any) {
    this.selectedTransaction = transaction;
    this.isModalOpen = true;
  }

  closeModal() {
    this.isModalOpen = false;
    this.selectedTransaction = null;
  }
}
