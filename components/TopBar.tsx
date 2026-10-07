'use client';

import Link from 'next/link';
import { useApp } from '@/lib/store';
import { formatReportDate } from '@/lib/format';

export default function TopBar() {
  const { state } = useApp();
  if (!state.parsed) return null;
  const { header, dateRange } = state.parsed;

  return (
    <header className="sticky top-0 z-20 border-b border-hairline bg-canvas/85 backdrop-blur-md print:hidden">
      <div className="mx-auto flex max-w-[1280px] flex-wrap items-center gap-3 px-5 py-3">
        <Link href="/" className="wordmark">
          Attendly
        </Link>

        <div className="mr-auto min-w-0">
          <p className="truncate text-[13px] font-medium text-ink">{header.studentName}</p>
          <p className="truncate font-mono text-[12px] text-ink-tertiary">
            {header.rollNo} · {formatReportDate(dateRange.from)} → {formatReportDate(dateRange.to)}
          </p>
        </div>

        <Link href="/report" className="btn-primary">
          View report
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </Link>
      </div>
    </header>
  );
}
