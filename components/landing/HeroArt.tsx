'use client';

import { motion } from 'framer-motion';

const ROWS = [
  { name: 'Applied Systems', before: 68, after: 84 },
  { name: 'Technical Writing', before: 77, after: 88 },
  { name: 'Data Methods', before: 74, after: 82 },
  { name: 'Network Design', before: 71, after: 79 },
];

export default function HeroArt() {
  return (
    <div className="panel relative overflow-hidden p-6">
      <div className="flex items-baseline justify-between">
        <p className="t-eyebrow text-ink-tertiary">After placement credit</p>
        <span className="rounded-full border border-hairline bg-surface-2 px-2.5 py-0.5 font-mono text-[11px] text-ink-subtle">
          4 hrs credited
        </span>
      </div>

      <div className="mt-5 space-y-4">
        {ROWS.map((row, i) => (
          <div key={row.name}>
            <div className="flex items-baseline justify-between gap-3">
              <span className="truncate text-[13px] text-ink-muted">{row.name}</span>
              <span className="shrink-0 font-mono text-[11px] text-ink-tertiary line-through">
                {row.before.toFixed(2)}%
              </span>
            </div>
            <div className="mt-1.5 flex items-center gap-3">
              <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                <span
                  className="absolute inset-y-0 left-0 rounded-full bg-[#3a3a3e]"
                  style={{ width: `${row.before}%` }}
                />
                <motion.span
                  className="absolute inset-y-0 left-0 rounded-full bg-success"
                  initial={{ width: `${row.before}%` }}
                  whileInView={{ width: `${row.after}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 1.1, delay: 0.25 + i * 0.12, ease: [0.16, 1, 0.3, 1] }}
                />
                <span
                  className="absolute inset-y-[-3px] w-px bg-ink-subtle/70"
                  style={{ left: '80%' }}
                />
              </div>
              <motion.span
                className="w-14 shrink-0 text-right font-mono text-[13px] font-medium text-success"
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: 0.9 + i * 0.12 }}
              >
                {row.after.toFixed(2)}%
              </motion.span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-center justify-between border-t border-hairline pt-4">
        <p className="text-[12px] text-ink-tertiary">
          Dashed line marks the 80% requirement
        </p>
        <p className="font-mono text-[12px] text-ink-subtle">88.00% · eligible</p>
      </div>
    </div>
  );
}
