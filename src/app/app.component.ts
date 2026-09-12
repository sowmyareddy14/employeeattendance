import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable, finalize } from 'rxjs';
import { EmployeeAttendance, EmployeeAttendanceDraft, AttendanceStatus } from './models/employee-attendance.model';
import { EmployeeAttendanceService } from './services/employee-attendance.service';

interface EmployeeOption {
  id: string;
  name: string;
}

interface CalendarDay {
  date: string;
  day: number;
  status: AttendanceStatus | null;
  isCurrentMonth: boolean;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  private readonly attendanceService = inject(EmployeeAttendanceService);

  readonly statuses = [
    { value: AttendanceStatus.Present, label: 'Present' },
    { value: AttendanceStatus.Absent, label: 'Absent' },
    { value: AttendanceStatus.Leave, label: 'Leave' },
    { value: AttendanceStatus.Remote, label: 'Remote' }
  ];
  attendance: EmployeeAttendance[] = [];
  filteredAttendance: EmployeeAttendance[] = [];
  employees: EmployeeOption[] = [];
  selectedEmployee: EmployeeOption | null = null;
  calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  searchTerm = '';
  selectedDate = '';
  selectedStatus: AttendanceStatus | 'All' = 'All';
  readonly currentDate = this.getLocalDate();
  draft: EmployeeAttendanceDraft = this.emptyDraft();
  isNewEmployee = false;
  editingId: string | null = null;
  isDialogOpen = false;
  isLoading = false;
  errorMessage = '';
  successMessage = '';

  constructor() {
    this.loadAttendance();
  }

  get presentCount(): number { return this.todayAttendance.filter((item) => item.status === AttendanceStatus.Present).length; }
  get absentCount(): number { return this.todayAttendance.filter((item) => item.status === AttendanceStatus.Absent).length; }
  get remoteCount(): number { return this.todayAttendance.filter((item) => item.status === AttendanceStatus.Remote).length; }
  get leaveCount(): number { return this.todayAttendance.filter((item) => item.status === AttendanceStatus.Leave).length; }

  private get todayAttendance(): EmployeeAttendance[] { return this.attendance.filter((item) => item.date === this.currentDate); }

  get calendarMonthLabel(): string { return this.calendarMonth.toLocaleDateString(undefined, { month: 'long', year: 'numeric' }); }

  get calendarDays(): CalendarDay[] {
    if (!this.selectedEmployee) return [];
    const year = this.calendarMonth.getFullYear();
    const month = this.calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const firstGridDay = new Date(year, month, 1 - firstDay.getDay());
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const totalDays = Math.ceil((firstDay.getDay() + daysInMonth) / 7) * 7;

    return Array.from({ length: totalDays }, (_, index) => {
      const date = new Date(firstGridDay.getFullYear(), firstGridDay.getMonth(), firstGridDay.getDate() + index);
      const dateValue = this.formatDate(date);
      const record = this.attendance.find((item) => item.employeeId === this.selectedEmployee?.id && item.date === dateValue);
      return { date: dateValue, day: date.getDate(), status: record?.status ?? null, isCurrentMonth: date.getMonth() === month };
    });
  }

  loadAttendance(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.attendanceService.getAll().pipe(finalize(() => this.isLoading = false)).subscribe({
      next: (items) => {
        this.attendance = items;
        this.employees = this.buildEmployeeOptions(items);
        if (this.selectedEmployee) this.selectedEmployee = this.employees.find((item) => item.id === this.selectedEmployee?.id) ?? null;
        this.applyFilters();
      },
      error: () => { this.errorMessage = 'Could not connect to the attendance API. Check that the API is running and CORS is enabled.'; }
    });
  }

  applyFilters(): void {
    const query = this.searchTerm.trim().toLowerCase();
    this.filteredAttendance = this.attendance.filter((item) => {
      const matchesSearch = !query || item.employeeName.toLowerCase().includes(query) || item.employeeId.toLowerCase().includes(query);
      const matchesDate = !this.selectedDate || item.date === this.selectedDate;
      const matchesStatus = this.selectedStatus === 'All' || item.status === this.selectedStatus;
      return matchesSearch && matchesDate && matchesStatus;
    });
  }

  selectEmployeeForCalendar(employee: EmployeeOption): void {
    this.selectedEmployee = employee;
    this.calendarMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  }

  previousMonth(): void { this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() - 1, 1); }
  nextMonth(): void { this.calendarMonth = new Date(this.calendarMonth.getFullYear(), this.calendarMonth.getMonth() + 1, 1); }

  openCreate(): void {
    this.editingId = null;
    this.isNewEmployee = false;
    this.draft = this.emptyDraft();
    this.isDialogOpen = true;
  }

  openNewEmployee(): void {
    this.editingId = null;
    this.isNewEmployee = true;
    this.draft = this.emptyDraft();
    this.isDialogOpen = true;
  }

  selectEmployee(employeeId: string): void {
    const employee = this.employees.find((item) => item.id === employeeId);
    this.draft.employeeId = employee?.id ?? '';
    this.draft.employeeName = employee?.name ?? '';
  }

  openEdit(item: EmployeeAttendance): void {
    this.editingId = item.id;
    this.isNewEmployee = false;
    this.draft = { employeeId: item.employeeId, employeeName: item.employeeName, date: item.date, status: item.status, notes: item.notes ?? '' };
    this.isDialogOpen = true;
  }

  save(): void {
    if (!this.draft.employeeId.trim() || !this.draft.employeeName.trim() || !this.draft.date) return;
    this.isLoading = true;
    this.errorMessage = '';
    const request: Observable<EmployeeAttendance | void> = this.editingId
      ? this.attendanceService.update(this.editingId, this.draft)
      : this.attendanceService.create(this.draft);
    request.pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => { this.isDialogOpen = false; this.successMessage = this.editingId ? 'Attendance updated.' : this.isNewEmployee ? 'Employee added.' : 'Attendance added.'; this.loadAttendance(); },
      error: () => { this.errorMessage = 'The attendance record could not be saved.'; }
    });
  }

  remove(item: EmployeeAttendance): void {
    if (!window.confirm(`Delete attendance for ${item.employeeName}?`)) return;
    this.isLoading = true;
    this.attendanceService.delete(item.id).pipe(finalize(() => this.isLoading = false)).subscribe({
      next: () => { this.successMessage = 'Attendance deleted.'; this.loadAttendance(); },
      error: () => { this.errorMessage = 'The attendance record could not be deleted.'; }
    });
  }

  statusLabel(status: AttendanceStatus): string { return AttendanceStatus[status]; }
  private buildEmployeeOptions(items: EmployeeAttendance[]): EmployeeOption[] {
    const employees = new Map<string, EmployeeOption>();
    items.forEach((item) => employees.set(item.employeeId, { id: item.employeeId, name: item.employeeName }));
    return [...employees.values()].sort((left, right) => left.name.localeCompare(right.name));
  }
  private emptyDraft(): EmployeeAttendanceDraft { return { employeeId: '', employeeName: '', date: this.currentDate, status: AttendanceStatus.Present, notes: '' }; }
  private getLocalDate(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
