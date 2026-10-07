'use client';

import Dashboard from '@/components/Dashboard';
import UploadScreen from '@/components/UploadScreen';
import { useApp } from '@/lib/store';

export default function CalculatorPage() {
  const { state } = useApp();
  if (state.status === 'ready' && state.parsed) return <Dashboard />;
  return <UploadScreen />;
}
