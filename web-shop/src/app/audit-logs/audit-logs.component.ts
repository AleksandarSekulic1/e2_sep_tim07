import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface AuditLog {
  id: number;
  actionType: string;
  actor: string;
  resourceType: string;
  resourceId: string;
  outcome: string;
  clientIp: string;
  timestamp: string;
  details: string;
}

@Component({
  selector: 'app-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './audit-logs.component.html',
  styleUrls: ['./audit-logs.component.css']
})
export class AuditLogsComponent implements OnInit {
  auditLogs: AuditLog[] = [];
  isLoading = false;
  errorMessage = '';

  filterAction = '';
  filterOutcome = '';

  // Action types matching backend AuditLog.AuditActionType
  actionTypes = [
    'LOGIN_ATTEMPT', 'LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT',
    'CARD_DATA_ACCESS', 'CARD_DATA_VIEWED', 'CARD_PAYMENT_INITIATED', 'CARD_PAYMENT_PROCESSED',
    'TRANSACTION_CREATED', 'TRANSACTION_VIEWED', 'TRANSACTION_UPDATED', 'TRANSACTION_STATUS_CHANGED', 'TRANSACTION_SEARCH',
    'MERCHANT_REGISTERED', 'MERCHANT_UPDATED', 'MERCHANT_VIEWED', 'MERCHANT_DELETED', 'MERCHANT_SUBSCRIPTION_CHANGED',
    'PAYMENT_METHOD_SELECTED', 'BANK_PAYMENT_INITIATED', 'PAYPAL_PAYMENT_INITIATED', 'CRYPTO_PAYMENT_INITIATED', 'QR_PAYMENT_INITIATED',
    'INVALID_ACCESS_ATTEMPT', 'RATE_LIMIT_EXCEEDED', 'VALIDATION_FAILED', 'ENCRYPTION_ERROR', 'DECRYPTION_ERROR',
    'SYSTEM_STARTUP', 'SYSTEM_SHUTDOWN', 'CONFIGURATION_CHANGED', 'AUDIT_LOG_ACCESSED'
  ];
  
  // Outcomes matching backend AuditLog.AuditOutcome
  outcomes = ['SUCCESS', 'FAILURE', 'ACCESS_DENIED', 'VALIDATION_ERROR', 'SYSTEM_ERROR'];

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadAuditLogs();
  }

  loadAuditLogs(): void {
    this.isLoading = true;
    this.errorMessage = '';

    let url = '/api/admin/audit-logs?size=100';
    if (this.filterAction) url += `&actionType=${this.filterAction}`;
    if (this.filterOutcome) url += `&outcome=${this.filterOutcome}`;

    this.http.get<{content: AuditLog[]}>(url).subscribe({
      next: (response) => {
        this.auditLogs = response.content || [];
        this.isLoading = false;
      },
      error: (error) => {
        this.errorMessage = error.error?.error || 'Greška pri učitavanju audit logova';
        this.isLoading = false;
        // Mock data for demo
        this.auditLogs = [
          {
            id: 1,
            actionType: 'LOGIN_SUCCESS',
            actor: 'superadmin',
            resourceType: 'USER',
            resourceId: '1',
            outcome: 'SUCCESS',
            clientIp: '192.168.1.100',
            timestamp: new Date().toISOString(),
            details: 'Admin login successful'
          },
          {
            id: 2,
            actionType: 'REGISTRATION',
            actor: 'testcust',
            resourceType: 'USER',
            resourceId: '2',
            outcome: 'SUCCESS',
            clientIp: '192.168.1.105',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            details: 'New customer registration'
          },
          {
            id: 3,
            actionType: 'LOGIN_FAILURE',
            actor: 'unknown',
            resourceType: 'USER',
            resourceId: '',
            outcome: 'FAILURE',
            clientIp: '10.0.0.50',
            timestamp: new Date(Date.now() - 7200000).toISOString(),
            details: 'Invalid credentials'
          }
        ];
      }
    });
  }

  applyFilter(): void {
    this.loadAuditLogs();
  }

  clearFilter(): void {
    this.filterAction = '';
    this.filterOutcome = '';
    this.loadAuditLogs();
  }

  getActionIcon(action: string): string {
    const icons: {[key: string]: string} = {
      'LOGIN_ATTEMPT': '🔑',
      'LOGIN_SUCCESS': '✅',
      'LOGIN_FAILURE': '❌',
      'LOGOUT': '🚪',
      'CARD_DATA_ACCESS': '💳',
      'CARD_DATA_VIEWED': '👁️',
      'CARD_PAYMENT_INITIATED': '💳',
      'CARD_PAYMENT_PROCESSED': '✔️',
      'TRANSACTION_CREATED': '📝',
      'TRANSACTION_VIEWED': '👀',
      'TRANSACTION_UPDATED': '📝',
      'TRANSACTION_STATUS_CHANGED': '🔄',
      'TRANSACTION_SEARCH': '🔍',
      'MERCHANT_REGISTERED': '🏪',
      'MERCHANT_UPDATED': '📝',
      'MERCHANT_VIEWED': '👀',
      'MERCHANT_DELETED': '🗑️',
      'MERCHANT_SUBSCRIPTION_CHANGED': '📋',
      'PAYMENT_METHOD_SELECTED': '💰',
      'BANK_PAYMENT_INITIATED': '🏦',
      'PAYPAL_PAYMENT_INITIATED': '🅿️',
      'CRYPTO_PAYMENT_INITIATED': '₿',
      'QR_PAYMENT_INITIATED': '📱',
      'INVALID_ACCESS_ATTEMPT': '⛔',
      'RATE_LIMIT_EXCEEDED': '🚫',
      'VALIDATION_FAILED': '⚠️',
      'ENCRYPTION_ERROR': '🔒',
      'DECRYPTION_ERROR': '🔓',
      'SYSTEM_STARTUP': '🚀',
      'SYSTEM_SHUTDOWN': '🛑',
      'CONFIGURATION_CHANGED': '⚙️',
      'AUDIT_LOG_ACCESSED': '📊'
    };
    return icons[action] || '📋';
  }

  getOutcomeClass(outcome: string): string {
    return outcome === 'SUCCESS' ? 'outcome-success' : 'outcome-failure';
  }
}
