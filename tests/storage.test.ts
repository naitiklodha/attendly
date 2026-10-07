import { describe, expect, it } from 'vitest';
import {
  exportJson,
  fingerprint,
  loadDrives,
  parseImport,
  saveDrives,
  type KeyValueStore,
} from '../lib/storage';
import type { Drive, StudentHeader } from '../lib/types';

function memoryStore(): KeyValueStore & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return {
    data,
    getItem: (k) => data.get(k) ?? null,
    setItem: (k, v) => void data.set(k, v),
    removeItem: (k) => void data.delete(k),
  };
}

const header: StudentHeader = {
  studentName: 'NAITIK LODHA',
  studentNumber: '70322100139',
  rollNo: 'C028',
  academicYear: '2026-2027, Semester XI',
  programName: 'B.Tech (Comp. Engg.) (Integrated)',
};

const drives: Drive[] = [{ id: 'd1', company: 'TCS', description: 'TCS drive', rowIds: [16, 17] }];

describe('fingerprint', () => {
  it('is stable for the same bytes', async () => {
    const a = await fingerprint(new Uint8Array([1, 2, 3]));
    const b = await fingerprint(new Uint8Array([1, 2, 3]));
    expect(a).toBe(b);
    expect(a).toHaveLength(64);
  });
  it('differs for different bytes', async () => {
    const a = await fingerprint(new Uint8Array([1, 2, 3]));
    const b = await fingerprint(new Uint8Array([1, 2, 4]));
    expect(a).not.toBe(b);
  });
});

describe('saveDrives / loadDrives', () => {
  it('round-trips through a store', async () => {
    const store = memoryStore();
    const fp = await fingerprint(new Uint8Array([9]));
    expect(saveDrives(fp, drives, store)).toBe(true);
    expect(loadDrives(fp, store)).toEqual(drives);
  });
  it('returns false when no store is available', () => {
    expect(saveDrives('fp', drives, null)).toBe(false);
    expect(loadDrives('fp', null)).toBeNull();
  });
  it('ignores corrupted payloads', () => {
    const store = memoryStore();
    store.setItem('attcalc:v1:abc', '{not json');
    expect(loadDrives('abc', store)).toBeNull();
  });
});

describe('exportJson / parseImport', () => {
  it('round-trips a valid export', () => {
    const json = exportJson('fp123', header, drives);
    const result = parseImport(json, 'fp123');
    expect(result).toEqual({ ok: true, drives });
  });
  it('rejects invalid JSON', () => {
    const result = parseImport('{oops', 'fp123');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-json');
  });
  it('rejects files without a drives array', () => {
    const result = parseImport(JSON.stringify({ hello: 1 }), 'fp123');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.reason).toBe('invalid-shape');
  });
  it('flags a fingerprint mismatch', () => {
    const json = exportJson('other-fp', header, drives);
    const result = parseImport(json, 'fp123');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('fingerprint');
      expect(result.fingerprint).toBe('other-fp');
    }
  });
});
