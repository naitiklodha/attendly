'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReportView from '@/components/ReportView';
import { useApp } from '@/lib/store';

export default function ReportPage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (state.status !== 'ready') router.replace('/');
  }, [state.status, router]);

  if (state.status !== 'ready' || !state.parsed) return null;

  return (
    <div className="min-h-screen bg-zinc-100 py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex w-[210mm] max-w-full items-center justify-between px-2 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 shadow-sm hover:bg-zinc-50"
        >
          ← Back
        </button>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-indigo-500"
        >
          Download PDF
        </button>
      </div>
      <ReportView />
    </div>
  );
}
