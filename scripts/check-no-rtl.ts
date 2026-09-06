/**
 * Lint check: Ensure no RTL (Right-To-Left) API usage in the codebase.
 *
 * This script searches for forbidden global direction APIs and reversed row
 * layout declarations.
 *
 * Fails if any are found, which is the intended behavior for a lint check.
 * Test files in __tests__ directories are excluded from the check.
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const projectRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const sourceRoot = path.join(projectRoot, "src");
const patterns = [
  { name: "forceRTL", pattern: /I18nManager\s*\.\s*forceRTL\s*\(/g },
  { name: "allowRTL", pattern: /I18nManager\s*\.\s*allowRTL\s*\(/g },
  { name: "row-reverse", pattern: /flexDirection\s*:\s*["']row-reverse["']/g },
];

function collectSourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__")
        files.push(...collectSourceFiles(filePath));
      continue;
    }
    if (
      (entry.name.endsWith(".ts") || entry.name.endsWith(".tsx")) &&
      !entry.name.endsWith(".test.ts") &&
      !entry.name.endsWith(".test.tsx")
    ) {
      files.push(filePath);
    }
  }
  return files;
}

const violations: string[] = [];
for (const filePath of collectSourceFiles(sourceRoot)) {
  const content = fs.readFileSync(filePath, "utf8");
  for (const entry of patterns) {
    entry.pattern.lastIndex = 0;
    if (entry.pattern.test(content))
      violations.push(`${entry.name}: ${filePath}`);
  }
}

if (violations.length > 0) {
  console.error("Forbidden global RTL usage found:\n" + violations.join("\n"));
  process.exit(1);
}

console.log("No forbidden global RTL usage found.");
