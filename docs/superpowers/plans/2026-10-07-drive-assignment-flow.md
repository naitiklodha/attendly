# Drive Assignment Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make live lecture selection and the save-and-assign action clear in the drive form.

**Architecture:** Keep the existing reducer contract: checkbox actions update `selection`, and `ADD_DRIVE` saves drive details with the selected hour IDs atomically. Include those selected IDs in the dashboard's provisional credited set, and clarify the selected-hour status and new-drive submit label.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS, Vitest, ESLint.

---

### Task 1: Clarify new drive assignment

**Files:**
- Modify: `components/DrivesPanel.tsx`
- Modify: `components/SubjectSummary.tsx`
- Modify: `lib/calculate.ts`
- Test: `tests/calculate.test.ts`
- Verify: `tests/storeReducer.test.ts`

- [ ] **Step 1: Make the selected-hour count prominent and live**

Keep the count directly below the form heading, emphasize it as the immediate result of selecting lectures, and announce changes accessibly:

```tsx
<p aria-live="polite" className="mt-1 text-[13px] font-medium text-primary">
  {state.selection.length} hour{state.selection.length === 1 ? '' : 's'} selected
</p>
```

- [ ] **Step 2: Name the combined save-and-allocation action**

For a new drive, change the submit button text from `Save drive` to `Save and assign drive`. Keep the existing `Update drive` text for edits. Do not change `submit` or reducer behavior: successful new-drive submission dispatches `ADD_DRIVE` with the current company, description, and selected hours.

- [ ] **Step 3: Verify selection and allocation behavior**

Run `npm test -- tests/calculate.test.ts tests/storeReducer.test.ts`. Expected: all calculation and reducer tests pass, including `previews selected hours before they are saved to a drive`, `TOGGLE_SELECT adds and removes ids`, and `ADD_DRIVE saves trimmed values, clears selection, sets notice`.

- [ ] **Step 4: Lint the changed component**

Run `npx eslint components/DrivesPanel.tsx`. Expected: exit code 0 with no lint errors.