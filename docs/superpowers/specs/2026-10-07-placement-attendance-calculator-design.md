# Placement-Cum-Attendance Calculator — Design Spec

**Date:** 2026-10-07
**Status:** Approved (design walkthrough complete)

## 1. Problem

NMIMS students lose attendance when they skip classes for placement drives. The college
SAP attendance export (hour-wise) and the official summary sheet (course-wise) are both
PDFs. Students need to see their real per-subject attendance after excusing placement
hours, and get a report in the official sheet format they can submit as proof.

## 2. Inputs

### 2.1 Detailed attendance PDF (input)

Source: `ZSVKM_STUDENT_ATTENDANCE_COPY.pdf` (SAP LiveCycle export, 9 pages).

- **Header block:** Student Name, Student Number, Roll No., Academic Year & Session,
  Program Name, Attendance Report Duration (From/To).
- **Table, one hour slot per row:**
  `Sr No | Course Name | Date | Start Time | End Time | Attendance`
  - `Course Name` example: `Cloud ComputingP1 BTI Comp B1`
    - base course: `Cloud Computing`
    - type suffix: `P1` → Practical, `T1` → Theory
    - division: `BTI Comp B1` (everything after `BTI`)
  - `Date`: `Jul 13, 2026` · `Start/End Time`: `10:00:01 AM` / `11:00:00 AM`
  - `Attendance`: `P` Present · `A` Absent · `E` Exemption · `L` Late Admission ·
    `NU` Not Updated
- Rows are strictly one-per-line in text extraction; parsing is line-regex based.

### 2.2 Target report format (output model)

Source: `sheet.PDF` (SAP `ZSLCM_ATTENDANCE_REPORT`, A4, 2 pages).

- Header: School name, Student Name, Student Number, Additional ID (Roll),
  Academic Year & Session, Program Name, `Attendance Report Date: From DD.MM.YYYY To DD.MM.YYYY`.
- Table columns: `S.No. | Course Name | Division Name | Lecture Type |
  Total No. Of Classes Conducted | Total No. Of Classes Attended | Percentage (%)`
- **Percentage is per course (shown once, merged across that course's rows):**
  `Σ attended / Σ conducted × 100`, 2 decimal places.
  Verified against the sample: DL 32/42 = 76.19, BDA 30/46 = 65.22, EH 41/44 = 93.18,
  CC 40/44 = 90.91, Ling 28/34 = 82.35.
- `Lecture Type`: `THEO` for `T1` courses, `PRAC` for `P1` courses.
- `Course Name`: base course, uppercase. `Division Name`: full course string
  (base + type suffix) uppercase, then division string uppercase on the next line.
- Footer: 4 standard footnotes + "This is system generated attendance report and
  needs no signature...." + generation timestamp.

## 3. Requirements

### R1 — Parse the detailed PDF client-side
Upload → parse in browser with `pdfjs-dist` → structured hour slots. Show row count,
date range, subjects found, and a clear error if the file doesn't match the format.

### R2 — Tag absent hours with a placement drive
- The **only** reason category is **Placement Drive**: fields `Company` and
  `Drive description` (both required).
- Tags are **hour-wise**: a drive is attached to a specific set of hour slots
  (`rowIds`). One drive may cover many hours — a full day, multiple subjects, or
  scattered slots. Hours can belong to only one drive at a time.
- UI supports: multi-select hour slots → "Attach to drive", quick
  "select all absents on this date", edit drive (add/remove hours), delete drive
  (hours revert to untagged absent).

### R3 — Counting rules
| Status | Conducted | Attended | Notes |
|---|---|---|---|
| `P` | ✓ | ✓ | |
| `L` | ✓ | ✓ | late admission counts present |
| `A` | ✓ | only if credited by a drive | otherwise absent |
| `NU` | ✗ | ✗ | excluded entirely; not taggable |
| `E` | ✗ | ✗ | exempt, out of both totals |

Placement-credited hours: **count as present** — attended +1, conducted unchanged.

### R4 — Per-subject calculation (mirrors sheet.PDF)
- Group by `courseName + typeCode` → one table row with conducted/attended.
- Course percentage = Σattended ÷ Σconducted × 100 (2 dp), rendered once per course.
- Dashboard shows original % vs corrected % per subject, with 80% pass mark colored.

### R5 — Report generation in sheet.PDF format
Dedicated `/report` route, print-optimized A4 CSS → browser "Save as PDF":
- **Page 1:** exact sheet.PDF replica — header (values taken from the parsed input
  PDF), date range from the parsed data, 7-column table with merged per-course
  percentage, 4 footnotes, system-generated line, timestamp.
- **Page 2+ Annexure:** one block per placement drive — company, description,
  then hours as `Date | Time | Subject | Lecture Type`, plus total excused-hour count.

### R6 — Persistence
- Auto-save cumulative parsed attendance and drive assignments to `localStorage`, keyed by the
  student's SAP number. Append unseen hour slots from later PDFs; preserve first-saved data and
  drive assignments for matching slots. Store no PDF bytes.
- Keep existing fingerprint-keyed records untouched and do not automatically migrate them.
- `Export JSON` / `Import JSON` for backup and cross-device transfer.

### R7 — Non-goals
- No medical/personal/other reason categories.
- No backend, no database, no auth — static deployment (Vercel).
- No modification or re-upload of the official college record.

## 4. Architecture

- **Next.js (App Router) + TypeScript + Tailwind**, deployed as a static site.
- All parsing, state, and PDF export run client-side; no server filesystem use.
- Modules:
  - `lib/parseAttendance.ts` — pdfjs text extraction → `HourSlot[]` (pure, unit-tested)
  - `lib/calculate.ts` — status rules + per-course grouping/percentages (pure, unit-tested)
  - `lib/storage.ts` — SAP-number-keyed localStorage history plus fingerprint and JSON helpers
  - `components/*` — upload dropzone, subject cards, absent-hour list, drive form,
    report view
  - `app/report/page.tsx` — print-styled A4 report (sheet replica + annexure)
- State: single client-side store (React context + reducer) for slots and drives.

## 5. Error handling

- Unparseable/mismatched PDF → friendly message stating the expected format;
  keep the dropzone usable for retry.
- Zero absents → report still generates (pure original percentages).
- Blank company/description on save → inline validation, block submit.
- Imported JSON fingerprint mismatch → warn and require confirm before applying.
- localStorage unavailable (private mode) → degrade to session-only with a notice.

## 6. Testing

- **Vitest** unit tests:
  - Parser fixture: the real `ZSVKM_STUDENT_ATTENDANCE_COPY.pdf` → 166 rows,
    status distribution, first/last row assertions, `NU` detection.
  - Calculator: the five exact percentages from §2.2 (76.19 / 65.22 / 93.18 / 90.91 /
    82.35), plus drive-crediting and `NU`/`E` exclusion cases.
- **Manual QA:** upload → tag a drive covering a whole day → verify dashboard delta
  and report numbers match a hand calculation; print-preview the report at A4.
