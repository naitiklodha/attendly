import { describe, expect, it } from 'vitest';
import { ensureReadableStreamAsyncIterator } from '../lib/pdfText';

describe('ensureReadableStreamAsyncIterator', () => {
  it('adds reader-based async iteration when the platform lacks it', async () => {
    const prototype = ReadableStream.prototype;
    const iteratorDescriptor = Object.getOwnPropertyDescriptor(prototype, Symbol.asyncIterator);
    Object.defineProperty(prototype, Symbol.asyncIterator, {
      configurable: true,
      value: undefined,
    });

    try {
      ensureReadableStreamAsyncIterator();
      const stream = new ReadableStream<number>({
        start(controller) {
          controller.enqueue(1);
          controller.enqueue(2);
          controller.close();
        },
      });
      const values: number[] = [];
      for await (const value of stream as unknown as AsyncIterable<number>) values.push(value);
      expect(values).toEqual([1, 2]);
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
