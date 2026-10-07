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
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center gap-3 border-b border-hairline px-5 py-3.5">
        <div className="mr-auto">
          <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-ink">Absent hours</h2>
          <p className="mt-0.5 text-[12px] text-ink-tertiary">
            {editing
              ? 'Editing — tick the hours this drive should cover.'
              : 'Tick the hours you missed — they’ll be credited as attended.'}
          </p>
        </div>
        {editing ? (
          <button
            type="button"
            onClick={() => dispatch({ type: 'CANCEL_EDIT' })}
            className="btn-secondary"
          >
            Cancel edit
          </button>
        ) : (
          <>
            <span className="font-mono text-[12px] text-ink-subtle">
              {state.selection.length} selected
            </span>
            <button
              type="button"
              onClick={() => dispatch({ type: 'SELECT_ALL' })}
              className="btn-secondary"
            >
              Select all
            </button>
          </>
        )}
      </div>

      {groups.length === 0 ? (
        <p className="px-5 py-10 text-center text-[14px] text-ink-tertiary">
          No absences — every counted hour is present.
        </p>
      ) : (
        <ul className="max-h-[560px] overflow-y-auto">
          {groups.map((group) => {
            const selectable = group.slots.filter((slot) => {
              const owner = ownerOf(slot.id, state.drives);
              return !owner || owner.id === editing;
            });
            const daySelectable = selectable.length;
            const daySelected = selectable.filter((slot) =>
              state.selection.includes(slot.id),
            ).length;

            return (
            <li key={group.date}>
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-hairline bg-surface-2/95 px-5 py-1.5 backdrop-blur">
                {!editing && (
                  <input
                    type="checkbox"
                    aria-label={`Select every hour on ${formatDayLabel(group.date)}`}
                    checked={daySelectable > 0 && daySelected === daySelectable}
                    disabled={daySelectable === 0}
                    onChange={() => dispatch({ type: 'SELECT_DATE', date: group.date })}
                    className="h-4 w-4 shrink-0 cursor-pointer rounded-xs border-hairline-strong bg-surface-1 accent-primary disabled:cursor-not-allowed disabled:opacity-40"
                  />
                )}
                <span className="t-eyebrow text-ink-subtle">{formatDayLabel(group.date)}</span>
                {!editing && (
                  <span className="ml-auto font-mono text-[11px] tabular-nums text-ink-tertiary">
                    {daySelected}/{daySelectable}
                  </span>
                )}
              </div>
              <ul className="divide-y divide-hairline/70">
                {group.slots.map((slot: HourSlot) => {
                  const owner = ownerOf(slot.id, state.drives);
                  const checked = state.selection.includes(slot.id);
                  const disabled = Boolean(owner && owner.id !== editing);
                  return (
                    <li
                      key={slot.id}
                      className={`flex items-center gap-3 px-5 py-2.5 transition ${
                        checked ? 'bg-primary/10' : 'hover:bg-surface-2/60'
                      } ${disabled ? 'opacity-50' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={() => dispatch({ type: 'TOGGLE_SELECT', id: slot.id })}
                        className="h-4 w-4 shrink-0 cursor-pointer rounded-xs border-hairline-strong bg-surface-1 accent-primary"
                      />
                      <span className="w-36 shrink-0 font-mono text-[12px] tabular-nums text-ink-tertiary">
                        {formatTimeRange(slot.start, slot.end)}
                      </span>
                      <span className="flex-1 truncate text-[14px] text-ink-muted">
                        {slot.courseName}
                      </span>
                      <span className="hidden shrink-0 font-mono text-[11px] uppercase text-ink-tertiary sm:block">
                        {slot.lectureType}
                      </span>
                      {owner ? (
                        <span className="shrink-0 rounded-full border border-hairline bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-ink-subtle">
                          Excused · {owner.company}
                        </span>
                      ) : (
                        <span className="shrink-0 rounded-full border border-hairline-strong bg-surface-3 px-2.5 py-0.5 font-mono text-[11px] text-[#e06c75]">
                          Absent
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
