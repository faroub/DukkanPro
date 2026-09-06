import * as fs from "fs";
import * as path from "path";

const appRoot = path.resolve(process.cwd(), "src/app");
const forbiddenDirectoryNames = new Set([
  "components",
  "hooks",
  "services",
  "repositories",
  "types",
  "utils",
  "constants",
  "stores",
]);

function filesInApp(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...filesInApp(filePath));
    else files.push(filePath);
  }
  return files;
}

describe("route architecture", () => {
  it("contains only route/layout files under src/app", () => {
    const violations = filesInApp(appRoot).filter((filePath) => {
      const relative = path.relative(appRoot, filePath);
      return (
        forbiddenDirectoryNames.has(path.basename(path.dirname(filePath))) ||
        /\.(test|spec)\.[jt]sx?$/.test(relative) ||
        !/\.(tsx?|jsx?)$/.test(filePath)
      );
    });
    expect(violations).toEqual([]);
  });
});
