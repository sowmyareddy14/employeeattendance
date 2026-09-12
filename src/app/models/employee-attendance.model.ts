export enum AttendanceStatus {
  Present = 0,
  Absent = 1,
  Leave = 2,
  Remote = 3
}

export interface EmployeeAttendance {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
  notes: string | null;
}

export interface EmployeeAttendanceDraft {
  employeeId: string;
  employeeName: string;
  date: string;
  status: AttendanceStatus;
  notes: string;
}
