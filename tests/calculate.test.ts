import { describe, expect, it } from 'vitest';
import {
  buildDashboard,
  creditedIds,
  groupAbsentByDate,
  pct,
  summarize,
} from '../lib/calculate';
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
    date: '2026-01-12',
    start: '10:00 AM',
    end: '11:00 AM',
    status: 'P',
    ...partial,
  };
}

describe('pct', () => {
  it('reproduces the official sheet percentages', () => {
    expect(pct(5, 6)).toBe(83.33);
    expect(pct(7, 9)).toBe(77.78);
    expect(pct(2, 3)).toBe(66.67);
    expect(pct(9, 10)).toBe(90);
    expect(pct(17, 20)).toBe(85);
  });
  it('guards zero denominators', () => {
    expect(pct(0, 0)).toBe(0);
  });
});
describe('summarize', () => {
  it('groups per course + lecture type and shows percentage once per course', () => {
    const slots: HourSlot[] = [
      ...Array.from({ length: 10 }, (_, i) =>
        slot({ courseName: 'Sample Course', courseRaw: 'Sample CourseP1', typeCode: 'P1', lectureType: 'PRAC', status: i < 8 ? 'P' : 'A', id: 1000 + i }),
      ),
      ...Array.from({ length: 8 }, (_, i) =>
        slot({ courseName: 'Sample Course', courseRaw: 'Sample CourseT1', typeCode: 'T1', lectureType: 'THEO', status: i < 5 ? 'P' : 'A', id: 2000 + i }),
      ),
    ];
    const [summary] = summarize(slots, new Set());
    expect(summary.percentage).toBe(72.22);
    expect(summary.conducted).toBe(18);
    expect(summary.attended).toBe(13);
    expect(summary.lines).toHaveLength(2);
    expect(summary.lines[0]).toMatchObject({
      courseName: 'SAMPLE COURSE',
      courseRaw: 'SAMPLE COURSEP1',
      division: 'BTI COMP B',
      lectureType: 'PRAC',
      conducted: 10,
      attended: 8,
    });
    expect(summary.lines[1]).toMatchObject({ lectureType: 'THEO', conducted: 8, attended: 5 });
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
      slot({ courseName: 'Sample Course', courseRaw: 'Sample CourseP1', status: 'P' }),
      slot({ courseName: 'Sample Course', courseRaw: 'Sample CourseP1', status: 'A' }),
      slot({ courseName: 'Sample Course', courseRaw: 'Sample CourseP1', status: 'A' }),
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
      slot({ id: 20, courseName: 'Sample Course', status: 'P' }),
      slot({ id: 21, courseName: 'Sample Course', status: 'A' }),
      slot({ id: 22, courseName: 'Sample Course', status: 'A' }),
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
      slot({ date: '2026-01-13', status: 'A' }),
      slot({ date: '2026-01-12', status: 'A' }),
      slot({ date: '2026-01-12', status: 'P' }),
      slot({ date: '2026-01-12', status: 'NU' }),
    ];
    const groups = groupAbsentByDate(slots);
    expect(groups.map((g) => g.date)).toEqual(['2026-01-12', '2026-01-13']);
    expect(groups[0].slots).toHaveLength(1);
    expect(groups[1].slots).toHaveLength(1);
  });
});
