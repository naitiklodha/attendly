'use client';

import { useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

const STORAGE_KEY = 'attcalc:v1:disclaimer-ack';
const EVENT = 'attcalc:disclaimer-ack';

function subscribe(onChange: () => void): () => void {
  window.addEventListener('storage', onChange);
  window.addEventListener(EVENT, onChange);
  return () => {
    window.removeEventListener('storage', onChange);
    window.removeEventListener(EVENT, onChange);
  };
}

function getAcknowledged(): boolean {
  try {
    return window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function getServerAcknowledged(): boolean {
  return false;
}

export default function DisclaimerGate() {
  const acknowledged = useSyncExternalStore(
    subscribe,
    getAcknowledged,
    getServerAcknowledged,
  );
  const [dismissed, setDismissed] = useState(false);
  const open = acknowledged || dismissed ? false : true;

  const acknowledge = () => {
    try {
      window.localStorage.setItem(STORAGE_KEY, '1');
    } catch {
      /* private mode — still lets the user through for this session */
    }
    window.dispatchEvent(new Event(EVENT));
    setDismissed(true);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          role="dialog"
          aria-modal="true"
          aria-labelledby="disclaimer-title"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-4 backdrop-blur-sm print:hidden"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-hairline-strong bg-surface-1 p-7 shadow-2xl sm:p-9"
          >
            <p className="t-eyebrow eyebrow-dot text-ink-subtle">Read this first</p>

            <h2
              id="disclaimer-title"
              className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.6px] text-ink sm:text-[32px]"
            >
              This is an estimate, not an attendance record.
            </h2>

            <div className="mt-5 space-y-4 text-[15px] leading-relaxed text-ink-muted">
              <p>
                This tool gives you a <strong className="font-semibold text-ink">rough idea</strong>{' '}
                of your attendance percentage by treating hours you skipped for a placement drive as
                attended.
              </p>
              <p>
                Granting attendance is at the{' '}
                <strong className="font-semibold text-ink">sole discretion of the college</strong>,
                and is done only against the forms submitted to the Placement Office. Nothing here
                changes your official record.
              </p>
              <p>
                Do not treat the PDF generated here as a final or authoritative document. Always
                confirm your percentage with your course co-ordinator before acting on it.
              </p>
            </div>

            <div className="mt-6 rounded-md border border-hairline bg-surface-2 px-4 py-3 text-[13px] leading-relaxed text-ink-subtle">
              Your PDF is parsed in your browser and is never uploaded or stored. Attendance history
              and drive tags are saved locally on this device, keyed to your SAP student number.
            </div>

            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:items-center">
              <button type="button" onClick={acknowledge} className="btn-primary w-full sm:w-auto">
                I understand — continue
              </button>
              <p className="text-[13px] text-ink-tertiary sm:ml-2">
                You can re-read this any time from the landing page.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
