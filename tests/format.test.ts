import { describe, expect, it } from 'vitest';
import { formatDayLabel, formatPercent, formatReportDate, formatTimeRange } from '../lib/format';

describe('formatReportDate', () => {
  it('renders DD.MM.YYYY', () => {
    expect(formatReportDate('2026-07-13')).toBe('13.07.2026');
    expect(formatReportDate('2026-07-05')).toBe('05.07.2026');
  });
});

describe('formatDayLabel', () => {
  it('renders a friendly weekday label', () => {
    expect(formatDayLabel('2026-07-13')).toBe('Mon, 13 Jul 2026');
  });
});

describe('formatPercent', () => {
  it('always shows two decimals', () => {
    expect(formatPercent(100)).toBe('100.00%');
    expect(formatPercent(64.705882)).toBe('64.71%');
  });
});

describe('formatTimeRange', () => {
  it('joins start and end', () => {
    expect(formatTimeRange('10:00 AM', '11:00 AM')).toBe('10:00 AM – 11:00 AM');
  });
});
