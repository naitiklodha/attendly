import type { AttendanceStatus, HourSlot, ParsedAttendance, StudentHeader } from './types';

export class ParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ParseError';
  }
}

const MONTHS: Record<string, string> = {
  Jan: '01', Feb: '02', Mar: '03', Apr: '04', May: '05', Jun: '06',
  Jul: '07', Aug: '08', Sep: '09', Oct: '10', Nov: '11', Dec: '12',
};

const ROW_RE =
  /^\s*(\d+)\s+(.+?)\s+([A-Z][a-z]{2} \d{1,2}, \d{4})\s+(\d{1,2}:\d{2}:\d{2} [AP]M)\s+(\d{1,2}:\d{2}:\d{2} [AP]M)\s+(P|A|E|L|NU)\s*$/;

const HEADER_KEYS = [
  'Student Name',
  'Student Number',
  'Roll No.',
  'Academic Year & Academic Session',
  'Program Name',
] as const;

export interface SplitCourse {
  courseName: string;
  typeCode: 'P1' | 'T1';
  lectureType: 'PRAC' | 'THEO';
  division: string;
}

export function splitCourse(courseRaw: string): SplitCourse | null {
  const idx = courseRaw.indexOf(' BTI ');
  const coursePart = idx === -1 ? courseRaw : courseRaw.slice(0, idx);
  const division = idx === -1 ? '' : courseRaw.slice(idx + 1);
  const m = /^(.*?)(P1|T1)$/.exec(coursePart);
  if (!m) return null;
  return {
    courseName: m[1],
    typeCode: m[2] as 'P1' | 'T1',
    lectureType: m[2] === 'T1' ? 'THEO' : 'PRAC',
    division,
  };
}

function toIsoDate(raw: string): string {
  const [mon, day, year] = raw.replace(',', '').split(/\s+/);
  const mm = MONTHS[mon];
  if (!mm || !day || !year) throw new ParseError(`Unrecognized date: ${raw}`);
  return `${year}-${mm}-${day.padStart(2, '0')}`;
}

function normalizeTime(raw: string): string {
  const m = /^(\d{1,2}:\d{2}):\d{2} ([AP]M)$/.exec(raw);
  if (!m) throw new ParseError(`Unrecognized time: ${raw}`);
  return `${m[1]} ${m[2]}`;
}

export function parseHeader(lines: string[]): StudentHeader {
  const values: Partial<Record<(typeof HEADER_KEYS)[number], string>> = {};
  for (const line of lines) {
    for (const key of HEADER_KEYS) {
      if (line.startsWith(key)) {
        values[key] = line
          .slice(key.length)
          .replace(/^\s*:\s*/, '')
          .replace(/\s+/g, ' ')
          .trim();
        break;
      }
    }
  }
  const missing = HEADER_KEYS.filter((k) => !values[k]);
  if (missing.length > 0) {
    throw new ParseError(
      `Not an attendance PDF — missing header fields: ${missing.join(', ')}.`,
    );
  }
  return {
    studentName: values['Student Name']!,
    studentNumber: values['Student Number']!,
    rollNo: values['Roll No.']!,
    academicYear: values['Academic Year & Academic Session']!,
    programName: values['Program Name']!,
  };
}

export function parseAttendance(lines: string[]): ParsedAttendance {
  const header = parseHeader(lines);
  const slots: HourSlot[] = [];
  let skipped = 0;
  for (const line of lines) {
    const m = ROW_RE.exec(line);
    if (!m) continue;
    const courseRaw = m[2].trim();
    const course = splitCourse(courseRaw);
    if (!course) {
      skipped++;
      continue;
    }
    slots.push({
      id: Number(m[1]),
      courseRaw,
      ...course,
      date: toIsoDate(m[3]),
      start: normalizeTime(m[4]),
      end: normalizeTime(m[5]),
      status: m[6] as AttendanceStatus,
    });
  }
  if (skipped > 0) {
    throw new ParseError(
      `${skipped} rows had an unrecognised course format — expected "<course>P1|T1 BTI <division>".`,
    );
  }
  if (slots.length === 0) {
    throw new ParseError(
      'No hour-wise attendance rows found — expected the SAP attendance report with Sr No / Date / Time / P-A-E-L-NU columns.',
    );
  }
  slots.sort((a, b) => a.id - b.id);
  const dates = slots.map((s) => s.date).sort();
  return { header, slots, dateRange: { from: dates[0], to: dates[dates.length - 1] } };
}
