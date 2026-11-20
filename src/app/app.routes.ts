import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';
import { LoginComponent } from './pages/login/login.component';
import { WaiterComponent } from './pages/waiter/waiter.component';
import { KitchenComponent } from './pages/kitchen/kitchen.component';
import { CashierComponent } from './pages/cashier/cashier.component';
import { AdminComponent } from './pages/admin/admin.component';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', component: LoginComponent },
  {
    path: 'garcom',
    component: WaiterComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['WAITER', 'MANAGER', 'ADMIN'] }
  },
  {
    path: 'cozinha',
    component: KitchenComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['KITCHEN', 'MANAGER', 'ADMIN'] }
  },
  {
    path: 'caixa',
    component: CashierComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['CASHIER', 'MANAGER', 'ADMIN'] }
  },
  {
    path: 'admin',
    component: AdminComponent,
    canActivate: [authGuard, roleGuard],
    data: { roles: ['ADMIN', 'MANAGER'] }
  }
];
