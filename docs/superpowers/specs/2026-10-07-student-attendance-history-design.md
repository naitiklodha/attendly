# Student Attendance History Design

**Date:** 2026-10-07
**Status:** Proposed for review

## Goal

Keep placement-drive assignments and their attendance hours across successive PDFs for the same student, without replacing previously saved local data.

## Storage

- Store a versioned attendance-history record in `localStorage`, keyed by the parsed SAP student number.
- Store parsed hour-slot data and drive assignments, not the original PDF bytes.
- Keep current fingerprint-keyed entries untouched for now; do not migrate or delete them in this change. The student-keyed archive starts when a PDF is first successfully processed after this feature is released.
- If local storage is unavailable or full, preserve the existing in-memory behavior and show the existing storage warning.

## Merge behavior

- Identify a lecture slot by its course raw name, date, start time, and end time; attendance status is not part of the identity.
- On the first PDF for an SAP ID, initialize the history from that parsed PDF.
- On later PDFs for the same SAP ID, append only slot identities not already stored.
- If a slot identity already exists, keep its first-saved slot data and drive assignment; do not overwrite it with the newer PDF row.
- Keep previous drives and their assigned slot identities. New drive assignments append without replacing previous assignments; a slot already assigned to an existing drive remains owned by that drive.
- Calculate dashboard and report attendance from the accumulated slot history, so old credited hours remain included even when absent from a later PDF.
- Use the latest PDF's student header details and derive the report date range from the earliest and latest dates in the accumulated slots.
- Reassign internal numeric row IDs as needed when merging; persisted drive references must remain tied to stable slot identities, not PDF-local row IDs.

## Scope and compatibility

The history is local to one browser profile and one SAP student number. Different students on the same device have separate records. This change does not synchronize across devices or merge historical hash-keyed records. Existing hash-keyed values remain in `localStorage` but are not imported into the new archive.

## Verification

Test initial history creation, append-only merge, duplicate-slot first-write-wins behavior, preserved drive ownership, distinct SAP IDs, and stable drive-to-slot remapping when incoming PDF row IDs collide. Re-run parser, calculation, reducer, and storage suites, then lint and production build.
