# Mobile-First Drive Entry Design

**Date:** 2026-10-07
**Status:** Approved (approach B selected; create-new-drive behavior confirmed)

## Problem

The drive-entry form is easy to miss, particularly on mobile where it appears after the long absent-hours list and only after a selection exists.

## Interaction

- Keep absent hours as the primary content.
- Keep an **Add drive** action visible in the absent-hours header. With no selected hours, disable it and explain: **Select hours first**.
- As users check absent hours, update the selected-hour count and attendance preview immediately.
- Once one or more hours are selected, show a sticky action bar at the bottom of both mobile and desktop layouts with the live count and **Add to drive** action.
- On mobile, either active entry point opens a bottom sheet for creating a new drive. On desktop, the sticky action and visible right-side drive panel open the same form.
- The form asks for company (required) and description (optional). **Save and assign drive** creates a new saved drive and assigns the currently selected hours in one action. No existing drive is required.
- The company picker keeps every company available in a visibly scrollable list; typing filters the full list without truncating results.
- After success, clear selection, close the sheet/form, and show the new drive under Saved drives. Existing edit and remove actions remain unchanged.

## State and boundaries

Use existing reducer selection and `ADD_DRIVE` behavior. Keep selection transient until save, and use selected IDs only as a provisional attendance credit before save. Add only the UI state needed to open/close the creation form; do not alter storage format or drive data model. Keep company filtering as a pure helper so the full-list behavior is unit-tested.

## Verification

Add focused coverage for company filtering, and retain calculation/reducer coverage for immediate preview and atomic assignment. Verify mobile and desktop layouts and company-list scrolling in the browser, then run the full Vitest suite and lint.
