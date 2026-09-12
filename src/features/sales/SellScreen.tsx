import { SymbolView } from "expo-symbols";
import { useCallback, useMemo, useState } from "react";
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
import { useProducts } from "@/hooks/useProducts";
import { useCartStoreHook } from "@/stores/cartStore";
import { Product } from "@/types/entities";
import { formatCentimes } from "@/utils/money";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SellScreen() {
  const router = useRouter();
  const { t, i18n } = useTranslation();
  const { products, loading } = useProducts({ is_active: true });
  const {
    items,
    addItemWithProduct,
    subtractItem,
    removeItem,
    updateQuantity,
    clearCart,
    total,
    subtotal,
    itemCount,
    discount,
    setDiscount,
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

  const handleBarcodeScanned = (code: string, matchedProduct?: Product) => {
    const cleanCode = code.trim();
    const productToAdd =
      matchedProduct ||
      products.find((p) => {
        if (!p.sku) return false;
        const s = p.sku.trim().toLowerCase();
        const c = cleanCode.toLowerCase();
        return s === c || (s.replace(/^0+/, "") !== "" && s.replace(/^0+/, "") === c.replace(/^0+/, ""));
      });

    if (productToAdd) {
      addItemWithProduct(productToAdd, 1);
    } else {
      setSearchQuery(cleanCode);
      setScannerVisible(false);
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

  const isArabic = i18n.language?.startsWith("ar");

  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
      <ThemedView style={styles.container}>
        {/* Header with Search & Barcode Scan */}
        <View style={styles.headerContainer}>
          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <SearchInput
                placeholder={t("products:searchPlaceholder", { defaultValue: "Rechercher produit ou code..." })}
                value={searchQuery}
                onChangeText={setSearchQuery}
                locale={isArabic ? "ar" : "fr"}
              />
            </View>

            <Pressable
              onPress={() => setScannerVisible(true)}
              style={styles.scannerBtn}
              accessibilityLabel={t("sell.scanBarcode", { defaultValue: "Scanner un code-barres" })}
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
                      {cat === "all" ? t("sell.allProducts", { defaultValue: "Tous les articles" }) : cat}
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
                {t("sell.frequentItems", { defaultValue: "Articles Fréquents" })}
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.frequentList}
            >
              {frequentProducts.map((p) => (
                <View
                  key={p.id}
                  style={styles.frequentCard}
                  accessibilityLabel={`${p.name}, ${formatCentimes(p.sale_price_centimes)}`}
                >
                  <View style={styles.frequentCardContent}>
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
                    </View>
                    <ThemedText style={styles.frequentName} numberOfLines={1}>
                      {p.name}
                    </ThemedText>
                    <ThemedText style={styles.frequentPrice}>
                      {formatCentimes(p.sale_price_centimes)}
                    </ThemedText>
                  </View>
                </View>
              ))}
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
                {searchQuery ? t("products:noProductsInList", { defaultValue: "Aucun produit trouvé" }) : t("products:noProductsInList", { defaultValue: "Catalogue vide" })}
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {searchQuery
                  ? `${t("common:search", { defaultValue: "Recherche" })}: "${searchQuery}"`
                  : t("products:subtitle", { defaultValue: "Ajoutez des produits dans l'onglet Catalogue" })}
              </ThemedText>
            </View>
          ) : (
            <FlatList
              data={filteredProducts}
              extraData={items}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.productsList}
              renderItem={({ item }: { item: Product }) => {
                const cartQty = getItemCartQty(item.id);
                const isLowStock =
                  item.stock_quantity !== undefined &&
                  item.stock_quantity !== null &&
                  item.minimum_stock_quantity !== undefined &&
                  item.stock_quantity <= item.minimum_stock_quantity;

                return (
                  <View
                    style={[
                      styles.productCard,
                      cartQty > 0 && styles.productCardInCart,
                    ]}
                  >
                    <View style={styles.productCardMainArea}>
                      <View style={styles.productLeft}>
                        <View style={styles.productAvatar}>
                          <Text style={styles.productInitial}>
                            {item.name ? item.name[0].toUpperCase() : "P"}
                          </Text>
                          {cartQty > 0 && (
                            <View style={styles.productQtyBadge}>
                              <Text style={styles.productQtyBadgeText}>
                                {cartQty}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.productCenter}>
                        <ThemedText style={styles.productName} numberOfLines={1}>
                          {item.name}
                        </ThemedText>
                        <View style={styles.productMeta}>
                          {item.unit && (
                            <Text style={styles.unitText}>{item.unit}</Text>
                          )}
                          {item.sku && (
                            <Text style={styles.skuBadge}>
                              SKU: {item.sku}
                            </Text>
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
                                {t("products:stockLabel", { defaultValue: "Stock" })}: {item.stock_quantity}
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

                      {cartQty === 0 ? (
                        <Pressable
                          onPress={() => addItemWithProduct(item, 1)}
                          style={styles.addBtn}
                          hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                          accessibilityLabel={`${t("sell.add", { defaultValue: "Ajouter" })} ${item.name}`}
                        >
                          <SymbolView
                            name={{
                              ios: "plus" as any,
                              android: "add" as any,
                              web: "add" as any,
                            }}
                            size={14}
                            tintColor={Colors.light.primary}
                          />
                          <Text style={styles.addBtnText}>
                            {t("sell.add", { defaultValue: "Ajouter" })}
                          </Text>
                        </Pressable>
                      ) : (
                        <View style={styles.stepperContainer}>
                          <Pressable
                            onPress={() => subtractItem(item.id)}
                            style={styles.stepperBtnMinus}
                            hitSlop={{ top: 8, bottom: 8, left: 8, right: 6 }}
                            accessibilityLabel={`-`}
                          >
                            <SymbolView
                              name={{
                                ios: "minus" as any,
                                android: "remove" as any,
                                web: "remove" as any,
                              }}
                              size={14}
                              tintColor={Colors.light.primary}
                            />
                          </Pressable>
                          <View style={styles.stepperQtyBox}>
                            <Text style={styles.stepperQtyText}>{cartQty}</Text>
                          </View>
                          <Pressable
                            onPress={() => addItemWithProduct(item, 1)}
                            style={styles.stepperBtnPlus}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 8 }}
                            accessibilityLabel={`+`}
                          >
                            <SymbolView
                              name={{
                                ios: "plus" as any,
                                android: "add" as any,
                                web: "add" as any,
                              }}
                              size={14}
                              tintColor="#FFFFFF"
                            />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                );
              }}
            />
          )}
        </View>

        {/* Bottom Dock: Cart Bar */}
        <View
          nativeID="sell-actions-container"
          id="sell-actions-container"
          // @ts-ignore
          className="sell-actions-container"
          style={styles.bottomDockContainer}
        >
          <Pressable
            onPress={() => setCartVisible(true)}
            style={[
              styles.cartBarInner,
              itemCount === 0 && styles.cartBarInnerEmpty,
            ]}
            accessibilityLabel={t("sell.cart.viewCart", {
              defaultValue: "Voir le panier",
            })}
            accessibilityRole="button"
          >
            <View style={styles.cartBarLeft}>
              <View style={styles.cartBadgeContainer}>
                <SymbolView
                  name={{
                    ios: "bag.fill" as any,
                    android: "shopping_bag" as any,
                    web: "shopping_bag" as any,
                  }}
                  size={20}
                  tintColor={
                    itemCount > 0 ? "#FFFFFF" : Colors.light.textSecondary
                  }
                />
                {itemCount > 0 && (
                  <View style={styles.cartCountBadge}>
                    <Text style={styles.cartCountBadgeText}>{itemCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cartTextGroup}>
                <Text
                  style={[
                    styles.cartBarLabel,
                    itemCount === 0 && styles.cartBarLabelEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {t("nav.sell", { defaultValue: "Panier" })}
                </Text>
                <Text
                  style={[
                    styles.cartBarTotal,
                    itemCount === 0 && styles.cartBarTotalEmpty,
                  ]}
                  numberOfLines={1}
                >
                  {formatCentimes(total)}
                </Text>
              </View>
            </View>

            <View
              style={[
                styles.cartBarRight,
                itemCount === 0 && styles.cartBarRightEmpty,
              ]}
            >
              <Text
                style={[
                  styles.cartBarActionText,
                  itemCount === 0 && styles.cartBarActionTextEmpty,
                ]}
                numberOfLines={1}
              >
                {t("sell.cart.seeCart", { defaultValue: "Voir le panier" })}
              </Text>
              <SymbolView
                name={{
                  ios: "chevron.right" as any,
                  android: "chevron_right" as any,
                  web: "chevron_right" as any,
                }}
                size={16}
                tintColor={
                  itemCount > 0 ? "#FFFFFF" : Colors.light.textSecondary
                }
              />
            </View>
          </Pressable>
        </View>

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
                onClearCart={clearCart}
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
            saleItems={sale?.items?.map((item: any) => ({
              id: item.id,
              name: item.name,
              quantity: item.quantity,
              sale_price_centimes: item.unitSalePriceCentimes,
            })) || []}
            cartTotal={sale?.total_centimes || 0}
            discountCentimes={discount}
            paymentMethod={paymentMethod}
            amountReceived={sale?.total_paid_centimes || 0}
            customerName={sale?.customerName || null}
          />
        )}

        {/* Barcode Scanner Modal */}
        {scannerVisible && (
          <BarcodeScannerModal
            visible={scannerVisible}
            products={products}
            onScan={handleBarcodeScanned}
            onClose={() => setScannerVisible(false)}
            onNavigateToCreateProduct={(sku) => {
              setScannerVisible(false);
              router.push({
                pathname: "/products/new" as any,
                params: { sku },
              });
            }}
            onSearchInCatalog={(code) => {
              setScannerVisible(false);
              setSearchQuery(code);
            }}
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
    width: 108,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.sm,
  },
  frequentCardContent: {
    alignItems: "center",
    width: "100%",
    gap: 4,
  },
  frequentIconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
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
  productCardInCart: {
    borderColor: Colors.light.primary,
    backgroundColor: "#F7FBF8",
  },
  productCardMainArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  productLeft: {
    width: 56,
    alignItems: "center",
    justifyContent: "center",
  },
  productAvatar: {
    width: 42,
    height: 42,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  productQtyBadge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Colors.light.primary,
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  productQtyBadgeText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700",
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
    ...Typography.caption,
    fontSize: 13,
    color: Colors.light.textPrimary,
    marginBottom: 2,
  },
  productMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 2,
  },

  skuBadge: {
    backgroundColor: Colors.light.backgroundElement,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: BorderRadius.sm,
    fontSize: 10,
    fontWeight: "600",
    color: Colors.light.textSecondary,
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
    justifyContent: "center",
    gap: 6,
    minWidth: 96,
  },

  productCenter: {
    flex: 1,
    paddingHorizontal: Spacing.sm,
  },

  productPrice: {
    ...Typography.moneySmall,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.light.surfaceAlt,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
  },
  addBtnText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "600",
    color: Colors.light.primary,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    height: 38,
    paddingHorizontal: 3,
    gap: 2,
  },
  stepperBtnMinus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.surface,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  stepperQtyBox: {
    minWidth: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  stepperQtyText: {
    ...Typography.caption,
    fontSize: 14,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  stepperBtnPlus: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  bottomDockContainer: {
    paddingHorizontal: ComponentDimensions.screenPadding,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.light.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  cartBarInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.light.primary,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 16,
    height: 52,
    minHeight: 52,
    width: "100%",
    ...Shadows.md,
  },
  cartBarInnerEmpty: {
    backgroundColor: Colors.light.backgroundElement,
    borderWidth: 1,
    borderColor: Colors.light.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  cartBarLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
    minWidth: 0,
  },
  cartTextGroup: {
    flex: 1,
    minWidth: 0,
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
    right: -4,
    backgroundColor: Colors.light.warning,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    paddingHorizontal: 4,
    justifyContent: "center",
    alignItems: "center",
  },
  cartCountBadgeText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "700",
  },
  cartBarLabel: {
    fontSize: 11,
    color: "rgba(255, 255, 255, 0.85)",
    textTransform: "uppercase",
    fontWeight: "600",
    lineHeight: 14,
  },
  cartBarLabelEmpty: {
    color: Colors.light.textSecondary,
  },
  cartBarTotal: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "700",
    lineHeight: 20,
  },
  cartBarTotalEmpty: {
    color: Colors.light.textPrimary,
  },
  cartBarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: BorderRadius.lg,
  },
  cartBarRightEmpty: {
    backgroundColor: "transparent",
  },
  cartBarActionText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "600",
  },
  cartBarActionTextEmpty: {
    color: Colors.light.textSecondary,
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
