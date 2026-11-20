import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Order, Product, Table, User } from '../../shared/models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private base = '/api';

  constructor(private http: HttpClient) {}

  tables(): Observable<Table[]> {
    return this.http.get<Table[]>(`${this.base}/tables`);
  }

  products(): Observable<Product[]> {
    return this.http.get<Product[]>(`${this.base}/products`);
  }

  orders(status?: string): Observable<Order[]> {
    const query = status ? `?status=${status}` : '';
    return this.http.get<Order[]>(`${this.base}/orders${query}`);
  }

  createOrder(payload: any): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders`, payload);
  }

  addItems(orderId: string, items: any[]): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/items`, { items });
  }

  sendOrder(orderId: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/send`, {});
  }

  changeStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/orders/${orderId}/status`, { status });
  }

  pay(orderId: string, method: string, amount: number): Observable<Order> {
    return this.http.post<Order>(`${this.base}/orders/${orderId}/payments`, { method, amount });
  }

  kitchenQueue(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.base}/kitchen/queue`);
  }

  kitchenStatus(orderId: string, status: string): Observable<Order> {
    return this.http.patch<Order>(`${this.base}/kitchen/orders/${orderId}/status`, { status });
  }

  createUser(user: Partial<User> & { password: string }): Observable<User> {
    return this.http.post<User>(`${this.base}/users`, user);
  }

  users(): Observable<User[]> {
    return this.http.get<User[]>(`${this.base}/users`);
  }

  createProduct(product: Partial<Product>): Observable<Product> {
    return this.http.post<Product>(`${this.base}/products`, product);
  }

  createTable(table: Partial<Table>): Observable<Table> {
    return this.http.post<Table>(`${this.base}/tables`, table);
  }
}
