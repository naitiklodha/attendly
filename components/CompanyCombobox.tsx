'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { CheckIcon, ChevronsUpDownIcon, PlusIcon } from 'lucide-react';
import { filterCompanySuggestions } from '@/lib/companies';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';

type Props = {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  placeholder?: string;
  id?: string;
};

export default function CompanyCombobox({ value, onChange, options, placeholder, id }: Props) {
  const [open, setOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const suggestions = useMemo(
    () => filterCompanySuggestions(options, value),
    [options, value],
  );
  const query = value.trim().toLowerCase();

  const freeText = query.length > 0 && !options.some((o) => o.toLowerCase() === query);

  useEffect(() => {
    if (!open) return;
    const raf = requestAnimationFrame(() => {
      const el = inputRef.current;
      if (!el) return;
      el.focus();
      el.select();
    });
    return () => cancelAnimationFrame(raf);
  }, [open]);

  const commit = (next: string) => {
    onChange(next.trim());
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button id={id} type="button" className="field flex items-center justify-between gap-2">
          <span className={`truncate ${value ? 'text-ink' : 'text-ink-tertiary'}`}>
            {value || placeholder || 'Select a company'}
          </span>
          <ChevronsUpDownIcon className="h-4 w-4 shrink-0 text-ink-tertiary" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        sideOffset={6}
        onOpenAutoFocus={(e) => e.preventDefault()}
        className="z-[70] w-(--radix-popover-trigger-width) min-w-56 gap-0 overflow-hidden rounded-md p-0 shadow-2xl ring-hairline-strong"
      >
        <Command shouldFilter={false} className="bg-surface-3">
          <CommandInput
            ref={inputRef}
            value={value}
            onValueChange={onChange}
            placeholder={placeholder ?? 'Type a company…'}
            className="text-ink"
          />
          <CommandList>
            <CommandEmpty className="py-4 text-[13px] text-ink-tertiary">
              No matching company.
            </CommandEmpty>
            {freeText && (
              <CommandGroup>
                <CommandItem
                  value={`__use__${query}`}
                  onSelect={() => commit(value)}
                  className="data-selected:bg-primary/15 data-selected:text-ink"
                >
                  <PlusIcon className="text-primary" />
                  <span className="truncate">Use “{value.trim()}”</span>
                </CommandItem>
              </CommandGroup>
            )}
            {suggestions.length > 0 && (
              <CommandGroup heading="Companies">
                {suggestions.map((option) => {
                  const selected = option.toLowerCase() === query;
                  return (
                    <CommandItem
                      key={option}
                      value={option}
                      onSelect={() => commit(option)}
                      className="data-selected:bg-primary/15 data-selected:text-ink"
                    >
                      <span className="truncate">{option}</span>
                      {selected && <CheckIcon className="ml-auto text-primary" />}
                    </CommandItem>
                  );
                })}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
