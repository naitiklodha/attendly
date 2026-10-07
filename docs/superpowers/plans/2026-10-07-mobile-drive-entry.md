# Mobile-First Drive Entry Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make new-drive creation easy to discover on desktop and mobile, and assign selected hours in one save action.

**Architecture:** Keep selection, assignment, and the shared create-dialog open state in the existing reducer so the absent-hours header, sticky action bar, and drive panel can all open the same form. The drive panel provides the responsive creation dialog and continues to own saved-drive editing and removal. Company filtering exposes the complete list in a bounded scrollable command list.

**Tech Stack:** Next.js 16 App Router, React 19, Radix Dialog, Tailwind CSS, Vitest, ESLint.

---

### Task 1: Add visible drive-entry actions

**Files:**
- Modify: `lib/storeReducer.ts`
- Test: `tests/storeReducer.test.ts`
- Modify: `components/Dashboard.tsx`
- Modify: `components/AbsentHourList.tsx`

- [ ] **Step 1: Test create-dialog state transitions**

Add reducer actions `OPEN_NEW_DRIVE` and `CLOSE_NEW_DRIVE`. Test that opening requires a nonempty selection, close preserves selection, and successful `ADD_DRIVE` closes the dialog.

- [ ] **Step 2: Add dashboard mobile action**

Render a fixed, safe-area-aware bottom action at all breakpoints, only when selection is non-empty, and only when no drive is being edited. Show the live hour count and **Add to drive**; dispatch `OPEN_NEW_DRIVE` on click. Reserve page-bottom space while this action is visible.

- [ ] **Step 3: Add the absent-hours header action**

Always show **Add drive** in the absent-hours header when not editing. Disable it when `state.selection.length === 0`, and show **Select hours first** beside it. When selection is non-empty, clicking opens creation.

### Task 2: Reuse one create form across breakpoints

**Files:**
- Modify: `components/DrivesPanel.tsx`
- Reuse: `components/ui/dialog.tsx`
- Modify: `components/CompanyCombobox.tsx`
- Modify: `components/ui/command.tsx`
- Modify: `lib/companies.ts`
- Test: `tests/companies.test.ts`

- [ ] **Step 1: Make the right-side creation entry persistent**

Keep a visible **New drive** entry at the top of the desktop drive panel. Its button opens the create form. Show the selected-hour count and explain the zero-selection requirement.

- [ ] **Step 2: Put new-drive fields in a responsive dialog**

Use the existing Radix dialog wrappers. Below `lg`, position dialog content as a bottom sheet; at `lg` and above, center it. Keep one controlled form implementation and the existing company/description state.

- [ ] **Step 3: Preserve edit and cancel behavior**

Keep `START_EDIT`, `UPDATE_DRIVE`, and edit cancel behavior unchanged. Closing a new-drive dialog clears its draft fields but preserves the hour selection. Successful `ADD_DRIVE` clears the selection, closes the dialog, and leaves the new item in Saved drives.

- [ ] **Step 4: Keep the full company list reachable**

Use `filterCompanySuggestions(options, value)` from `lib/companies.ts` without an item-count slice. Keep the command list at a bounded height with vertical overflow scrolling and without the `no-scrollbar` class. Verify `tests/companies.test.ts` covers all default companies and case-insensitive query behavior.

### Task 3: Verify behavior and responsive UI

**Files:**
- Verify: `tests/calculate.test.ts`
- Verify: `tests/storeReducer.test.ts`
- Verify: `tests/companies.test.ts`

- [ ] **Step 1: Run focused behavior tests**

Run `npm test -- tests/calculate.test.ts tests/storeReducer.test.ts tests/companies.test.ts`. Expected: selected-hour preview, `ADD_DRIVE` allocation, dialog-state, and complete company-filter tests pass.

- [ ] **Step 2: Run lint and production build**

Run `npm run lint` and `npm run build`. Expected: both exit successfully.

- [ ] **Step 3: Check the running app at mobile and desktop widths**

Use the local Next dev server and browser to verify the disabled header action at zero selection, the enabled sticky bar after selection at mobile and desktop widths, the responsive create dialog, all default company options and scrolling, and drive assignment on save. Stop after confirming the flow at narrow mobile and desktop widths.
