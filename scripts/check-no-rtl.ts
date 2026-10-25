/**
 * Lint check: Ensure no arbitrary global RTL (Right-To-Left) API usage or hardcoded row-reverse layouts.
 *
 * `src/localization/i18n.ts` is the single authorized control site for driving I18nManager.
 * All other source files must NOT call global I18nManager direction setters or hardcode row-reverse.
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
      !entry.name.endsWith(".test.tsx") &&
      !filePath.endsWith(path.join("src", "localization", "i18n.ts"))
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
