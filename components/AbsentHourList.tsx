'use client';

import { groupAbsentByDate } from '@/lib/calculate';
import { formatDayLabel, formatTimeRange } from '@/lib/format';
import { useApp } from '@/lib/store';
import type { HourSlot } from '@/lib/types';

function ownerOf<T extends { id: string; rowIds: number[] }>(slotId: number, drives: T[]) {
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
