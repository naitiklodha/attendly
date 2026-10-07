'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { PlusIcon } from 'lucide-react';
import { useApp } from '@/lib/store';
import { loadCompanies, refreshCompanies, rememberCompany } from '@/lib/companies';
import CompanyCombobox from '@/components/CompanyCombobox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

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

  const openNewDrive = () => {
    setCompany('');
    setDescription('');
    setError(null);
    dispatch({ type: 'OPEN_NEW_DRIVE' });
  };

  const closeNewDrive = () => {
    setCompany('');
    setDescription('');
    setError(null);
    dispatch({ type: 'CLOSE_NEW_DRIVE' });
  };

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

  const cancelForm = active ? cancel : closeNewDrive;

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

  const driveForm = (
    <form onSubmit={submit} className="space-y-2.5">
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
      {error && <p className="text-[13px] font-medium text-[#e06c75]">{error}</p>}
      <div className="flex gap-2 pt-1">
        <button type="button" onClick={cancelForm} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" className="btn-primary flex-1">
          {active ? 'Update drive' : 'Save and assign drive'}
        </button>
      </div>
    </form>
  );

  return (
    <section className="panel overflow-hidden">
      {active ? (
        <div className="p-5">
          <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-ink">
            Edit drive — {active.company}
          </h2>
          <p aria-live="polite" className="mt-1 text-[13px] font-medium text-primary">
            {state.selection.length} hour{state.selection.length === 1 ? '' : 's'} selected
          </p>
          <div className="mt-4">{driveForm}</div>
        </div>
      ) : (
        <div className="hidden p-5 lg:block">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-[14px] font-semibold tracking-[-0.2px] text-ink">
                New drive
              </h2>
              <p aria-live="polite" className="mt-1 text-[12px] text-ink-tertiary">
                {state.selection.length > 0
                  ? `${state.selection.length} hour${state.selection.length === 1 ? '' : 's'} selected · attendance preview updated`
                  : 'Select absent hours to create and assign a drive.'}
              </p>
            </div>
            <button
              type="button"
              onClick={openNewDrive}
              disabled={state.selection.length === 0}
              className="btn-primary shrink-0 gap-1.5 px-3 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <PlusIcon aria-hidden="true" className="size-4" />
              New drive
            </button>
          </div>
        </div>
      )}

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

      <Dialog
        open={!active && state.newDriveOpen}
        onOpenChange={(open) => {
          if (!open) closeNewDrive();
        }}
      >
        <DialogContent className="top-auto bottom-0 left-0 max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:max-w-none lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl lg:p-6">
          <DialogHeader className="pr-8">
            <DialogTitle>New placement drive</DialogTitle>
            <DialogDescription>
              Assign {state.selection.length} selected hour
              {state.selection.length === 1 ? '' : 's'} to a new drive. Attendance preview is
              already updated.
            </DialogDescription>
          </DialogHeader>
          {driveForm}
        </DialogContent>
      </Dialog>
    </section>
  );
}
