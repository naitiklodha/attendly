'use client';

import { motion } from 'framer-motion';
import { buildDashboard, creditedIds } from '@/lib/calculate';
import { formatPercent } from '@/lib/format';
import { useApp } from '@/lib/store';

const TONES = {
  emerald: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
  amber: { bar: 'bg-amber-500', chip: 'bg-amber-50 text-amber-700' },
  rose: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700' },
} as const;

function toneFor(pct: number): keyof typeof TONES {
  if (pct >= 80) return 'emerald';
  if (pct >= 70) return 'amber';
  return 'rose';
}

export default function SubjectCards() {
  const { state } = useApp();
  if (!state.parsed) return null;
  const rows = buildDashboard(state.parsed.slots, creditedIds(state.drives));

  return (
    <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
      {rows.map((row, i) => {
        const delta = Math.round((row.correctedPct - row.originalPct) * 100) / 100;
        const tone = TONES[toneFor(row.correctedPct)];
        const credited = row.creditedAttended - row.originalAttended;
        return (
          <motion.article
            key={row.courseName}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            whileHover={{ y: -2 }}
            className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2">
              <h3 className="text-sm font-semibold leading-tight text-zinc-800">{row.courseName}</h3>
              {delta > 0 && (
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-bold ${tone.chip}`}>
                  +{delta.toFixed(2)}
                </span>
              )}
            </div>

            <div className="mt-3 flex items-end gap-2">
              <span className="text-3xl font-bold tabular-nums text-zinc-900">
                {formatPercent(row.correctedPct)}
              </span>
              {delta > 0 && (
                <span className="mb-1 text-xs text-zinc-400 line-through">
                  {formatPercent(row.originalPct)}
                </span>
              )}
            </div>

            <div className="relative mt-3 h-2 rounded-full bg-zinc-100">
              <div
                className={`h-2 rounded-full transition-all duration-500 ${tone.bar}`}
                style={{ width: `${Math.min(row.correctedPct, 100)}%` }}
              />
              <span className="absolute -top-1 h-4 w-px bg-zinc-400/70" style={{ left: '80%' }} />
            </div>

            <p className="mt-2 text-xs text-zinc-500">
              {row.creditedAttended}/{row.conducted} hours
              {credited > 0 && (
                <span className="font-semibold text-indigo-600"> · +{credited} placement</span>
              )}
              {credited === 0 && row.correctedPct < 80 && (
                <span className="font-semibold text-rose-500"> · below 80%</span>
              )}
            </p>
          </motion.article>
        );
      })}
    </section>
  );
}
