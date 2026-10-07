export type AttendanceStatus = 'P' | 'A' | 'E' | 'L' | 'NU';

export interface HourSlot {
  id: number;
  courseRaw: string;
  courseName: string;
  typeCode: 'P1' | 'T1';
  lectureType: 'PRAC' | 'THEO';
  division: string;
  date: string;
  start: string;
  end: string;
  status: AttendanceStatus;
}

export interface StudentHeader {
  studentName: string;
  studentNumber: string;
  rollNo: string;
  academicYear: string;
  programName: string;
}

export interface ParsedAttendance {
  header: StudentHeader;
  slots: HourSlot[];
  dateRange: { from: string; to: string };
}

export interface Drive {
  id: string;
  company: string;
  description: string;
  rowIds: number[];
}

export interface CourseLine {
  courseName: string;
  courseRaw: string;
  division: string;
  lectureType: 'THEO' | 'PRAC';
  conducted: number;
  attended: number;
}

export interface CourseSummary {
  courseName: string;
  lines: CourseLine[];
  conducted: number;
  attended: number;
  percentage: number;
}

export interface DashboardRow {
  courseName: string;
  conducted: number;
  originalAttended: number;
  creditedAttended: number;
  originalPct: number;
  correctedPct: number;
}

export interface DateGroup {
  date: string;
  slots: HourSlot[];
}
