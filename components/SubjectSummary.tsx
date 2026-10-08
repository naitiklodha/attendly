'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { LayersIcon } from 'lucide-react';
import { buildDashboard, creditedIds } from '@/lib/calculate';
import { formatPercent } from '@/lib/format';
import { suggestMergeGroups } from '@/lib/subjectMerge';
import { useApp } from '@/lib/store';
import MergeSubjectsDialog from './MergeSubjectsDialog';
import MergeSuggestionsPopup from './MergeSuggestionsPopup';

export default function SubjectSummary() {
  const { state } = useApp();
  const [merging, setMerging] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);
  if (!state.parsed) return null;
  const rows = buildDashboard(
    state.parsed.slots,
    creditedIds(state.drives, state.selection),
    state.courseMerges,
  );
  const suggestionGroups = suggestMergeGroups(rows.map((row) => row.courseName));
  const suggestions = suggestionGroups.filter(
    (group) => !dismissed.includes(group.join('|')),
  );

  const suppressSuggestions = () => {
    const keys = suggestionGroups.map((group) => group.join('|'));
    setDismissed((current) => [...new Set([...current, ...keys])]);
  };

  return (
    <section className="panel overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-b border-hairline px-5 py-3">
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-ink">Course attendance</h2>
          <p className="font-mono text-[12px] text-ink-tertiary">original → after placement credit</p>
        </div>
        <button
          type="button"
          onClick={() => setMerging(true)}
          className="btn-ghost -my-1 gap-1.5 px-2.5 py-1.5 text-[13px]"
        >
          <LayersIcon aria-hidden="true" className="size-3.5" />
          Merge subjects
        </button>
      </div>

      <ul className="divide-y divide-hairline">
        {rows.map((row, i) => {
          const delta = Math.round((row.correctedPct - row.originalPct) * 100) / 100;
          const hours = row.creditedAttended - row.originalAttended;
          const below = hours === 0 && row.correctedPct < 80;
          const onTrack = row.correctedPct >= 80;
          return (
            <motion.li
              key={row.courseName}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04 }}
              className="flex items-center gap-3 px-5 py-3 transition hover:bg-surface-2/60"
            >
              <span className="min-w-0 flex-1 truncate text-[14px] text-ink-muted">
                {row.courseName}
              </span>

              {delta > 0 && (
                <span className="hidden shrink-0 font-mono text-[12px] text-ink-tertiary line-through sm:block">
                  {formatPercent(row.originalPct)}
                </span>
              )}

              <span
                className={`w-[4.5rem] shrink-0 text-right font-mono text-[15px] font-medium tabular-nums ${onTrack ? 'text-ink' : 'text-[#e06c75]'
                  }`}
              >
                {formatPercent(row.correctedPct)}
              </span>

              <span className="relative hidden h-1.5 w-24 shrink-0 rounded-full bg-surface-3 md:block">
                <span
                  className={`absolute inset-y-0 left-0 rounded-full ${onTrack ? 'bg-success' : 'bg-[#e06c75]'
                    }`}
                  style={{ width: `${Math.min(row.correctedPct, 100)}%` }}
                />
                <span
                  className="absolute -top-1 h-3.5 w-px bg-ink-tertiary"
                  style={{ left: '80%' }}
                />
              </span>

              <span className="hidden w-[9.5rem] shrink-0 text-right font-mono text-[12px] tabular-nums text-ink-tertiary sm:block">
                {row.creditedAttended}/{row.conducted} hrs
                {hours > 0 && (
                  <span className="font-medium text-success"> · +{hours} credited</span>
                )}
                {below && <span className="font-medium text-[#e06c75]"> · below 80%</span>}
              </span>
            </motion.li>
          );
        })}
      </ul>

      <MergeSuggestionsPopup
        open={suggestions.length > 0 && !merging}
        suggestions={suggestions}
        onClose={suppressSuggestions}
      />

      <MergeSubjectsDialog
        open={merging}
        onOpenChange={setMerging}
        subjects={rows.map((row) => row.courseName)}
      />
    </section>
  );
}
