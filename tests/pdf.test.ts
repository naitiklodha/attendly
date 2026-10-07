import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { ensureReadableStreamAsyncIterator, extractLines } from '../lib/pdfText';

const PDF = path.join(process.cwd(), 'ZSVKM_STUDENT_ATTENDANCE_COPY.pdf');

it('sample PDF is committed', () => {
  expect(existsSync(PDF)).toBe(true);
});

describe.runIf(existsSync(PDF))('extractLines (live sample PDF)', () => {
  it('reconstructs visual rows in column order', async () => {
    const lines = await extractLines(new Uint8Array(readFileSync(PDF)));
    expect(lines.length).toBeGreaterThan(150);
    expect(lines).toContain(
      '1 Cloud ComputingP1 BTI Comp B1 Jul 13, 2026 10:00:01 AM 11:00:00 AM P',
    );
    expect(
      lines.some((l) => l.startsWith('Student Name') && l.includes('NAITIK LODHA')),
    ).toBe(true);
    expect(lines.some((l) => /^166 /.test(l) && l.endsWith('NU'))).toBe(true);
    const ids = lines
      .filter((l) => /^\d+ .* (P|A|E|L|NU)$/.test(l))
      .map((l) => Number.parseInt(l, 10))
      .sort((a, b) => a - b);
    expect(ids).toEqual(Array.from({ length: 166 }, (_, i) => i + 1));
  });

  it('extracts text when ReadableStream lacks async iteration', async () => {
    const prototype = ReadableStream.prototype;
    const iteratorDescriptor = Object.getOwnPropertyDescriptor(prototype, Symbol.asyncIterator);
    Object.defineProperty(prototype, Symbol.asyncIterator, {
      configurable: true,
      value: undefined,
    });

    try {
      ensureReadableStreamAsyncIterator();
      const lines = await extractLines(new Uint8Array(readFileSync(PDF)));
      expect(lines.length).toBeGreaterThan(150);
    } finally {
      if (iteratorDescriptor) {
        Object.defineProperty(prototype, Symbol.asyncIterator, iteratorDescriptor);
      } else {
        const asyncIterablePrototype = prototype as ReadableStream<unknown> & {
          [Symbol.asyncIterator]?: AsyncIterator<unknown>;
        };
        delete asyncIterablePrototype[Symbol.asyncIterator];
      }
    }
  });
});
