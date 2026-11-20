import { Component, OnInit, OnDestroy } from "@angular/core";

import { CommonModule } from "@angular/common";

import { ApiService } from "../../core/services/api.service";
import { Order } from "../../shared/models";

@Component({
    selector: "app-kitchen",
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="row">
            <h1>Fila da Cozinha</h1>

            <button class="primary" (click)="load()" [disabled]="loading">
                {{ loading ? "Atualizando..." : "Atualizar fila" }}
            </button>
        </div>

        <p *ngIf="error" class="error" role="alert">
            {{ error }}
        </p>

        <p *ngIf="!loading && !error && orders.length === 0">
            Nenhum pedido aguardando ou em preparo.
        </p>

        <div class="grid grid-3">
            <article
                class="card"
                *ngFor="let order of orders; trackBy: trackOrder"
                [class.preparing]="order.status === 'PREPARING'">
                <h2>Mesa {{ tableNumber(order) }}</h2>

                <p class="muted">{{ order.code }}</p>

                <p>
                    Status:
                    <strong>
                        {{
                            order.status === "SENT"
                                ? "Aguardando preparo"
                                : order.status === "PREPARING"
                                  ? "Em preparo"
                                  : order.status
                        }}
                    </strong>
                </p>

                <ul>
                    <li *ngFor="let item of order.items">
                        <strong> {{ item.quantity }}x {{ item.name }} </strong>

                        <p *ngIf="item.notes" class="notes">
                            Observação: {{ item.notes }}
                        </p>
                    </li>
                </ul>

                <button
                    *ngIf="order.status === 'SENT'"
                    class="warning"
                    [disabled]="busyIds.has(order._id)"
                    (click)="update(order, 'PREPARING')">
                    Iniciar preparo
                </button>

                <button
                    *ngIf="order.status === 'PREPARING'"
                    class="success"
                    [disabled]="busyIds.has(order._id)"
                    (click)="update(order, 'READY')">
                    Marcar pronto
                </button>
            </article>
        </div>
    `,
    styles: [
        `
            .card {
                border-top: 5px solid #2563eb;
            }

            .card.preparing {
                border-top-color: #d97706;
            }

            .error {
                padding: 12px;
                background: #fee2e2;
                color: #991b1b;
                border-radius: 8px;
            }

            li {
                margin-bottom: 12px;
            }

            .notes {
                margin: 6px 0;
                color: #b45309;
            }
        `,
    ],
})
export class KitchenComponent implements OnInit, OnDestroy {
    orders: Order[] = [];

    loading = false;
    error = "";

    busyIds = new Set<string>();

    private intervalId?: ReturnType<typeof setInterval>;
    private destroyed = false;

    constructor(private api: ApiService) {}

    ngOnInit(): void {
        this.load();

        this.intervalId = setInterval(() => {
            this.load();
        }, 5000);
    }

    ngOnDestroy(): void {
        this.destroyed = true;

        if (this.intervalId !== undefined) {
            clearInterval(this.intervalId);
        }
    }

    load(): void {
        if (this.loading || this.busyIds.size > 0) return;

        this.loading = true;

        this.api.kitchenQueue().subscribe({
            next: (orders) => {
                if (this.destroyed) return;

                this.orders = orders;
                this.loading = false;
                this.error = "";
            },
            error: (err) => {
                if (this.destroyed) return;

                console.error("Erro ao carregar a cozinha:", err);

                this.loading = false;
                this.error =
                    err.error?.message ||
                    "Não foi possível carregar os pedidos da cozinha.";
            },
        });
    }

    update(order: Order, status: "PREPARING" | "READY"): void {
        if (this.loading || this.busyIds.has(order._id)) return;

        this.busyIds.add(order._id);
        this.error = "";

        this.api.kitchenStatus(order._id, status).subscribe({
            next: (updatedOrder) => {
                if (this.destroyed) return;

                this.busyIds.delete(order._id);

                if (updatedOrder.status === "READY") {
                    this.orders = this.orders.filter(
                        (current) => current._id !== order._id,
                    );

                    return;
                }

                // Mantém a mesa já carregada e atualiza o status.
                this.orders = this.orders.map((current) =>
                    current._id === order._id
                        ? { ...current, status: updatedOrder.status }
                        : current,
                );
            },
            error: (err) => {
                if (this.destroyed) return;

                console.error("Erro ao atualizar o pedido:", err);

                this.busyIds.delete(order._id);
                this.error =
                    err.error?.message ||
                    "Não foi possível alterar o status do pedido.";
            },
        });
    }

    tableNumber(order: Order): number | string {
        return typeof order.table === "object" && order.table
            ? order.table.number
            : "-";
    }

    trackOrder(_index: number, order: Order): string {
        return order._id;
    }
}
