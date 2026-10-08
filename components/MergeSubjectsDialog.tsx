'use client';

import { useMemo, useState } from 'react';
import { CheckIcon, LayersIcon, SplitIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/lib/store';
import { groupMembers, mergesToGroups, suggestMergeGroups } from '@/lib/subjectMerge';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  subjects: string[];
}

export default function MergeSubjectsDialog({ open, onOpenChange, subjects }: Props) {
  const { state, dispatch } = useApp();
  const merges = state.courseMerges;
  const [selected, setSelected] = useState<string[]>([]);

  const suggestions = useMemo(() => suggestMergeGroups(subjects), [subjects]);
  const groups = useMemo(
    () => mergesToGroups(merges).filter((group) => group.length > 1),
    [merges],
  );
  const active = useMemo(
    () => selected.filter((name) => subjects.includes(name)),
    [selected, subjects],
  );

  const handleOpenChange = (next: boolean) => {
    if (!next) setSelected([]);
    onOpenChange(next);
  };

  const toggle = (name: string) => {
    setSelected((current) =>
      current.includes(name)
        ? current.filter((entry) => entry !== name)
        : [...current, name],
    );
  };

  const mergeSelected = () => {
    if (active.length < 2) return;
    dispatch({ type: 'MERGE_COURSES', names: active });
    setSelected([]);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="top-auto bottom-0 left-0 max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-w-lg lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl lg:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>Merge subjects</DialogTitle>
          <DialogDescription>
            Group subjects that SAP exported under different names. Hours are re-counted under one
            row — nothing is lost.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {suggestions.length > 0 && (
            <section>
              <p className="t-eyebrow text-ink-tertiary">Likely duplicates</p>
              <ul className="mt-2 space-y-2">
                {suggestions.map((group) => (
                  <li
                    key={group.join('|')}
                    className="rounded-md border border-hairline bg-surface-2 px-3 py-2.5"
                  >
                    <ul className="space-y-0.5">
                      {group.map((name) => (
                        <li key={name} className="text-[13px] leading-snug text-ink-muted">
                          {name}
                        </li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: 'MERGE_COURSES', names: group })}
                      className="btn-secondary mt-2.5 gap-1.5 px-3 py-1.5 text-[13px]"
                    >
                      <LayersIcon aria-hidden="true" className="size-3.5" />
                      Merge these
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section>
            <p className="t-eyebrow text-ink-tertiary">Combine by hand</p>
            <ul className="mt-2 max-h-[34vh] divide-y divide-hairline/70 overflow-y-auto rounded-md border border-hairline">
              {subjects.map((name) => {
                const checked = active.includes(name);
                const members = groupMembers(merges, name);
                return (
                  <li key={name}>
                    <button
                      type="button"
                      role="checkbox"
                      aria-checked={checked}
                      onClick={() => toggle(name)}
                      className="flex w-full items-start gap-3 px-3 py-2.5 text-left transition hover:bg-surface-2/60"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition ${checked
                          ? 'border-primary bg-primary text-canvas'
                          : 'border-hairline-strong bg-surface-1'
                          }`}
                      >
                        {checked && <CheckIcon className="size-3" strokeWidth={3} />}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[13px] text-ink">{name}</span>
                        {members && members.length > 1 && (
                          <span className="mt-0.5 block text-[12px] text-ink-tertiary">
                            {members.length} names combined
                          </span>
                        )}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>

            <button
              type="button"
              onClick={mergeSelected}
              disabled={active.length < 2}
              className="btn-primary mt-3 w-full disabled:cursor-not-allowed disabled:opacity-50"
            >
              {active.length < 2
                ? 'Select at least two subjects'
                : `Merge ${active.length} subjects`}
            </button>
          </section>

          {groups.length > 0 && (
            <section>
              <p className="t-eyebrow text-ink-tertiary">Merged</p>
              <ul className="mt-2 space-y-2">
                {groups.map((group) => {
                  const display = group.reduce((best, name) =>
                    name.length > best.length ? name : best,
                  );
                  return (
                    <li
                      key={group.join('|')}
                      className="flex items-start justify-between gap-3 rounded-md border border-hairline bg-surface-2 px-3 py-2.5"
                    >
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-medium text-ink">{display}</p>
                        <p className="mt-0.5 text-[12px] text-ink-tertiary">
                          {group.length} names · {group.filter((n) => n !== display).join(', ')}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => dispatch({ type: 'UNMERGE_GROUP', display })}
                        className="btn-ghost shrink-0 gap-1.5 px-2 py-1 text-[13px]"
                      >
                        <SplitIcon aria-hidden="true" className="size-3.5" />
                        Unmerge
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
