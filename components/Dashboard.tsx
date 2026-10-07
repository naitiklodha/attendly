'use client';

import { useEffect } from 'react';
import NoticeToast from './NoticeToast';
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
      <main className="mx-auto max-w-6xl px-4 pb-24 pt-6">{/* sections wired below */}</main>
      <NoticeToast />
    </div>
  );
}
