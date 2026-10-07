# Placement-Cum-Attendance Calculator Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A local-first Next.js app that parses the NMIMS hour-wise SAP attendance PDF, lets students excuse absent hours as placement drives (company + description), shows per-subject original vs corrected attendance, and prints a sheet.PDF-format report plus a placement annexure.

**Architecture:** Fully client-side Next.js (App Router) — pdfjs-dist extracts text lines in the browser, a pure line-regex parser turns them into hour slots, a pure calculator applies the counting rules (P/L present, A absent unless drive-credited, NU/E excluded), and a React context reducer holds state persisted to localStorage keyed by the PDF's SHA-256 fingerprint. The report is a print-styled A4 route rendered via the browser's Save-as-PDF.

**Tech Stack:** Next.js (App Router, TS, Tailwind v4), pdfjs-dist@6 (legacy build), framer-motion, geist (local font), Vitest + tsx (dev).

**Spec:** `docs/superpowers/specs/2026-10-07-placement-attendance-calculator-design.md`

---

## Verified facts (validated against the real sample PDF before planning)

- Sample: `ZSVKM_STUDENT_ATTENDANCE_COPY.pdf` — 166 hour rows, `P:134, A:26, NU:6`, IDs sequential 1..166, date range `2026-07-13` → `2026-09-16`.
- Header fields extract as: `NAITIK LODHA` / `70322100139` / `C028` / `2026-2027, Semester XI` / `B.Tech (Comp. Engg.) (Integrated)`.
- pdfjs text items must be **grouped by Y (tolerance 2pt), then sorted by X within each group** — Y-first ordering scrambles table cells.
- `pdfjs-dist/legacy/build/pdf.mjs` works in Node 20 (main build needs Node 22+ `Iterator`) and ships `pdf.d.mts` types. No `exports` map → deep import is safe.
- Node 20 needs a `Promise.withResolvers` polyfill (guarded, browser-safe).
- Worker: copy `pdf.worker.min.mjs` to `public/` via postinstall, set `GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'` in browser only — bundler-independent.
- Original percentages from the sample: **CC 94.12, EH 97.06, Ling 80.77, DL 81.25, BDA 64.71**. Crediting all 26 absents → **100% everywhere**.
- sheet.PDF percentage math reproduced exactly: `round(att/cond*10000)/100` → 76.19 / 65.22 / 93.18 / 90.91 / 82.35.
- Environment: Node v20.19.3, npm 11.4.2, darwin, **not a git repo yet**.

## Counting rules (from spec R3)

| Status | Conducted | Attended |
|---|---|---|
| `P` | yes | yes |
| `L` | yes | yes |
| `A` | yes | only if credited by a drive |
| `NU` | no | no (excluded, not taggable) |
| `E` | no | no |

---

## File structure

```
/Users/naitiklodha/Documents/Development/placement-cum-attendance/
├── app/
│   ├── layout.tsx              # root layout: Geist font, globals.css, AppProvider
│   ├── globals.css             # Tailwind v4 import, body font, print/A4 rules
│   ├── page.tsx                # home: UploadScreen | Dashboard by state
│   └── report/page.tsx         # print route: toolbar + ReportView
├── components/
│   ├── UploadScreen.tsx        # dropzone → fingerprint → extract → parse
│   ├── TopBar.tsx              # brand, student chip, Export/Import/Reset/Report
│   ├── Dashboard.tsx           # composition + persistence + toast timer
│   ├── NoticeToast.tsx         # bottom toast (framer-motion)
│   ├── SubjectCards.tsx        # per-subject original vs corrected %
│   ├── AbsentHourList.tsx      # date-grouped A-slots + selection
│   ├── DrivesPanel.tsx         # drive form + drive cards (edit/remove)
│   └── ReportView.tsx          # sheet.PDF replica + placement annexure
├── lib/
│   ├── types.ts                # all shared interfaces
│   ├── format.ts               # date/percent formatting
│   ├── pdfText.ts              # pdfjs extraction → visual lines
│   ├── parseAttendance.ts      # lines → ParsedAttendance (pure)
│   ├── calculate.ts            # summaries, dashboard, grouping (pure)
│   ├── storage.ts              # fingerprint, localStorage, JSON export/import
│   ├── storeReducer.ts         # pure reducer + AppState (tested)
│   └── store.tsx               # AppProvider + useApp (client)
├── scripts/
│   ├── copy-worker.mjs         # postinstall: pdf.worker → public/
│   └── make-fixture.ts         # generates tests/fixtures/attendance-lines.json
├── tests/
│   ├── fixtures/attendance-lines.json
│   ├── format.test.ts
│   ├── pdf.test.ts             # live extraction of the sample PDF
│   ├── parseAttendance.test.ts # fixture-based (fast)
│   ├── calculate.test.ts
│   ├── storage.test.ts
│   └── storeReducer.test.ts
├── vitest.config.ts
├── ZSVKM_STUDENT_ATTENDANCE_COPY.pdf   # committed: test fixture
├── sheet.PDF                           # committed: format reference
└── docs/superpowers/...
```

**Boundaries:** `pdfText` knows PDFs but not attendance semantics. `parseAttendance` knows the report format but not PDFs (takes `string[]`). `calculate` is pure math over slots+drives. `storeReducer` is pure state (no React). `storage` takes an injectable store for tests. UI components never parse or compute — they dispatch and render.

---

### Task 1: Repo init, Next scaffold, dependencies

**Files:** Create: `.gitignore` (from scaffold), `package.json` (from scaffold, edited), `scripts/copy-worker.mjs`, `vitest.config.ts`

- [ ] **Step 1: Initialize git and commit the spec + PDFs**

```bash
cd /Users/naitiklodha/Documents/Development/placement-cum-attendance
git init -b main
git add docs sheet.PDF ZSVKM_STUDENT_ATTENDANCE_COPY.pdf
git commit -m "docs: approved design spec + sample attendance PDFs"
```

Expected: `[main (root-commit) ...] docs: approved design spec + sample attendance PDFs`

- [ ] **Step 2: Scaffold Next.js into a temp dir and merge into the project root**

The root is non-empty (PDFs, docs/), so `create-next-app` must run in a temp dir and its files are merged in:

```bash
npx --yes create-next-app@latest /tmp/attcalc-scaffold \
  --ts --tailwind --eslint --app --no-src-dir \
  --import-alias "@/*" --use-npm --yes
rsync -a --exclude .git --exclude node_modules /tmp/attcalc-scaffold/ ./
rm -rf /tmp/attcalc-scaffold
```

Fallback if a flag is rejected or the CLI prompts interactively: run `npx --yes create-next-app@latest /tmp/attcalc-scaffold` interactively, choose TypeScript, Tailwind, ESLint, App Router, no `src/`, alias `@/*`, then the same `rsync` merge. Outcome matters, not flags.

- [ ] **Step 3: Create `scripts/copy-worker.mjs` (must exist before any `npm install`)**

```js
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';

const src = new URL('../node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', import.meta.url);
const outDir = new URL('../public/', import.meta.url);
if (!existsSync(src)) {
  console.error('[postinstall] pdfjs-dist missing — run `npm install` first.');
  process.exit(1);
}
mkdirSync(outDir, { recursive: true });
copyFileSync(src, new URL('pdf.worker.min.mjs', outDir));
console.log('[postinstall] copied pdf.worker.min.mjs -> public/');
```

- [ ] **Step 4: Edit `package.json` scripts**

Keep the scaffold's `dev`/`build`/`start`/`lint` entries and add:

```json
"postinstall": "node scripts/copy-worker.mjs",
"test": "vitest run",
"test:watch": "vitest",
"fixture": "tsx scripts/make-fixture.ts"
```

- [ ] **Step 5: Ignore the generated worker**

Append to `.gitignore`:

```
public/pdf.worker.min.mjs
```

- [ ] **Step 6: Install dependencies**

```bash
npm install pdfjs-dist framer-motion geist
npm install --save-dev vitest tsx
ls -la public/pdf.worker.min.mjs
```

Expected: `copied pdf.worker.min.mjs -> public/` from postinstall, file exists.

- [ ] **Step 7: Create `vitest.config.ts`**

```ts
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts'],
    environment: 'node',
    testTimeout: 30000,
  },
});
```

- [ ] **Step 8: Verify the scaffold builds**

```bash
npm run build
git add -A && git commit -m "chore: scaffold Next.js app with pdfjs, vitest, worker postinstall"
```

Expected: build succeeds.

---

### Task 2: Shared types

**Files:** Create: `lib/types.ts`

- [ ] **Step 1: Write `lib/types.ts`**

```ts
export type AttendanceStatus = 'P' | 'A' | 'E' | 'L' | 'NU';

export interface HourSlot {
  id: number;
  courseRaw: string;
  courseName: string;
  typeCode: 'P1' | 'T1';
  lectureType: 'PRAC' | 'THEO';
  division: string;
  date: string;
  start: string;
  end: string;
  status: AttendanceStatus;
}

export interface StudentHeader {
  studentName: string;
  studentNumber: string;
  rollNo: string;
  academicYear: string;
  programName: string;
}

export interface ParsedAttendance {
  header: StudentHeader;
  slots: HourSlot[];
  dateRange: { from: string; to: string };
}

export interface Drive {
  id: string;
  company: string;
  description: string;
  rowIds: number[];
}

export interface CourseLine {
  courseName: string;
  courseRaw: string;
  division: string;
  lectureType: 'THEO' | 'PRAC';
  conducted: number;
  attended: number;
}

export interface CourseSummary {
  courseName: string;
  lines: CourseLine[];
  conducted: number;
  attended: number;
  percentage: number;
}

export interface DashboardRow {
  courseName: string;
  conducted: number;
  originalAttended: number;
  creditedAttended: number;
  originalPct: number;
  correctedPct: number;
}

export interface DateGroup {
  date: string;
  slots: HourSlot[];
}
```

- [ ] **Step 2: Typecheck and commit**

```bash
npx tsc --noEmit
git add lib/types.ts && git commit -m "feat: shared domain types"
```

---

### Task 3: Format helpers (TDD)

**Files:** Create: `lib/format.ts`, `tests/format.test.ts`

- [ ] **Step 1: Write the failing test `tests/format.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatPercent, formatReportDate, formatTimeRange } from '../lib/format';

describe('formatReportDate', () => {
  it('renders DD.MM.YYYY', () => {
    expect(formatReportDate('2026-07-13')).toBe('13.07.2026');
  });
});

describe('formatDayLabel', () => {
  it('renders a friendly weekday label', () => {
    expect(formatDayLabel('2026-07-13')).toBe('Mon, 13 Jul 2026');
  });
});

describe('formatPercent', () => {
  it('always shows two decimals', () => {
    expect(formatPercent(100)).toBe('100.00%');
    expect(formatPercent(64.705882)).toBe('64.71%');
  });
});

describe('formatTimeRange', () => {
  it('joins start and end', () => {
    expect(formatTimeRange('10:00 AM', '11:00 AM')).toBe('10:00 AM – 11:00 AM');
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npx vitest run tests/format.test.ts
```

Expected: FAIL — cannot resolve `../lib/format`.

- [ ] **Step 3: Implement `lib/format.ts`**

```ts
export function formatReportDate(iso: string): string {
  const [y, m, d] = iso.split('-');
  return `${d}.${m}.${y}`;
}

export function formatDayLabel(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  return new Intl.DateTimeFormat('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date);
}

export function formatPercent(n: number): string {
  return `${n.toFixed(2)}%`;
}

export function formatTimeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}
```

- [ ] **Step 4: Run and confirm pass**

```bash
npx vitest run tests/format.test.ts
```

Expected: PASS, 4 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/format.ts tests/format.test.ts && git commit -m "feat: format helpers with tests"
```

---

### Task 4: PDF line extraction (TDD, live against the sample PDF)

**Files:** Create: `lib/pdfText.ts`, `tests/pdf.test.ts`

- [ ] **Step 1: Write the failing test `tests/pdf.test.ts`**

```ts
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { extractLines } from '../lib/pdfText';

const PDF = path.join(process.cwd(), 'ZSVKM_STUDENT_ATTENDANCE_COPY.pdf');

it('sample PDF is committed', () => {
  expect(existsSync(PDF)).toBe(true);
});

describe.runIf(existsSync(PDF))('extractLines (live sample PDF)', () => {
  it('reconstructs visual rows in column order', async () => {
    const lines = await extractLines(new Uint8Array(readFileSync(PDF)));
    expect(lines.length).toBeGreaterThan(150);
    expect(lines).toContain(
      '1 Cloud ComputingP1 BTI Comp B1 Jul 13, 2026 10:00:01 AM 11:00:00 AM P',
    );
    expect(
      lines.some((l) => l.startsWith('Student Name') && l.includes('NAITIK LODHA')),
    ).toBe(true);
    expect(lines.some((l) => /^166 /.test(l) && l.endsWith('NU'))).toBe(true);
    const ids = lines
      .filter((l) => /^\d+ .* (P|A|E|L|NU)$/.test(l))
      .map((l) => Number.parseInt(l, 10))
      .sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 166 }, (_, i) => i + 1));
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npx vitest run tests/pdf.test.ts
```

Expected: FAIL — cannot resolve `../lib/pdfText`.

- [ ] **Step 3: Implement `lib/pdfText.ts`**

```ts
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof Promise.withResolvers !== 'function') {
  const P = Promise as unknown as {
    withResolvers: <T>() => {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  };
  P.withResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const Y_TOLERANCE = 2;

interface Point {
  x: number;
  y: number;
  s: string;
}

export async function extractLines(pdfBytes: Uint8Array): Promise<string[]> {
  const task = getDocument({ data: pdfBytes.slice() });
  const lines: string[] = [];
  try {
    const doc = await task.promise;
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();

      const pts: Point[] = [];
      for (const item of content.items) {
        if (!('str' in item) || !('transform' in item)) continue;
        pts.push({ y: item.transform[5], x: item.transform[4], s: item.str });
      }
      pts.sort((a, b) => b.y - a.y || a.x - b.x);

      let group: Point[] = [];
      let groupY: number | null = null;
      const flush = () => {
        if (group.length > 0) {
          group.sort((a, b) => a.x - b.x);
          const text = group
            .map((pt) => pt.s)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (text) lines.push(text);
        }
        group = [];
      };

      for (const pt of pts) {
        if (groupY === null || Math.abs(pt.y - groupY) <= Y_TOLERANCE) {
          groupY = groupY === null ? pt.y : (groupY * group.length + pt.y) / (group.length + 1);
          group.push(pt);
        } else {
          flush();
          groupY = pt.y;
          group.push(pt);
        }
      }
      flush();
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  return lines;
}
```

Note: the `'str' in item && 'transform' in item` guard is required for type-safety (pdfjs returns `TextItem | TextMarkedContent`), and `isEvalSupported` was dropped — it is not in pdfjs v6's `DocumentInitParameters` type. Two review-driven fixes vs the original draft: `task.promise` is awaited *inside* the `try` so a corrupt PDF still reaches `task.destroy()` in `finally` (no worker leak), and `pdfBytes.slice()` copies the buffer because pdfjs transfers (detaches) the caller's `data.buffer`.

- [ ] **Step 4: Run and confirm pass**

```bash
npx vitest run tests/pdf.test.ts
```

Expected: PASS (first run may take ~2–5s loading pdfjs).

- [ ] **Step 5: Commit**

```bash
git add lib/pdfText.ts tests/pdf.test.ts && git commit -m "feat: pdfjs line extraction with Y-group/X-sort ordering"
```

---

### Task 5: Fixture generation script

**Files:** Create: `scripts/make-fixture.ts`; Generate: `tests/fixtures/attendance-lines.json`

- [ ] **Step 1: Write `scripts/make-fixture.ts`**

```ts
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { extractLines } from '../lib/pdfText';

async function main() {
  const pdfPath = path.join(process.cwd(), 'ZSVKM_STUDENT_ATTENDANCE_COPY.pdf');
  const outPath = path.join(process.cwd(), 'tests/fixtures/attendance-lines.json');
  const lines = await extractLines(new Uint8Array(readFileSync(pdfPath)));
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(lines, null, 2));
  console.log(`Wrote ${lines.length} lines -> tests/fixtures/attendance-lines.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 2: Generate and sanity-check the fixture**

```bash
npm run fixture
node -e "const l=require('./tests/fixtures/attendance-lines.json'); console.log(l.length, l.filter(x=>/^\d+ /.test(x)).length)"
```

Expected: `210 lines` (approximately), row-line count ≥ 166.

- [ ] **Step 3: Commit the fixture**

```bash
git add scripts/make-fixture.ts tests/fixtures/attendance-lines.json
git commit -m "chore: fixture generator + committed line fixture"
```

---

### Task 6: Attendance parser (TDD)

**Files:** Create: `lib/parseAttendance.ts`, `tests/parseAttendance.test.ts`

- [ ] **Step 1: Write the failing test `tests/parseAttendance.test.ts`**

```ts
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
  it('returns empty division without BTI marker', () => {
    expect(splitCourse('RandomP1')).toEqual({
      courseName: 'Random',
      typeCode: 'P1',
      lectureType: 'PRAC',
      division: '',
    });
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

  it('normalizes single-digit hour times', () => {
    const slot = parsed.slots.find((s) => s.id === 9);
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
        'Program Name B.Tech',
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
        'Program Name B.Tech',
      ]),
    ).toThrow(/No hour-wise attendance rows/);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npx vitest run tests/parseAttendance.test.ts
```

Expected: FAIL — cannot resolve `../lib/parseAttendance`.

- [ ] **Step 3: Implement `lib/parseAttendance.ts`**

```ts
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
```

- [ ] **Step 4: Run and confirm pass**

```bash
npx vitest run tests/parseAttendance.test.ts
```

Expected: PASS, 14 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/parseAttendance.ts tests/parseAttendance.test.ts
git commit -m "feat: line-regex attendance parser"
```

---

### Task 7: Calculator (TDD)

**Files:** Create: `lib/calculate.ts`, `tests/calculate.test.ts`

- [ ] **Step 1: Write the failing test `tests/calculate.test.ts`**

```ts
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
    expect(summary.lines[0]).toMatchObject({ lectureType: 'PRAC', conducted: 24, attended: 20 });
    expect(summary.lines[1]).toMatchObject({ lectureType: 'THEO', conducted: 18, attended: 12 });
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
```

- [ ] **Step 2: Run and confirm failure**

```bash
npx vitest run tests/calculate.test.ts
```

Expected: FAIL — cannot resolve `../lib/calculate`.

- [ ] **Step 3: Implement `lib/calculate.ts`**

> Invariant (do not "clean up"): `CourseLine.courseName`/`courseRaw`/`division` are stored **UPPERCASED** (sheet.PDF fidelity) while `CourseSummary.courseName` keeps original case as the grouping key. Copy the `.toUpperCase()` calls verbatim.

```ts
import type {
  CourseLine,
  CourseSummary,
  DashboardRow,
  DateGroup,
  Drive,
  HourSlot,
} from './types';

export function pct(attended: number, conducted: number): number {
  if (conducted === 0) return 0;
  return Math.round((attended / conducted) * 10000) / 100;
}

export function creditedIds(drives: Drive[]): Set<number> {
  const set = new Set<number>();
  for (const drive of drives) for (const id of drive.rowIds) set.add(id);
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
    let course = byCourse.get(slot.courseName);
    if (!course) {
      course = { lines: [], lineIndex: new Map(), conducted: 0, attended: 0 };
      byCourse.set(slot.courseName, course);
      order.push(slot.courseName);
    }
    let idx = course.lineIndex.get(slot.lectureType);
    if (idx === undefined) {
      idx = course.lines.length;
      course.lineIndex.set(slot.lectureType, idx);
      course.lines.push({
        courseName: slot.courseName.toUpperCase(),
        courseRaw: slot.courseRaw.toUpperCase(),
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

export function buildDashboard(
  slots: HourSlot[],
  credited: ReadonlySet<number>,
): DashboardRow[] {
  const original = summarize(slots, new Set());
  const corrected = summarize(slots, credited);
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
```

- [ ] **Step 4: Run and confirm pass**

```bash
npx vitest run tests/calculate.test.ts
```

Expected: PASS, 12 tests — including the fixture regression asserting 94.12 / 97.06 / 80.77 / 81.25 / 64.71 and the all-credited 100% case.

- [ ] **Step 5: Run the full suite to catch cross-module breakage**

```bash
npm test
```

Expected: all suites pass (format, pdf, parseAttendance, calculate).

- [ ] **Step 6: Commit**

```bash
git add lib/calculate.ts tests/calculate.test.ts
git commit -m "feat: attendance calculator with placement credits"
```

---

### Task 8: Storage — fingerprint, persistence, JSON import/export (TDD)

**Files:** Create: `lib/storage.ts`, `tests/storage.test.ts`

- [ ] **Step 1: Write the failing test `tests/storage.test.ts`**

```ts
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
```

- [ ] **Step 2: Run and confirm failure**

```bash
npx vitest run tests/storage.test.ts
```

Expected: FAIL — cannot resolve `../lib/storage`.

- [ ] **Step 3: Implement `lib/storage.ts`**

```ts
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
  const digest = await crypto.subtle.digest('SHA-256', bytes);
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
```

- [ ] **Step 4: Run and confirm pass**

```bash
npx vitest run tests/storage.test.ts
```

Expected: PASS, 9 tests.

- [ ] **Step 5: Commit**

```bash
git add lib/storage.ts tests/storage.test.ts
git commit -m "feat: fingerprint-keyed storage + JSON export/import"
```

---

### Task 9: State — reducer (TDD) + React provider

**Files:** Create: `lib/storeReducer.ts`, `tests/storeReducer.test.ts`, `lib/store.tsx`

- [ ] **Step 1: Write the failing test `tests/storeReducer.test.ts`**

```ts
import { describe, expect, it } from 'vitest';
import {
  appReducer,
  initialState,
  type Action,
  type AppState,
} from '../lib/storeReducer';
import type { HourSlot, ParsedAttendance } from '../lib/types';

function slot(id: number, status: HourSlot['status'], date = '2026-07-13'): HourSlot {
  return {
    id,
    courseRaw: 'Cloud ComputingP1 BTI Comp B1',
    courseName: 'Cloud Computing',
    typeCode: 'P1',
    lectureType: 'PRAC',
    division: 'BTI Comp B1',
    date,
    start: '10:00 AM',
    end: '11:00 AM',
    status,
  };
}

function readyState(): AppState {
  const parsed: ParsedAttendance = {
    header: {
      studentName: 'NAITIK LODHA',
      studentNumber: '70322100139',
      rollNo: 'C028',
      academicYear: '2026-2027, Semester XI',
      programName: 'B.Tech',
    },
    slots: [slot(1, 'P'), slot(2, 'A'), slot(3, 'A', '2026-07-14'), slot(4, 'NU')],
    dateRange: { from: '2026-07-13', to: '2026-07-14' },
  };
  return appReducer(initialState, {
    type: 'PARSE_SUCCESS',
    parsed,
    fingerprint: 'fp',
    restored: [],
  });
}

describe('appReducer', () => {
  it('PARSE_SUCCESS stores parsed data and restores drives', () => {
    const state = appReducer(initialState, {
      type: 'PARSE_SUCCESS',
      parsed: readyState().parsed!,
      fingerprint: 'fp',
      restored: [{ id: 'r1', company: 'Infosys', description: 'd', rowIds: [2] }],
    });
    expect(state.status).toBe('ready');
    expect(state.drives).toHaveLength(1);
    expect(state.notice).toContain('Restored 1');
  });

  it('PARSE_ERROR keeps the user on upload with a message', () => {
    const state = appReducer(initialState, { type: 'PARSE_ERROR', message: 'bad pdf' });
    expect(state.status).toBe('error');
    expect(state.errorMessage).toBe('bad pdf');
  });

  it('TOGGLE_SELECT adds and removes ids', () => {
    let state = readyState();
    state = appReducer(state, { type: 'TOGGLE_SELECT', id: 2 });
    expect(state.selection).toEqual([2]);
    state = appReducer(state, { type: 'TOGGLE_SELECT', id: 2 });
    expect(state.selection).toEqual([]);
  });

  it('SELECT_DATE selects all A slots of that date only', () => {
    const state = appReducer(readyState(), { type: 'SELECT_DATE', date: '2026-07-14' });
    expect(state.selection).toEqual([3]);
  });

  it('SELECT_ALL selects every untagged A slot and skips NU', () => {
    const state = appReducer(readyState(), { type: 'SELECT_ALL' });
    expect(state.selection.sort((a, b) => a - b)).toEqual([2, 3]);
  });

  it('ADD_DRIVE refuses empty selection or blank fields', () => {
    const state = readyState();
    expect(appReducer(state, { type: 'ADD_DRIVE', company: '', description: 'd' })).toBe(state);
    expect(
      appReducer({ ...state, selection: [] }, { type: 'ADD_DRIVE', company: 'TCS', description: 'd' }),
    ).toBe(state);
  });

  it('ADD_DRIVE saves trimmed values, clears selection, sets notice', () => {
    let state = readyState();
    state = appReducer(state, { type: 'TOGGLE_SELECT', id: 2 });
    state = appReducer(state, { type: 'TOGGLE_SELECT', id: 3 });
    state = appReducer(state, { type: 'ADD_DRIVE', company: '  TCS  ', description: ' National drive ' });
    expect(state.drives).toHaveLength(1);
    expect(state.drives[0]).toMatchObject({
      company: 'TCS',
      description: 'National drive',
      rowIds: [2, 3],
    });
    expect(state.selection).toEqual([]);
    expect(state.notice).toContain('Tagged 2 hours');
  });

  it('ADD_DRIVE releases overlapping ids from other drives', () => {
    let state = readyState();
    state = {
      ...state,
      drives: [{ id: 'd1', company: 'Old', description: 'old', rowIds: [2, 3] }],
    };
    state = appReducer(state, { type: 'TOGGLE_SELECT', id: 2 });
    state = appReducer(state, { type: 'ADD_DRIVE', company: 'New', description: 'new', });
    const old = state.drives.find((d) => d.id === 'd1');
    const added = state.drives.find((d) => d.company === 'New');
    expect(old?.rowIds).toEqual([3]);
    expect(added?.rowIds).toEqual([2]);
  });

  it('START_EDIT / CANCEL_EDIT manage editing state', () => {
    let state = readyState();
    state = { ...state, drives: [{ id: 'd1', company: 'TCS', description: 'd', rowIds: [2] }] };
    state = appReducer(state, { type: 'START_EDIT', id: 'd1' });
    expect(state.editingDriveId).toBe('d1');
    expect(state.selection).toEqual([2]);
    state = appReducer(state, { type: 'CANCEL_EDIT' });
    expect(state.editingDriveId).toBeNull();
    expect(state.selection).toEqual([]);
  });

  it('UPDATE_DRIVE applies current selection as the new row set', () => {
    let state = readyState();
    state = { ...state, drives: [{ id: 'd1', company: 'TCS', description: 'd', rowIds: [2] }] };
    state = appReducer(state, { type: 'START_EDIT', id: 'd1' });
    state = appReducer(state, { type: 'TOGGLE_SELECT', id: 3 });
    state = appReducer(state, { type: 'UPDATE_DRIVE', id: 'd1', company: 'TCS', description: 'updated' });
    expect(state.drives).toHaveLength(1);
    expect(state.drives[0]).toMatchObject({ description: 'updated', rowIds: [2, 3] });
    expect(state.editingDriveId).toBeNull();
  });

  it('DELETE_DRIVE removes the drive and re-opens its hours', () => {
    let state = readyState();
    state = { ...state, drives: [{ id: 'd1', company: 'TCS', description: 'd', rowIds: [2] }] };
    state = appReducer(state, { type: 'DELETE_DRIVE', id: 'd1' });
    expect(state.drives).toHaveLength(0);
    expect(state.notice).toContain('removed');
  });

  it('SET_DRIVES filters ids that are not taggable', () => {
    const state = appReducer(readyState(), {
      type: 'SET_DRIVES',
      drives: [{ id: 'x', company: 'Wipro', description: 'd', rowIds: [4, 99] }],
    });
    expect(state.drives[0].rowIds).toEqual([]);
    expect(state.drives).toHaveLength(0);
  });

  it('RESET returns to initial state', () => {
    const state = appReducer(readyState(), { type: 'RESET' });
    expect(state).toEqual(initialState);
  });
});
```

- [ ] **Step 2: Run and confirm failure**

```bash
npx vitest run tests/storeReducer.test.ts
```

Expected: FAIL — cannot resolve `../lib/storeReducer`.

- [ ] **Step 3: Implement `lib/storeReducer.ts`**

```ts
import type { Drive, ParsedAttendance } from './types';

export interface AppState {
  status: 'idle' | 'parsing' | 'ready' | 'error';
  errorMessage: string | null;
  fingerprint: string | null;
  parsed: ParsedAttendance | null;
  drives: Drive[];
  selection: number[];
  editingDriveId: string | null;
  notice: string | null;
}

export type Action =
  | { type: 'PARSE_START' }
  | { type: 'PARSE_SUCCESS'; parsed: ParsedAttendance; fingerprint: string; restored: Drive[] }
  | { type: 'PARSE_ERROR'; message: string }
  | { type: 'TOGGLE_SELECT'; id: number }
  | { type: 'SELECT_DATE'; date: string }
  | { type: 'SELECT_ALL' }
  | { type: 'CLEAR_SELECTION' }
  | { type: 'ADD_DRIVE'; company: string; description: string }
  | { type: 'UPDATE_DRIVE'; id: string; company: string; description: string }
  | { type: 'DELETE_DRIVE'; id: string }
  | { type: 'START_EDIT'; id: string }
  | { type: 'CANCEL_EDIT' }
  | { type: 'SET_DRIVES'; drives: Drive[] }
  | { type: 'SET_NOTICE'; message: string }
  | { type: 'CLEAR_NOTICE' }
  | { type: 'RESET' };

export const initialState: AppState = {
  status: 'idle',
  errorMessage: null,
  fingerprint: null,
  parsed: null,
  drives: [],
  selection: [],
  editingDriveId: null,
  notice: null,
};

function taggableIds(parsed: ParsedAttendance | null): Set<number> {
  return new Set((parsed?.slots ?? []).filter((s) => s.status === 'A').map((s) => s.id));
}

function availableIds(state: AppState, date?: string): number[] {
  const own = state.editingDriveId;
  return (state.parsed?.slots ?? [])
    .filter((s) => s.status === 'A' && (date === undefined || s.date === date))
    .filter((s) => {
      const owner = state.drives.find((d) => d.rowIds.includes(s.id));
      return !owner || owner.id === own;
    })
    .map((s) => s.id);
}

function makeId(): string {
  return crypto.randomUUID();
}

export function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'PARSE_START':
      return { ...state, status: 'parsing', errorMessage: null };

    case 'PARSE_SUCCESS': {
      const n = action.restored.length;
      return {
        ...state,
        status: 'ready',
        parsed: action.parsed,
        fingerprint: action.fingerprint,
        drives: action.restored,
        selection: [],
        editingDriveId: null,
        errorMessage: null,
        notice: n > 0 ? `Restored ${n} saved drive${n === 1 ? '' : 's'}.` : null,
      };
    }

    case 'PARSE_ERROR':
      return {
        ...state,
        status: 'error',
        errorMessage: action.message,
        parsed: null,
        fingerprint: null,
      };

    case 'TOGGLE_SELECT': {
      const has = state.selection.includes(action.id);
      return {
        ...state,
        selection: has
          ? state.selection.filter((x) => x !== action.id)
          : [...state.selection, action.id],
      };
    }

    case 'SELECT_DATE':
      return {
        ...state,
        selection: [...new Set([...state.selection, ...availableIds(state, action.date)])],
      };

    case 'SELECT_ALL':
      return { ...state, selection: [...new Set([...state.selection, ...availableIds(state)])] };

    case 'CLEAR_SELECTION':
      return { ...state, selection: [] };

    case 'ADD_DRIVE': {
      const company = action.company.trim();
      const description = action.description.trim();
      const rowIds = [...new Set(state.selection)].filter((id) => taggableIds(state.parsed).has(id));
      if (rowIds.length === 0 || !company || !description) return state;
      const drive: Drive = { id: makeId(), company, description, rowIds };
      const released = state.drives
        .map((d) => ({ ...d, rowIds: d.rowIds.filter((id) => !rowIds.includes(id)) }))
        .filter((d) => d.rowIds.length > 0);
      return {
        ...state,
        drives: [...released, drive],
        selection: [],
        editingDriveId: null,
        notice: `Tagged ${rowIds.length} hour${rowIds.length === 1 ? '' : 's'} for ${company}.`,
      };
    }

    case 'UPDATE_DRIVE': {
      const target = state.drives.find((d) => d.id === action.id);
      const company = action.company.trim();
      const description = action.description.trim();
      if (!target || !company || !description) return state;
      const rowIds = [...new Set(state.selection)].filter((id) => taggableIds(state.parsed).has(id));
      if (rowIds.length === 0) return state;
      const drives: Drive[] = [];
      for (const d of state.drives) {
        if (d.id === action.id) {
          drives.push({ ...d, company, description, rowIds });
        } else {
          const released = { ...d, rowIds: d.rowIds.filter((id) => !rowIds.includes(id)) };
          if (released.rowIds.length > 0) drives.push(released);
        }
      }
      return {
        ...state,
        drives,
        selection: [],
        editingDriveId: null,
        notice: `Drive updated (${rowIds.length} hour${rowIds.length === 1 ? '' : 's'}).`,
      };
    }

    case 'DELETE_DRIVE': {
      const target = state.drives.find((d) => d.id === action.id);
      if (!target) return state;
      return {
        ...state,
        drives: state.drives.filter((d) => d.id !== action.id),
        editingDriveId: state.editingDriveId === action.id ? null : state.editingDriveId,
        selection: state.editingDriveId === action.id ? [] : state.selection,
        notice: `Removed ${target.company} drive.`,
      };
    }

    case 'START_EDIT': {
      const drive = state.drives.find((d) => d.id === action.id);
      if (!drive) return state;
      return { ...state, editingDriveId: drive.id, selection: [...drive.rowIds] };
    }

    case 'CANCEL_EDIT':
      return { ...state, editingDriveId: null, selection: [] };

    case 'SET_DRIVES': {
      const valid = taggableIds(state.parsed);
      const drives = action.drives
        .map((d) => ({ ...d, rowIds: d.rowIds.filter((id) => valid.has(id)) }))
        .filter((d) => d.rowIds.length > 0);
      return {
        ...state,
        drives,
        selection: [],
        editingDriveId: null,
        notice: `Imported ${drives.length} drive${drives.length === 1 ? '' : 's'}.`,
      };
    }

    case 'SET_NOTICE':
      return { ...state, notice: action.message };

    case 'CLEAR_NOTICE':
      return { ...state, notice: null };

    case 'RESET':
      return initialState;
  }
}
```

- [ ] **Step 4: Run and confirm pass**

```bash
npx vitest run tests/storeReducer.test.ts
```

Expected: PASS, 14 tests.

- [ ] **Step 5: Implement `lib/store.tsx` (provider + hook)**

```tsx
'use client';

import { createContext, useContext, useMemo, useReducer, type Dispatch, type ReactNode } from 'react';
import { appReducer, initialState, type Action, type AppState } from './storeReducer';

interface AppContextValue {
  state: AppState;
  dispatch: Dispatch<Action>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state]);
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside <AppProvider>');
  return ctx;
}
```

- [ ] **Step 6: Typecheck and commit**

```bash
npx tsc --noEmit
git add lib/storeReducer.ts lib/store.tsx tests/storeReducer.test.ts
git commit -m "feat: state reducer + app provider"
```

---

### Task 10: App shell — layout, styles, upload, top bar, dashboard composition

**Files:** Create: `app/layout.tsx`, `app/globals.css`, `app/page.tsx`, `components/UploadScreen.tsx`, `components/TopBar.tsx`, `components/Dashboard.tsx`, `components/NoticeToast.tsx`
**Modify:** `app/page.tsx` (replace scaffold page), `app/layout.tsx` (replace scaffold layout), `app/globals.css` (replace scaffold globals)

- [ ] **Step 1: Write `app/layout.tsx` (replaces scaffold layout)**

```tsx
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { AppProvider } from '@/lib/store';
import './globals.css';

export const metadata: Metadata = {
  title: 'Attendance Calculator — Placement Excusals',
  description:
    'Per-subject attendance with placement-drive hour excusals, reported in NMIMS sheet format.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <body>
        <AppProvider>{children}</AppProvider>
      </body>
    </html>
  );
}
```

- [ ] **Step 2: Write `app/globals.css` (replaces scaffold globals)**

```css
@import "tailwindcss";

body {
  font-family: var(--font-geist-sans), ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif;
  background: #f6f7f9;
  color: #18181b;
}

.report-sheet {
  width: 210mm;
  min-height: 297mm;
  padding: 14mm;
  background: #fff;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
}

.page-break {
  break-before: page;
}

@page {
  size: A4;
  margin: 12mm;
}

@media print {
  body {
    background: #fff;
  }
  .report-sheet {
    box-shadow: none;
    margin: 0;
    padding: 0;
    width: auto;
    min-height: 0;
  }
}
```

- [ ] **Step 3: Write `components/UploadScreen.tsx`**

```tsx
'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { parseAttendance } from '@/lib/parseAttendance';
import { extractLines } from '@/lib/pdfText';
import { fingerprint, loadDrives } from '@/lib/storage';
import { useApp } from '@/lib/store';

export default function UploadScreen() {
  const { state, dispatch } = useApp();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      dispatch({ type: 'PARSE_START' });
      try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const fp = await fingerprint(bytes);
        const lines = await extractLines(bytes);
        const parsed = parseAttendance(lines);
        const restored = loadDrives(fp) ?? [];
        dispatch({ type: 'PARSE_SUCCESS', parsed, fingerprint: fp, restored });
      } catch (err) {
        dispatch({
          type: 'PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Could not read this PDF.',
        });
      }
    },
    [dispatch],
  );

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 19V5m0 14h16M8 15l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Attendance Calculator</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload your hour-wise SAP attendance PDF and excuse placement-drive hours.
          </p>
        </div>

        <motion.div
          whileTap={{ scale: 0.995 }}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
            dragging
              ? 'border-indigo-500 bg-indigo-50/60'
              : 'border-zinc-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
          }`}
        >
          <input
            ref={inputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
              e.target.value = '';
            }}
          />
          {state.status === 'parsing' ? (
            <p className="text-sm font-medium text-indigo-600">Reading PDF…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-800">Drop your attendance PDF here</p>
              <p className="mt-1 text-xs text-zinc-500">
                or click to browse — the file never leaves your device
              </p>
            </>
          )}
        </motion.div>

        {state.status === 'error' && state.errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {state.errorMessage}
          </motion.div>
        )}

        <p className="mt-5 text-center text-xs text-zinc-400">
          Nothing is uploaded — parsing happens entirely in your browser.
        </p>
      </div>
    </div>
  );
}
```

- [ ] **Step 4: Write `components/TopBar.tsx`**

```tsx
'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { exportJson, parseImport } from '@/lib/storage';
import { useApp } from '@/lib/store';
import { formatReportDate } from '@/lib/format';

const BTN =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50';

export default function TopBar() {
  const { state, dispatch } = useApp();
  const importRef = useRef<HTMLInputElement>(null);
  if (!state.parsed) return null;
  const { header, dateRange } = state.parsed;

  const onExport = () => {
    if (!state.fingerprint) return;
    const json = exportJson(state.fingerprint, header, state.drives);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-drives-${header.studentNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    if (!state.fingerprint) return;
    const text = await file.text();
    const result = parseImport(text, state.fingerprint);
    if (result.ok) {
      dispatch({ type: 'SET_DRIVES', drives: result.drives });
    } else if (result.reason === 'fingerprint') {
      const proceed = window.confirm(
        `${result.error}\n\nImport anyway? Hours that don't match this PDF will be dropped.`,
      );
      if (proceed) dispatch({ type: 'SET_DRIVES', drives: result.drives });
      else dispatch({ type: 'SET_NOTICE', message: 'Import cancelled.' });
    } else {
      dispatch({ type: 'SET_NOTICE', message: result.error });
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M4 19V5m0 14h16M8 15l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="mr-auto">
          <p className="text-sm font-bold leading-tight text-zinc-900">Attendance Calculator</p>
          <p className="text-xs text-zinc-500">
            {header.studentName} · {header.rollNo} · {formatReportDate(dateRange.from)} →{' '}
            {formatReportDate(dateRange.to)}
          </p>
        </div>
        <button type="button" className={BTN} onClick={() => dispatch({ type: 'RESET' })}>
          New PDF
        </button>
        <button type="button" className={BTN} onClick={onExport}>
          Export JSON
        </button>
        <button type="button" className={BTN} onClick={() => importRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
        <Link
          href="/report"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          View report →
        </Link>
      </div>
    </header>
  );
}
```

- [ ] **Step 5: Write `components/NoticeToast.tsx`**

```tsx
'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';

export default function NoticeToast() {
  const { state } = useApp();
  return (
    <AnimatePresence>
      {state.notice && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xl print:hidden"
        >
          {state.notice}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

- [ ] **Step 6: Write `components/Dashboard.tsx` (shell; sections are wired in Tasks 11–13)**

```tsx
'use client';

import { useEffect } from 'react';
import NoticeToast from './NoticeToast';
import TopBar from './TopBar';
import { saveDrives } from '@/lib/storage';
import { useApp } from '@/lib/store';

export default function Dashboard() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (state.status === 'ready' && state.fingerprint) {
      saveDrives(state.fingerprint, state.drives);
    }
  }, [state.status, state.fingerprint, state.drives]);

  useEffect(() => {
    if (!state.notice) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 3500);
    return () => clearTimeout(t);
  }, [state.notice, dispatch]);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{/* sections wired below */}</main>
      <NoticeToast />
    </div>
  );
}
```

- [ ] **Step 7: Write `app/page.tsx` (replaces scaffold page)**

```tsx
'use client';

import Dashboard from '@/components/Dashboard';
import UploadScreen from '@/components/UploadScreen';
import { useApp } from '@/lib/store';

export default function Home() {
  const { state } = useApp();
  if (state.status === 'ready' && state.parsed) return <Dashboard />;
  return <UploadScreen />;
}
```

- [ ] **Step 8: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add app components && git commit -m "feat: app shell with upload, top bar, dashboard composition"
```

Expected: typecheck and lint clean (lint may warn on the scaffold's leftover files — fix only errors).

---

### Task 11: Subject cards

**Files:** Create: `components/SubjectCards.tsx`; Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Write `components/SubjectCards.tsx`**

```tsx
'use client';

import { motion } from 'framer-motion';
import { buildDashboard, creditedIds } from '@/lib/calculate';
import { formatPercent } from '@/lib/format';
import { useApp } from '@/lib/store';

const TONES = {
  emerald: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  amber: { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  rose: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700' },
} as const;

function toneFor(pct: number): keyof typeof TONES {
  if (pct >= 80) return 'emerald';
  if (pct >= 70) return 'amber';
  return 'rose';
}

export default function SubjectCards() {
  const { state } = useApp();
  if (!state.parsed) return null;
  const rows = buildDashboard(state.parsed.slots, creditedIds(state.drives));

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row, i) => {
        const delta = Math.round((row.correctedPct - row.originalPct) * 100) / 100;
        const tone = TONES[toneFor(row.correctedPct)];
        const credited = row.creditedAttended - row.originalAttended;
        return (
          <motion.article
            key={row.courseName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-tight text-zinc-800">{row.courseName}</h3>
              {delta > 0 && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>
                  +{delta.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums text-zinc-900">
                {formatPercent(row.correctedPct)}
              </span>
              {delta > 0 && (
                <span className="mb-1 text-xs text-zinc-400 line-through">
                  {formatPercent(row.originalPct)}
                </span>
              )}
            </div>

            <div className="relative mt-3 h-2 rounded-full bg-zinc-100">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${tone.bar}`}
                style={{ width: `${Math.min(row.correctedPct, 100)}%` }}
              />
              <span className="absolute -top-1 h-4 w-px bg-zinc-400/70" style={{ left: '80%' }} />
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              {row.creditedAttended}/{row.conducted} hours
              {credited > 0 && (
                <span className="font-semibold text-indigo-600"> · +{credited} placement</span>
              )}
              {credited === 0 && row.correctedPct < 80 && (
                <span className="font-semibold text-rose-500"> · below 80%</span>
              )}
            </p>
          </motion.article>
        );
      })}
    </section>
  );
}
```

- [ ] **Step 2: Wire into `components/Dashboard.tsx`**

Add import and render inside `<main>`:

```tsx
import SubjectCards from './SubjectCards';
```

```tsx
<main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
  <SubjectCards />
</main>
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add components && git commit -m "feat: subject cards with original vs corrected percent"
```

---

### Task 12: Absent hour list

**Files:** Create: `components/AbsentHourList.tsx`; Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Write `components/AbsentHourList.tsx`**

```tsx
'use client';

import { groupAbsentByDate } from '@/lib/calculate';
import { formatDayLabel, formatTimeRange } from '@/lib/format';
import { useApp } from '@/lib/store';
import type { HourSlot } from '@/lib/types';

function ownerOf(slotId: number, drives: { id: string; rowIds: number[] }[]) {
  return drives.find((d) => d.rowIds.includes(slotId)) ?? null;
}

export default function AbsentHourList() {
  const { state, dispatch } = useApp();
  if (!state.parsed) return null;
  const groups = groupAbsentByDate(state.parsed.slots);
  const editing = state.editingDriveId;

  return (
    <section className="rounded-2xl border border-zinc-200/80 bg-white shadow-sm">
      <div className="flex flex-wrap items-center gap-3 border-b border-zinc-100 px-4 py-3">
        <div className="mr-auto">
          <h2 className="text-sm font-bold text-zinc-900">Absent hours</h2>
          <p className="text-xs text-zinc-500">
            {editing
              ? 'Editing — tick the hours this drive should cover.'
              : 'Tick hours to excuse them as a placement drive.'}
          </p>
        </div>
        {editing ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'CANCEL_EDIT' })}
            className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
          >
            Cancel edit
          </button>
        ) : (
          <>
            <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
              {state.selection.length} selected
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SELECT_ALL' })}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
            >
              Select all
            </button>
          </>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-zinc-400">
          No absences — every counted hour is present.
        </p>
      ) : (
        <ul className="max-h-[560px] divide-y divide-zinc-100 overflow-y-auto">
          {groups.map((group) => (
            <li key={group.date}>
              <div className="sticky top-0 z-10 flex items-center gap-3 bg-zinc-50/95 px-4 py-1.5 backdrop-blur">
                <span className="text-[11px] font-bold uppercase tracking-wide text-zinc-500">
                  {formatDayLabel(group.date)}
                </span>
                {!editing && (
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'SELECT_DATE', date: group.date })}
                    className="text-[11px] font-semibold text-indigo-600 hover:underline"
                  >
                    Select all
                  </button>
                )}
              </div>
              <ul className="space-y-2 px-3 py-2">
                {group.slots.map((slot: HourSlot) => {
                  const owner = ownerOf(slot.id, state.drives);
                  const checked = state.selection.includes(slot.id);
                  const disabled = Boolean(owner && owner.id !== editing);
                  return (
                    <li
                      key={slot.id}
                      className={`flex items-center gap-3 rounded-xl border px-3 py-2.5 transition ${
                        checked
                          ? 'border-indigo-300 bg-indigo-50/50'
                          : 'border-zinc-200/70 bg-white hover:border-zinc-300'
                      } ${disabled ? 'opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => dispatch({ type: 'TOGGLE_SELECT', id: slot.id })}
                        className="h-4 w-4 shrink-0 rounded border-zinc-300 accent-indigo-600"
                      />
                      <span className="w-36 shrink-0 text-xs font-medium tabular-nums text-zinc-500">
                        {formatTimeRange(slot.start, slot.end)}
                      </span>
                      <span className="flex-1 truncate text-sm text-zinc-800">{slot.courseName}</span>
                      <span className="hidden shrink-0 text-[10px] font-bold uppercase tracking-wide text-zinc-400 sm:block">
                        {slot.lectureType}
                      </span>
                      {owner ? (
                        <span className="shrink-0 rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                          Excused · {owner.company}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-bold text-rose-600">
                          Absent
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
```

- [ ] **Step 2: Wire into `components/Dashboard.tsx` with the two-column grid**

Add imports:

```tsx
import AbsentHourList from './AbsentHourList';
import SubjectCards from './SubjectCards';
```

Replace the `<main>` body:

```tsx
<main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
  <SubjectCards />
  <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
    <AbsentHourList />
    <div className="space-y-6" />
  </div>
</main>
```

Task 13 puts `<DrivesPanel />` inside the right-hand `div`.

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add components && git commit -m "feat: date-grouped absent hour list with selection"
```

---

### Task 13: Drives panel — form + cards

**Files:** Create: `components/DrivesPanel.tsx`; Modify: `components/Dashboard.tsx`

- [ ] **Step 1: Write `components/DrivesPanel.tsx`**

```tsx
'use client';

import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';

export default function DrivesPanel() {
  const { state, dispatch } = useApp();
  const editing = state.drives.find((d) => d.id === state.editingDriveId) ?? null;
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const active = editing ?? null;
  const canForm = Boolean(active) || state.selection.length > 0;

  const startEdit = (id: string) => {
    const drive = state.drives.find((d) => d.id === id);
    if (!drive) return;
    setCompany(drive.company);
    setDescription(drive.description);
    setError(null);
    dispatch({ type: 'START_EDIT', id });
  };

  const cancel = () => {
    setCompany('');
    setDescription('');
    setError(null);
    dispatch({ type: 'CANCEL_EDIT' });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !description.trim()) {
      setError('Company and description are both required.');
      return;
    }
    if (state.selection.length === 0) {
      setError('Select at least one absent hour.');
      return;
    }
    if (active) {
      dispatch({ type: 'UPDATE_DRIVE', id: active.id, company, description });
    } else {
      dispatch({ type: 'ADD_DRIVE', company, description });
    }
    setCompany('');
    setDescription('');
    setError(null);
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">
          {active ? `Edit drive — ${active.company}` : 'Tag as placement drive'}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {active || state.selection.length > 0
            ? `${state.selection.length} hour${state.selection.length === 1 ? '' : 's'} selected`
            : 'Select absent hours on the left first.'}
        </p>

        <AnimatePresence initial={false}>
          {canForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={submit}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (e.g. TCS)"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Drive description (e.g. TCS National Qualifier — off-campus, Slot 2)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500"
                  >
                    {active ? 'Update drive' : 'Save drive'}
                  </button>
                  {active && (
                    <button
                      type="button"
                      onClick={cancel}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">Tagged drives</h2>
        {state.drives.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-400">No placement drives tagged yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.drives.map((drive) => (
              <li key={drive.id} className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-zinc-900">{drive.company}</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                    {drive.rowIds.length} hr{drive.rowIds.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{drive.description}</p>
                <div className="mt-2 flex gap-3 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => startEdit(drive.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    Edit hours
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'DELETE_DRIVE', id: drive.id })}
                    className="text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Wire into `components/Dashboard.tsx`**

Add import:

```tsx
import DrivesPanel from './DrivesPanel';
```

Replace the empty right-hand column from Task 12 (`<div className="space-y-6" />`) with:

```tsx
<div className="space-y-6">
  <DrivesPanel />
</div>
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add components && git commit -m "feat: placement drive form with edit/remove flows"
```

---

### Task 14: Report page — sheet.PDF replica

**Files:** Create: `app/report/page.tsx`, `components/ReportView.tsx`

- [ ] **Step 1: Write `app/report/page.tsx`**

```tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReportView from '@/components/ReportView';
import { useApp } from '@/lib/store';

export default function ReportPage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (state.status !== 'ready') router.replace('/');
  }, [state.status, router]);

  if (state.status !== 'ready' || !state.parsed) return null;

  return (
    <div className="min-h-screen bg-zinc-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex w-[210mm] max-w-full items-center justify-between px-2 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
        >
          Download PDF
        </button>
      </div>
      <ReportView />
    </div>
  );
}
```

- [ ] **Step 2: Write `components/ReportView.tsx` (page 1 only; annexure in Task 15)**

```tsx
'use client';

import { creditedIds, summarize } from '@/lib/calculate';
import { formatReportDate } from '@/lib/format';
import { useApp } from '@/lib/store';
import type { CourseLine } from '@/lib/types';

interface Row {
  sNo: number;
  line: CourseLine;
  first: boolean;
  percentage?: number;
}

const FOOTNOTES = [
  'The overall attendance % for each course is reflected once, whereas lectures conducted/attended for Theory / Practical/Tutorial/Studio are shown in a separate row, as applicable.',
  'Please contact school Course Co-ordinator/AR/DR for any attendance-related queries within 2 days from the receipt of the report.',
  'You will be detained if you do not comply with the attendance requirement of 80% attendance in each course. You have to register afresh and repeat the Semester / Year in the subsequent Academic year as per readmission rules mentioned in the Student Resource Book.',
  'For academic-related concerns, please write to us at mpstme-mum.academics@nmims.edu with the following details to ensure prompt assistance.\nStudent SAP ID | Student Name | Student Roll No. | Name of the Program | Academic Term',
];

export default function ReportView() {
  const { state } = useApp();
  if (!state.parsed) return null;
  const { header, dateRange } = state.parsed;
  const summaries = summarize(state.parsed.slots, creditedIds(state.drives));

  const rows: Row[] = [];
  for (const summary of summaries) {
    summary.lines.forEach((line, i) => {
      rows.push({
        sNo: rows.length + 1,
        line,
        first: i === 0,
        percentage: i === 0 ? summary.percentage : undefined,
      });
    });
  }

  const th = 'border border-zinc-500 px-2 py-1.5 text-left font-bold';
  const td = 'border border-zinc-500 px-2 py-1.5 align-top';

  return (
    <div className="report-sheet mx-auto text-zinc-900">
      <h1 className="text-center text-[13px] font-bold uppercase tracking-wide">
        Mukesh Patel School of Technology Management &amp; Engineering - Mumbai
      </h1>

      <div className="mt-8 space-y-1.5 text-[11px]">
        <p>
          <span className="inline-block w-[52mm]">Student Name:</span>
          {header.studentName}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Student Number:</span>
          {header.studentNumber}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Additional ID Number:</span>
          {header.rollNo}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Academic Year &amp; Academic Session</span>
          {header.academicYear}
        </p>
        <p>
          <span className="inline-block w-[52mm]">Program Name:</span>
          {header.programName}
        </p>
        <p className="pt-2 font-semibold">
          Attendance Report Date: From {formatReportDate(dateRange.from)} To{' '}
          {formatReportDate(dateRange.to)}
        </p>
      </div>

      <table className="mt-6 w-full border-collapse text-[10px] leading-tight">
        <thead>
          <tr className="bg-zinc-100">
            <th className={`${th} w-[6%]`}>S.No.</th>
            <th className={`${th} w-[17%]`}>Course Name</th>
            <th className={`${th} w-[23%]`}>Division Name</th>
            <th className={`${th} w-[10%]`}>Lecture Type</th>
            <th className={`${th} w-[13%]`}>Total No. Of Classes Conducted</th>
            <th className={`${th} w-[13%]`}>Total No. Of Classes Attended</th>
            <th className={`${th} w-[12%]`}>Percentage (%)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={`${row.sNo}-${row.line.lectureType}`}>
              <td className={`${td} text-center`}>{row.sNo}</td>
              <td className={td}>{row.line.courseName}</td>
              <td className={td}>
                {row.line.courseRaw}
                <br />
                {row.line.division}
              </td>
              <td className={td}>{row.line.lectureType}</td>
              <td className={`${td} text-center`}>{row.line.conducted}</td>
              <td className={`${td} text-center`}>{row.line.attended}</td>
              <td className={`${td} text-center font-semibold`}>
                {row.percentage !== undefined ? row.percentage.toFixed(2) : ''}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <ol className="mt-6 list-decimal space-y-1 pl-4 text-[9.5px] leading-snug">
        {FOOTNOTES.map((note) => (
          <li key={note.slice(0, 30)}>{note}</li>
        ))}
      </ol>

      <p className="mt-6 text-[9.5px] italic">
        This is system generated attendance report and needs no signature....
      </p>

      {/* Annexure rendered in Task 15 */}
    </div>
  );
}
```

- [ ] **Step 3: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add app/report components/ReportView.tsx
git commit -m "feat: report route with sheet-format attendance table"
```

---

### Task 15: Placement annexure

**Files:** Modify: `components/ReportView.tsx`

- [ ] **Step 1: Add the annexure import + section**

Add imports:

```tsx
import { formatDayLabel, formatTimeRange } from '@/lib/format';
import type { Drive, HourSlot } from '@/lib/types';
```

Add helper above the component:

```tsx
function buildAnnexure(drives: Drive[], slots: HourSlot[]) {
  const byId = new Map(slots.map((s) => [s.id, s]));
  const toMinutes = (t: string): number => {
    const m = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(t);
    if (!m) return 0;
    const h = Number(m[1]) % 12;
    return (m[3] === 'PM' ? h + 12 : h) * 60 + Number(m[2]);
  };
  return drives
    .map((drive) => ({
      drive,
      hours: drive.rowIds
        .map((id) => byId.get(id))
        .filter((s): s is HourSlot => Boolean(s))
        .sort(
          (a, b) => a.date.localeCompare(b.date) || toMinutes(a.start) - toMinutes(b.start),
        ),
    }))
    .filter((block) => block.hours.length > 0);
}
```

Inside `ReportView`, before `return`, compute:

```tsx
const annexure = buildAnnexure(state.drives, state.parsed.slots);
const totalCredited = annexure.reduce((sum, b) => sum + b.hours.length, 0);
```

Replace the `{/* Annexure rendered in Task 15 */}` comment with:

```tsx
{annexure.length > 0 && (
  <section className="page-break mt-10">
    <h2 className="text-center text-[12px] font-bold uppercase tracking-wide">
      Annexure — Placement Drive Excusals
    </h2>
    <p className="mt-3 text-[10px] leading-relaxed">
      The following {totalCredited} hour{totalCredited === 1 ? '' : 's'} were missed due to
      placement drives and are credited as present attendance in the report above.
    </p>

    {annexure.map((block, i) => (
      <div key={block.drive.id} className="mt-5">
        <p className="text-[11px] font-bold">
          Drive {i + 1} — {block.drive.company}
          <span className="ml-2 font-normal text-zinc-600">({block.hours.length} hour{block.hours.length === 1 ? '' : 's'})</span>
        </p>
        <p className="mt-1 text-[10px] leading-relaxed text-zinc-800">
          {block.drive.description}
        </p>
        <table className="mt-2 w-full border-collapse text-[9.5px]">
          <thead>
            <tr className="bg-zinc-100">
              <th className={`${th} w-[24%]`}>Date</th>
              <th className={`${th} w-[26%]`}>Time Slot</th>
              <th className={`${th} w-[32%]`}>Subject</th>
              <th className={`${th} w-[18%]`}>Lecture Type</th>
            </tr>
          </thead>
          <tbody>
            {block.hours.map((hour) => (
              <tr key={hour.id}>
                <td className={td}>{formatDayLabel(hour.date)}</td>
                <td className={td}>{formatTimeRange(hour.start, hour.end)}</td>
                <td className={td}>{hour.courseName}</td>
                <td className={td}>{hour.lectureType}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ))}
  </section>
)}
```

- [ ] **Step 2: Verify and commit**

```bash
npx tsc --noEmit && npm run lint
git add components/ReportView.tsx && git commit -m "feat: placement drive annexure on report"
```

---

### Task 16: Full verification, README, final commit

**Files:** Modify: `README.md`

- [ ] **Step 1: Run the whole test suite**

```bash
npm test
```

Expected: all suites pass — format, pdf, parseAttendance, calculate, storage, storeReducer.

Then guard against fixture drift (regenerating must be a no-op; if `pdfText` changed but the fixture wasn't refreshed, tests could be green against stale lines):

```bash
npm run fixture && git diff --exit-code tests/fixtures/attendance-lines.json
```

Expected: no diff.

- [ ] **Step 2: Typecheck + lint + production build**

```bash
npx tsc --noEmit && npm run lint && npm run build
```

Expected: clean; build succeeds.

- [ ] **Step 3: Manual QA in the browser**

```bash
npm run dev
```

Checklist (open http://localhost:3000):

1. Drop `ZSVKM_STUDENT_ATTENDANCE_COPY.pdf` → dashboard appears with 5 subject cards: **CC 94.12%, EH 97.06%, Ling 80.77%, DL 81.25%, BDA 64.71%** (BDA rose, Ling/DL/EH/CC emerald).
2. BDA card shows below-80% hint; absent list shows 26 A-hours across dates; NU hours are absent from the list.
3. "Select all" → tag company `TCS`, description `National Qualifier Test` → save. BDA → **100.00%**, delta chip `+35.29`, 6 placement hours credited (BDA has 6 absents: 30,31,49,50,51,52 + 33,34... verify count shown matches absents tagged).
4. Reload the page → "Restored 1 saved drive." badge; cards keep corrected values.
5. Export JSON → file downloads; Reset → upload screen; Import JSON → drives return.
6. View report → print preview (Cmd+P): A4, sheet-format table with merged per-course percentage, 4 footnotes; page 2 = annexure with company, description, hour table.
7. Untag via drive card "Remove" → subject drops back to original %.

- [ ] **Step 4: Write `README.md` (replace scaffold content)**

```markdown
# Attendance Calculator — Placement Excusals

Local-first Next.js app for NMIMS students: parse the hour-wise SAP attendance
PDF, excuse absent hours as placement drives (company + drive description), and
print a course-wise attendance report in the official `sheet.PDF` format with a
placement annexure.

## Usage

```bash
npm install        # also copies the pdf.js worker into public/
npm run dev        # http://localhost:3000
```

1. Drop your hour-wise attendance PDF (SAP export) on the upload screen.
2. Tick absent hours (optionally "Select all" per date).
3. Enter company + drive description → Save drive.
4. Watch per-subject original vs corrected % (80% line marked).
5. "View report" → "Download PDF" (browser print → Save as PDF).

## Rules

| Status | Conducted | Attended |
|---|---|---|
| P / L | yes | yes |
| A | yes | only if tagged to a placement drive |
| NU / E | no | no |

## Data & privacy

Everything runs in the browser — no uploads. Tags auto-save in localStorage
keyed by the PDF's SHA-256, and can be Exported/Imported as JSON.

## Tests

```bash
npm test
npm run fixture   # regenerate tests/fixtures from the sample PDF
```
```

- [ ] **Step 5: Final commit**

```bash
git add README.md && git commit -m "docs: usage README"
git status
```

Expected: working tree clean.

---

## Self-review notes (plan vs spec)

- **R1 parse client-side** → Tasks 4, 6, 10.
- **R2 drive tagging (placement-only, hour-wise, many hours per drive, edit/delete)** → Tasks 9, 12, 13.
- **R3 counting rules (NU excluded from denominator, placement counts as present)** → Task 7 + reducer tests.
- **R4 per-subject calc with sheet percentage formula** → Task 7 (five official percentages asserted).
- **R5 report replica + annexure** → Tasks 14, 15.
- **R6 fingerprint localStorage + JSON export/import** → Tasks 8, 10 (TopBar).
- **R7 non-goals** — no other reasons, no backend: respected throughout.
- **Error handling** → ParseError messages (Task 6), import validation (Task 8), form validation (Task 13), private-mode storage guard (Task 8).
- **UI quality bar ("best ui")** → Geist font, card grid with deltas + 80% markers, sticky date headers, framer-motion entrances/toasts, animated form expansion, print-perfect A4.
