export type Role = 'ADMIN' | 'MANAGER' | 'WAITER' | 'KITCHEN' | 'CASHIER';

export interface User {
  id?: string;
  name: string;
  email: string;
  role: Role;
  active?: boolean;
}

export interface Product {
  _id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  available: boolean;
}

export interface Table {
  _id: string;
  number: number;
  seats: number;
  status: 'FREE' | 'OCCUPIED' | 'RESERVED';
}

export interface OrderItem {
  product: string;
  name: string;
  quantity: number;
  unitPrice: number;
  notes?: string;
}

export interface Payment {
  method: 'CASH' | 'CARD' | 'PIX';
  amount: number;
  paidAt?: string;
}

export interface Order {
  _id: string;
  code: string;
  table: Table | string;
  waiter?: User | string;
  customerName?: string;
  items: OrderItem[];
  status: 'OPEN' | 'SENT' | 'PREPARING' | 'READY' | 'DELIVERED' | 'PAID' | 'CANCELED';
  payments: Payment[];
  total: number;
  paidAmount: number;
  remainingAmount: number;
  openedAt: string;
  sentAt?: string;
  readyAt?: string;
  deliveredAt?: string;
  closedAt?: string;
}
