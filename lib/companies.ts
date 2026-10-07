const REMEMBERED_KEY = 'attcalc:v1:companies';
const SHEET_CACHE_KEY = 'attcalc:v1:companies:sheet';
const MAX_REMEMBERED = 300;

export const DEFAULT_COMPANIES = [
  'byteeIT',
  'Capgemini',
  'Jio Games',
  'KVAT & Co',
  'Lxme',
  'Marsh',
  'Morgan Stanley',
  'Quantiphi',
];

export const SHEET_URL = process.env.NEXT_PUBLIC_COMPANY_SHEET_URL ?? '';

function store(): Storage | null {
  try {
    if (typeof window === 'undefined') return null;
    return window.localStorage;
  } catch {
    return null;
  }
}

function readList(key: string): string[] {
  const raw = store()?.getItem(key);
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === 'string') : [];
  } catch {
    return [];
  }
}

function writeList(key: string, value: string[]): void {
  try {
    store()?.setItem(key, JSON.stringify(value));
  } catch {
    /* storage full or unavailable — the list just does not persist */
  }
}

export function rememberedCompanies(): string[] {
  return readList(REMEMBERED_KEY);
}

export function rememberCompany(name: string): void {
  const trimmed = name.trim();
  if (!trimmed) return;
  const key = trimmed.toLowerCase();
  const next = [trimmed, ...rememberedCompanies().filter((c) => c.toLowerCase() !== key)];
  writeList(REMEMBERED_KEY, next.slice(0, MAX_REMEMBERED));
}

export function parseCompanyCsv(text: string): string[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let quoted = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        field += ch;
      }
      continue;
    }
    if (ch === '"') quoted = true;
    else if (ch === ',') {
      row.push(field);
      field = '';
    } else if (ch === '\n') {
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else if (ch !== '\r') {
      field += ch;
    }
  }
  row.push(field);
  rows.push(row);

  const names: string[] = [];
  rows.forEach(([first], index) => {
    const name = (first ?? '').trim();
    if (!name) return;
    if (index === 0 && /^(company|companies|company name|employer|employers|name|firm|firms)$/i.test(name)) {
      return;
    }
    names.push(name);
  });
  return names;
}

export function mergeCompanies(...lists: string[][]): string[] {
  const seen = new Map<string, string>();
  for (const list of lists) {
    for (const raw of list) {
      const name = raw.trim();
      if (!name) continue;
      const key = name.toLowerCase();
      if (!seen.has(key)) seen.set(key, name);
    }
  }
  return [...seen.values()].sort((a, b) => a.localeCompare(b));
}

export function loadCompanies(): string[] {
  return mergeCompanies(readList(SHEET_CACHE_KEY), rememberedCompanies(), DEFAULT_COMPANIES);
}

export async function fetchSheetCompanies(): Promise<string[]> {
  if (!SHEET_URL) return [];
  try {
    const res = await fetch(SHEET_URL, { cache: 'no-store' });
    if (!res.ok) return [];
    const names = parseCompanyCsv(await res.text());
    if (names.length === 0) return [];
    writeList(SHEET_CACHE_KEY, names);
    return names;
  } catch {
    return [];
  }
}

export async function refreshCompanies(): Promise<string[]> {
  const sheet = await fetchSheetCompanies();
  return sheet.length > 0 ? mergeCompanies(sheet, rememberedCompanies(), DEFAULT_COMPANIES) : loadCompanies();
}
