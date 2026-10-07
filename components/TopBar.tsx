'use client';

import Link from 'next/link';
import { useRef } from 'react';
import { exportJson, parseImport } from '@/lib/storage';
import { useApp } from '@/lib/store';
import { formatReportDate } from '@/lib/format';

const BTN =
  'rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50';

export default function TopBar() {
  const { state, dispatch } = useApp();
  const importRef = useRef<HTMLInputElement>(null);
  if (!state.parsed) return null;
  const { header, dateRange } = state.parsed;

  const onExport = () => {
    if (!state.fingerprint) return;
    const json = exportJson(state.fingerprint, header, state.drives);
    const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance-drives-${header.studentNumber}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onImport = async (file: File) => {
    if (!state.fingerprint) return;
    const text = await file.text();
    const result = parseImport(text, state.fingerprint);
    if (result.ok) {
      dispatch({ type: 'SET_DRIVES', drives: result.drives });
    } else if (result.reason === 'fingerprint') {
      const proceed = window.confirm(
        `${result.error}\n\nImport anyway? Hours that don't match this PDF will be dropped.`,
      );
      if (proceed) dispatch({ type: 'SET_DRIVES', drives: result.drives });
      else dispatch({ type: 'SET_NOTICE', message: 'Import cancelled.' });
    } else {
      dispatch({ type: 'SET_NOTICE', message: result.error });
    }
  };

  return (
    <header className="sticky top-0 z-20 border-b border-zinc-200/80 bg-white/80 backdrop-blur print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4">
            <path d="M4 19V5m0 14h16M8 15l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="mr-auto">
          <p className="text-sm font-bold leading-tight text-zinc-900">Attendance Calculator</p>
          <p className="text-xs text-zinc-500">
            {header.studentName} · {header.rollNo} · {formatReportDate(dateRange.from)} →{' '}
            {formatReportDate(dateRange.to)}
          </p>
        </div>
        <button type="button" className={BTN} onClick={() => dispatch({ type: 'RESET' })}>
          New PDF
        </button>
        <button type="button" className={BTN} onClick={onExport}>
          Export JSON
        </button>
        <button type="button" className={BTN} onClick={() => importRef.current?.click()}>
          Import JSON
        </button>
        <input
          ref={importRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void onImport(f);
            e.target.value = '';
          }}
        />
        <Link
          href="/report"
          className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-indigo-500"
        >
          View report →
        </Link>
      </div>
    </header>
  );
}
