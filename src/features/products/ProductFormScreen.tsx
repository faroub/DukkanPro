import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { FormField } from "@/components/ui/FormField";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { executeRead, executeWrite } from "@/database/database";
import { adjustStock } from "@/database/repositories/productRepository";
import { Product } from "@/types/entities";
import { useNavigation, useRoute } from "expo-router";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import {
    Alert,
    ScrollView,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    View,
} from "react-native";

export interface ProductFormScreenProps {
  route?: any;
  navigation?: any;
  onClose?: () => void;
  mode?: "create" | "edit";
}

export function ProductFormScreen({
  route,
  navigation,
}: ProductFormScreenProps) {
  const { t } = useTranslation();
  const defaultNavigation = useNavigation();
  const routerRoute = useRoute() as { params?: { id?: string } };
  const params = route?.params ?? routerRoute.params ?? {};
  const currentNavigation = navigation ?? defaultNavigation;
  const productId = params?.id;
  const isEditMode = !!productId;
  const isCreateMode = !isEditMode;

  // State for product data
  const [product, setProduct] = useState<Product | null>({
    id: 0,
    name: "",
    sku: "",
    category: "",
    sale_price_centimes: 0,
    cost_price_centimes: 0,
    stock_quantity: 0,
    minimum_stock_quantity: 0,
    unit: "pcs",
    is_active: true,
    created_at: "",
    updated_at: "",
  });
  const [isLoading, setIsLoading] = useState(true);

  // Load product data on edit
  useEffect(() => {
    (async () => {
      if (!productId) {
        setIsLoading(false);
        return;
      }

      try {
        const rows: any[] = await executeRead(
          // language=SQLite
          `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
               stock_quantity, minimum_stock_quantity, unit, is_active,
               created_at, updated_at
           FROM products
           WHERE id = ?`,
          [Number(productId)],
        );
        if (rows.length > 0) {
          const r = rows[0];
          setProduct({
            id: r.id,
            name: r.name,
            sku: r.sku || "",
            category: r.category || "",
            sale_price_centimes: r.sale_price_centimes,
            cost_price_centimes: r.cost_price_centimes,
            stock_quantity: r.stock_quantity,
            minimum_stock_quantity: r.minimum_stock_quantity,
            unit: r.unit || "pcs",
            is_active: r.is_active !== 0,
            created_at: r.created_at,
            updated_at: r.updated_at,
          });
        }
      } catch (err) {
        console.error("Failed to load product:", err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [productId]);

  // Handle form save
  const handleSave = useCallback(
    async (productData: Product) => {
      setIsLoading(true);

      try {
        if (isCreateMode) {
          // Create new product
          await executeWrite(
            // language=SQLite
            `INSERT INTO products
           (name, sku, category, sale_price_centimes, cost_price_centimes,
            stock_quantity, minimum_stock_quantity, unit, is_active, created_at, updated_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))`,
            [
              productData.name,
              productData.sku,
              productData.category,
              productData.sale_price_centimes,
              productData.cost_price_centimes,
              productData.stock_quantity,
              productData.minimum_stock_quantity,
              productData.unit,
              productData.is_active ? 1 : 0,
            ],
          );
        } else {
          // Update existing product
          await executeWrite(
            // language=SQLite
            `UPDATE products
           SET name = ?,
               sku = ?,
               category = ?,
               sale_price_centimes = ?,
               cost_price_centimes = ?,
               stock_quantity = ?,
               minimum_stock_quantity = ?,
               unit = ?,
               is_active = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
            [
              productData.name,
              productData.sku,
              productData.category,
              productData.sale_price_centimes,
              productData.cost_price_centimes,
              productData.stock_quantity,
              productData.minimum_stock_quantity,
              productData.unit,
              productData.is_active ? 1 : 0,
              productId,
            ],
          );
        }
        currentNavigation?.back();
      } catch (err) {
        setIsLoading(false);
        Alert.alert(t("common:error"), (err as Error).message);
      }
    },
    [productId, isCreateMode, currentNavigation, t],
  );

  // Handle stock adjustment
  const handleStockAdjustment = useCallback(
    async (quantityChange: number, reason: string) => {
      if (!reason?.trim()) {
        Alert.alert(
          t("products.adjustmentReason"),
          t("products.validationRequired").replace(
            "This field is required",
            t("products.adjustmentReason"),
          ),
        );
        return;
      }

      try {
        await adjustStock(productId!, quantityChange, reason);
        // Refresh product data
        if (productId) {
          const rows: any[] = await executeRead(
            // language=SQLite
            `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
               stock_quantity, minimum_stock_quantity, unit, is_active,
               created_at, updated_at
           FROM products
           WHERE id = ?`,
            [Number(productId)],
          );
          if (rows.length > 0) {
            const r = rows[0];
            setProduct({
              id: r.id,
              name: r.name,
              sku: r.sku || "",
              category: r.category || "",
              sale_price_centimes: r.sale_price_centimes,
              cost_price_centimes: r.cost_price_centimes,
              stock_quantity: r.stock_quantity,
              minimum_stock_quantity: r.minimum_stock_quantity,
              unit: r.unit || "pcs",
              is_active: r.is_active !== 0,
              created_at: r.created_at,
              updated_at: r.updated_at,
            });
          }
        }
      } catch (err) {
        Alert.alert(t("common:error"), (err as Error).message);
      }
    },
    [productId, t],
  );

  // Handle archive/reactivate
  const handleArchive = useCallback(async () => {
    const actionTitle = product?.is_active
      ? t("products.archive")
      : t("products.reactivate");
    const confirmText = product?.is_active ? t("products.deleteConfirm") : "OK";

    const handleConfirm = async () => {
      try {
        await executeWrite(
          // language=SQLite
          `UPDATE products
           SET is_active = ?,
               updated_at = datetime('now')
           WHERE id = ?`,
          [product?.is_active ? 0 : 1, productId],
        );
        // Refresh product data
        if (productId) {
          const rows: any[] = await executeRead(
            // language=SQLite
            `SELECT id, name, sku, category, sale_price_centimes, cost_price_centimes,
                 stock_quantity, minimum_stock_quantity, unit, is_active,
                 created_at, updated_at
             FROM products
             WHERE id = ?`,
            [Number(productId)],
          );
          if (rows.length > 0) {
            const r = rows[0];
            setProduct({
              id: r.id,
              name: r.name,
              sku: r.sku || "",
              category: r.category || "",
              sale_price_centimes: r.sale_price_centimes,
              cost_price_centimes: r.cost_price_centimes,
              stock_quantity: r.stock_quantity,
              minimum_stock_quantity: r.minimum_stock_quantity,
              unit: r.unit || "pcs",
              is_active: r.is_active !== 0,
              created_at: r.created_at,
              updated_at: r.updated_at,
            });
          }
        }
        currentNavigation?.back();
      } catch (err) {
        Alert.alert(t("common:error"), (err as Error).message);
      }
    };

    Alert.alert(
      actionTitle,
      t("common:confirmDialog"),
      [
        { text: t("common:cancel"), style: "cancel" },
        { text: confirmText, onPress: handleConfirm },
      ],
      { cancelable: false },
    );
  }, [productId, product, t, currentNavigation]);

  return (
    <ThemedView type="background" style={styles.container}>
      {isLoading && (
        <ThemedView style={styles.loadingView}>
          <ThemedText type="small" style={styles.loadingText}>
            {t("common:loading")}
          </ThemedText>
        </ThemedView>
      )}
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <ThemedView style={styles.card}>
          {!product && isEditMode && (
            <ThemedView style={styles.emptyState}>
              <ThemedText type="subtitle" style={styles.emptyText}>
                {t("products.noProductFound")}
              </ThemedText>
            </ThemedView>
          )}
          {product && (
            <ThemedView style={styles.form}>
              <ThemedText type="title" style={styles.title}>
                {t("products.formTitle")}
              </ThemedText>

              <ThemedText type="subtitle" style={styles.subtitle}>
                {t(
                  isEditMode
                    ? "products.formSubtitle"
                    : "products.formSubtitle",
                )}
              </ThemedText>

              {/* Name */}
              <FormField label={t("products.name")}>
                <TextInput
                  value={product?.name || ""}
                  onChangeText={(value) =>
                    setProduct((prev) => ({ ...prev, name: value }) as Product)
                  }
                  placeholder={t("products.placeholder")}
                  autoCapitalize="words"
                  style={styles.input}
                />
              </FormField>

              {/* SKU */}
              <FormField label={t("products.sku")}>
                <TextInput
                  value={product?.sku || ""}
                  onChangeText={(value) =>
                    setProduct(
                      (prev) => ({ ...prev, sku: value || "" }) as Product,
                    )
                  }
                  placeholder="FL-001, OI-001, etc."
                  keyboardType="default"
                  autoCapitalize="characters"
                  style={styles.input}
                />
              </FormField>

              {/* Category */}
              <FormField label={t("products.category")}>
                <TextInput
                  value={product?.category || ""}
                  onChangeText={(value) =>
                    setProduct(
                      (prev) => ({ ...prev, category: value || "" }) as Product,
                    )
                  }
                  placeholder="مخبوزات, مطبخ, etc."
                  style={styles.input}
                />
              </FormField>

              {/* Sale Price */}
              <FormField label={t("products.salePrice")}>
                <TextInput
                  value={product?.sale_price_centimes.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
                    setProduct(
                      (prev) =>
                        ({ ...prev, sale_price_centimes: num || 0 }) as Product,
                    );
                  }}
                  keyboardType="numeric"
                  placeholder={t("products.placeholder")}
                  style={styles.input}
                />
                <ThemedText type="small" style={styles.hint}>
                  {t("products.salePriceCentimes")}
                </ThemedText>
              </FormField>

              {/* Cost Price */}
              <FormField label={t("products.costPrice")}>
                <TextInput
                  value={product?.cost_price_centimes.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value.replace(/[^0-9]/g, ""), 10);
                    setProduct(
                      (prev) =>
                        ({ ...prev, cost_price_centimes: num || 0 }) as Product,
                    );
                  }}
                  keyboardType="numeric"
                  placeholder={t("products.placeholder")}
                  style={styles.input}
                />
                <ThemedText type="small" style={styles.hint}>
                  {t("products.salePriceCentimes")}
                </ThemedText>
              </FormField>

              {/* Current Stock */}
              <FormField label={t("products.stock")}>
                <TextInput
                  value={product?.stock_quantity.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value, 10);
                    setProduct(
                      (prev) =>
                        ({ ...prev, stock_quantity: num || 0 }) as Product,
                    );
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  style={styles.input}
                />
                {isCreateMode && (
                  <ThemedText type="small" style={styles.hint}>
                    {t("products.stockCreateNote")}
                  </ThemedText>
                )}
              </FormField>

              {/* Minimum Stock Threshold */}
              <FormField label={t("products.minimumStock")}>
                <TextInput
                  value={product?.minimum_stock_quantity.toString()}
                  onChangeText={(value) => {
                    const num = parseInt(value, 10);
                    setProduct(
                      (prev) =>
                        ({
                          ...prev,
                          minimum_stock_quantity: num || 0,
                        }) as Product,
                    );
                  }}
                  keyboardType="numeric"
                  placeholder="0"
                  style={styles.input}
                />
              </FormField>

              {/* Unit */}
              <FormField label={t("products.unit")}>
                <TextInput
                  value={product?.unit || "pcs"}
                  onChangeText={(value) =>
                    setProduct((prev) => ({ ...prev, unit: value }) as Product)
                  }
                  style={styles.input}
                />
                <ThemedText type="small" style={styles.hint}>
                  {t("products.unitPiece")} | {t("products.unitKg")} |{" "}
                  {t("products.unitLiter")} | {t("products.unitPack")} |{" "}
                  {t("products.unitBox")} | {t("products.unitOther")}
                </ThemedText>
              </FormField>

              {/* Stock Adjustment Section (only in edit/detail mode) */}
              {!isCreateMode && (
                <View style={styles.adjustmentSection}>
                  <ThemedText type="small" style={styles.sectionTitle}>
                    {t("products.stockAdjustment")}
                  </ThemedText>

                  <TouchableOpacity
                    style={styles.adjustmentButton}
                    onPress={() => {
                      currentNavigation?.push("stock-adjustment", {
                        productId: product.id,
                        productName: product.name,
                        currentStock: product.stock_quantity,
                      });
                    }}
                  >
                    <ThemedText
                      type="small"
                      style={styles.adjustmentButtonText}
                    >
                      {t("products.adjustStock")}
                    </ThemedText>
                  </TouchableOpacity>
                </View>
              )}

              {/* Action buttons */}
              <View style={styles.buttonRow}>
                <PrimaryButton
                  title={t("products.formSave")}
                  loading={false}
                  onPress={() => product && handleSave(product)}
                />
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => currentNavigation?.back()}
                >
                  <ThemedText type="small" style={styles.cancelText}>
                    {t(
                      isEditMode
                        ? "products.formCancel"
                        : "products.formCancel",
                    )}
                  </ThemedText>
                </TouchableOpacity>

                {isEditMode && (
                  <TouchableOpacity
                    style={styles.archiveButton}
                    onPress={() => handleArchive()}
                  >
                    <ThemedText type="small" style={styles.archiveText}>
                      {product.is_active
                        ? t("products.archive")
                        : t("products.reactivate")}
                    </ThemedText>
                  </TouchableOpacity>
                )}
              </View>
            </ThemedView>
          )}
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F7F4",
  },
  scroll: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    flexGrow: 1,
    maxWidth: 400,
    width: "100%",
    padding: 20,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    margin: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 14,
    color: "#6B7280",
    marginBottom: 24,
    textAlign: "center",
  },
  input: {
    height: 50,
    borderColor: "#D1D5DB",
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
    marginBottom: 16,
    backgroundColor: "white",
  },
  hint: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
    color: "#6B7280",
  },
  adjustmentSection: {
    marginVertical: 20,
    paddingVertical: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#E5E5E5",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#E5E5E5",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 500,
    marginTop: 20,
    marginBottom: 12,
    color: "#374151",
  },
  adjustmentButton: {
    padding: 12,
    backgroundColor: "#D1D5DB",
    borderRadius: 8,
    marginBottom: 8,
    alignItems: "center",
  },
  adjustmentButtonText: {
    color: "#1A1A1A",
    fontWeight: 500,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 24,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
  },
  emptyText: {
    color: "#6B7280",
  },
  form: {
    padding: 24,
  },
  cancelText: {
    color: "#6B7280",
  },
  archiveText: {
    color: "#B91C1C",
  },
  archiveButton: {
    padding: 8,
    backgroundColor: "#E5E5E5",
    borderRadius: 8,
  },
  loadingView: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    fontSize: 14,
    color: "#6B7280",
  },
});
