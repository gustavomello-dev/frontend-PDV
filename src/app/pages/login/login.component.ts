import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login">
      <form class="card" (ngSubmit)="submit()">
        <h1>PDV Restaurante</h1>
        <label>E-mail</label>
        <input [(ngModel)]="email" name="email" type="email" required />
        <label>Senha</label>
        <input [(ngModel)]="password" name="password" type="password" required />
        <button class="primary" [disabled]="loading">
          {{ loading ? 'Entrando...' : 'Entrar' }}
        </button>
        <p class="error" *ngIf="error">{{ error }}</p>
      </form>
    </div>
  `,
  styles: [`
    .login { min-height: 100vh; display: grid; place-items: center; }
    form { width: 360px; display: grid; gap: 10px; }
    .error { color: #dc2626; }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  loading = false;
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.loading = true;
    this.error = '';

    this.auth.login(this.email, this.password).subscribe({
      next: user => {
        const routes: Record<string, string> = {
          WAITER: '/garcom',
          KITCHEN: '/cozinha',
          CASHIER: '/caixa',
          ADMIN: '/admin',
          MANAGER: '/garcom'
        };
        this.router.navigate([routes[user.user.role] || '/login']);
      },
      error: () => {
        this.error = 'E-mail ou senha inválidos';
        this.loading = false;
      }
    });
  }
}
