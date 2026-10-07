import type { StudentAttendanceHistory } from './attendanceHistory';
import type { Drive, HourSlot, ParsedAttendance, StudentHeader } from './types';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEY_PREFIX = 'attcalc:v1:';
const STUDENT_HISTORY_PREFIX = 'attcalc:v2:student:';

export interface ExportPayload {
  version: 1;
  fingerprint: string;
  studentName: string;
  studentNumber: string;
  exportedAt: string;
  drives: Drive[];
}

export async function fingerprint(bytes: Uint8Array): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes as BufferSource);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function defaultStore(): KeyValueStore | null {
  try {
    if (typeof window === 'undefined') return null;
    const ls = window.localStorage;
    const probe = `${KEY_PREFIX}probe`;
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    return null;
  }
}

export function isDrive(value: unknown): value is Drive {
  if (typeof value !== 'object' || value === null) return false;
  const d = value as Record<string, unknown>;
  return (
    typeof d.id === 'string' &&
    typeof d.company === 'string' &&
    typeof d.description === 'string' &&
    Array.isArray(d.rowIds) &&
    d.rowIds.every((n) => typeof n === 'number' && Number.isInteger(n))
  );
}

export function saveDrives(
  fp: string,
  drives: Drive[],
  store: KeyValueStore | null = defaultStore(),
): boolean {
  if (!store) return false;
  try {
    store.setItem(KEY_PREFIX + fp, JSON.stringify(drives));
    return true;
  } catch {
    return false;
  }
}

export function loadDrives(
  fp: string,
  store: KeyValueStore | null = defaultStore(),
): Drive[] | null {
  if (!store) return null;
  try {
    const raw = store.getItem(KEY_PREFIX + fp);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    const valid = parsed.filter(isDrive);
    return valid.length > 0 ? valid : [];
  } catch {
    return null;
  }
}

function isHourSlot(value: unknown): value is HourSlot {
  if (typeof value !== 'object' || value === null) return false;
  const slot = value as Record<string, unknown>;
  return (
    typeof slot.id === 'number' &&
    Number.isInteger(slot.id) &&
    typeof slot.courseRaw === 'string' &&
    typeof slot.courseName === 'string' &&
    (slot.typeCode === 'P1' || slot.typeCode === 'T1') &&
    (slot.lectureType === 'PRAC' || slot.lectureType === 'THEO') &&
    typeof slot.division === 'string' &&
    typeof slot.date === 'string' &&
    typeof slot.start === 'string' &&
    typeof slot.end === 'string' &&
    (slot.status === 'P' || slot.status === 'A' || slot.status === 'E' || slot.status === 'L' || slot.status === 'NU')
  );
}

function isParsedAttendance(value: unknown): value is ParsedAttendance {
  if (typeof value !== 'object' || value === null) return false;
  const parsed = value as Record<string, unknown>;
  if (typeof parsed.header !== 'object' || parsed.header === null) return false;
  if (typeof parsed.dateRange !== 'object' || parsed.dateRange === null) return false;
  const header = parsed.header as Record<string, unknown>;
  const dateRange = parsed.dateRange as Record<string, unknown>;
  return (
    ['studentName', 'studentNumber', 'rollNo', 'academicYear', 'programName'].every(
      (key) => typeof header[key] === 'string',
    ) &&
    Array.isArray(parsed.slots) &&
    parsed.slots.every(isHourSlot) &&
    typeof dateRange.from === 'string' &&
    typeof dateRange.to === 'string'
  );
}

function studentHistoryKey(studentNumber: string): string {
  return STUDENT_HISTORY_PREFIX + studentNumber.trim();
}

export function saveStudentHistory(
  studentNumber: string,
  history: StudentAttendanceHistory,
  store: KeyValueStore | null = defaultStore(),
): boolean {
  const normalizedStudentNumber = studentNumber.trim();
  if (!store || !normalizedStudentNumber) return false;
  try {
    store.setItem(
      studentHistoryKey(normalizedStudentNumber),
      JSON.stringify({ version: 2, ...history }),
    );
    return true;
  } catch {
    return false;
  }
}

export function loadStudentHistory(
  studentNumber: string,
  store: KeyValueStore | null = defaultStore(),
): StudentAttendanceHistory | null {
  const normalizedStudentNumber = studentNumber.trim();
  if (!store || !normalizedStudentNumber) return null;
  try {
    const raw = store.getItem(studentHistoryKey(normalizedStudentNumber));
    if (!raw) return null;
    const record: unknown = JSON.parse(raw);
    if (typeof record !== 'object' || record === null) return null;
    const value = record as Record<string, unknown>;
    if (
      value.version !== 2 ||
      !isParsedAttendance(value.parsed) ||
      value.parsed.header.studentNumber.trim() !== normalizedStudentNumber ||
      !Array.isArray(value.drives) ||
      !value.drives.every(isDrive)
    ) {
      return null;
    }
    return { parsed: value.parsed, drives: value.drives };
  } catch {
    return null;
  }
}

export function exportJson(fp: string, header: StudentHeader, drives: Drive[]): string {
  const payload: ExportPayload = {
    version: 1,
    fingerprint: fp,
    studentName: header.studentName,
    studentNumber: header.studentNumber,
    exportedAt: new Date().toISOString(),
    drives,
  };
  return JSON.stringify(payload, null, 2);
}

export type ImportResult =
  | { ok: true; drives: Drive[] }
  | { ok: false; reason: 'fingerprint'; error: string; fingerprint: string; drives: Drive[] }
  | { ok: false; reason: 'invalid-json' | 'invalid-shape'; error: string };

export function parseImport(json: string, currentFingerprint: string | null): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    return { ok: false, reason: 'invalid-json', error: 'That file is not valid JSON.' };
  }
  if (typeof data !== 'object' || data === null) {
    return { ok: false, reason: 'invalid-shape', error: 'Unexpected file structure.' };
  }
  const p = data as Record<string, unknown>;
  if (!Array.isArray(p.drives)) {
    return { ok: false, reason: 'invalid-shape', error: 'No drive list found in that file.' };
  }
  if (!p.drives.every(isDrive)) {
    return {
      ok: false,
      reason: 'invalid-shape',
      error: 'One or more drives in that file are malformed.',
    };
  }
  if (p.version !== undefined && p.version !== 1) {
    return {
      ok: false,
      reason: 'invalid-shape',
      error: 'This file uses an unsupported format version.',
    };
  }
  const fp = typeof p.fingerprint === 'string' ? p.fingerprint : null;
  if (currentFingerprint && fp && fp !== currentFingerprint) {
    return {
      ok: false,
      reason: 'fingerprint',
      error: 'This file was saved for a different attendance PDF.',
      fingerprint: fp,
      drives: p.drives as Drive[],
    };
  }
  return { ok: true, drives: p.drives as Drive[] };
}
