'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';

export default function NoticeToast() {
  const { state } = useApp();
  return (
    <AnimatePresence>
      {state.notice && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-md border border-hairline-strong bg-surface-3 px-4 py-2.5 text-[13px] font-medium text-ink shadow-2xl print:hidden"
        >
          {state.notice}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
