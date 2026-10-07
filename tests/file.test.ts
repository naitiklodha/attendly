import { afterEach, describe, expect, it, vi } from 'vitest';
import { readFileBytes } from '../lib/file';

const fileBytes = Uint8Array.of(12, 34, 56);

class MockFileReader {
    result: ArrayBuffer | string | null = null;
    error: DOMException | null = null;
    onload: ((this: FileReader, event: ProgressEvent<FileReader>) => unknown) | null = null;
    onerror: ((this: FileReader, event: ProgressEvent<FileReader>) => unknown) | null = null;

    readAsArrayBuffer() {
        this.result = fileBytes.buffer.slice(0);
        this.onload?.call(this as unknown as FileReader, {} as ProgressEvent<FileReader>);
    }
}

afterEach(() => {
    vi.unstubAllGlobals();
});

describe('readFileBytes', () => {
    it('uses FileReader when File.arrayBuffer is unavailable', async () => {
        vi.stubGlobal('FileReader', MockFileReader);
        const file = { arrayBuffer: undefined } as unknown as File;

        await expect(readFileBytes(file)).resolves.toEqual(fileBytes);
    });
});
