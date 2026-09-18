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
import { useEdgeToEdge } from "@/hooks/useEdgeToEdge";

import { FooterTrademark } from "@/components/FooterTrademark";
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
import { useTheme } from "@/hooks/use-theme";
import { useProducts } from "@/hooks/useProducts";
import { useCartStoreHook } from "@/stores/cartStore";
import { Product, Sale } from "@/types/entities";
import { formatCentimes } from "@/utils/money";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";

export default function SellScreen() {
  const router = useRouter();
  const theme = useTheme();
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
  const [sale, setSale] = useState<Sale | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [errorState, setErrorState] = useState<string | null>(null);
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
        return (
          s === c ||
          (s.replace(/^0+/, "") !== "" &&
            s.replace(/^0+/, "") === c.replace(/^0+/, ""))
        );
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
          amountPaidCentimes: details.amountPaid,
        };

        const newSale = await create(saleInput);
        setSale(newSale);
        setReceiptVisible(true);
        setIsSaving(false);

        clearCart();
        setCheckoutVisible(false);
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

  const { insets, style } = useEdgeToEdge();

  return (
    <View
      style={[{ flex: 1, backgroundColor: theme.background }, style]}>
      <ThemedView
        style={[styles.container, { backgroundColor: theme.background }]}
      >
        {/* Header with Title, Search & Barcode Scan */}
        <View
          style={[
            styles.headerContainer,
            {
              paddingTop: Math.max(insets.top, Spacing.md),
              backgroundColor: theme.surface,
              borderBottomColor: theme.borderLight,
            },
          ]}
        >
          <View style={styles.screenTitleRow}>
            <ThemedText style={[styles.screenTitle, { color: theme.textPrimary }]}>
              {t("sell.title", { defaultValue: "Caisse & Ventes" })}
            </ThemedText>
            <ThemedText style={[styles.screenSubtitle, { color: theme.textSecondary }]}>
              {t("sell.subtitle", { defaultValue: "Encaissement rapide • Catalogue & code-barres" })}
            </ThemedText>
          </View>

          <View style={styles.searchRow}>
            <View style={styles.searchInputWrapper}>
              <SearchInput
                placeholder={t("products:searchPlaceholder", {
                  defaultValue: "Rechercher produit ou code...",
                })}
                value={searchQuery}
                onChangeText={setSearchQuery}
                locale={isArabic ? "ar" : "fr"}
              />
            </View>

            <Pressable
              onPress={() => setScannerVisible(true)}
              style={[
                styles.scannerBtn,
                { backgroundColor: theme.surface, borderColor: theme.border },
              ]}
              accessibilityLabel={t("sell.scanBarcode", {
                defaultValue: "Scanner un code-barres",
              })}
            >
              <SymbolView
                name={{
                  ios: "barcode.viewfinder" as any,
                  android: "qr_code_scanner" as any,
                  web: "qr_code_scanner" as any,
                }}
                size={22}
                tintColor={theme.primary}
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
                      { backgroundColor: theme.backgroundElement },
                      isSelected && [
                        styles.chipSelected,
                        {
                          backgroundColor: theme.primaryLight,
                          borderColor: theme.primary,
                        },
                      ],
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: theme.textSecondary },
                        isSelected && [
                          styles.chipTextSelected,
                          { color: theme.primary },
                        ],
                      ]}
                    >
                      {cat === "all"
                        ? t("sell.allProducts", {
                            defaultValue: "Tous les articles",
                          })
                        : cat}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          )}
        </View>

        {/* Frequent Items Carousel (when not searching) */}
        {!searchQuery && frequentProducts.length > 0 && (
          <View
            style={[
              styles.frequentSection,
              { borderBottomColor: theme.borderLight },
            ]}
          >
            <View style={styles.sectionHeader}>
              <ThemedText
                style={[styles.sectionTitle, { color: theme.textSecondary }]}
              >
                {t("sell.frequentItems", {
                  defaultValue: "Articles Fréquents",
                })}
              </ThemedText>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.frequentList}
            >
              {frequentProducts.map((p) => {
                const cartQty = getItemCartQty(p.id);
                return (
                  <View
                    key={p.id}
                    style={[
                      styles.frequentCard,
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                      cartQty > 0 && [
                        styles.frequentCardInCart,
                        {
                          borderColor: theme.primary,
                          backgroundColor: theme.primaryLight,
                        },
                      ],
                    ]}
                    accessibilityLabel={`${p.name}, ${formatCentimes(p.sale_price_centimes)}`}
                  >
                    <Pressable
                      style={styles.frequentCardContent}
                      onPress={() => {
                        if (cartQty === 0) {
                          addItemWithProduct(p, 1);
                        }
                      }}
                    >
                      <View
                        style={[
                          styles.frequentIconBox,
                          { backgroundColor: theme.backgroundElement },
                          cartQty > 0 && { backgroundColor: theme.primary },
                        ]}
                      >
                        <SymbolView
                          name={{
                            ios: cartQty > 0 ? ("checkmark" as any) : ("bag" as any),
                            android: cartQty > 0 ? ("check" as any) : ("shopping_bag" as any),
                            web: cartQty > 0 ? ("check" as any) : ("shopping_bag" as any),
                          }}
                          size={18}
                          tintColor={cartQty > 0 ? theme.surface : theme.primary}
                        />
                        {cartQty > 0 && (
                          <View
                            style={[
                              styles.frequentQtyBadge,
                              { backgroundColor: theme.primary },
                            ]}
                          >
                            <Text style={styles.frequentQtyBadgeText}>{cartQty}</Text>
                          </View>
                        )}
                      </View>
                      <ThemedText
                        style={[
                          styles.frequentName,
                          { color: theme.textPrimary },
                          cartQty > 0 && { fontWeight: "700" },
                        ]}
                        numberOfLines={1}
                      >
                        {p.name}
                      </ThemedText>
                      <ThemedText
                        style={[styles.frequentPrice, { color: theme.primary }]}
                      >
                        {formatCentimes(p.sale_price_centimes)}
                      </ThemedText>
                    </Pressable>

                    {cartQty > 0 ? (
                      <View style={styles.frequentStepperRow}>
                        <Pressable
                          onPress={() => subtractItem(p.id)}
                          style={[
                            styles.frequentStepBtn,
                            { backgroundColor: theme.surface, borderColor: theme.border },
                          ]}
                          hitSlop={6}
                          accessibilityLabel="Decrease quantity"
                        >
                          <SymbolView
                            name={{ ios: "minus" as any, android: "remove" as any, web: "remove" as any }}
                            size={12}
                            tintColor={theme.primary}
                          />
                        </Pressable>
                        <Text style={[styles.frequentStepQty, { color: theme.primary }]}>
                          {cartQty}
                        </Text>
                        <Pressable
                          onPress={() => addItemWithProduct(p, 1)}
                          style={[
                            styles.frequentStepBtn,
                            { backgroundColor: theme.surface, borderColor: theme.border },
                          ]}
                          hitSlop={6}
                          accessibilityLabel="Increase quantity"
                        >
                          <SymbolView
                            name={{ ios: "plus" as any, android: "add" as any, web: "add" as any }}
                            size={12}
                            tintColor={theme.primary}
                          />
                        </Pressable>
                      </View>
                    ) : (
                      <Pressable
                        onPress={() => addItemWithProduct(p, 1)}
                        style={[
                          styles.frequentAddQuickBtn,
                          { backgroundColor: theme.primary },
                        ]}
                        accessibilityLabel={`Add ${p.name}`}
                      >
                        <SymbolView
                          name={{ ios: "plus" as any, android: "add" as any, web: "add" as any }}
                          size={12}
                          tintColor="#FFFFFF"
                        />
                        <Text style={[styles.frequentAddQuickText, { color: "#FFFFFF" }]}>
                          {t("sell.add", { defaultValue: "Ajouter" })}
                        </Text>
                      </Pressable>
                    )}
                  </View>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Products List */}
        <View style={styles.listContainer}>
          {loading ? (
            <View style={styles.centered}>
              <ActivityIndicator size="large" color={theme.primary} />
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
                tintColor={theme.textMuted}
              />
              <ThemedText
                style={[styles.emptyTitle, { color: theme.textPrimary }]}
              >
                {searchQuery
                  ? t("products:noProductsInList", {
                      defaultValue: "Aucun produit trouvé",
                    })
                  : t("products:noProductsInList", {
                      defaultValue: "Catalogue vide",
                    })}
              </ThemedText>
              <ThemedText
                style={[styles.emptySubtitle, { color: theme.textSecondary }]}
              >
                {searchQuery
                  ? `${t("common:search", { defaultValue: "Recherche" })}: "${searchQuery}"`
                  : t("products:subtitle", {
                      defaultValue:
                        "Ajoutez des produits dans l'onglet Catalogue",
                    })}
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
                      {
                        backgroundColor: theme.surface,
                        borderColor: theme.border,
                      },
                      cartQty > 0 && [
                        styles.productCardInCart,
                        {
                          borderColor: theme.primary,
                          backgroundColor: theme.primaryLight,
                        },
                      ],
                    ]}
                  >
                    <View style={styles.productCardMainArea}>
                      <View style={styles.productLeft}>
                        <View
                          style={[
                            styles.productAvatar,
                            { backgroundColor: theme.primaryLight },
                          ]}
                        >
                          <Text
                            style={[
                              styles.productInitial,
                              { color: theme.primary },
                            ]}
                          >
                            {item.name ? item.name[0].toUpperCase() : "P"}
                          </Text>
                          {cartQty > 0 && (
                            <View
                              style={[
                                styles.productQtyBadge,
                                { backgroundColor: theme.primary },
                              ]}
                            >
                              <Text style={styles.productQtyBadgeText}>
                                {cartQty}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.productCenter}>
                        <ThemedText
                          style={[
                            styles.productName,
                            { color: theme.textPrimary },
                          ]}
                          numberOfLines={1}
                        >
                          {item.name}
                        </ThemedText>
                        <View style={styles.productMeta}>
                          {item.unit && (
                            <Text
                              style={[
                                styles.unitText,
                                { color: theme.textSecondary },
                              ]}
                            >
                              {item.unit}
                            </Text>
                          )}
                          {item.sku && (
                            <Text
                              style={[
                                styles.skuBadge,
                                {
                                  backgroundColor: theme.backgroundElement,
                                  color: theme.textSecondary,
                                },
                              ]}
                            >
                              SKU: {item.sku}
                            </Text>
                          )}
                          {item.stock_quantity !== undefined && (
                            <View
                              style={[
                                styles.stockBadge,
                                { backgroundColor: theme.backgroundElement },
                                isLowStock && styles.stockBadgeLow,
                              ]}
                            >
                              <Text
                                style={[
                                  styles.stockBadgeText,
                                  { color: theme.textSecondary },
                                  isLowStock && styles.stockBadgeTextLow,
                                ]}
                              >
                                {t("products:stockLabel", {
                                  defaultValue: "Stock",
                                })}
                                : {item.stock_quantity}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>

                    <View style={styles.productRight}>
                      <Text
                        style={[styles.productPrice, { color: theme.primary }]}
                      >
                        {formatCentimes(item.sale_price_centimes)}
                      </Text>

                      {cartQty === 0 ? (
                        <Pressable
                          onPress={() => addItemWithProduct(item, 1)}
                          style={[
                            styles.addBtn,
                            {
                              backgroundColor: theme.primary,
                            },
                          ]}
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
                            tintColor="#FFFFFF"
                          />
                          <Text
                            style={[
                              styles.addBtnText,
                              { color: "#FFFFFF" },
                            ]}
                          >
                            {t("sell.add", { defaultValue: "Ajouter" })}
                          </Text>
                        </Pressable>
                      ) : (
                        <View
                          style={[
                            styles.stepperContainer,
                            {
                              backgroundColor: theme.surfaceAlt,
                              borderColor: theme.primary,
                            },
                          ]}
                        >
                          <Pressable
                            onPress={() => subtractItem(item.id)}
                            style={[
                              styles.stepperBtnMinus,
                              {
                                backgroundColor: theme.surface,
                                borderColor: theme.border,
                              },
                            ]}
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
                              tintColor={theme.primary}
                            />
                          </Pressable>
                          <View style={styles.stepperQtyBox}>
                            <Text
                              style={[
                                styles.stepperQtyText,
                                { color: theme.primary },
                              ]}
                            >
                              {cartQty}
                            </Text>
                          </View>
                          <Pressable
                            onPress={() => addItemWithProduct(item, 1)}
                            style={[
                              styles.stepperBtnPlus,
                              { backgroundColor: theme.primary },
                            ]}
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
              ListFooterComponent={() => (
                <FooterTrademark style={{ paddingBottom: 60 }} />
              )}
            />
          )}
        </View>

        {/* Bottom Dock: Cart Bar */}
        <View
          nativeID="sell-actions-container"
          id="sell-actions-container"
          // @ts-ignore
          className="sell-actions-container"
          style={[
            styles.bottomDockContainer,
            {
              backgroundColor: theme.surface,
              borderTopColor: theme.borderLight,
            },
          ]}
        >
          <Pressable
            onPress={() => setCartVisible(true)}
            style={[
              styles.cartBarInner,
              { backgroundColor: theme.primary },
              itemCount === 0 && [
                styles.cartBarInnerEmpty,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.border,
                },
              ],
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
                  tintColor={itemCount > 0 ? "#FFFFFF" : theme.textSecondary}
                />
                {itemCount > 0 && (
                  <View
                    style={[
                      styles.cartCountBadge,
                      { backgroundColor: theme.warning },
                    ]}
                  >
                    <Text style={styles.cartCountBadgeText}>{itemCount}</Text>
                  </View>
                )}
              </View>
              <View style={styles.cartTextGroup}>
                <Text
                  style={[
                    styles.cartBarLabel,
                    itemCount === 0 && [
                      styles.cartBarLabelEmpty,
                      { color: theme.textSecondary },
                    ],
                  ]}
                  numberOfLines={1}
                >
                  {t("nav.sell", { defaultValue: "Panier" })}
                </Text>
                <Text
                  style={[
                    styles.cartBarTotal,
                    itemCount === 0 && [
                      styles.cartBarTotalEmpty,
                      { color: theme.textPrimary },
                    ],
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
                  itemCount === 0 && [
                    styles.cartBarActionTextEmpty,
                    { color: theme.textSecondary },
                  ],
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
                tintColor={itemCount > 0 ? "#FFFFFF" : theme.textSecondary}
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
            saleItems={
              sale?.saleItems?.map((item) => ({
                id: item.id,
                name: item.product_name_snapshot,
                quantity: item.quantity,
                sale_price_centimes: item.unit_sale_price_centimes,
              })) || []
            }
            cartTotal={sale?.total_centimes || 0}
            discountCentimes={sale?.discount_centimes || 0}
            paymentMethod={sale?.payment_method}
            amountReceived={sale?.amount_paid_centimes || 0}
            customerName={null}
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
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
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
  screenTitleRow: {
    marginBottom: 2,
  },
  screenTitle: {
    ...Typography.heading2,
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  screenSubtitle: {
    ...Typography.caption,
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
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
    width: 140,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: Spacing.sm,
    paddingVertical: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.light.border,
    alignItems: "center",
    justifyContent: "space-between",
    ...Shadows.sm,
  },
  frequentCardContent: {
    alignItems: "center",
    width: "100%",
    gap: 6,
  },
  frequentIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  frequentName: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: Colors.light.textPrimary,
    textAlign: "center",
  },
  frequentPrice: {
    ...Typography.caption,
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.primary,
  },
  frequentCardInCart: {
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  frequentStepperRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 38,
    marginTop: 8,
    paddingHorizontal: 4,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    backgroundColor: Colors.light.primaryLight,
  },
  frequentStepBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  frequentStepQty: {
    fontSize: 14,
    fontWeight: "700",
  },
  frequentAddQuickBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    width: "100%",
    height: 38,
    marginTop: 8,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  frequentAddQuickText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  frequentQtyBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: Colors.light.primary,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  frequentQtyBadgeText: {
    color: "#FFFFFF",
    fontSize: 9,
    fontWeight: "700",
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
    paddingHorizontal: 14,
    borderRadius: BorderRadius.button,
    backgroundColor: Colors.light.primary,
    ...Shadows.sm,
  },
  addBtnText: {
    ...Typography.caption,
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
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
