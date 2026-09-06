import ar from '../ar';
import en from '../en';
import fr from '../fr';

const CATALOGUE_SECTION = 'catalogue';

describe('Catalogue Privacy', () => {
  // Verify that catalogue section exists in all languages (same as translations.test.ts)
  it('should have catalogue section in all languages', () => {
    const sections = ['catalogue'];
    for (const section of sections) {
      expect(section in ar).toBe(true);
      expect(section in fr).toBe(true);
      expect(section in en).toBe(true);
    }
  });

  it('should have identical catalogue section keys across all languages', () => {
    const enKeys = Object.keys(en.catalogue || {}).sort();
    const arKeys = Object.keys(ar.catalogue || {}).sort();
    const frKeys = Object.keys(fr.catalogue || {}).sort();

    expect(enKeys).toEqual(arKeys);
    expect(enKeys).toEqual(frKeys);
  });

  it('should not expose customer data in catalogue keys', () => {
    const allKeys = [
      ...Object.keys(en.catalogue || {}),
      ...Object.keys(ar.catalogue || {}),
      ...Object.keys(fr.catalogue || {}),
    ];
    const privateKeys = allKeys.filter((k: string) =>
      ['customer', 'debt', 'profit', 'cost'].some(prefix => k.includes(prefix))
    );
    expect(privateKeys).toHaveLength(0);
  });
});