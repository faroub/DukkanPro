import * as fs from "fs";
import * as path from "path";

const sourceRoot = path.resolve(process.cwd(), "src");
const patterns = {
  force: /I18nManager\s*\.\s*forceRTL\s*\(/g,
  allow: /I18nManager\s*\.\s*allowRTL\s*\(/g,
  reverse: /flexDirection\s*:\s*["']row-reverse["']/g,
};

function sourceFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name !== "__tests__") files.push(...sourceFiles(filePath));
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

function filesMatching(pattern: RegExp): string[] {
  return sourceFiles(sourceRoot).filter((filePath) => {
    pattern.lastIndex = 0;
    return pattern.test(fs.readFileSync(filePath, "utf8"));
  });
}

describe("LTR architecture", () => {
  it("does not use global RTL APIs or reversed row layout", () => {
    expect(filesMatching(patterns.force)).toEqual([]);
    expect(filesMatching(patterns.allow)).toEqual([]);
    expect(filesMatching(patterns.reverse)).toEqual([]);
  });

  it("keeps layout direction hardcoded to LTR", () => {
    const i18nSetup = fs.readFileSync(
      path.join(sourceRoot, "localization/i18n.ts"),
      "utf8",
    );
    // updateLayoutDirection pins dir="ltr" for every locale, Arabic included —
    // language switching never triggers RTL layout.
    expect(i18nSetup).toContain('document.documentElement.dir = "ltr"');
    expect(i18nSetup).not.toMatch(/forceRTL|allowRTL/);
  });
});
