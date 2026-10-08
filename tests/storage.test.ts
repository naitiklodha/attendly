import { describe, expect, it } from 'vitest';
import {
  exportJson,
  fingerprint,
  loadDrives,
  loadStudentHistory,
  parseImport,
  saveDrives,
  saveStudentHistory,
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
  studentName: 'Sample Student',
  studentNumber: 'STUDENT-TEST-001',
  rollNo: 'R001',
  academicYear: '2026-2027, Semester XI',
  programName: 'Sample Engineering Program',
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
  it('filters out malformed drive entries', () => {
    const store = memoryStore();
    store.setItem('attcalc:v1:abc', JSON.stringify([drives[0], { bogus: 1 }]));
    expect(loadDrives('abc', store)).toEqual(drives);
  });
});

describe('saveStudentHistory / loadStudentHistory', () => {
  const history = {
    parsed: {
      header,
      slots: [],
      dateRange: { from: '2026-01-12', to: '2026-01-12' },
    },
    drives,
    merges: {},
  };

  it('round-trips history independently for each SAP student number', () => {
    const store = memoryStore();
    expect(saveStudentHistory(header.studentNumber, history, store)).toBe(true);
    expect(loadStudentHistory(header.studentNumber, store)).toEqual(history);
    expect(loadStudentHistory('another-student', store)).toBeNull();
  });

  it('round-trips subject merges with the history', () => {
    const store = memoryStore();
    const withMerges = { ...history, merges: { Sample: 'Sample Course' } };
    expect(saveStudentHistory(header.studentNumber, withMerges, store)).toBe(true);
    expect(loadStudentHistory(header.studentNumber, store)).toEqual(withMerges);
  });

  it('leaves legacy fingerprint records untouched', () => {
    const store = memoryStore();
    const legacy = JSON.stringify(drives);
    store.setItem('attcalc:v1:old-fingerprint', legacy);

    expect(saveStudentHistory(header.studentNumber, history, store)).toBe(true);
    expect(store.getItem('attcalc:v1:old-fingerprint')).toBe(legacy);
  });

  it('ignores malformed student history', () => {
    const store = memoryStore();
    store.setItem('attcalc:v2:student:STUDENT-TEST-001', '{not json');

    expect(loadStudentHistory(header.studentNumber, store)).toBeNull();
  });
});

describe('exportJson / parseImport', () => {
  it('round-trips a valid export', () => {
    const json = exportJson('fp123', header, drives);
    const result = parseImport(json, 'fp123');
    expect(result).toEqual({ ok: true, drives, merges: {} });
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
  it('rejects unsupported format versions', () => {
    const result = parseImport(JSON.stringify({ version: 2, drives }), 'fp123');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toBe('invalid-shape');
      expect(result.error).toBe('This file uses an unsupported format version.');
    }
  });
  it('accepts files without a fingerprint field', () => {
    const result = parseImport(JSON.stringify({ drives }), 'fp123');
    expect(result).toEqual({ ok: true, drives, merges: {} });
  });
  it('carries subject merges through the export', () => {
    const merges = { 'NLP Procsg': 'Natural Language Processing' };
    const result = parseImport(exportJson('fp123', header, drives, merges), 'fp123');
    expect(result).toEqual({ ok: true, drives, merges });
  });
  it('flags a fingerprint mismatch', () => {
    const json = exportJson('other-fp', header, drives);
    const result = parseImport(json, 'fp123');
    expect(result.ok).toBe(false);
    if (!result.ok && result.reason === 'fingerprint') {
      expect(result.fingerprint).toBe('other-fp');
      expect(result.drives).toEqual(drives);
    } else {
      expect.fail('expected a fingerprint mismatch');
    }
  });
});
