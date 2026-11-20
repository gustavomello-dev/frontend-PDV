import { Component } from "@angular/core";
import { Router, RouterOutlet, RouterLink } from "@angular/router";
import { AuthService } from "./core/services/auth.service";
import { CommonModule } from "@angular/common";

@Component({
    selector: "app-root",
    standalone: true,
    imports: [RouterOutlet, RouterLink, CommonModule],
    template: `
        <div class="layout">
            <aside class="sidebar">
                <h2>PDV Restaurante</h2>
                <nav>
                    <a
                        routerLink="/garcom"
                        *ngIf="auth.hasRole('WAITER', 'MANAGER', 'ADMIN')"
                        >Garçom</a
                    >
                    <a
                        routerLink="/cozinha"
                        *ngIf="auth.hasRole('KITCHEN', 'MANAGER', 'ADMIN')"
                        >Cozinha</a
                    >
                    <a
                        routerLink="/caixa"
                        *ngIf="auth.hasRole('CASHIER', 'MANAGER', 'ADMIN')"
                        >Caixa</a
                    >
                    <a
                        routerLink="/admin"
                        *ngIf="auth.hasRole('ADMIN', 'MANAGER')"
                        >Administração</a
                    >
                </nav>
                <div class="user" *ngIf="auth.currentUser$ | async as user">
                    <strong>{{ user.name }}</strong>
                    <span class="muted">{{ user.role }}</span>
                    <button class="danger" (click)="auth.logout()">Sair</button>
                </div>
            </aside>
            <main><router-outlet /></main>
        </div>
    `,
    styles: [
        `
            .layout {
                display: flex;
                min-height: 100vh;
            }
            .sidebar {
                width: 230px;
                background: #111827;
                color: #fff;
                padding: 20px;
                display: flex;
                flex-direction: column;
                gap: 20px;
            }
            .sidebar a {
                display: block;
                color: #cbd5e1;
                text-decoration: none;
                padding: 10px;
                border-radius: 8px;
            }
            .sidebar a:hover {
                background: #1f2937;
                color: #fff;
            }
            main {
                flex: 1;
                padding: 24px;
            }
            .user {
                margin-top: auto;
                display: grid;
                gap: 6px;
            }
        `,
    ],
})
export class AppComponent {
    constructor(
        public auth: AuthService,
        private router: Router,
    ) {}
}
