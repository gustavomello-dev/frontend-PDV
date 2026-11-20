import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, tap } from 'rxjs';
import { User } from '../../shared/models';

interface LoginResponse {
  token: string;
  user: User;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly tokenKey = 'pdv_token';
  private readonly userKey = 'pdv_user';

  currentUser$ = new BehaviorSubject<User | null>(this.readUser());

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string) {
    return this.http
      .post<LoginResponse>('/api/auth/login', { email, password })
      .pipe(
        tap(response => {
          localStorage.setItem(this.tokenKey, response.token);
          localStorage.setItem(this.userKey, JSON.stringify(response.user));
          this.currentUser$.next(response.user);
        })
      );
  }

  logout() {
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    this.currentUser$.next(null);
    this.router.navigate(['/login']);
  }

  get token() {
    return localStorage.getItem(this.tokenKey);
  }

  get user() {
    return this.readUser();
  }

  hasRole(...roles: string[]) {
    const user = this.user;
    return !!user && roles.includes(user.role);
  }

  private readUser(): User | null {
    const raw = localStorage.getItem(this.userKey);
    return raw ? JSON.parse(raw) : null;
  }
}
