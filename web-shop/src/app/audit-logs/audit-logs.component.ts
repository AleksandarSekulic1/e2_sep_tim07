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

  actionTypes = ['LOGIN_SUCCESS', 'LOGIN_FAILURE', 'LOGOUT', 'REGISTRATION', 'PAYMENT_INITIATED', 'PAYMENT_COMPLETED'];
  outcomes = ['SUCCESS', 'FAILURE'];

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
      'LOGIN_SUCCESS': '✅',
      'LOGIN_FAILURE': '❌',
      'LOGOUT': '🚪',
      'REGISTRATION': '📝',
      'PAYMENT_INITIATED': '💳',
      'PAYMENT_COMPLETED': '✔️'
    };
    return icons[action] || '📋';
  }

  getOutcomeClass(outcome: string): string {
    return outcome === 'SUCCESS' ? 'outcome-success' : 'outcome-failure';
  }
}
