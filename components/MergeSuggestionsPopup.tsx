'use client';

import { LayersIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useApp } from '@/lib/store';

interface Props {
  open: boolean;
  suggestions: string[][];
  onClose: () => void;
}

export default function MergeSuggestionsPopup({ open, suggestions, onClose }: Props) {
  const { dispatch } = useApp();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
    >
      <DialogContent className="top-auto bottom-0 left-0 max-h-[90dvh] w-full max-w-none translate-x-0 translate-y-0 overflow-y-auto rounded-b-none p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] lg:top-1/2 lg:bottom-auto lg:left-1/2 lg:max-w-md lg:-translate-x-1/2 lg:-translate-y-1/2 lg:rounded-xl lg:p-6">
        <DialogHeader className="pr-8">
          <DialogTitle>Same subject?</DialogTitle>
          <DialogDescription>
            SAP exported these under different names, so they are being counted separately. Merge
            them into one row — nothing is lost.
          </DialogDescription>
        </DialogHeader>

        <ul className="space-y-3">
          {suggestions.map((group) => (
            <li key={group.join('|')} className="rounded-md border border-hairline bg-surface-2 p-3.5">
              <p className="t-eyebrow text-primary">Looks like the same subject</p>
              <ul className="mt-2 space-y-1">
                {group.map((name) => (
                  <li key={name} className="text-[13px] leading-snug text-ink-muted">
                    {name}
                  </li>
                ))}
              </ul>
              <button
                type="button"
                onClick={() => dispatch({ type: 'MERGE_COURSES', names: group })}
                className="mt-3 inline-flex w-full items-center justify-center gap-1.5 rounded-sm bg-primary px-3 py-2 text-[13px] font-medium text-canvas transition hover:bg-primary-hover"
              >
                <LayersIcon aria-hidden="true" className="size-3.5" />
                Merge
              </button>
            </li>
          ))}
        </ul>

        <button type="button" onClick={onClose} className="btn-secondary w-full">
          Not now
        </button>
      </DialogContent>
    </Dialog>
  );
}
