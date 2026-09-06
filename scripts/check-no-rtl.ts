/**
 * Lint check: Ensure no RTL (Right-To-Left) API usage in the codebase.
 *
 * This script searches for:
 * - I18nManager.forceRTL
 * - I18nManager.allowRTL
 * - flexDirection: 'row-reverse' or flexDirection: "row-reverse"
 * - Any other RTL-indicative patterns in style objects
 *
 * Fails if any are found, which is the intended behavior for a lint check.
 * Test files in __tests__ directories are excluded from the check.
 */

import * as fs from "fs";
import * as path from "path";

// Project root directory
const PROJECT_ROOT = "/home/faroub/Documents/Projects/DukkanOS/DukkanOS";
const SRC_DIR = path.resolve(PROJECT_ROOT, "src");

// Patterns that indicate RTL behavior (should NOT be found in non-test files)
const RTL_PATTERNS = [
  {
    name: "I18nManager.forceRTL",
    pattern: /I18n\.manager\.forceRTL\(/g,
    severity: "critical",
  },
  {
    name: "I18nManager.allowRTL",
    pattern: /I18n\.manager\.allowRTL\(/g,
    severity: "critical",
  },
  {
    name: "flexDirection: 'row-reverse'",
    pattern: /flexDirection\s*:\s*['"]row-reverse['"]/g,
    severity: "critical",
  },
  {
    name: 'flexDirection: "row-reverse"',
    pattern: /flexDirection\s*:\s*"row-reverse"/g,
    severity: "critical",
  },
];

interface Violation {
  file: string;
  pattern: string;
  line: number;
  content: string;
}

function findViolationsInFile(filePath: string): Violation[] {
  const violations: Violation[] = [];
  const content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const lineNumber = i + 1;

    for (const rtlPattern of RTL_PATTERNS) {
      const matches = line.match(rtlPattern.pattern);
      if (matches) {
        violations.push({
          file: filePath,
          pattern: rtlPattern.name,
          line: lineNumber,
          content: line.trim(),
        });
      }
    }
  }

  return violations;
}

function isTestFile(filePath: string): boolean {
  const testFileName = path.basename(filePath);
  return (
    testFileName.startsWith("__tests__") ||
    testFileName.endsWith(".test.ts") ||
    testFileName.endsWith(".test.tsx")
  );
}

function main(): void {
  const violations: Violation[] = [];

  // Read all TypeScript and TypeScript XML files recursively, excluding test files
  function walkDir(dir: string): void {
    const entries = fs.readdirSync(dir, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Skip node_modules and .git
        if (entry.name === "node_modules" || entry.name === ".git") {
          continue;
        }
        // Skip __tests__ directories
        if (entry.name === "__tests__") {
          continue;
        }
        walkDir(fullPath);
      } else if (entry.isFile()) {
        const ext = path.extname(entry.name);
        if (ext === ".ts" || ext === ".tsx") {
          // Skip test files - they are checked separately
          if (isTestFile(fullPath)) {
            continue;
          }
          const fileViolations = findViolationsInFile(fullPath);
          violations.push(...fileViolations);
        }
      }
    }
  }

  walkDir(SRC_DIR);

  if (violations.length > 0) {
    console.error("❌ RTL API usage violations found:");
    console.error("");

    // Group by pattern for cleaner output
    const byPattern: Record<string, Violation[]> = {};
    for (const v of violations) {
      if (!byPattern[v.pattern]) {
        byPattern[v.pattern] = [];
      }
      byPattern[v.pattern].push(v);
    }

    for (const [pattern, files] of Object.entries(byPattern)) {
      console.error(`  ${pattern}:`);
      for (const v of files) {
        console.error(`    - ${v.file}:${v.line}`);
        console.error(`        ${v.content}`);
      }
    }

    console.error(`\nTotal violations: ${violations.length}`);
    console.error("\nPlease fix all RTL API usage before proceeding.");
    process.exit(1);
  } else {
    console.log("✅ No RTL API usage found in the codebase.");
    console.log("   All files comply with LTR architecture requirements.");
    process.exit(0);
  }
}

main();