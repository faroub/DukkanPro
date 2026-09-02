import * as fs from 'fs';
import * as path from 'path';

// Use the project root directory
const PROJECT_ROOT = '/home/faroub/Documents/Projects/DukkanOS/DukkanOS';
const SRC_APP_DIR = path.resolve(PROJECT_ROOT, 'src/app');
const FORBIDDEN_DIRS = [
  'components',
  'hooks',
  'services',
  'repositories',
  'types',
  'utils',
  'constants',
  'stores',
];

const FORBIDDEN_FILE_PATTERNS = [
  /\.test\.tsx?$/,
  /\.spec\.tsx?$/,
  '/__tests__/',
];

interface Violation {
  file: string;
  reason: string;
}

function isForbiddenFile(filePath: string): boolean {
  const normalized = path.normalize(filePath);

  // Check for test/spec files
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(normalized)) {
      return true;
    }
  }

  // Check if any component of the path is a forbidden directory
  const parts = path.normalize(filePath).split(path.sep);
  for (let i = 0; i < parts.length; i++) {
    const dir = parts[i];
    if (FORBIDDEN_DIRS.includes(dir)) {
      return true;
    }
  }

  return false;
}

function main(): void {
  const violations: Violation[] = [];

  // Read all files recursively in src/app
  function walkDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Recurse into directories
        walkDir(fullPath);
      } else if (entry.isFile()) {
        // Check file paths
        if (isForbiddenFile(fullPath)) {
          // Determine the reason
          const relPath = path.relative(SRC_APP_DIR, fullPath);
          let reason = 'File inside src/app/';

          if (FORBIDDEN_FILE_PATTERNS.some(p => p.test(fullPath))) {
            reason = 'Test/spec file inside src/app/ - should be in a __tests__ directory or separate';
          } else {
            reason = `Found ${path.basename(entry.name)} inside src/app/ - route files only`;
          }

          violations.push({
            file: relPath,
            reason,
          });
        }
      }
    }
  }

  walkDir(SRC_APP_DIR);

  if (violations.length > 0) {
    console.error('❌ Architecture violations found in src/app/:');
    console.error('');

    // Group by reason for cleaner output
    const byReason: Record<string, string[]> = {};
    for (const v of violations) {
      if (!byReason[v.reason]) {
        byReason[v.reason] = [];
      }
      byReason[v.reason].push(v.file);
    }

    for (const [reason, files] of Object.entries(byReason)) {
      console.error(`  ${reason}:`);
      for (const file of files) {
        console.error(`    - ${file}`);
      }
    }

    console.error(`\nTotal violations: ${violations.length}`);
    process.exit(1);
  } else {
    console.log('✅ No architecture violations found in src/app/');
    console.log('   All files are valid route or layout files.');
    process.exit(0);
  }
}

main();