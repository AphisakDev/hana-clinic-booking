import { HttpClient } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from '../core/api.service';
import { LoginResult, StaffProfile } from './admin.models';

const STORAGE_KEY = 'clinic-admin-session';

interface Session {
  token: string;
  staff: StaffProfile;
}

/**
 * Keeps the staff login. The token sits in sessionStorage so it is gone when
 * the tab closes; the API rejects it after 8 hours anyway.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly base = inject(API_BASE_URL);

  private readonly session = signal<Session | null>(readSession());

  readonly staff = computed(() => this.session()?.staff ?? null);
  readonly token = computed(() => this.session()?.token ?? null);
  readonly isLoggedIn = computed(() => this.session() !== null);

  login(email: string, password: string): Observable<LoginResult> {
    return this.http
      .post<LoginResult>(`${this.base}/admin/login`, { email, password })
      .pipe(tap(({ accessToken, staff }) => this.store({ token: accessToken, staff })));
  }

  logout(reason?: 'expired') {
    this.store(null);
    void this.router.navigate(['/admin/login'], {
      queryParams: reason ? { reason } : {},
    });
  }

  private store(session: Session | null) {
    this.session.set(session);
    try {
      if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage can be unavailable (private mode); the in-memory session still works.
    }
  }
}

function readSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
