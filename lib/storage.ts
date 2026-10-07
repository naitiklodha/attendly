import type { Drive, StudentHeader } from './types';

export interface KeyValueStore {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

const KEY_PREFIX = 'attcalc:v1:';

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
  | { ok: false; reason: 'invalid-json' | 'invalid-shape' | 'fingerprint'; error: string; fingerprint?: string };

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
  if (!Array.isArray(p.drives) || !p.drives.every(isDrive)) {
    return { ok: false, reason: 'invalid-shape', error: 'No drive list found in that file.' };
  }
  const fp = typeof p.fingerprint === 'string' ? p.fingerprint : null;
  if (currentFingerprint && fp && fp !== currentFingerprint) {
    return {
      ok: false,
      reason: 'fingerprint',
      error: 'This file was saved for a different attendance PDF.',
      fingerprint: fp,
    };
  }
  return { ok: true, drives: p.drives as Drive[] };
}
