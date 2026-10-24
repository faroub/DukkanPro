import { updateLayoutDirection } from "@/localization/i18n";
import { I18nManager } from "react-native";

describe("RTL and LTR layout direction management", () => {
  let allowRTLSpy: jest.SpyInstance;
  let forceRTLSpy: jest.SpyInstance;

  beforeEach(() => {
    allowRTLSpy = jest.spyOn(I18nManager, "allowRTL").mockImplementation(() => {});
    forceRTLSpy = jest.spyOn(I18nManager, "forceRTL").mockImplementation(() => {});
  });

  afterEach(() => {
    allowRTLSpy.mockRestore();
    forceRTLSpy.mockRestore();
    updateLayoutDirection("fr");
  });

  it("applies RTL layout direction when arabic ('ar') is selected", () => {
    updateLayoutDirection("ar");
    if (typeof document !== "undefined" && document.documentElement) {
      expect(document.documentElement.dir).toBe("rtl");
      expect(document.documentElement.lang).toBe("ar");
    }
    expect(allowRTLSpy).toHaveBeenCalledWith(true);
    expect(forceRTLSpy).toHaveBeenCalledWith(true);
  });

  it("applies LTR layout direction when french ('fr') or english ('en') is selected", () => {
    updateLayoutDirection("fr");
    if (typeof document !== "undefined" && document.documentElement) {
      expect(document.documentElement.dir).toBe("ltr");
      expect(document.documentElement.lang).toBe("fr");
    }
    expect(allowRTLSpy).toHaveBeenCalledWith(false);

    updateLayoutDirection("en");
    if (typeof document !== "undefined" && document.documentElement) {
      expect(document.documentElement.dir).toBe("ltr");
      expect(document.documentElement.lang).toBe("en");
    }
    expect(allowRTLSpy).toHaveBeenCalledWith(false);
  });
});
