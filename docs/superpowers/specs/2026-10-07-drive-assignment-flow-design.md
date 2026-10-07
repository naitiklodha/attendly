# Drive Assignment Flow Design

**Date:** 2026-10-07
**Status:** Approved

## Goal

Make it obvious that selecting absent lectures updates the selected-hour count immediately, and that saving drive details allocates those selected hours to the drive.

## Interaction

- Keep the existing multi-select lecture workflow.
- Show the live selected-hour count prominently in the drive form, and immediately preview selected hours as placement credits in the course attendance percentages.
- Label the submit action **Save and assign drive** to communicate that one action saves the company and description and allocates the selected lectures.
- Keep saved-drive editing and removal behavior unchanged.

## State and validation

Selection remains in the existing reducer state. The dashboard combines persisted drive hours with the current selection for a live preview; only saving changes persisted drives. Saving a new drive continues to use the existing atomic `ADD_DRIVE` action; no new draft or intermediate assignment state is needed. Existing company-required and selection-required validation remains in place.

## Verification

Run the calculation tests for selected-hour preview and the reducer tests covering live selection and `ADD_DRIVE`, then run the focused lint/type validation for the touched components.