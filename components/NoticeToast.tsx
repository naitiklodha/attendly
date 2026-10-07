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
          className="fixed bottom-6 left-1/2 z-30 -translate-x-1/2 rounded-full bg-zinc-900 px-4 py-2 text-xs font-semibold text-white shadow-xl print:hidden"
        >
          {state.notice}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
