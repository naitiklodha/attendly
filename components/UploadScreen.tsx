'use client';

import { useCallback, useRef, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { parseAttendance } from '@/lib/parseAttendance';
import { extractLines } from '@/lib/pdfText';
import { readFileBytes } from '@/lib/file';
import { mergeAttendanceHistory } from '@/lib/attendanceHistory';
import { fingerprint, loadStudentHistory } from '@/lib/storage';
import { useApp } from '@/lib/store';
import { SAP_PORTAL_LABEL, SAP_PORTAL_URL } from '@/lib/links';

const STEPS = [
  <>
    Get the hour-wise PDF from the{' '}
    <a
      href={SAP_PORTAL_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline decoration-primary/40 underline-offset-2 transition hover:text-primary-hover"
    >
      {SAP_PORTAL_LABEL}
    </a>
    , choosing <span className="font-medium text-ink">Detailed Report</span>.
  </>,
  <>Tick the hours missed for a drive; name the company.</>,
  <>Check corrected %, then print the sheet-format report.</>,
];

export default function UploadScreen() {
  const { state, dispatch } = useApp();
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const parsingRef = useRef(false);

  const handleFile = useCallback(
    async (file: File) => {
      if (parsingRef.current) return;
      parsingRef.current = true;
      dispatch({ type: 'PARSE_START' });
      try {
        const bytes = await readFileBytes(file);
        const fp = await fingerprint(bytes);
        const lines = await extractLines(bytes);
        const parsed = parseAttendance(lines);
        const existing = loadStudentHistory(parsed.header.studentNumber);
        const history = mergeAttendanceHistory(existing, parsed);
        dispatch({
          type: 'PARSE_SUCCESS',
          parsed: history.parsed,
          fingerprint: fp,
          restored: history.drives,
        });
      } catch (err) {
        dispatch({
          type: 'PARSE_ERROR',
          message: err instanceof Error ? err.message : 'Could not read this PDF.',
        });
      } finally {
        parsingRef.current = false;
      }
    },
    [dispatch],
  );

  const parsing = state.status === 'parsing';

  return (
    <div className="min-h-screen bg-canvas">
      <header className="border-b border-hairline">
        <div className="mx-auto flex h-14 max-w-[1280px] items-center gap-3 px-5">
          <Link href="/" className="wordmark">
            Attendly
          </Link>
          <Link href="/" className="btn-ghost ml-auto">
            ← Home
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1280px] items-start gap-12 px-5 py-16 lg:grid-cols-[1.1fr_0.9fr] lg:py-24">
        <div>
          <p className="t-eyebrow eyebrow-dot text-ink-subtle">The calculator</p>
          <h1 className="t-display-lg mt-6 text-ink">
            Credit the hours you missed for a placement drive.
          </h1>
          <p className="t-subhead mt-6 max-w-xl text-ink-muted">
            Drop in your hour-wise SAP export, tick the absences that were really a drive, and print
            the official course-wise report — with an annexure listing every credited hour.
          </p>

          <div className="panel mt-7 p-6">
            <p className="t-eyebrow text-ink-tertiary">How it works</p>
            <ol className="mt-4 space-y-3">
              {STEPS.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 font-mono text-[11px] text-primary">
                    {i + 1}
                  </span>
                  <span className="text-[14px] leading-relaxed text-ink-muted">{step}</span>
                </li>
              ))}
            </ol>
          </div>

          <motion.div
            whileTap={{ scale: 0.995 }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              const f = e.dataTransfer.files?.[0];
              if (f) void handleFile(f);
            }}
            onClick={() => !parsing && inputRef.current?.click()}
            className={`mt-9 cursor-pointer rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${dragging
              ? 'border-primary bg-primary/10'
              : parsing
                ? 'border-hairline-strong bg-surface-1'
                : 'border-hairline bg-surface-1 hover:border-hairline-strong hover:bg-surface-2'
              }`}
          >
            <input
              ref={inputRef}
              type="file"
              accept="application/pdf,.pdf"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = '';
              }}
            />
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-md border border-hairline bg-surface-2 text-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5">
                <path d="M12 3v10m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
              </svg>
            </span>
            <p className="mt-4 text-[15px] font-medium text-ink">
              {parsing ? 'Reading PDF…' : 'Drop your hour-wise SAP export'}
            </p>
            <p className="mt-1 text-[13px] text-ink-tertiary">
              {parsing ? 'This takes a moment.' : 'or click to browse'}
            </p>
          </motion.div>

          <p className="mt-4 text-[13px] leading-relaxed text-ink-tertiary">
            Parsed in your browser — the PDF is never uploaded or stored. Attendance history and
            drive tags are saved locally, keyed to your SAP student number.
          </p>

          {state.status === 'error' && state.errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 rounded-md border border-hairline-strong bg-surface-2 px-4 py-3 text-[14px] text-ink"
            >
              {state.errorMessage}
            </motion.div>
          )}
        </div>

        <div className="space-y-5">
          <div className="panel p-6">
            <p className="t-eyebrow text-ink-tertiary">Sample output</p>
            <div className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1">
              <span className="font-mono text-[15px] text-ink-tertiary line-through">64.71%</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-4 w-4 text-ink-tertiary">
                <path d="M5 12h14m-6-6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-mono text-[30px] font-medium tracking-[-1.5px] text-success">
                100.00%
              </span>
            </div>
            <p className="mt-2 text-[13px] text-ink-subtle">
              Big Data Analytics · 12 hours credited
            </p>
          </div>

          <div className="panel p-6">
            <p className="text-[13px] leading-relaxed text-ink-subtle">
              <span className="font-medium text-ink">Estimate only.</span> Granting attendance is at
              the sole discretion of the college, against the forms submitted to the Placement
              Office.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
