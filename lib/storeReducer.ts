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

function sanitizeDrives(drives: Drive[], parsed: ParsedAttendance | null): Drive[] {
  const valid = taggableIds(parsed);
  const seen = new Set<number>();
  const out: Drive[] = [];
  for (const d of drives) {
    const rowIds = d.rowIds.filter((id) => {
      if (!valid.has(id) || seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    if (rowIds.length > 0) out.push({ ...d, rowIds });
  }
  return out;
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
      const drives = sanitizeDrives(action.restored, action.parsed);
      const n = drives.length;
      return {
        ...state,
        status: 'ready',
        parsed: action.parsed,
        fingerprint: action.fingerprint,
        drives,
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
      const taggable = taggableIds(state.parsed);
      const rowIds = [...new Set(state.selection)].filter((id) => taggable.has(id));
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
      const taggable = taggableIds(state.parsed);
      const rowIds = [...new Set(state.selection)].filter((id) => taggable.has(id));
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
      const drives = sanitizeDrives(action.drives, state.parsed);
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
