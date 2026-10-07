'use client';

import { useEffect } from 'react';
import AbsentHourList from './AbsentHourList';
import DrivesPanel from './DrivesPanel';
import NoticeToast from './NoticeToast';
import SubjectCards from './SubjectCards';
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
          message: 'Storage unavailable — tags will not persist. Use Export JSON to save them.',
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
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">
        <SubjectCards />
        <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
          <AbsentHourList />
          <div className="space-y-6">
            <DrivesPanel />
          </div>
        </div>
      </main>
      <NoticeToast />
    </div>
  );
}
