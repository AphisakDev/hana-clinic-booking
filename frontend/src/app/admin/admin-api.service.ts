import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { API_BASE_URL } from '../core/api.service';
import {
  AdminBooking,
  BookingStatus,
  NewTimeBlock,
  Schedule,
  Stats,
  TimeBlock,
} from './admin.models';

@Injectable({ providedIn: 'root' })
export class AdminApiService {
  private readonly http = inject(HttpClient);
  private readonly base = `${inject(API_BASE_URL)}/admin`;

  getStats(branch?: string): Observable<Stats> {
    const params = branch ? new HttpParams().set('branch', branch) : undefined;
    return this.http.get<Stats>(`${this.base}/stats`, { params });
  }

  getSchedule(date: string, branch: string): Observable<Schedule> {
    return this.http.get<Schedule>(`${this.base}/schedule`, {
      params: new HttpParams().set('date', date).set('branch', branch),
    });
  }

  changeStatus(reference: string, status: BookingStatus): Observable<AdminBooking> {
    return this.http.patch<AdminBooking>(
      `${this.base}/bookings/${encodeURIComponent(reference)}/status`,
      { status },
    );
  }

  createBlock(block: NewTimeBlock): Observable<TimeBlock> {
    return this.http.post<TimeBlock>(`${this.base}/blocks`, block);
  }

  deleteBlock(id: string): Observable<void> {
    return this.http.delete<void>(`${this.base}/blocks/${encodeURIComponent(id)}`);
  }
}
