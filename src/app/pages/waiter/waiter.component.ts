import { Component, OnInit, OnDestroy } from "@angular/core";

import { CommonModule } from "@angular/common";
import { FormsModule } from "@angular/forms";

import { forkJoin, Subscription, finalize } from "rxjs";

import { ApiService } from "../../core/services/api.service";

import { Order, Product, Table } from "../../shared/models";

interface DraftItem {
    productId: string;
    name: string;
    quantity: number;
    unitPrice: number;
    notes: string;
}

@Component({
    selector: "app-waiter",
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
        <div class="row">
            <h1>Área do Garçom</h1>

            <button
                class="primary"
                (click)="load()"
                [disabled]="loading || busy">
                {{ loading ? "Atualizando..." : "Atualizar" }}
            </button>
        </div>

        <p *ngIf="error" class="message error" role="alert">
            {{ error }}
        </p>

        <p *ngIf="message" class="message success-message">
            {{ message }}
        </p>

        <h2>Mesas</h2>

        <div class="grid grid-3">
            <article class="card" *ngFor="let table of tables">
                <h3>Mesa {{ table.number }}</h3>

                <p class="muted">{{ table.seats }} lugares</p>

                <p>{{ tableLabel(table) }}</p>

                <button
                    class="primary"
                    [disabled]="table.status === 'RESERVED' || loading || busy"
                    (click)="accessTable(table)">
                    {{
                        activeOrdersForTable(table).length > 0
                            ? "Ver pedidos da mesa"
                            : table.status === "OCCUPIED"
                              ? "Conferir mesa"
                              : "Novo pedido"
                    }}
                </button>
            </article>
        </div>

        <section class="card section">
            <h2>Pedidos em andamento: {{ orders.length }}</h2>

            <p *ngIf="!loading && orders.length === 0">
                Nenhum pedido ativo encontrado.
            </p>

            <div class="grid grid-3">
                <article
                    class="order-card"
                    *ngFor="let order of orders"
                    [class.ready]="order.status === 'READY'">
                    <h3>Mesa {{ tableNumber(order) }}</h3>

                    <p class="muted">{{ order.code }}</p>

                    <p>{{ statusLabel(order.status) }}</p>

                    <ul>
                        <li *ngFor="let item of order.items">
                            {{ item.quantity }}x {{ item.name }}
                        </li>
                    </ul>

                    <p>Total: R$ {{ order.total | number: "1.2-2" }}</p>

                    <button
                        class="primary"
                        [disabled]="busy"
                        (click)="selectOrder(order)">
                        Ver detalhes
                    </button>
                </article>
            </div>
        </section>

        <section class="card section" *ngIf="draftTable">
            <h2>Novo pedido — Mesa {{ draftTable.number }}</h2>

            <p class="muted">
                Escolha os produtos antes de salvar. A mesa só será ocupada
                quando o pedido for salvo.
            </p>

            <div class="item-form">
                <select [(ngModel)]="selectedProduct" [disabled]="busy">
                    <option [ngValue]="null">Selecione um produto</option>

                    <option
                        *ngFor="let product of products"
                        [ngValue]="product">
                        {{ product.name }} — R$
                        {{ product.price | number: "1.2-2" }}
                    </option>
                </select>

                <input
                    type="number"
                    [(ngModel)]="quantity"
                    min="1"
                    step="1"
                    placeholder="Quantidade"
                    [disabled]="busy" />

                <input
                    [(ngModel)]="notes"
                    placeholder="Observação"
                    [disabled]="busy" />

                <button
                    class="primary"
                    (click)="addDraftItem()"
                    [disabled]="busy || !selectedProduct">
                    Adicionar ao pedido
                </button>
            </div>

            <ul>
                <li *ngFor="let item of draftItems; let index = index">
                    {{ item.quantity }}x {{ item.name }}
                    — R$
                    {{ item.quantity * item.unitPrice | number: "1.2-2" }}

                    <span *ngIf="item.notes"> — {{ item.notes }} </span>

                    <button
                        class="danger"
                        (click)="removeDraftItem(index)"
                        [disabled]="busy">
                        Remover
                    </button>
                </li>
            </ul>

            <h3>Total: R$ {{ draftTotal | number: "1.2-2" }}</h3>

            <div class="row">
                <button
                    class="success"
                    (click)="createOrder()"
                    [disabled]="busy || loading || draftItems.length === 0">
                    Salvar pedido
                </button>

                <button (click)="closeDraft()" [disabled]="busy">
                    Cancelar rascunho
                </button>
            </div>
        </section>

        <section class="card section" *ngIf="selectedOrder as order">
            <div class="row">
                <h2>Pedido {{ order.code }} — Mesa {{ tableNumber(order) }}</h2>

                <button (click)="selectedOrder = null" [disabled]="busy">
                    Fechar detalhes
                </button>
            </div>

            <p>Status: {{ statusLabel(order.status) }}</p>

            <div class="item-form" *ngIf="order.status === 'OPEN'">
                <select [(ngModel)]="selectedProduct" [disabled]="busy">
                    <option [ngValue]="null">Selecione um produto</option>

                    <option
                        *ngFor="let product of products"
                        [ngValue]="product">
                        {{ product.name }} — R$
                        {{ product.price | number: "1.2-2" }}
                    </option>
                </select>

                <input
                    type="number"
                    [(ngModel)]="quantity"
                    min="1"
                    step="1"
                    [disabled]="busy" />

                <input
                    [(ngModel)]="notes"
                    placeholder="Observação"
                    [disabled]="busy" />

                <button
                    class="primary"
                    (click)="addItem()"
                    [disabled]="busy || loading || !selectedProduct">
                    Adicionar item
                </button>
            </div>

            <p
                *ngIf="order.status === 'PREPARING'"
                class="message preparing-message">
                Este pedido está sendo preparado na cozinha.
            </p>

            <p *ngIf="order.status === 'READY'" class="message success-message">
                Pedido pronto para retirar na cozinha.
            </p>

            <div class="table-wrapper">
                <table>
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Quantidade</th>
                            <th>Observação</th>
                            <th>Subtotal</th>
                        </tr>
                    </thead>

                    <tbody>
                        <tr *ngFor="let item of order.items">
                            <td>{{ item.name }}</td>
                            <td>{{ item.quantity }}</td>
                            <td>{{ item.notes || "-" }}</td>

                            <td>
                                R$
                                {{
                                    item.quantity * item.unitPrice
                                        | number: "1.2-2"
                                }}
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

            <h3>Total: R$ {{ order.total | number: "1.2-2" }}</h3>

            <div class="row">
                <button
                    *ngIf="order.status === 'OPEN'"
                    class="success"
                    (click)="send()"
                    [disabled]="busy || loading">
                    Enviar para cozinha
                </button>

                <button
                    *ngIf="order.status === 'READY'"
                    class="warning"
                    (click)="deliver()"
                    [disabled]="busy || loading">
                    Confirmar entrega ao cliente
                </button>
            </div>
        </section>
    `,
    styles: [
        `
            .section {
                margin-top: 24px;
            }

            .message {
                padding: 12px;
                border-radius: 8px;
            }

            .error {
                background: #fee2e2;
                color: #991b1b;
            }

            .success-message {
                background: #dcfce7;
                color: #166534;
            }

            .preparing-message {
                background: #fef3c7;
                color: #92400e;
            }

            .order-card {
                border: 1px solid #cbd5e1;
                border-left: 5px solid #2563eb;
                border-radius: 8px;
                padding: 16px;
            }

            .order-card.ready {
                border-left-color: #16a34a;
            }

            .item-form {
                display: grid;
                grid-template-columns: 2fr 100px 2fr auto;
                gap: 10px;
                margin: 16px 0;
            }

            .table-wrapper {
                overflow-x: auto;
            }

            table {
                width: 100%;
                border-collapse: collapse;
                margin: 16px 0;
            }

            th,
            td {
                padding: 10px;
                border-bottom: 1px solid #e2e8f0;
                text-align: left;
            }

            li {
                margin-bottom: 10px;
            }

            @media (max-width: 900px) {
                .item-form {
                    grid-template-columns: 1fr;
                }
            }
        `,
    ],
})
export class WaiterComponent implements OnInit, OnDestroy {
    tables: Table[] = [];
    products: Product[] = [];
    orders: Order[] = [];

    selectedOrder: Order | null = null;
    selectedProduct: Product | null = null;

    draftTable: Table | null = null;
    draftItems: DraftItem[] = [];

    quantity = 1;
    notes = "";

    loading = false;
    busy = false;

    message = "";
    error = "";

    private intervalId?: ReturnType<typeof setInterval>;
    private subscriptions = new Subscription();

    constructor(private api: ApiService) {}

    ngOnInit(): void {
        this.load();

        this.intervalId = setInterval(() => {
            this.load();
        }, 5000);
    }

    ngOnDestroy(): void {
        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
        }

        this.subscriptions.unsubscribe();
    }

    load(): void {
        if (this.loading || this.busy) return;

        this.loading = true;

        const request = forkJoin({
            tables: this.api.tables(),
            products: this.api.products(),
            orders: this.api.orders(),
        })
            .pipe(
                finalize(() => {
                    this.loading = false;
                }),
            )
            .subscribe({
                next: (result) => {
                    this.tables = result.tables;

                    this.products = result.products.filter(
                        (product) => product.available,
                    );

                    this.orders = result.orders.filter(
                        (order) => !["PAID", "CANCELED"].includes(order.status),
                    );

                    // Atualiza também os detalhes do pedido aberto.
                    if (this.selectedOrder) {
                        const selectedId = this.selectedOrder._id;

                        this.selectedOrder =
                            this.orders.find(
                                (order) => order._id === selectedId,
                            ) || null;
                    }

                    this.error = "";
                },
                error: (err) => {
                    this.error =
                        err.error?.message ||
                        "Não foi possível atualizar mesas e pedidos.";
                },
            });

        this.subscriptions.add(request);
    }

    activeOrdersForTable(table: Table): Order[] {
        return this.orders.filter((order) => {
            const tableId =
                typeof order.table === "string"
                    ? order.table
                    : order.table?._id;

            return tableId === table._id;
        });
    }

    tableLabel(table: Table): string {
        if (this.activeOrdersForTable(table).length > 0) {
            return "Ocupada";
        }

        const labels = {
            FREE: "Livre",
            OCCUPIED: "Ocupada",
            RESERVED: "Reservada",
        };

        return labels[table.status];
    }

    accessTable(table: Table): void {
        if (this.busy || this.loading) return;

        this.error = "";
        this.message = "";

        const activeOrders = this.activeOrdersForTable(table);

        if (activeOrders.length > 0) {
            this.selectOrder(activeOrders[0]);

            if (activeOrders.length > 1) {
                this.message =
                    "Esta mesa tem mais de um pedido ativo. " +
                    "Todos estão na lista de pedidos em andamento.";
            }

            return;
        }

        if (table.status !== "FREE") {
            this.error =
                "Esta mesa não está livre e nenhum pedido ativo foi " +
                "encontrado na lista carregada. Atualize e confira " +
                "os registros antes de liberar a mesa.";

            return;
        }

        if (this.draftItems.length > 0) {
            this.error =
                "Salve ou cancele o rascunho atual antes de abrir outra mesa.";

            return;
        }

        this.selectedOrder = null;
        this.draftTable = table;
        this.draftItems = [];

        this.resetItemForm();
    }

    selectOrder(order: Order): void {
        if (this.busy) return;

        if (this.draftItems.length > 0) {
            this.error =
                "Salve ou cancele o rascunho antes de consultar outro pedido.";

            return;
        }

        this.draftTable = null;
        this.selectedOrder = order;

        this.resetItemForm();
    }

    addDraftItem(): void {
        if (!this.draftTable || this.busy) return;
        if (!this.validateItem()) return;

        const product = this.selectedProduct!;

        this.draftItems.push({
            productId: product._id,
            name: product.name,
            quantity: Number(this.quantity),
            unitPrice: product.price,
            notes: this.notes.trim(),
        });

        this.resetItemForm();
    }

    removeDraftItem(index: number): void {
        if (this.busy) return;

        this.draftItems.splice(index, 1);
    }

    get draftTotal(): number {
        return this.draftItems.reduce(
            (total, item) => total + item.quantity * item.unitPrice,
            0,
        );
    }

    closeDraft(): void {
        if (this.busy) return;

        this.draftTable = null;
        this.draftItems = [];

        this.resetItemForm();
    }

    createOrder(): void {
        if (
            !this.draftTable ||
            this.draftItems.length === 0 ||
            this.busy ||
            this.loading
        ) {
            return;
        }

        this.busy = true;
        this.error = "";
        this.message = "";

        const request = this.api
            .createOrder({
                tableId: this.draftTable._id,
                customerName: "",
                items: this.draftItems.map((item) => ({
                    productId: item.productId,
                    quantity: item.quantity,
                    notes: item.notes,
                })),
            })
            .subscribe({
                next: (order) => {
                    this.busy = false;

                    this.selectedOrder = order;
                    this.orders = [order, ...this.orders];

                    this.draftTable = null;
                    this.draftItems = [];

                    this.resetItemForm();

                    this.message =
                        "Pedido salvo. Confira os itens e clique em " +
                        '"Enviar para cozinha".';

                    this.load();
                },
                error: (err) => {
                    this.busy = false;

                    this.error =
                        err.error?.message ||
                        "Não foi possível salvar o pedido. Atualize a lista " +
                            "para conferir se ele foi registrado antes de tentar novamente.";
                },
            });

        this.subscriptions.add(request);
    }

    addItem(): void {
        if (
            !this.selectedOrder ||
            this.selectedOrder.status !== "OPEN" ||
            this.busy ||
            this.loading
        ) {
            return;
        }

        if (!this.validateItem()) return;

        this.busy = true;
        this.error = "";

        const request = this.api
            .addItems(this.selectedOrder._id, [
                {
                    productId: this.selectedProduct!._id,
                    quantity: Number(this.quantity),
                    notes: this.notes.trim(),
                },
            ])
            .subscribe({
                next: (order) => {
                    this.busy = false;
                    this.selectedOrder = order;

                    this.resetItemForm();
                    this.load();
                },
                error: (err) => {
                    this.busy = false;

                    this.error =
                        err.error?.message ||
                        "Não foi possível adicionar o item.";
                },
            });

        this.subscriptions.add(request);
    }

    send(): void {
        if (
            !this.selectedOrder ||
            this.selectedOrder.status !== "OPEN" ||
            this.busy ||
            this.loading
        ) {
            return;
        }

        const order = this.selectedOrder;

        this.busy = true;
        this.error = "";

        const request = this.api.sendOrder(order._id).subscribe({
            next: (updated) => {
                this.busy = false;

                // Preserva a mesa populada da consulta anterior.
                this.selectedOrder = {
                    ...order,
                    status: updated.status,
                };

                this.message = "Pedido enviado para a cozinha.";
                this.load();
            },
            error: (err) => {
                this.busy = false;

                this.error =
                    err.error?.message || "Não foi possível enviar o pedido.";
            },
        });

        this.subscriptions.add(request);
    }

    deliver(): void {
        if (
            !this.selectedOrder ||
            this.selectedOrder.status !== "READY" ||
            this.busy ||
            this.loading
        ) {
            return;
        }

        const order = this.selectedOrder;

        this.busy = true;
        this.error = "";

        const request = this.api
            .changeStatus(order._id, "DELIVERED")
            .subscribe({
                next: (updated) => {
                    this.busy = false;

                    this.selectedOrder = {
                        ...order,
                        status: updated.status,
                    };

                    this.message =
                        "Entrega confirmada. A mesa permanece ocupada até o fechamento.";

                    this.load();
                },
                error: (err) => {
                    this.busy = false;

                    this.error =
                        err.error?.message ||
                        "Não foi possível confirmar a entrega.";
                },
            });

        this.subscriptions.add(request);
    }

    tableNumber(order: Order): number | string {
        return typeof order.table === "object" && order.table
            ? order.table.number
            : "-";
    }

    statusLabel(status: Order["status"]): string {
        const labels: Record<Order["status"], string> = {
            OPEN: "Aberto — falta enviar para a cozinha",
            SENT: "Aguardando cozinha",
            PREPARING: "Em preparo na cozinha",
            READY: "Pronto para retirar",
            DELIVERED: "Entregue — aguardando pagamento",
            PAID: "Pago",
            CANCELED: "Cancelado",
        };

        return labels[status];
    }

    private validateItem(): boolean {
        if (!this.selectedProduct) {
            this.error = "Selecione um produto.";
            return false;
        }

        const quantity = Number(this.quantity);

        if (!Number.isInteger(quantity) || quantity < 1) {
            this.error = "Informe uma quantidade inteira maior que zero.";
            return false;
        }

        this.error = "";
        return true;
    }

    private resetItemForm(): void {
        this.selectedProduct = null;
        this.quantity = 1;
        this.notes = "";
    }
}
