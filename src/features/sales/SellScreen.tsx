import { SymbolView } from "expo-symbols";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { SearchInput } from "@/components/ui/SearchInput";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { create } from "@/database/repositories/saleRepository";
import { BarcodeScannerModal } from "@/features/sales/components/BarcodeScannerModal";
import { CartList } from "@/features/sales/components/CartList";
import { CheckoutSheet } from "@/features/sales/components/CheckoutSheet";
import { ReceiptPreview } from "@/features/sales/components/ReceiptPreview";
import { ReviewSheet } from "@/features/voice/components/ReviewSheet";
import { VoiceButton } from "@/features/voice/components/VoiceButton";
import { useProducts } from "@/hooks/useProducts";
import {
  AvailableProduct,
  parseSaleCommand,
} from "@/services/voice/voiceSaleParser";
import { useCartStoreHook } from "@/stores/cartStore";
import { Product } from "@/types/entities";
import { formatCentimes } from "@/utils/money";
import { useTranslation } from "react-i18next";

export default function SellScreen() {
  const { t } = useTranslation();
  const { products, loading } = useProducts({ is_active: true });
  const {
    items,
    addItemWithProduct,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    subtotal,
    itemCount,
    discount,
    setDiscount,
    preserveCart,
    setPreserveCart,
  } = useCartStoreHook();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
  const [scannerVisible, setScannerVisible] = useState(false);
  const [sale, setSale] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<
    "cash" | "electronic" | "mixed" | "partial" | "credit"
  >("cash");
  const [note, setNote] = useState<string>("");
  const [customerId, setCustomerId] = useState<number | null>(null);

  // Voice input state
  const [voiceVisible, setVoiceVisible] = useState(false);
  const [voiceCommand, setVoiceCommand] = useState<string>("");
  const [parsedVoice, setParsedVoice] = useState<any | null>(null);
  const [voiceAvailableProducts, setVoiceAvailableProducts] = useState<
    AvailableProduct[]
  >([]);

  useEffect(() => {
    const available = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      price_centimes: p.sale_price_centimes,
      stock: p.stock_quantity,
    }));
    setVoiceAvailableProducts(available);
  }, [products]);

  // Unique categories for filter chips
  const categories = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ["all", ...Array.from(set)];
  }, [products]);

  // Filtered products based on search query and category
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      const matchesCategory =
        selectedCategory === "all" || p.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        p.name.toLowerCase().includes(q) ||
        (p.sku && p.sku.toLowerCase().includes(q));
      return matchesCategory && matchesSearch;
    });
  }, [products, searchQuery, selectedCategory]);

  // Frequent / fast-tap items (first 6 products)
  const frequentProducts = useMemo(() => {
    return products.slice(0, 6);
  }, [products]);

  const handleBarcodeScanned = (code: string) => {
    setScannerVisible(false);
    const match = products.find((p) => p.sku === code);
    if (match) {
      addItemWithProduct(match, 1);
    } else {
      setSearchQuery(code);
    }
  };

  const handleCheckout = useCallback(
    async (details: {
      method: "cash" | "electronic" | "mixed" | "partial" | "credit";
      amountPaid?: number;
      note?: string;
      customerId?: number;
    }) => {
      if (items.length === 0) {
        setErrorState(t("sell.empty_cart"));
        return;
      }

      setIsSaving(true);
      setErrorState(null);

      try {
        const saleInput = {
          customerId: details.customerId,
          paymentMethod: details.method,
          items: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            unitSalePriceCentimes: item.product.sale_price_centimes,
            note: details.note,
          })),
          note: details.note,
          discountCentimes: discount,
        };

        const newSale = await create(saleInput);
        setSale(newSale);
        setReceiptVisible(true);
        setIsSaving(false);

        clearCart();
        setCheckoutVisible(false);
        setPaymentMethod("cash");
        setNote("");
        setCustomerId(null);
      } catch (err: any) {
        console.error("Sale checkout failed", err);
        setErrorState(err?.message || "Failed to process sale");
        setIsSaving(false);
      }
    },
    [items, discount, clearCart, t],
  );

  const getItemCartQty = (productId: number) => {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ThemedView style={styles.container}>
        {/* Header with Search & Barcode Scan */}
        <View style={styles.headerContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <SearchInput
                placeholder="Rechercher produit ou code..."
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>

            <Pressable
              onPress={() => setScannerVisible(true)}
              style={styles.scannerBtn}
              accessibilityLabel="Scanner un code-barres"
            >
              <SymbolView
                name={{
                  ios: "barcode.viewfinder" as any,
                  android: "qr_code_scanner" as any,
                  web: "qr_code_scanner" as any,
                }}
                size={22}
                tintColor={Colors.light.primary}
              />
            </Pressable>
          </View>

          {/* Category Filter Chips */}
          {categories.length > 2 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryChips}
            >
              {categories.map((cat) => {
                const isSelected = selectedCategory === cat;
                return (
                  <Pressable
                    key={cat}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.chip,
                      isSelected && styles.chipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        isSelected && styles.chipTextSelected,
                      ]}
                    >
                      {cat === "all" ? "Tous les articles" : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Frequent Items Carousel (when not searching) */}
        {!searchQuery && frequentProducts.length > 0 && (
          <View style={styles.frequentSection}>
            <View style={styles.sectionHeader}>
              <ThemedText style={styles.sectionTitle}>
                Articles Fréquents
              </ThemedText>
              <ThemedText style={styles.sectionSubtitle}>
                Appuyer pour ajouter
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.frequentList}
            >
              {frequentProducts.map((p) => {
                const qty = getItemCartQty(p.id);
                return (
                  <Pressable
                    key={p.id}
                    onPress={() => addItemWithProduct(p, 1)}
                    style={[styles.frequentCard, qty > 0 && styles.frequentCardInCart]}
                  >
                    <View style={styles.frequentIconBox}>
                      <SymbolView
                        name={{
                          ios: "bag" as any,
                          android: "shopping_bag" as any,
                          web: "shopping_bag" as any,
                        }}
                        size={18}
                        tintColor={Colors.light.primary}
                      />
                      {qty > 0 && (
                        <View style={styles.frequentQtyBadge}>
                          <Text style={styles.frequentQtyBadgeText}>{qty}</Text>
                        </View>
                      )}
                    </View>
                    <ThemedText style={styles.frequentName} numberOfLines={1}>
                      {p.name}
                    </ThemedText>
                    <ThemedText style={styles.frequentPrice}>
                      {formatCentimes(p.sale_price_centimes)}
                    </ThemedText>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Products List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={Colors.light.primary} />
            </View>
          ) : filteredProducts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <SymbolView
                name={{
                  ios: "cart" as any,
                  android: "shopping_cart" as any,
                  web: "shopping_cart" as any,
                }}
                size={48}
                tintColor={Colors.light.textMuted}
              />
              <ThemedText style={styles.emptyTitle}>
                {searchQuery ? "Aucun produit trouvé" : "Catalogue vide"}
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {searchQuery
                  ? `Aucun résultat pour "${searchQuery}"`
                  : "Ajoutez des produits dans l'onglet Catalogue"}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.productsList,
                itemCount > 0 && { paddingBottom: 100 },
              ]}
              renderItem={({ item }: { item: Product }) => {
                const cartQty = getItemCartQty(item.id);
                const isLowStock =
                  item.stock_quantity !== undefined &&
                  item.stock_quantity !== null &&
                  item.minimum_stock_quantity !== undefined &&
                  item.stock_quantity <= item.minimum_stock_quantity;

                return (
                  <View style={styles.productCard}>
                    <View style={styles.productLeft}>
                      <View style={styles.productAvatar}>
                        <Text style={styles.productInitial}>
                          {item.name ? item.name[0].toUpperCase() : "P"}
                        </Text>
                      </View>

                      <View style={styles.productDetails}>
                        <ThemedText style={styles.productName} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <View style={styles.productMeta}>
                          {item.unit && (
                            <Text style={styles.unitText}>{item.unit}</Text>
                          )}
                          {item.stock_quantity !== undefined && (
                            <View
                              style={[
                                styles.stockBadge,
                                isLowStock && styles.stockBadgeLow,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stockBadgeText,
                                  isLowStock && styles.stockBadgeTextLow,
                                ]}
                              >
                                Stock: {item.stock_quantity}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.productRight}>
                      <Text style={styles.productPrice}>
                        {formatCentimes(item.sale_price_centimes)}
                      </Text>

                      <Pressable
                        onPress={() => addItemWithProduct(item, 1)}
                        style={[
                          styles.addBtn,
                          cartQty > 0 && styles.addBtnInCart,
                        ]}
                        accessibilityLabel={`Ajouter ${item.name} au panier`}
                      >
                        <SymbolView
                          name={{
                            ios: cartQty > 0 ? ("plus" as any) : ("plus" as any),
                            android: "add" as any,
                            web: "add" as any,
                          }}
                          size={16}
                          tintColor={
                            cartQty > 0 ? "#FFFFFF" : Colors.light.primary
                          }
                        />
                        {cartQty > 0 && (
                          <Text style={styles.addBtnCount}>{cartQty}</Text>
                        )}
                      </Pressable>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Floating Cart Bar (Shown when cart has items) */}
        {itemCount > 0 && (
          <View style={styles.floatingCartBar}>
            <Pressable
              onPress={() => setCartVisible(true)}
              style={styles.cartBarInner}
              accessibilityLabel="Voir le panier"
            >
              <View style={styles.cartBarLeft}>
                <View style={styles.cartBadgeContainer}>
                  <SymbolView
                    name={{
                      ios: "bag.fill" as any,
                      android: "shopping_bag" as any,
                      web: "shopping_bag" as any,
                    }}
                    size={22}
                    tintColor="#FFFFFF"
                  />
                  <View style={styles.cartCountBadge}>
                    <Text style={styles.cartCountBadgeText}>{itemCount}</Text>
                  </View>
                </View>
                <View>
                  <Text style={styles.cartBarLabel}>Total Panier</Text>
                  <Text style={styles.cartBarTotal}>
                    {formatCentimes(total)}
                  </Text>
                </View>
              </View>

              <View style={styles.cartBarRight}>
                <Text style={styles.cartBarActionText}>Voir le panier</Text>
                <SymbolView
                  name={{
                    ios: "chevron.right" as any,
                    android: "chevron_right" as any,
                    web: "chevron_right" as any,
                  }}
                  size={16}
                  tintColor="#FFFFFF"
                />
              </View>
            </Pressable>
          </View>
        )}

        {/* Cart Bottom Sheet Modal */}
        {cartVisible && (
          <Modal
            visible={cartVisible}
            transparent
            animationType="slide"
            onRequestClose={() => setCartVisible(false)}
          >
            <View style={styles.modalOverlay}>
              <CartList
                items={items}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
                subtotal={subtotal}
                discount={discount}
                total={total}
                setDiscount={setDiscount}
                onCheckout={() => {
                  setCartVisible(false);
                  setCheckoutVisible(true);
                }}
                onClose={() => setCartVisible(false)}
              />
            </View>
          </Modal>
        )}

        {/* Checkout Modal */}
        {checkoutVisible && (
          <CheckoutSheet
            visible={checkoutVisible}
            onRequestClose={() => setCheckoutVisible(false)}
            onCheckout={handleCheckout}
            cartTotal={total}
            isSaving={isSaving}
            error={errorState}
            customerId={customerId || undefined}
            setCustomerId={setCustomerId}
            note={note}
            setNote={setNote}
          />
        )}

        {/* Receipt Success Preview Modal */}
        {receiptVisible && sale && (
          <ReceiptPreview
            visible={receiptVisible}
            onRequestClose={() => setReceiptVisible(false)}
            onNewSale={() => {
              setReceiptVisible(false);
              clearCart();
              setSale(null);
            }}
            sale={sale}
          />
        )}

        {/* Barcode Scanner Modal */}
        {scannerVisible && (
          <BarcodeScannerModal
            visible={scannerVisible}
            onScan={handleBarcodeScanned}
            onClose={() => setScannerVisible(false)}
          />
        )}

        {/* Voice Input Button */}
        <VoiceButton
          onVoiceStart={() => setVoiceVisible(true)}
          onVoiceEnd={() => {}}
          onTranscript={(text) => {
            setVoiceCommand(text);
            const parsed = parseSaleCommand(text, voiceAvailableProducts);
            if (parsed) {
              setParsedVoice(parsed);
            }
          }}
          disabled={isSaving}
        />

        {/* Voice Review Sheet */}
        {parsedVoice && (
          <ReviewSheet
            isVisible={voiceVisible}
            onClose={() => setVoiceVisible(false)}
            onConfirm={(parsed) => {
              const product = products.find(
                (item) => item.name === parsed.productName,
              );
              if (product) addItemWithProduct(product, parsed.quantity);
              setVoiceVisible(false);
              setParsedVoice(null);
            }}
            availableProducts={voiceAvailableProducts}
            commandText={voiceCommand}
          />
        )}
      </ThemedView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  headerContainer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
    gap: Spacing.sm,
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  searchInputWrapper: {
    flex: 1,
  },
  scannerBtn: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
  categoryChips: {
    gap: Spacing.xs,
    paddingBottom: Spacing.xs,
  },
  chip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: "transparent",
  },
  chipSelected: {
    backgroundColor: Colors.light.primaryLight,
    borderColor: Colors.light.primary,
  },
  chipText: {
    ...Typography.caption,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  chipTextSelected: {
    color: Colors.light.primary,
  },
  frequentSection: {
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: ComponentDimensions.screenPadding,
    marginBottom: Spacing.xs,
  },
  sectionTitle: {
    ...Typography.label,
    fontSize: 12,
    color: Colors.light.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  sectionSubtitle: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textMuted,
  },
  frequentList: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    gap: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  frequentCard: {
    width: 105,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    gap: 4,
    ...Shadows.sm,
  },
  frequentCardInCart: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  frequentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  frequentQtyBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.primary,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
  },
  frequentQtyBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  frequentName: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  frequentPrice: {
    ...Typography.caption,
    fontSize: 11,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: ComponentDimensions.screenPadding,
  },
  productsList: {
    paddingTop: Spacing.md,
    paddingBottom: Spacing.xxl,
    gap: ComponentDimensions.cardGap,
  },
  productCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadows.sm,
  },
  productLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  productAvatar: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  productInitial: {
    ...Typography.label,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  productDetails: {
    flex: 1,
  },
  productName: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },
  unitText: {
    ...Typography.caption,
    fontSize: 11,
    color: Colors.light.textSecondary,
  },
  stockBadge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
  },
  stockBadgeLow: {
    backgroundColor: "#FEF3C7",
  },
  stockBadgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.textSecondary,
  },
  stockBadgeTextLow: {
    color: "#B45309",
  },
  productRight: {
    alignItems: "flex-end",
    gap: 6,
  },
  productPrice: {
    ...Typography.moneySmall,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: Colors.light.primary,
  },
  addBtnInCart: {
    backgroundColor: Colors.light.primary,
  },
  addBtnCount: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  floatingCartBar: {
    position: "absolute",
    bottom: Spacing.md,
    left: ComponentDimensions.screenPadding,
    right: ComponentDimensions.screenPadding,
    ...Shadows.lg,
  },
  cartBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cartBadgeContainer: {
    position: "relative",
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  cartCountBadge: {
    position: "absolute",
    top: -2,
    right: -6,
    backgroundColor: Colors.light.warning,
    width: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: "center",
    alignItems: "center",
  },
  cartCountBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cartBarLabel: {
    ...Typography.caption,
    fontSize: 10,
    color: "#A5F4B6",
    textTransform: "uppercase",
  },
  cartBarTotal: {
    ...Typography.moneySmall,
    color: "#FFFFFF",
    fontWeight: "700",
  },
  cartBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cartBarActionText: {
    ...Typography.label,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "flex-end",
  },
  centered: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyTitle: {
    ...Typography.heading3,
    color: Colors.light.textPrimary,
  },
  emptySubtitle: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    textAlign: "center",
  },
});
