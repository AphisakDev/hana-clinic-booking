import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Availability,
  Booking,
  Branch,
  Doctor,
  NewBooking,
  Treatment,
  TreatmentCategory,
} from './models';

export const API_BASE_URL = new InjectionToken<string>('API_BASE_URL', {
  factory: () => environment.apiBaseUrl,
});

export interface TreatmentQuery {
  category?: TreatmentCategory;
  q?: string;
}

/** Thin typed wrapper around the REST API. Components never build URLs themselves. */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly base = inject(API_BASE_URL);

  listTreatments(query: TreatmentQuery = {}): Observable<Treatment[]> {
    return this.http.get<Treatment[]>(`${this.base}/treatments`, {
      params: toParams({ category: query.category, q: query.q?.trim() }),
    });
  }

  getTreatment(slug: string): Observable<Treatment> {
    return this.http.get<Treatment>(`${this.base}/treatments/${encodeURIComponent(slug)}`);
  }

  listBranches(): Observable<Branch[]> {
    return this.http.get<Branch[]>(`${this.base}/branches`);
  }

  listDoctors(branchSlug?: string): Observable<Doctor[]> {
    return this.http.get<Doctor[]>(`${this.base}/doctors`, {
      params: toParams({ branch: branchSlug }),
    });
  }

  getAvailability(params: {
    treatment: string;
    branch: string;
    date: string;
    doctor?: string;
  }): Observable<Availability> {
    return this.http.get<Availability>(`${this.base}/availability`, {
      params: toParams(params),
    });
  }

  createBooking(booking: NewBooking): Observable<Booking> {
    return this.http.post<Booking>(`${this.base}/bookings`, booking);
  }

  getBooking(reference: string): Observable<Booking> {
    return this.http.get<Booking>(`${this.base}/bookings/${encodeURIComponent(reference)}`);
  }

  cancelBooking(reference: string): Observable<Booking> {
    return this.http.patch<Booking>(
      `${this.base}/bookings/${encodeURIComponent(reference)}/cancel`,
      {},
    );
  }
}

function toParams(values: Record<string, string | undefined>): HttpParams {
  let params = new HttpParams();
  for (const [key, value] of Object.entries(values)) {
    if (value) params = params.set(key, value);
  }
  return params;
}

/** Turns any HTTP error into a sentence we can show to the user (API messages are Thai). */
export function errorMessage(error: unknown): string {
  if (error instanceof HttpErrorResponse) {
    if (error.status === 0) return 'เชื่อมต่อเซิร์ฟเวอร์ไม่ได้ กรุณาลองใหม่อีกครั้ง';
    const message = (error.error as { message?: string | string[] } | null)?.message;
    if (Array.isArray(message)) return message[0];
    if (message) return message;
  }
  return 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง';
}
