'use client';

import { useEffect } from 'react';
import AbsentHourList from './AbsentHourList';
import DrivesPanel from './DrivesPanel';
import NoticeToast from './NoticeToast';
import SubjectSummary from './SubjectSummary';
import TopBar from './TopBar';
import { saveStudentHistory } from '@/lib/storage';
import { useApp } from '@/lib/store';
import { PlusIcon } from 'lucide-react';

export default function Dashboard() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    const studentNumber = state.parsed?.header.studentNumber;
    if (state.status === 'ready' && studentNumber && state.parsed) {
      const saved = saveStudentHistory(studentNumber, {
        parsed: state.parsed,
        drives: state.drives,
      });
      if (!saved) {
        dispatch({
          type: 'SET_NOTICE',
          message: 'Storage unavailable — attendance history will not persist in this browser.',
        });
      }
    }
  }, [state.status, state.parsed, state.drives, dispatch]);

  useEffect(() => {
    if (!state.notice) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 3500);
    return () => clearTimeout(t);
  }, [state.notice, dispatch]);

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar />
      <main className="mx-auto max-w-[1280px] px-5 pb-32 pt-6">
        <SubjectSummary />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AbsentHourList />
          <DrivesPanel />
        </div>
      </main>
      {state.selection.length > 0 && !state.editingDriveId && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-hairline bg-surface-1/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] shadow-[0_-8px_24px_rgba(0,0,0,0.25)] backdrop-blur">
          <div className="mx-auto flex max-w-[1280px] items-center justify-between gap-3 px-1">
            <div aria-live="polite" className="min-w-0">
              <p className="text-[13px] font-semibold text-ink">
                {state.selection.length} hour{state.selection.length === 1 ? '' : 's'} selected
              </p>
              <p className="text-[11px] text-ink-tertiary">Attendance preview updated</p>
            </div>
            <button
              type="button"
              onClick={() => dispatch({ type: 'OPEN_NEW_DRIVE' })}
              className="btn-primary gap-1.5 px-4"
            >
              <PlusIcon aria-hidden="true" className="size-4" />
              Add to drive
            </button>
          </div>
        </div>
      )}
      <NoticeToast />
    </div>
  );
}
