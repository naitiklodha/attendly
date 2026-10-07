# Student Attendance History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Accumulate attendance slots and drive assignments across successive PDFs for the same SAP student number without overwriting previously stored rows.

**Architecture:** Add a pure merge function that compares incoming slots with the student's stored history using a stable slot identity. Preserve existing slot IDs/data and drive assignments; assign new IDs only to unseen slots. Persist the merged parsed history and drives under a versioned per-student localStorage key. Leave old fingerprint-keyed entries untouched and do not migrate them.

**Tech Stack:** Next.js 16 App Router, TypeScript, browser localStorage, Vitest.

---

### Task 1: Define append-only history merging

**Files:**
- Create: `lib/attendanceHistory.ts`
- Test: `tests/attendanceHistory.test.ts`
- Reuse: `lib/types.ts`

- [ ] **Step 1: Write merge behavior tests**

Test a first import, a second PDF containing both old and new slots, a duplicate whose status differs, and preservation of drive ownership. Define slot identity from normalized `courseRaw`, ISO date, start, and end; exclude attendance status so a matching old slot is not replaced. Assert the first stored slot data wins and new IDs are greater than all existing IDs.

- [ ] **Step 2: Run the focused test and confirm it fails**

Run `npm test -- tests/attendanceHistory.test.ts`. Expected: failure because the history merge helper does not exist.

- [ ] **Step 3: Implement the pure merge helper**

Export `mergeAttendanceHistory(existing, incoming)` returning a `ParsedAttendance` and preserved `Drive[]`. For no existing history, return the incoming parsed rows with no drives. Otherwise, keep existing slots in order, append only unseen incoming slots with fresh IDs, preserve existing header-independent drive IDs/rowIds, use the latest incoming student header, and calculate `dateRange` from the merged slots.

- [ ] **Step 4: Rerun the focused test**

Run `npm test -- tests/attendanceHistory.test.ts`. Expected: all merge cases pass, including idempotent re-upload and first-write-wins duplicates.

### Task 2: Persist history by SAP student number

**Files:**
- Modify: `lib/storage.ts`
- Test: `tests/storage.test.ts`

- [ ] **Step 1: Test per-student storage isolation and round-trip**

Add tests using the existing in-memory `KeyValueStore`: saving then loading a history round-trips slots and drives, a different SAP number returns no history, and malformed records return no history without throwing.

- [ ] **Step 2: Implement versioned student-history storage**

Add `saveStudentHistory(studentNumber, { parsed, drives }, store?)` and `loadStudentHistory(studentNumber, store?)` using a key prefix distinct from the existing fingerprint keys, for example `attcalc:v2:student:<studentNumber>`. Store the record version, parsed header, accumulated slots/date range, and drives. Do not enumerate, migrate, delete, or overwrite `attcalc:v1:<fingerprint>` records.

- [ ] **Step 3: Run storage tests**

Run `npm test -- tests/storage.test.ts`. Expected: per-student histories remain isolated and malformed JSON is handled safely.

### Task 3: Merge at upload and save the canonical archive

**Files:**
- Modify: `components/UploadScreen.tsx`
- Modify: `components/Dashboard.tsx`
- Verify: `lib/storeReducer.ts`

- [ ] **Step 1: Load and merge immediately after parsing**

After `parseAttendance(lines)`, load history with `parsed.header.studentNumber`, call `mergeAttendanceHistory(existing, parsed)`, and dispatch the merged `ParsedAttendance` with the existing student's drives as `restored`. Do not call `loadDrives(fingerprint)` in the new upload path; legacy fingerprint records remain untouched as specified.

- [ ] **Step 2: Persist canonical state on dashboard changes**

Replace the fingerprint-keyed `saveDrives` effect with `saveStudentHistory(state.parsed.header.studentNumber, { parsed: state.parsed, drives: state.drives })`. Preserve the existing storage-unavailable notice. Because merged slots keep stable IDs and drives keep row IDs, the current calculation, selection, edit, report, and save behavior continue to use the same `ParsedAttendance` and `Drive` shapes.

- [ ] **Step 3: Verify recalculation and drive actions**

Run `npm test -- tests/calculate.test.ts tests/storeReducer.test.ts tests/attendanceHistory.test.ts tests/storage.test.ts`. Expected: cumulative slot percentages include earlier credited absences, and existing drive assignment/edit behavior remains unchanged.

### Task 4: Full verification

**Files:**
- Verify: `tests/**/*.test.ts`
- Verify: all modified TypeScript files

- [ ] **Step 1: Run all tests**

Run `npm test`. Expected: all Vitest suites pass.

- [ ] **Step 2: Run lint and production build**

Run `npm run lint` and `npm run build`. Expected: both exit successfully.

- [ ] **Step 3: Verify same-student and different-student upload behavior**

In the browser, upload a PDF, tag an absent hour, refresh, and confirm it remains credited. Upload a later PDF for the same SAP number with an overlapping range plus a new hour; confirm the old slot and drive remain, the new slot is appended once, and percentages use the combined history. Upload a PDF for a different SAP number and confirm it starts a separate archive.
