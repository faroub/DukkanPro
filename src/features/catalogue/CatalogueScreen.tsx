import { ThemedView } from "@/components/themed-view";
import { get as getBusinessProfile } from "@/database/repositories/businessProfileRepository";
import { getAll as getAllProducts } from "@/database/repositories/productRepository";
import { CataloguePreview } from "@/features/catalogue/components/CataloguePreview";
import {
    CatalogueSettings,
    CatalogueSettingsData,
} from "@/features/catalogue/components/CatalogueSettings";
import {
    ProductSelector,
    SelectorProductItem,
} from "@/features/catalogue/components/ProductSelector";
import { useTheme } from "@/hooks/use-theme";
import { CatalogueProduct } from "@/services/catalogue/catalogueService";
import { useRouter } from "expo-router";
import { useEffect, useMemo, useState } from "react";
import { StyleSheet } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

type CatalogueStep = "settings" | "selector" | "preview";

export function CatalogueScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const theme = useTheme();
  const [step, setStep] = useState<CatalogueStep>("settings");

  const [settings, setSettings] = useState<CatalogueSettingsData>({
    showPrices: true,
    hideOutOfStock: true,
    shopName: "",
    contact: "",
    address: "",
    welcomeNote: "",
  });

  const [products, setProducts] = useState<SelectorProductItem[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<Set<number>>(
    new Set(),
  );

  // Load business profile and active products on mount
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        // Load business profile if available
        const profile = await getBusinessProfile();
        if (isMounted && profile?.business_name) {
          setSettings((prev) => ({
            ...prev,
            shopName: profile.business_name || prev.shopName,
            contact: profile.phone_number ?? prev.contact,
            address: profile.address ?? prev.address,
          }));
        }

        // Load active products from DB
        const dbProducts = await getAllProducts({ is_active: true });
        if (isMounted && dbProducts && dbProducts.length > 0) {
          const mapped: SelectorProductItem[] = dbProducts.map((p) => ({
            id: p.id,
            name: p.name,
            category: p.category || "Général",
            price_centimes: p.sale_price_centimes,
            stock: p.stock_quantity,
          }));
          setProducts(mapped);
          setSelectedProductIds(new Set(mapped.map((p) => p.id)));
        }
      } catch {
        // Leave the catalogue empty; the selector shows its empty state.
      }
    }

    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  const handleSettingChange = <K extends keyof CatalogueSettingsData>(
    key: K,
    value: CatalogueSettingsData[K],
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleToggleProduct = (productId: number) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedProductIds(new Set(products.map((p) => p.id)));
  };

  const handleDeselectAll = () => {
    setSelectedProductIds(new Set());
  };

  // Selected products for preview (strictly public data)
  const selectedProductsForPreview: CatalogueProduct[] = useMemo(() => {
    return products
      .filter((p) => selectedProductIds.has(p.id))
      .map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        price_centimes: p.price_centimes,
        stock: p.stock,
      }));
  }, [products, selectedProductIds]);

  return (
    <ThemedView
      style={[
        styles.screen,
        {
          backgroundColor: theme.background,
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
      ]}
      id="catalogue-root"
    >
      {step === "settings" && (
        <CatalogueSettings
          settings={settings}
          onSettingChange={handleSettingChange}
          onProceedToSelector={() => setStep("selector")}
          onBack={() => router.back()}
        />
      )}

      {step === "selector" && (
        <ProductSelector
          products={products}
          selectedProductIds={selectedProductIds}
          onToggleProduct={handleToggleProduct}
          onSelectAll={handleSelectAll}
          onDeselectAll={handleDeselectAll}
          showPrices={settings.showPrices}
          hideOutOfStock={settings.hideOutOfStock}
          onProceedToPreview={() => setStep("preview")}
          onBack={() => setStep("settings")}
        />
      )}

      {step === "preview" && (
        <CataloguePreview
          products={selectedProductsForPreview}
          settings={settings}
          onEditSelection={() => setStep("selector")}
          onBack={() => setStep("selector")}
        />
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
});
