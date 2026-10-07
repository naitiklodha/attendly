'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import { loadCompanies, refreshCompanies, rememberCompany } from '@/lib/companies';
import CompanyCombobox from '@/components/CompanyCombobox';

export default function DrivesPanel() {
  const { state, dispatch } = useApp();
  const editing = state.drives.find((d) => d.id === state.editingDriveId) ?? null;
  const [company, setCompany] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [companies, setCompanies] = useState<string[]>(loadCompanies);

  useEffect(() => {
    let cancelled = false;
    refreshCompanies().then((list) => {
      if (!cancelled) setCompanies(list);
    });
    return () => {
      cancelled = true;
    };
  }, []);


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
    if (!company.trim()) {
      setError('Company is required.');
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
    rememberCompany(company);
    setCompanies((prev) =>
      prev.some((c) => c.toLowerCase() === company.trim().toLowerCase()) ? prev : [...prev, company.trim()],
    );
    setCompany('');
    setDescription('');
    setError(null);
  };

  return (
    <section className="panel overflow-hidden">
      <div className="p-5">
        <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-ink">
          {active ? `Edit drive — ${active.company}` : 'New drive'}
        </h2>
        <p className="mt-0.5 text-[12px] text-ink-tertiary">
          {active || state.selection.length > 0
            ? `${state.selection.length} hour${state.selection.length === 1 ? '' : 's'} selected`
            : 'Tick hours in the list to open the form.'}
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
              <div className="mt-4 space-y-2.5">
                <CompanyCombobox
                  value={company}
                  onChange={setCompany}
                  options={companies}
                  placeholder="Company (e.g. TCS)"
                />
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description (optional, e.g. TCS National Qualifier — Slot 2)"
                  rows={2}
                  className="field resize-none"
                />
                {error && (
                  <p className="text-[13px] font-medium text-[#e06c75]">{error}</p>
                )}
                <div className="flex gap-2">
                  <button type="submit" className="btn-primary flex-1">
                    {active ? 'Update drive' : 'Save drive'}
                  </button>
                  {active && (
                    <button type="button" onClick={cancel} className="btn-secondary">
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      <div className="border-t border-hairline p-5">
        <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-ink">Saved drives</h2>
        {state.drives.length === 0 ? (
          <p className="mt-3 text-[13px] text-ink-tertiary">No drives saved yet.</p>
        ) : (
          <ul className="mt-2 divide-y divide-hairline/70">
            {state.drives.map((drive) => (
              <li key={drive.id} className="py-3 first:pt-2 last:pb-0">
                <div className="flex items-baseline justify-between gap-2">
                  <p className="text-[14px] font-medium text-ink">{drive.company}</p>
                  <span className="shrink-0 font-mono text-[12px] tabular-nums text-ink-subtle">
                    {drive.rowIds.length} hr{drive.rowIds.length === 1 ? '' : 's'}
                  </span>
                </div>
                {drive.description && (
                  <p className="mt-0.5 text-[13px] leading-relaxed text-ink-tertiary">
                    {drive.description}
                  </p>
                )}
                <div className="mt-2 flex gap-4 text-[13px] font-medium">
                  <button
                    type="button"
                    onClick={() => startEdit(drive.id)}
                    className="text-primary transition hover:text-primary-hover"
                  >
                    Edit hours
                  </button>
                  <button
                    type="button"
                    onClick={() => dispatch({ type: 'DELETE_DRIVE', id: drive.id })}
                    className="text-ink-tertiary transition hover:text-[#e06c75]"
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
