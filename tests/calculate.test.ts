import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  buildDashboard,
  creditedIds,
  groupAbsentByDate,
  pct,
  summarize,
} from '../lib/calculate';
import { parseAttendance } from '../lib/parseAttendance';
import type { Drive, HourSlot } from '../lib/types';

let autoId = 0;
function slot(partial: Partial<HourSlot>): HourSlot {
  autoId += 1;
  return {
    id: autoId,
    courseRaw: 'Demo P1 BTI Comp B',
    courseName: 'Demo',
    typeCode: 'P1',
    lectureType: 'PRAC',
    division: 'BTI Comp B',
    date: '2026-07-13',
    start: '10:00 AM',
    end: '11:00 AM',
    status: 'P',
    ...partial,
  };
}

describe('pct', () => {
  it('reproduces the official sheet percentages', () => {
    expect(pct(32, 42)).toBe(76.19);
    expect(pct(30, 46)).toBe(65.22);
    expect(pct(41, 44)).toBe(93.18);
    expect(pct(40, 44)).toBe(90.91);
    expect(pct(28, 34)).toBe(82.35);
  });
  it('guards zero denominators', () => {
    expect(pct(0, 0)).toBe(0);
  });
});

describe('summarize', () => {
  it('groups per course + lecture type and shows percentage once per course', () => {
    const slots: HourSlot[] = [
      ...Array.from({ length: 24 }, (_, i) =>
        slot({ courseName: 'Deep Learning', courseRaw: 'Deep LearningP1', typeCode: 'P1', lectureType: 'PRAC', status: i < 20 ? 'P' : 'A', id: 1000 + i }),
      ),
      ...Array.from({ length: 18 }, (_, i) =>
        slot({ courseName: 'Deep Learning', courseRaw: 'Deep LearningT1', typeCode: 'T1', lectureType: 'THEO', status: i < 12 ? 'P' : 'A', id: 2000 + i }),
      ),
    ];
    const [summary] = summarize(slots, new Set());
    expect(summary.percentage).toBe(76.19);
    expect(summary.conducted).toBe(42);
    expect(summary.attended).toBe(32);
    expect(summary.lines).toHaveLength(2);
    expect(summary.lines[0]).toMatchObject({
      courseName: 'DEEP LEARNING',
      courseRaw: 'DEEP LEARNINGP1',
      division: 'BTI COMP B',
      lectureType: 'PRAC',
      conducted: 24,
      attended: 20,
    });
    expect(summary.lines[1]).toMatchObject({ lectureType: 'THEO', conducted: 18, attended: 12 });
  });

  it('merges interleaved lecture types into one line each', () => {
    const slots = [
      slot({ courseName: 'Interleave', courseRaw: 'InterleaveP1', lectureType: 'PRAC' }),
      slot({ courseName: 'Interleave', courseRaw: 'InterleaveT1', lectureType: 'THEO' }),
      slot({ courseName: 'Interleave', courseRaw: 'InterleaveP1', lectureType: 'PRAC' }),
    ];
    const [summary] = summarize(slots, new Set());
    expect(summary.lines).toHaveLength(2);
    expect(summary.lines[0]).toMatchObject({ lectureType: 'PRAC', conducted: 2 });
    expect(summary.lines[1]).toMatchObject({ lectureType: 'THEO', conducted: 1 });
  });

  it('credits absent hours marked into a drive', () => {
    const slots = [slot({ status: 'A' }), slot({ status: 'P' })];
    const [before] = summarize(slots, new Set());
    expect(before.attended).toBe(1);
    const [after] = summarize(slots, new Set([slots[0].id]));
    expect(after.attended).toBe(2);
    expect(after.conducted).toBe(2);
    expect(after.percentage).toBe(100);
  });

  it('excludes NU and E from both totals', () => {
    const slots = [slot({ status: 'NU' }), slot({ status: 'E' }), slot({ status: 'P' })];
    const [summary] = summarize(slots, new Set());
    expect(summary.conducted).toBe(1);
    expect(summary.attended).toBe(1);
  });

  it('counts L as present', () => {
    const [summary] = summarize([slot({ status: 'L' })], new Set());
    expect(summary.attended).toBe(1);
  });

  it('orders courses by first appearance', () => {
    const slots = [
      slot({ courseName: 'Alpha', courseRaw: 'AlphaP1' }),
      slot({ courseName: 'Beta', courseRaw: 'BetaP1', id: 999 }),
      slot({ courseName: 'Alpha', courseRaw: 'AlphaP1' }),
    ];
    const summaries = summarize(slots, new Set());
    expect(summaries.map((s) => s.courseName)).toEqual(['Alpha', 'Beta']);
  });
});

describe('buildDashboard', () => {
  it('returns original vs corrected per subject', () => {
    const slots = [
      slot({ courseName: 'Big Data Analytics', courseRaw: 'Big Data AnalyticsP1', status: 'P' }),
      slot({ courseName: 'Big Data Analytics', courseRaw: 'Big Data AnalyticsP1', status: 'A' }),
      slot({ courseName: 'Big Data Analytics', courseRaw: 'Big Data AnalyticsP1', status: 'A' }),
    ];
    const drives: Drive[] = [
      { id: 'd1', company: 'TCS', description: 'Drive', rowIds: [slots[1].id] },
    ];
    const [row] = buildDashboard(slots, creditedIds(drives));
    expect(row.originalPct).toBe(33.33);
    expect(row.correctedPct).toBe(66.67);
    expect(row.originalAttended).toBe(1);
    expect(row.creditedAttended).toBe(2);
    expect(row.conducted).toBe(3);
  });

  it('previews selected hours before they are saved to a drive', () => {
    const slots = [
      slot({ id: 20, courseName: 'Cloud Computing', status: 'P' }),
      slot({ id: 21, courseName: 'Cloud Computing', status: 'A' }),
      slot({ id: 22, courseName: 'Cloud Computing', status: 'A' }),
    ];
    const drives: Drive[] = [
      { id: 'd1', company: 'TCS', description: 'Drive', rowIds: [21] },
    ];
    const [row] = buildDashboard(slots, creditedIds(drives, [22]));

    expect(row.originalPct).toBe(33.33);
    expect(row.correctedPct).toBe(100);
    expect(row.creditedAttended).toBe(3);
  });
});

describe('groupAbsentByDate', () => {
  it('groups only A slots, sorted by date', () => {
    const slots = [
      slot({ date: '2026-07-14', status: 'A' }),
      slot({ date: '2026-07-13', status: 'A' }),
      slot({ date: '2026-07-13', status: 'P' }),
      slot({ date: '2026-07-13', status: 'NU' }),
    ];
    const groups = groupAbsentByDate(slots);
    expect(groups.map((g) => g.date)).toEqual(['2026-07-13', '2026-07-14']);
    expect(groups[0].slots).toHaveLength(1);
    expect(groups[1].slots).toHaveLength(1);
  });
});

describe('sample PDF regression (fixture)', () => {
  const lines: string[] = JSON.parse(
    readFileSync(path.join(process.cwd(), 'tests/fixtures/attendance-lines.json'), 'utf8'),
  );
  const parsed = parseAttendance(lines);

  it('reproduces the original per-subject percentages', () => {
    const rows = buildDashboard(parsed.slots, new Set());
    const byName = Object.fromEntries(rows.map((r) => [r.courseName, r.originalPct]));
    expect(byName).toEqual({
      'Cloud Computing': 94.12,
      'Ethical Hacking': 97.06,
      'Introduction to Linguistics': 80.77,
      'Deep Learning': 81.25,
      'Big Data Analytics': 64.71,
    });
  });

  it('reaches 100% on every subject when all absents are credited', () => {
    const allAbsent = parsed.slots.filter((s) => s.status === 'A').map((s) => s.id);
    expect(allAbsent).toHaveLength(26);
    const rows = buildDashboard(parsed.slots, creditedIds([{ id: 'all', company: 'X', description: 'Y', rowIds: allAbsent }]));
    expect(rows.every((r) => r.correctedPct === 100)).toBe(true);
  });
});
