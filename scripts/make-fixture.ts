import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { extractLines } from '../lib/pdfText';

async function main() {
  const pdfPath = path.join(process.cwd(), 'ZSVKM_STUDENT_ATTENDANCE_COPY.pdf');
  const outPath = path.join(process.cwd(), 'tests/fixtures/attendance-lines.json');
  const lines = await extractLines(new Uint8Array(readFileSync(pdfPath)));
  mkdirSync(path.dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(lines, null, 2));
  console.log(`Wrote ${lines.length} lines -> tests/fixtures/attendance-lines.json`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
