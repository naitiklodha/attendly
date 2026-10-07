'use client';

import { useCallback, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { parseAttendance } from '@/lib/parseAttendance';
import { extractLines } from '@/lib/pdfText';
import { fingerprint, loadDrives } from '@/lib/storage';
import { useApp } from '@/lib/store';

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
        const bytes = new Uint8Array(await file.arrayBuffer());
        const fp = await fingerprint(bytes);
        const lines = await extractLines(bytes);
        const parsed = parseAttendance(lines);
        const restored = loadDrives(fp) ?? [];
        dispatch({ type: 'PARSE_SUCCESS', parsed, fingerprint: fp, restored });
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

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-lg shadow-indigo-600/25">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="h-5 w-5">
              <path d="M4 19V5m0 14h16M8 15l3-4 3 3 4-6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-zinc-900">Attendance Calculator</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Upload your hour-wise SAP attendance PDF and excuse placement-drive hours.
          </p>
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
          onClick={() => inputRef.current?.click()}
          className={`cursor-pointer rounded-2xl border-2 border-dashed p-10 text-center transition ${
            dragging
              ? 'border-indigo-500 bg-indigo-50/60'
              : 'border-zinc-300 bg-white hover:border-indigo-400 hover:bg-indigo-50/30'
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
          {state.status === 'parsing' ? (
            <p className="text-sm font-medium text-indigo-600">Reading PDF…</p>
          ) : (
            <>
              <p className="text-sm font-semibold text-zinc-800">Drop your attendance PDF here</p>
              <p className="mt-1 text-xs text-zinc-500">
                or click to browse — the file never leaves your device
              </p>
            </>
          )}
        </motion.div>

        {state.status === 'error' && state.errorMessage && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700"
          >
            {state.errorMessage}
          </motion.div>
        )}

        <p className="mt-5 text-center text-xs text-zinc-400">
          Nothing is uploaded — parsing happens entirely in your browser.
        </p>
      </div>
    </div>
  );
}
