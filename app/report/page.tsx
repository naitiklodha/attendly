'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReportView from '@/components/ReportView';
import { useApp } from '@/lib/store';

export default function ReportPage() {
  const { state } = useApp();
  const router = useRouter();

  useEffect(() => {
    if (state.status !== 'ready') router.replace('/calculator');
  }, [state.status, router]);

  if (state.status !== 'ready' || !state.parsed) return null;

  return (
    <div className="min-h-screen bg-canvas py-8 print:bg-white print:py-0">
      <div className="mx-auto mb-6 flex w-[210mm] max-w-full items-center justify-between px-2 print:hidden">
        <button
          type="button"
          onClick={() => router.back()}
          className="btn-secondary"
        >
          ← Back
        </button>
        <button type="button" onClick={() => window.print()} className="btn-primary">
          Download PDF
        </button>
      </div>
      <ReportView />
    </div>
  );
}
