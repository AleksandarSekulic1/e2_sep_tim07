import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-crypto-payment',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './crypto-payment.component.html',
  styleUrls: ['./crypto-payment.component.css']
})
export class CryptoPaymentComponent implements OnInit, OnDestroy {
  address = '';
  amountCrypto = '';
  fiat = '';
  qr = '';
  network = '';
  cryptoType = 'ETH';
  privateKeyWif = '';
  merchantOrderId = '';

  status = 'waiting'; // waiting, detected, confirmed
  message = 'Čekam uplatu...';
  confirmations = 0;
  txHash = '';

  // MetaMask
  hasMetaMask = false;
  metaMaskConnected = false;
  metaMaskAddress = '';
  sendingWithMetaMask = false;

  private pollingSubscription?: Subscription;
  private readonly GATEWAY_URL = 'http://localhost:8084';
  private ethereum: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.merchantOrderId = this.route.snapshot.paramMap.get('id') || '';
    this.address = this.route.snapshot.queryParamMap.get('address') || '';
    this.amountCrypto = this.route.snapshot.queryParamMap.get('amountCrypto') || '';
    this.fiat = this.route.snapshot.queryParamMap.get('fiat') || '';
    this.qr = this.route.snapshot.queryParamMap.get('qr') || '';
    this.network = this.route.snapshot.queryParamMap.get('network') || 'sepolia';
    this.cryptoType = 'ETH';
    this.privateKeyWif = this.route.snapshot.queryParamMap.get('privateKeyWif') || '';

    if (!this.address || !this.amountCrypto) {
      this.router.navigate(['/payment']);
      return;
    }

    // Check if MetaMask is available (only for Ethereum)
    if (typeof (window as any).ethereum !== 'undefined') {
      this.hasMetaMask = true;
      this.ethereum = (window as any).ethereum;
    }

    // Start polling for payment confirmation every 10 seconds
    this.startPolling();
  }

  ngOnDestroy(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
  }

  private startPolling(): void {
    // Poll immediately, then every 10 seconds
    this.checkPayment();
    this.pollingSubscription = interval(10000)
      .pipe(switchMap(() => this.http.get<any>(`${this.GATEWAY_URL}/crypto/crypto/check-payment/${this.address}`)))
      .subscribe({
        next: (response) => this.handlePaymentStatus(response),
        error: (err) => console.error('Polling error:', err)
      });
  }

  private checkPayment(): void {
    this.http.get<any>(`${this.GATEWAY_URL}/crypto/crypto/check-payment/${this.address}`)
      .subscribe({
        next: (response) => this.handlePaymentStatus(response),
        error: (err) => console.error('Check payment error:', err)
      });
  }

  private handlePaymentStatus(response: any): void {
    if (response.paymentConfirmed) {
      this.status = 'confirmed';
      this.message = '✅ Uplata potvrđena!';
      this.confirmations = response.confirmations || 0;
      this.txHash = response.txHash || '';

      // Stop polling
      if (this.pollingSubscription) {
        this.pollingSubscription.unsubscribe();
      }

      // Redirect to success after 3 seconds
      setTimeout(() => {
        this.router.navigate(['/transactions']);
      }, 3000);
    } else if (response.unconfirmedBalance > 0 || response.message?.includes('mempool')) {
      this.status = 'detected';
      this.message = '⏳ Transakcija detektovana, čekam potvrdu...';
    } else {
      this.status = 'waiting';
      this.message = response.message || 'Čekam uplatu...';
    }
  }

  getQrImageUrl(): string {
    return 'https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=' + encodeURIComponent(this.qr);
  }

  getExplorerUrl(): string {
    if (this.txHash) {
      return 'https://sepolia.etherscan.io/tx/' + this.txHash;
    }
    return 'https://sepolia.etherscan.io/address/' + this.address;
  }

  async connectMetaMask(): Promise<void> {
    if (!this.ethereum) {
      alert('MetaMask nije instaliran! Preuzmite ga sa https://metamask.io/');
      return;
    }

    try {
      // Request account access
      const accounts = await this.ethereum.request({ method: 'eth_requestAccounts' });
      this.metaMaskAddress = accounts[0];
      this.metaMaskConnected = true;

      // Check/switch to Sepolia network (chain ID: 11155111 = 0xaa36a7)
      await this.switchToSepolia();
    } catch (error: any) {
      console.error('MetaMask connection error:', error);
      alert('Greška pri povezivanju sa MetaMask: ' + error.message);
    }
  }

  private async switchToSepolia(): Promise<void> {
    const sepoliaChainId = '0xaa36a7'; // 11155111 in hex

    try {
      await this.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: sepoliaChainId }],
      });
    } catch (switchError: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (switchError.code === 4902) {
        try {
          await this.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: sepoliaChainId,
                chainName: 'Sepolia Test Network',
                rpcUrls: ['https://rpc.sepolia.org'],
                nativeCurrency: {
                  name: 'Sepolia ETH',
                  symbol: 'ETH',
                  decimals: 18,
                },
                blockExplorerUrls: ['https://sepolia.etherscan.io/'],
              },
            ],
          });
        } catch (addError: any) {
          console.error('Error adding Sepolia network:', addError);
          alert('Greška pri dodavanju Sepolia mreže: ' + addError.message);
        }
      } else {
        console.error('Error switching to Sepolia:', switchError);
        alert('Greška pri prebacivanju na Sepolia mrežu: ' + switchError.message);
      }
    }
  }

  async payWithMetaMask(): Promise<void> {
    if (!this.metaMaskConnected) {
      await this.connectMetaMask();
      if (!this.metaMaskConnected) return;
    }

    this.sendingWithMetaMask = true;

    try {
      // Convert ETH amount to Wei (1 ETH = 10^18 Wei)
      const amountWei = '0x' + Math.floor(parseFloat(this.amountCrypto) * 1e18).toString(16);

      const transactionParameters = {
        from: this.metaMaskAddress,
        to: this.address,
        value: amountWei,
        gas: '0x5208', // 21000 gas (standard ETH transfer)
      };

      // Send transaction
      const txHash = await this.ethereum.request({
        method: 'eth_sendTransaction',
        params: [transactionParameters],
      });

      this.txHash = txHash;
      this.status = 'detected';
      this.message = '⏳ Transakcija poslata! Čekam potvrdu na blockchain...';

      console.log('Transaction sent:', txHash);

      // Wait for transaction to be mined (confirmed)
      await this.waitForTransactionConfirmation(txHash);

      // Once confirmed, notify backend
      this.http.post(`${this.GATEWAY_URL}/crypto/crypto/update-tx-hash`, {
        address: this.address,
        txHash: txHash
      }).subscribe({
        next: () => {
          console.log('✅ Backend notified about confirmed transaction');
          this.status = 'confirmed';
          this.message = '✅ Transakcija potvrđena!';
        },
        error: (err) => console.error('Error notifying backend:', err)
      });

    } catch (error: any) {
      console.error('MetaMask payment error:', error);
      alert('Greška pri slanju plaćanja: ' + error.message);
    } finally {
      this.sendingWithMetaMask = false;
    }
  }

  private async waitForTransactionConfirmation(txHash: string): Promise<void> {
    console.log('⏳ Waiting for transaction to be mined...');

    return new Promise((resolve, reject) => {
      const checkInterval = setInterval(async () => {
        try {
          const receipt = await this.ethereum.request({
            method: 'eth_getTransactionReceipt',
            params: [txHash],
          });

          if (receipt !== null) {
            clearInterval(checkInterval);

            if (receipt.status === '0x1') {
              // Transaction successful
              console.log('✅ Transaction confirmed on blockchain!', receipt);
              this.confirmations = parseInt(receipt.blockNumber, 16);
              resolve();
            } else {
              // Transaction failed
              console.error('❌ Transaction failed on blockchain');
              reject(new Error('Transaction failed'));
            }
          } else {
            console.log('⏳ Transaction still pending...');
          }
        } catch (error) {
          console.error('Error checking transaction receipt:', error);
        }
      }, 3000); // Check every 3 seconds

      // Timeout after 5 minutes
      setTimeout(() => {
        clearInterval(checkInterval);
        reject(new Error('Transaction confirmation timeout'));
      }, 300000);
    });
  }
}
