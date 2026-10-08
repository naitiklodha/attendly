import type {
  CourseLine,
  CourseSummary,
  DashboardRow,
  DateGroup,
  Drive,
  HourSlot,
} from './types';
import type { CourseMerges } from './subjectMerge';

export function pct(attended: number, conducted: number): number {
  if (conducted === 0) return 0;
  return Math.round((attended / conducted) * 10000) / 100;
}

export function creditedIds(drives: Drive[], pendingIds: Iterable<number> = []): Set<number> {
  const set = new Set<number>();
  for (const drive of drives) for (const id of drive.rowIds) set.add(id);
  for (const id of pendingIds) set.add(id);
  return set;
}

function isCounted(status: HourSlot['status']): boolean {
  return status !== 'NU' && status !== 'E';
}

function isPresent(slot: HourSlot, credited: ReadonlySet<number>): boolean {
  if (slot.status === 'P' || slot.status === 'L') return true;
  return slot.status === 'A' && credited.has(slot.id);
}

export function summarize(
  slots: HourSlot[],
  credited: ReadonlySet<number>,
  merges: CourseMerges = {},
): CourseSummary[] {
  const order: string[] = [];
  const byCourse = new Map<
    string,
    {
      lines: CourseLine[];
      lineIndex: Map<string, number>;
      conducted: number;
      attended: number;
    }
  >();

  for (const slot of slots) {
    if (!isCounted(slot.status)) continue;
    const key = merges[slot.courseName] ?? slot.courseName;
    let course = byCourse.get(key);
    if (!course) {
      course = { lines: [], lineIndex: new Map(), conducted: 0, attended: 0 };
      byCourse.set(key, course);
      order.push(key);
    }
    let idx = course.lineIndex.get(slot.lectureType);
    if (idx === undefined) {
      idx = course.lines.length;
      course.lineIndex.set(slot.lectureType, idx);
      course.lines.push({
        courseName: key.toUpperCase(),
        courseRaw: displayCourseRaw(slot, key),
        division: slot.division.toUpperCase(),
        lectureType: slot.lectureType,
        conducted: 0,
        attended: 0,
      });
    }
    const line = course.lines[idx];
    line.conducted += 1;
    course.conducted += 1;
    if (isPresent(slot, credited)) {
      line.attended += 1;
      course.attended += 1;
    }
  }

  return order.map((courseName) => {
    const course = byCourse.get(courseName)!;
    return {
      courseName,
      lines: course.lines,
      conducted: course.conducted,
      attended: course.attended,
      percentage: pct(course.attended, course.conducted),
    };
  });
}

function displayCourseRaw(slot: HourSlot, display: string): string {
  const suffix = slot.courseRaw.slice(slot.courseName.length);
  return (display + suffix).toUpperCase();
}

export function buildDashboard(
  slots: HourSlot[],
  credited: ReadonlySet<number>,
  merges: CourseMerges = {},
): DashboardRow[] {
  const original = summarize(slots, new Set(), merges);
  const corrected = summarize(slots, credited, merges);
  const originalByCourse = new Map(original.map((s) => [s.courseName, s]));
  return corrected.map((s) => {
    const before = originalByCourse.get(s.courseName);
    return {
      courseName: s.courseName,
      conducted: s.conducted,
      originalAttended: before?.attended ?? 0,
      creditedAttended: s.attended,
      originalPct: before?.percentage ?? 0,
      correctedPct: s.percentage,
    };
  });
}

export function groupAbsentByDate(slots: HourSlot[]): DateGroup[] {
  const groups = new Map<string, HourSlot[]>();
  for (const slot of slots) {
    if (slot.status !== 'A') continue;
    const list = groups.get(slot.date);
    if (list) list.push(slot);
    else groups.set(slot.date, [slot]);
  }
  return [...groups.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, groupSlots]) => ({ date, slots: groupSlots }));
}
