/**
 * recharts is DOM-only and crashes React Native. It must never be imported
 * outside of *.web.ts(x) modules, which Metro keeps out of native bundles via
 * platform extension resolution. This test fails the suite if a shared (native)
 * source file ever pulls it back in.
 */
import * as fs from "fs";
import * as path from "path";

const sourceRoot = path.resolve(process.cwd(), "src");
const rechartsImport =
  /\bfrom\s+['"]recharts(?:\/[^'"]*)?['"]|\brequire\s*\(\s*['"]recharts(?:\/[^'"]*)?['"]\s*\)/;

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

describe("recharts guard", () => {
  it("imports recharts only from web-only modules", () => {
    const violations = sourceFiles(sourceRoot).filter(
      (filePath) =>
        !/\.web\.[jt]sx?$/.test(path.basename(filePath)) &&
        rechartsImport.test(fs.readFileSync(filePath, "utf8")),
    );
    expect(violations).toEqual([]);
  });
});
