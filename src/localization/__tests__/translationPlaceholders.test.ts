import ar from "@/localization/ar";
import en from "@/localization/en";
import fr from "@/localization/fr";

function placeholders(value: unknown): string[] {
  if (typeof value !== "string") return [];
  return [...value.matchAll(/\{\{?\s*([\w.]+)\s*\}?\}/g)]
    .map((match) => match[1])
    .sort();
}

function flatten(value: unknown, prefix = ""): Record<string, unknown> {
  if (!value || typeof value !== "object") return { [prefix]: value };
  return Object.entries(value).reduce<Record<string, unknown>>(
    (result, [key, child]) => {
      Object.assign(result, flatten(child, prefix ? `${prefix}.${key}` : key));
      return result;
    },
    {},
  );
}

describe("translation interpolation placeholders", () => {
  it("keeps placeholders identical across Arabic, French, and English", () => {
    const languages = [flatten(ar), flatten(fr), flatten(en)];
    const keys = Object.keys(languages[0]).filter(
      (key) => typeof languages[0][key] === "string",
    );

    for (const key of keys) {
      expect(placeholders(languages[1][key])).toEqual(
        placeholders(languages[0][key]),
      );
      expect(placeholders(languages[2][key])).toEqual(
        placeholders(languages[0][key]),
      );
    }
  });
});
