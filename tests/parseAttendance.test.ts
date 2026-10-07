import { readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ParseError, parseAttendance, splitCourse } from '../lib/parseAttendance';

const lines: string[] = JSON.parse(
  readFileSync(path.join(process.cwd(), 'tests/fixtures/attendance-lines.json'), 'utf8'),
);

describe('splitCourse', () => {
  it('splits practical courses', () => {
    expect(splitCourse('Cloud ComputingP1 BTI Comp B1')).toEqual({
      courseName: 'Cloud Computing',
      typeCode: 'P1',
      lectureType: 'PRAC',
      division: 'BTI Comp B1',
    });
  });
  it('splits theory courses with multi-division groups', () => {
    expect(splitCourse('Ethical HackingT1 BTI Comp B+C+D')).toEqual({
      courseName: 'Ethical Hacking',
      typeCode: 'T1',
      lectureType: 'THEO',
      division: 'BTI Comp B+C+D',
    });
  });
  it('returns null when no type suffix', () => {
    expect(splitCourse('Random Course')).toBeNull();
  });
});

describe('parseAttendance (fixture)', () => {
  const parsed = parseAttendance(lines);

  it('parses all 166 rows', () => {
    expect(parsed.slots).toHaveLength(166);
  });

  it('has the expected status distribution', () => {
    const dist = parsed.slots.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {});
    expect(dist).toEqual({ P: 134, A: 26, NU: 6 });
  });

  it('keeps sequential ids', () => {
    expect(parsed.slots[0].id).toBe(1);
    expect(parsed.slots[165].id).toBe(166);
  });

  it('parses the first row fully', () => {
    expect(parsed.slots[0]).toEqual({
      id: 1,
      courseRaw: 'Cloud ComputingP1 BTI Comp B1',
      courseName: 'Cloud Computing',
      typeCode: 'P1',
      lectureType: 'PRAC',
      division: 'BTI Comp B1',
      date: '2026-07-13',
      start: '10:00 AM',
      end: '11:00 AM',
      status: 'P',
    });
  });

  it('parses the student header', () => {
    expect(parsed.header).toEqual({
      studentName: 'NAITIK LODHA',
      studentNumber: '70322100139',
      rollNo: 'C028',
      academicYear: '2026-2027, Semester XI',
      programName: 'B.Tech (Comp. Engg.) (Integrated)',
    });
  });

  it('derives the date range', () => {
    expect(parsed.dateRange).toEqual({ from: '2026-07-13', to: '2026-09-16' });
  });

  it('throws on non-attendance content', () => {
    expect(() => parseAttendance(['hello world'])).toThrow(ParseError);
  });

  it('throws when headers exist but no rows', () => {
    expect(() =>
      parseAttendance([
        'Student Name Someone',
        'Student Number 123',
        'Roll No. X1',
        'Academic Year & Academic Session 2026-2027, Semester I',
        'Program Name B.Tech',
      ]),
    ).toThrow(/No hour-wise attendance rows/);
  });
});
