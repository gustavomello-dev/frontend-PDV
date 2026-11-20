import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Order } from '../../shared/models';

@Component({
  selector: 'app-cashier',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <h1>Caixa</h1>

    <div class="grid grid-3">
      <div class="card" *ngFor="let order of orders">
        <h3>Mesa {{ tableNumber(order) }}</h3>
        <p class="muted">{{ order.code }}</p>
        <p><strong>Status:</strong> {{ order.status }}</p>
        <p>Total: R$ {{ order.total | number:'1.2-2' }}</p>
        <p>Pago: R$ {{ order.paidAmount | number:'1.2-2' }}</p>
        <p>Restante: R$ {{ order.remainingAmount | number:'1.2-2' }}</p>

        <div class="row" *ngIf="order.remainingAmount > 0">
          <select [(ngModel)]="method">
            <option value="CASH">Dinheiro</option>
            <option value="CARD">Cartão</option>
            <option value="PIX">Pix</option>
          </select>
          <input type="number" [(ngModel)]="amount" min="0.01" />
          <button class="success" (click)="pay(order)">Registrar</button>
        </div>
      </div>
    </div>
  `
})
export class CashierComponent implements OnInit {
  orders: Order[] = [];
  method = 'CASH';
  amount = 0;

  constructor(private api: ApiService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.api.orders().subscribe(data => {
      this.orders = data.filter(order => !['PAID', 'CANCELED'].includes(order.status));
    });
  }

  tableNumber(order: Order) {
    return typeof order.table === 'object' ? order.table.number : '-';
  }

  pay(order: Order) {
    this.api.pay(order._id, this.method, Number(this.amount)).subscribe(() => {
      this.amount = 0;
      this.load();
    });
  }
}
