import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatPercent, formatReportDate, formatTimeRange } from '../lib/format';

describe('formatReportDate', () => {
  it('renders DD.MM.YYYY', () => {
    expect(formatReportDate('2026-01-12')).toBe('12.01.2026');
    expect(formatReportDate('2026-01-05')).toBe('05.01.2026');
  });
});

describe('formatDayLabel', () => {
  it('renders a friendly weekday label', () => {
    expect(formatDayLabel('2026-01-12')).toBe('Mon, 12 Jan 2026');
  });
});

describe('formatPercent', () => {
  it('always shows two decimals', () => {
    expect(formatPercent(100)).toBe('100.00%');
    expect(formatPercent(13.456789)).toBe('13.46%');
  });
});

describe('formatTimeRange', () => {
  it('joins start and end', () => {
    expect(formatTimeRange('10:00 AM', '11:00 AM')).toBe('10:00 AM – 11:00 AM');
  });
});
