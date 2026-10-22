import { readFileSync, readdirSync, statSync } from 'node:fs';
import { basename, join, relative } from 'node:path';

interface Violation {
  file: string;
  rule: string;
  remediation: string;
}

const violations: Violation[] = [];
const ROOT = join(process.cwd(), 'src');

function scanDir(dir: string): string[] {
  let results: string[] = [];
  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      const stat = statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(scanDir(fullPath));
      } else if (entry.endsWith('.ts') || entry.endsWith('.tsx')) {
        results.push(fullPath);
      }
    }
  } catch {
    // Directory might not exist yet
  }
  return results;
}

const allFiles = scanDir(ROOT);

for (const file of allFiles) {
  const relPath = relative(process.cwd(), file).replace(/\\/g, '/');
  const filename = basename(file);

  // Invariant: Banned filename utils.ts
  if (filename === 'utils.ts' || filename === 'utils.tsx') {
    violations.push({
      file: relPath,
      rule: 'BANNED_FILENAME: The filename utils.ts is strictly prohibited.',
      remediation:
        'Categorize into shared/kernel, shared/calc, shared/ui, or a named utility like cn.util.ts.',
    });
  }

  // Invariant: No barrel index.ts in feature roots or shared roots
  if (
    filename === 'index.ts' &&
    (relPath.startsWith('src/features/') || relPath.startsWith('src/shared/')) &&
    relPath.split('/').length <= 4
  ) {
    violations.push({
      file: relPath,
      rule: 'BANNED_BARREL: Root index.ts barrel files are prohibited.',
      remediation: 'Import directly from subpaths (e.g. @/shared/kernel/result).',
    });
  }

  // Invariant: No .tsx in server/ or db/
  if (file.endsWith('.tsx') && (relPath.includes('src/server/') || relPath.includes('/db/'))) {
    violations.push({
      file: relPath,
      rule: 'NO_UI_IN_SERVER: React .tsx files are strictly forbidden in server/ or db/ folders.',
      remediation: 'Move React components to components/ or src/app/.',
    });
  }

  // Invariant: No .tsx in .service.ts, .repo.ts, .schema.ts, or .api.ts
  if (
    file.endsWith('.tsx') &&
    (relPath.includes('.service.') ||
      relPath.includes('.repo.') ||
      relPath.includes('.schema.') ||
      relPath.includes('.api.'))
  ) {
    violations.push({
      file: relPath,
      rule: 'NO_TSX_IN_BACKEND: Backend slice files must be .ts only, not .tsx.',
      remediation: 'Rename to .ts and remove React JSX elements.',
    });
  }

  // Check file import content
  const content = readFileSync(file, 'utf-8');
  const importLines = content.split('\n').filter((l) => l.trim().startsWith('import '));

  for (const line of importLines) {
    // Invariant: Zero feature imports allowed inside shared/
    if (relPath.startsWith('src/shared/') && line.includes('@/features/')) {
      violations.push({
        file: relPath,
        rule: 'LAYER_VIOLATION: shared/ cannot import from features/.',
        remediation: 'Keep shared/ infrastructure free of domain dependencies.',
      });
    }

    // Invariant: shared/kernel must have 0 external/framework dependencies
    if (
      relPath.startsWith('src/shared/kernel/') &&
      (line.includes('@prisma') ||
        line.includes('react') ||
        line.includes('@/server') ||
        line.includes('@/features'))
    ) {
      violations.push({
        file: relPath,
        rule: 'KERNEL_ISOLATION: shared/kernel must be zero-dependency pure types.',
        remediation: 'Remove external framework or server imports from shared/kernel.',
      });
    }

    // Invariant: components cannot directly import server/db or @prisma/client
    if (
      (relPath.includes('/components/') || relPath.startsWith('src/app/')) &&
      (line.includes('@/server/db') || line.includes('@prisma/client'))
    ) {
      violations.push({
        file: relPath,
        rule: 'UI_DB_COUPLING: UI components cannot import database clients directly.',
        remediation:
          'Delegate database queries to Server Actions (.api.ts) or Services (.service.ts).',
      });
    }

    // Invariant: services cannot directly import @prisma/client (delegate to repo)
    if (
      relPath.endsWith('.service.ts') &&
      line.includes('@prisma/client') &&
      !line.includes('type ')
    ) {
      violations.push({
        file: relPath,
        rule: 'REPO_SERVICE_SPLIT: Services must delegate DB queries to .repo.ts.',
        remediation: 'Move raw database operations into <domain>.repo.ts.',
      });
    }

    // Invariant: server/ cannot import UI components or styling
    if (
      relPath.startsWith('src/server/') &&
      line.includes('@/features/') &&
      line.includes('/components/')
    ) {
      violations.push({
        file: relPath,
        rule: 'SERVER_UI_COUPLING: server/ cannot import UI components.',
        remediation: 'Decouple server infrastructure from presentation components.',
      });
    }
  }
}

if (violations.length > 0) {
  console.error(`❌ Architecture Check Failed with ${violations.length} violation(s):\n`);
  for (const v of violations) {
    console.error(`File: ${v.file}`);
    console.error(`Rule: ${v.rule}`);
    console.error(`Remediation: ${v.remediation}\n`);
  }
  process.exit(1);
} else {
  console.log(
    `✅ Architecture Check Passed: All layer boundaries intact across ${allFiles.length} files.`,
  );
}
