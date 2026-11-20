import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { Product, Table, User } from '../../shared/models';

@Component({
    selector: "app-admin",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <h1>Administração</h1>

        <div class="card">
            <h2>Produtos</h2>
            <div class="row">
                <input [(ngModel)]="productName" placeholder="Nome" />
                <input
                    [(ngModel)]="productPrice"
                    type="number"
                    placeholder="Preço" />
                <button class="primary" (click)="createProduct()">
                    Cadastrar
                </button>
            </div>
            <ul>
                <li *ngFor="let product of products">
                    {{ product.name }} — R$
                    {{ product.price | number: "1.2-2" }}
                </li>
            </ul>
        </div>

        <div class="card">
            <h2>Mesas</h2>
            <div class="row">
                <input
                    [(ngModel)]="tableNumber"
                    type="number"
                    placeholder="Número" />
                <input
                    [(ngModel)]="tableSeats"
                    type="number"
                    placeholder="Lugares" />
                <button class="primary" (click)="createTable()">
                    Cadastrar
                </button>
            </div>
            <ul>
                <li *ngFor="let table of tables">
                    Mesa {{ table.number }} — {{ table.status }}
                </li>
            </ul>
        </div>

        <div class="card">
            <h2>Usuários</h2>
            <div class="row">
                <input [(ngModel)]="userName" placeholder="Nome" />
                <input [(ngModel)]="userEmail" placeholder="E-mail" />
                <input
                    [(ngModel)]="userPassword"
                    type="password"
                    placeholder="Senha" />
                <select [(ngModel)]="userRole">
                    <option value="WAITER">Garçom</option>
                    <option value="KITCHEN">Cozinha</option>
                    <option value="CASHIER">Caixa</option>
                    <option value="MANAGER">Gerente</option>
                    <option value="ADMIN">Administrador</option>
                </select>
                <button class="primary" (click)="createUser()">
                    Cadastrar
                </button>
            </div>
            <ul>
                <li *ngFor="let user of users">
                    {{ user.name }} — {{ user.role }}
                </li>
            </ul>
        </div>
    `,
    styles: [
        `
            .card {
                margin-bottom: 20px;
            }
        `,
    ],
})
export class AdminComponent implements OnInit {
    products: Product[] = [];
    tables: Table[] = [];
    users: User[] = [];

    productName = "";
    productPrice = 0;

    tableNumber = 0;
    tableSeats = 4;

    userName = "";
    userEmail = "";
    userPassword = "";
    userRole = "WAITER";

    constructor(private api: ApiService) {}

    ngOnInit() {
        this.load();
    }

    load() {
        this.api.products().subscribe((data) => (this.products = data));
        this.api.tables().subscribe((data) => (this.tables = data));
        this.api.users().subscribe((data) => (this.users = data));
    }

    createProduct() {
        this.api
            .createProduct({
                name: this.productName,
                price: Number(this.productPrice),
            })
            .subscribe(() => {
                this.productName = "";
                this.productPrice = 0;
                this.load();
            });
    }

    createTable() {
        this.api
            .createTable({
                number: Number(this.tableNumber),
                seats: Number(this.tableSeats),
            })
            .subscribe(() => {
                this.tableNumber = 0;
                this.load();
            });
    }

    createUser() {
        this.api
            .createUser({
                name: this.userName.trim(),
                email: this.userEmail.trim(),
                password: this.userPassword,
                role: this.userRole as User["role"],
            })
            .subscribe({
                next: () => {
                    this.userName = "";
                    this.userEmail = "";
                    this.userPassword = "";

                    this.load();

                    alert("Usuário cadastrado com sucesso.");
                },
                error: (error) => {
                    console.error("Erro ao cadastrar usuário:", error);

                    if (error.status === 403) {
                        alert(
                            "Sem permissão. No sistema atual, somente " +
                                "o administrador pode cadastrar usuários.",
                        );
                        return;
                    }

                    if (error.status === 401) {
                        alert(
                            "Sua sessão é inválida ou expirou. Entre novamente.",
                        );
                        return;
                    }

                    if (error.status === 0) {
                        alert(
                            "Não foi possível acessar a API. " +
                                "Confira se o backend está em execução.",
                        );
                        return;
                    }

                    alert(
                        error.error?.message ||
                            "Não foi possível cadastrar o usuário. " +
                                "Confira o terminal do backend.",
                    );
                },
            });
    }
}
