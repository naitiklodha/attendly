import { describe, expect, it } from 'vitest';
import {
  DEFAULT_COMPANIES,
  filterCompanySuggestions,
  loadCompanies,
  mergeCompanies,
  parseCompanyCsv,
} from '../lib/companies';

describe('parseCompanyCsv', () => {
  it('reads a single-column list', () => {
    expect(parseCompanyCsv('TCS\nInfosys\nWipro')).toEqual(['TCS', 'Infosys', 'Wipro']);
  });
  it('strips a Company header row', () => {
    expect(parseCompanyCsv('Company\nTCS\nLxme')).toEqual(['TCS', 'Lxme']);
  });
  it('ignores blank lines and surrounding whitespace', () => {
    expect(parseCompanyCsv(' TCS \n\n\n  Lxme  \n')).toEqual(['TCS', 'Lxme']);
  });
  it('handles quoted fields with commas', () => {
    expect(parseCompanyCsv('"KVAT & Co",extra\n"Marsh",extra')).toEqual(['KVAT & Co', 'Marsh']);
  });
  it('handles escaped quotes and CRLF line endings', () => {
    expect(parseCompanyCsv('"He said ""hi"""\r\nTCS')).toEqual(['He said "hi"', 'TCS']);
  });
  it('reads the first column when extra columns are present', () => {
    expect(parseCompanyCsv('Company,Location\nQuantiphi,Mumbai\nJio Games,Remote')).toEqual([
      'Quantiphi',
      'Jio Games',
    ]);
  });
  it('returns an empty list for empty input', () => {
    expect(parseCompanyCsv('')).toEqual([]);
    expect(parseCompanyCsv('Company')).toEqual([]);
  });
});

describe('mergeCompanies', () => {
  it('deduplicates case-insensitively keeping the first spelling seen', () => {
    expect(mergeCompanies(['TCS'], ['tcs', 'Infosys'])).toEqual(['Infosys', 'TCS']);
  });
  it('drops empty entries', () => {
    expect(mergeCompanies(['', '  ', 'TCS'])).toEqual(['TCS']);
  });
  it('sorts the combined list', () => {
    expect(mergeCompanies(['Wipro'], ['Infosys'])).toEqual(['Infosys', 'Wipro']);
  });
});

describe('filterCompanySuggestions', () => {
  it('keeps every matching company available to the scrollable list', () => {
    expect(filterCompanySuggestions(DEFAULT_COMPANIES, '')).toEqual(
      [...DEFAULT_COMPANIES].sort((a, b) => a.localeCompare(b)),
    );
  });

  it('filters case-insensitively and excludes the exact current value', () => {
    expect(filterCompanySuggestions(['TCS', 'tcs Digital', 'Infosys'], 'tcs')).toEqual([
      'tcs Digital',
    ]);
  });
});

describe('loadCompanies', () => {
  it('falls back to the built-in defaults when storage is unavailable', () => {
    expect(loadCompanies()).toEqual([...DEFAULT_COMPANIES].sort((a, b) => a.localeCompare(b)));
  });
});
