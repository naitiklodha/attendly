import { describe, expect, it } from 'vitest';
import { ParseError, parseAttendance, splitCourse } from '../lib/parseAttendance';

const lines = [
  'Student Name Sample Student',
  'Student Number STUDENT-TEST-001',
  'Roll No. R001',
  'Academic Year & Academic Session 2026-2027, Semester I',
  'Program Name Sample Engineering Program',
  '1 Sample SystemsP1 BTI Comp A Jan 12, 2026 10:00:01 AM 11:00:00 AM P',
  '2 Sample SystemsP1 BTI Comp A Jan 12, 2026 11:00:01 AM 12:00:00 PM A',
  '3 Technical WritingT1 BTI Comp A Jan 13, 2026 8:00:01 AM 9:00:00 AM NU',
  '4 Technical WritingP1 BTI Comp A Jan 13, 2026 9:00:01 AM 10:00:00 AM E',
];

describe('splitCourse', () => {
  it('splits practical courses', () => {
    expect(splitCourse('Applied SystemsP1 BTI Comp A')).toEqual({
      courseName: 'Applied Systems',
      typeCode: 'P1',
      lectureType: 'PRAC',
      division: 'BTI Comp A',
    });
  });
  it('splits theory courses with multi-division groups', () => {
    expect(splitCourse('Technical WritingT1 BTI Comp A+B')).toEqual({
      courseName: 'Technical Writing',
      typeCode: 'T1',
      lectureType: 'THEO',
      division: 'BTI Comp A+B',
    });
  });
  it('returns null when no type suffix', () => {
    expect(splitCourse('Random Course')).toBeNull();
  });
  it('returns empty division without BTI marker', () => {
    expect(splitCourse('RandomP1')).toEqual({
      courseName: 'Random',
      typeCode: 'P1',
      lectureType: 'PRAC',
      division: '',
    });
  });
});

describe('parseAttendance (synthetic rows)', () => {
  const parsed = parseAttendance(lines);

  it('parses every supplied row', () => {
    expect(parsed.slots).toHaveLength(4);
  });

  it('has the expected status distribution', () => {
    const dist = parsed.slots.reduce<Record<string, number>>((acc, s) => {
      acc[s.status] = (acc[s.status] ?? 0) + 1;
      return acc;
    }, {});
    expect(dist).toEqual({ P: 1, A: 1, NU: 1, E: 1 });
  });

  it('keeps sequential ids', () => {
    expect(parsed.slots[0].id).toBe(1);
    expect(parsed.slots[3].id).toBe(4);
  });

  it('parses the first row fully', () => {
    expect(parsed.slots[0]).toEqual({
      id: 1,
      courseRaw: 'Sample SystemsP1 BTI Comp A',
      courseName: 'Sample Systems',
      typeCode: 'P1',
      lectureType: 'PRAC',
      division: 'BTI Comp A',
      date: '2026-01-12',
      start: '10:00 AM',
      end: '11:00 AM',
      status: 'P',
    });
  });

  it('parses the student header', () => {
    expect(parsed.header).toEqual({
      studentName: 'Sample Student',
      studentNumber: 'STUDENT-TEST-001',
      rollNo: 'R001',
      academicYear: '2026-2027, Semester I',
      programName: 'Sample Engineering Program',
    });
  });

  it('derives the date range', () => {
    expect(parsed.dateRange).toEqual({ from: '2026-01-12', to: '2026-01-13' });
  });

  it('normalizes single-digit hour times', () => {
    const slot = parsed.slots.find((s) => s.id === 3);
    expect(slot).toBeDefined();
    expect(slot!.start).toBe('8:00 AM');
    expect(slot!.end).toBe('9:00 AM');
  });

  it('throws on non-attendance content', () => {
    expect(() => parseAttendance(['hello world'])).toThrow(ParseError);
    expect(() => parseAttendance(['hello world'])).toThrow(/missing header fields/);
  });

  it('throws when rows have an unrecognised course format', () => {
    expect(() =>
      parseAttendance([
        'Student Name Someone',
        'Student Number 123',
        'Roll No. X1',
        'Academic Year & Academic Session 2026-2027, Semester I',
        'Program Name Sample Engineering Program',
        '9 Random Course CT Comp B1 Jul 13, 2026 10:00:01 AM 11:00:00 AM P',
      ]),
    ).toThrow(/unrecognised course format/);
  });

  it('throws when headers exist but no rows', () => {
    expect(() =>
      parseAttendance([
        'Student Name Someone',
        'Student Number 123',
        'Roll No. X1',
        'Academic Year & Academic Session 2026-2027, Semester I',
        'Program Name Sample Engineering Program',
      ]),
    ).toThrow(/No hour-wise attendance rows/);
  });
});
