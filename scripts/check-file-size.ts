import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';

const MAX_LINES = 400;
const SCAN_DIR = join(process.cwd(), 'src');

function getFiles(dir: string): string[] {
  let results: string[] = [];
  if (!readdirSync) return results;
  try {
    const list = readdirSync(dir);
    for (const file of list) {
      const fullPath = join(dir, file);
      const stat = statSync(fullPath);
      if (stat?.isDirectory()) {
        results = results.concat(getFiles(fullPath));
      } else if (file.endsWith('.ts') || file.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist yet
  }
  return results;
}

const files = getFiles(SCAN_DIR);
let failed = false;

for (const file of files) {
  const content = readFileSync(file, 'utf-8');
  const lines = content.split('\n').length;
  if (lines > MAX_LINES) {
    console.error(`❌ File size violation: ${file} has ${lines} lines (max ${MAX_LINES})`);
    failed = true;
  }
}

if (failed) {
  process.exit(1);
} else {
  console.log(`✅ All ${files.length} scanned files under ${MAX_LINES} lines.`);
}
