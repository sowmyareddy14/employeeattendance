import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmployeeAttendance, EmployeeAttendanceDraft } from '../models/employee-attendance.model';

@Injectable({ providedIn: 'root' })
export class EmployeeAttendanceService {
  private readonly http = inject(HttpClient);
  private readonly endpoint = environment.apiUrl;

  getAll(): Observable<EmployeeAttendance[]> {
    return this.http.get<EmployeeAttendance[]>(this.endpoint);
  }

  create(attendance: EmployeeAttendanceDraft): Observable<EmployeeAttendance> {
    return this.http.post<EmployeeAttendance>(this.endpoint, { ...attendance, notes: attendance.notes || null });
  }

  update(id: string, attendance: EmployeeAttendanceDraft): Observable<void> {
    return this.http.put<void>(`${this.endpoint}/${id}`, { id, ...attendance, notes: attendance.notes || null });
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`${this.endpoint}/${id}`);
  }
}
