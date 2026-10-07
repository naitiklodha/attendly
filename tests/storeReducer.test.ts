import { describe, expect, it } from 'vitest';
import {
  appReducer,
  initialState,
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
    const emptySelection = { ...state, selection: [] };
    expect(
      appReducer(emptySelection, { type: 'ADD_DRIVE', company: 'TCS', description: 'd' }),
    ).toBe(emptySelection);
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
    expect(state.notice).toContain('Removed TCS drive');
  });

  it('SET_DRIVES filters ids that are not taggable', () => {
    const state = appReducer(readyState(), {
      type: 'SET_DRIVES',
      drives: [
        { id: 'x', company: 'Wipro', description: 'd', rowIds: [2, 99] },
        { id: 'y', company: 'HCL', description: 'd', rowIds: [4, 99] },
      ],
    });
    expect(state.drives).toHaveLength(1);
    expect(state.drives[0].rowIds).toEqual([2]);
  });

  it('RESET returns to initial state', () => {
    const state = appReducer(readyState(), { type: 'RESET' });
    expect(state).toEqual(initialState);
  });
});
