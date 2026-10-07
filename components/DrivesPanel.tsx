'use client';

import { useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';

export default function DrivesPanel() {
  const { state, dispatch } = useApp();
  const editing = state.drives.find((d) => d.id === state.editingDriveId) ?? null;
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);

  const active = editing ?? null;
  const canForm = Boolean(active) || state.selection.length > 0;

  const startEdit = (id: string) => {
    const drive = state.drives.find((d) => d.id === id);
    if (!drive) return;
    setCompany(drive.company);
    setDescription(drive.description);
    setError(null);
    dispatch({ type: 'START_EDIT', id });
  };

  const cancel = () => {
    setCompany('');
    setDescription('');
    setError(null);
    dispatch({ type: 'CANCEL_EDIT' });
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!company.trim() || !description.trim()) {
      setError('Company and description are both required.');
      return;
    }
    if (state.selection.length === 0) {
      setError('Select at least one absent hour.');
      return;
    }
    if (active) {
      dispatch({ type: 'UPDATE_DRIVE', id: active.id, company, description });
    } else {
      dispatch({ type: 'ADD_DRIVE', company, description });
    }
    setCompany('');
    setDescription('');
    setError(null);
  };

  return (
    <section className="space-y-4">
      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">
          {active ? `Edit drive — ${active.company}` : 'Tag as placement drive'}
        </h2>
        <p className="mt-0.5 text-xs text-zinc-500">
          {active || state.selection.length > 0
            ? `${state.selection.length} hour${state.selection.length === 1 ? '' : 's'} selected`
            : 'Select absent hours on the left first.'}
        </p>

        <AnimatePresence initial={false}>
          {canForm && (
            <motion.form
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              onSubmit={submit}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-2">
                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Company (e.g. TCS)"
                  className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Drive description (e.g. TCS National Qualifier — off-campus, Slot 2)"
                  rows={2}
                  className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                {error && <p className="text-xs font-semibold text-rose-600">{error}</p>}
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-indigo-500"
                  >
                    {active ? 'Update drive' : 'Save drive'}
                  </button>
                  {active && (
                    <button
                      type="button"
                      onClick={cancel}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-semibold text-zinc-600 hover:bg-zinc-50"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="rounded-2xl border border-zinc-200/80 bg-white p-4 shadow-sm">
        <h2 className="text-sm font-bold text-zinc-900">Tagged drives</h2>
        {state.drives.length === 0 ? (
          <p className="mt-2 text-xs text-zinc-400">No placement drives tagged yet.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {state.drives.map((drive) => (
              <li key={drive.id} className="rounded-xl border border-zinc-200/70 bg-zinc-50/60 p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-zinc-900">{drive.company}</p>
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-bold text-indigo-700">
                    {drive.rowIds.length} hr{drive.rowIds.length === 1 ? '' : 's'}
                  </span>
                </div>
                <p className="mt-1 text-xs leading-relaxed text-zinc-600">{drive.description}</p>
                <div className="mt-2 flex gap-3 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => startEdit(drive.id)}
                    className="text-indigo-600 hover:underline"
                  >
                    Edit hours
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'DELETE_DRIVE', id: drive.id })}
                    className="text-rose-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
