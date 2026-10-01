import {HttpClient} from '@angular/common/http';
import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import API_URL from 'src/app/config/constants/apiUrl';

export interface StaffAttentionCounts {
  awaiting_feedback_count: number;
  help_requested_count: number;
  extension_requested_count: number;
  oldest_wait_days: number | null;
  overdue_feedback_count: number;
}

export interface StaffAttentionUnit extends StaffAttentionCounts {
  queue_scope: 'all' | 'mine';
  unit_id: number;
  unit_code: string;
  unit_name: string;
  feedback_warning_threshold_days: number;
}

export interface StaffAttention {
  units: StaffAttentionUnit[];
  totals: StaffAttentionCounts;
}

/** The server scopes these counts to the signed-in staff member's teaching duties. */
@Injectable({providedIn: 'root'})
export class AttentionService {
  constructor(private http: HttpClient) {}

  staff(): Observable<StaffAttention> {
    // Deliberately uncached: a summary from an earlier login must never be reused.
    return this.http.get<StaffAttention>(`${API_URL}/attention/staff`);
  }
}
