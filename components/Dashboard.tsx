'use client';

import { useEffect } from 'react';
import AbsentHourList from './AbsentHourList';
import DrivesPanel from './DrivesPanel';
import NoticeToast from './NoticeToast';
import SubjectSummary from './SubjectSummary';
import TopBar from './TopBar';
import { saveDrives } from '@/lib/storage';
import { useApp } from '@/lib/store';

export default function Dashboard() {
  const { state, dispatch } = useApp();

  useEffect(() => {
    if (state.status === 'ready' && state.fingerprint) {
      const saved = saveDrives(state.fingerprint, state.drives);
      if (!saved) {
        dispatch({
          type: 'SET_NOTICE',
          message: 'Storage unavailable — tags will not persist. Use Save tags to keep them.',
        });
      }
    }
  }, [state.status, state.fingerprint, state.drives, dispatch]);

  useEffect(() => {
    if (!state.notice) return;
    const t = setTimeout(() => dispatch({ type: 'CLEAR_NOTICE' }), 3500);
    return () => clearTimeout(t);
  }, [state.notice, dispatch]);

  return (
    <div className="min-h-screen bg-canvas">
      <TopBar />
      <main className="mx-auto max-w-[1280px] px-5 pb-24 pt-6">
        <SubjectSummary />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AbsentHourList />
          <DrivesPanel />
        </div>
      </main>
      <NoticeToast />
    </div>
  );
}
