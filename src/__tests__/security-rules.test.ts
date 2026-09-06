import * as fs from "fs";
import * as path from "path";

const sourceRoot = path.resolve(process.cwd(), "src");

function readFiles(directory: string): string[] {
  const files: string[] = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...readFiles(filePath));
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(filePath);
  }
  return files;
}

describe("security business rules", () => {
  it("keeps destructive sale operations guarded against repeated mutation", () => {
    const saleRepository = fs.readFileSync(
      path.join(sourceRoot, "database/repositories/saleRepository.ts"),
      "utf8",
    );
    expect(saleRepository).toContain('status !== "completed"');
    expect(saleRepository).toContain("cannot cancel");
    expect(saleRepository).toContain("cannot return");
  });

  it("requires exact business-name confirmation before data reset", () => {
    const resetScreen = fs.readFileSync(
      path.join(sourceRoot, "features/settings/DataResetScreen.tsx"),
      "utf8",
    );
    expect(resetScreen).toContain(
      "businessNameInput.trim() !== expectedBusinessName",
    );
    expect(resetScreen).toContain("Alert.alert");
  });

  it("does not place raw SQL in route files", () => {
    const routeFiles = readFiles(path.join(sourceRoot, "app"));
    for (const filePath of routeFiles) {
      expect(fs.readFileSync(filePath, "utf8")).not.toMatch(
        /\b(SELECT\s+.+\s+FROM|INSERT\s+INTO|UPDATE\s+.+\s+SET|DELETE\s+FROM)\b/i,
      );
    }
  });
});
