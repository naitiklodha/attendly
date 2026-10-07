import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist/legacy/build/pdf.mjs';

if (typeof Promise.withResolvers !== 'function') {
  const P = Promise as unknown as {
    withResolvers: <T>() => {
      promise: Promise<T>;
      resolve: (value: T | PromiseLike<T>) => void;
      reject: (reason?: unknown) => void;
    };
  };
  P.withResolvers = <T>() => {
    let resolve!: (value: T | PromiseLike<T>) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise<T>((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

if (typeof window !== 'undefined') {
  GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

const Y_TOLERANCE = 2;

interface Point {
  x: number;
  y: number;
  s: string;
}

export async function extractLines(pdfBytes: Uint8Array): Promise<string[]> {
  const task = getDocument({ data: pdfBytes });
  const doc = await task.promise;
  const lines: string[] = [];
  try {
    for (let p = 1; p <= doc.numPages; p++) {
      const page = await doc.getPage(p);
      const content = await page.getTextContent();

      const pts: Point[] = [];
      for (const item of content.items) {
        if (!('str' in item) || !('transform' in item)) continue;
        pts.push({ y: item.transform[5], x: item.transform[4], s: item.str });
      }
      pts.sort((a, b) => b.y - a.y || a.x - b.x);

      let group: Point[] = [];
      let groupY: number | null = null;
      const flush = () => {
        if (group.length > 0) {
          group.sort((a, b) => a.x - b.x);
          const text = group
            .map((pt) => pt.s)
            .join(' ')
            .replace(/\s+/g, ' ')
            .trim();
          if (text) lines.push(text);
        }
        group = [];
      };

      for (const pt of pts) {
        if (groupY === null || Math.abs(pt.y - groupY) <= Y_TOLERANCE) {
          groupY = groupY === null ? pt.y : (groupY * group.length + pt.y) / (group.length + 1);
          group.push(pt);
        } else {
          flush();
          groupY = pt.y;
          group.push(pt);
        }
      }
      flush();
      page.cleanup();
    }
  } finally {
    await task.destroy();
  }
  return lines;
}
