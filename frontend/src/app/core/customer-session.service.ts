import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, tap } from 'rxjs';
import { API_BASE_URL } from './api.service';
import { Booking } from './models';

const STORAGE_KEY = 'clinic-customer-session';

export interface OtpRequestResult {
  expiresInSec: number;
  resendInSec: number;
  /** Only in demo builds, where no real SMS is sent. */
  demoCode?: string;
}

interface Session {
  token: string;
  phone: string;
}

/**
 * Phone-verified access for clients (no account needed). The token lasts
 * 30 minutes and lives in sessionStorage, so it ends with the tab.
 */
@Injectable({ providedIn: 'root' })
export class CustomerSessionService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/customer`;
  private readonly session = signal<Session | null>(read());

  readonly phone = computed(() => this.session()?.phone ?? null);
  readonly isVerified = computed(() => this.session() !== null);

  requestCode(phone: string): Observable<OtpRequestResult> {
    return this.http.post<OtpRequestResult>(`${this.base}/otp/request`, { phone });
  }

  verify(phone: string, code: string): Observable<{ accessToken: string }> {
    return this.http
      .post<{ accessToken: string }>(`${this.base}/otp/verify`, { phone, code })
      .pipe(tap(({ accessToken }) => this.store({ token: accessToken, phone })));
  }

  myBookings(): Observable<Booking[]> {
    const token = this.session()?.token ?? '';
    return this.http.get<Booking[]>(`${this.base}/bookings`, {
      headers: new HttpHeaders({ Authorization: `Bearer ${token}` }),
    });
  }

  signOut() {
    this.store(null);
  }

  private store(session: Session | null) {
    this.session.set(session);
    try {
      if (session) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      else sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // Storage unavailable: keep the in-memory session only.
    }
  }
}

function read(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}

/** "0891231840" → "089-123-1840" */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10
    ? `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`
    : digits.length === 9
      ? `${digits.slice(0, 2)}-${digits.slice(2, 5)}-${digits.slice(5)}`
      : phone;
}
