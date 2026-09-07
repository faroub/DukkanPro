import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { create } from "@/database/repositories/saleRepository";
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
import { formatCentimes } from "@/utils/money";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, FlatList, Modal, Pressable, View } from "react-native";

export default function SellScreen() {
  const { t } = useTranslation();
  const { products, loading, error } = useProducts({ is_active: true });
  const {
    items,
    addItem,
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

  const [cartVisible, setCartVisible] = useState(false);
  const [checkoutVisible, setCheckoutVisible] = useState(false);
  const [receiptVisible, setReceiptVisible] = useState(false);
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

  // Update voice available products when products change
  useEffect(() => {
    const availableProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category ?? "",
      price_centimes: p.sale_price_centimes,
      stock: p.stock_quantity,
    }));
    setVoiceAvailableProducts(availableProducts);
  }, [products]);

  // Handle product add to cart from search sheet
  const handleAddToCart = useCallback(
    (product: any, quantity: number) => {
      addItemWithProduct(product, quantity);
    },
    [addItemWithProduct],
  );

  // Handle cart open/close
  const toggleCart = useCallback(() => {
    setCartVisible(!cartVisible);
  }, [cartVisible]);

  // Handle checkout
  const handleCheckout = useCallback(async () => {
    if (items.length === 0) {
      setErrorState(t("sell.empty_cart"));
      return;
    }

    setIsSaving(true);
    setErrorState(null);

    try {
      // Create the sale atomically
      const saleInput = {
        customerId: customerId || undefined,
        paymentMethod,
        items: items.map((item: any) => ({
          productId: item.product.id,
          quantity: item.quantity,
          unitSalePriceCentimes: item.product.sale_price_centimes,
          note,
        })),
        note,
        discountCentimes: discount,
      };

      // Use create to create sale atomically
      const newSale = await create(saleInput);
      setSale(newSale);
      setReceiptVisible(true);
      setIsSaving(false);

      // Clear cart after successful sale
      clearCart();
      setCheckoutVisible(false);
      setPaymentMethod("cash");
      setNote("");
      setCustomerId(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create sale";
      setErrorState(message);
      setIsSaving(false);
    }
  }, [items, customerId, paymentMethod, discount, note, clearCart]);

  // Handle preserve cart toggle
  const togglePreserveCart = useCallback(() => {
    const newValue = !preserveCart;
    setPreserveCart(newValue);
  }, [preserveCart]);

  // Voice command handling
  const handleVoiceStart = useCallback(async () => {
    setVoiceCommand("");
    setParsedVoice(null);
  }, []);

  const handleVoiceEnd = useCallback((finalTranscript?: string) => {
    const textToParse = (finalTranscript || voiceCommand).trim();
    if (textToParse) {
      setVoiceCommand(textToParse);
      const availableProducts = products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category ?? "",
        price_centimes: p.sale_price_centimes,
        stock: p.stock_quantity,
      }));
      const parsed = parseSaleCommand(textToParse, availableProducts);
      if (parsed) {
        setParsedVoice(parsed);
        setVoiceVisible(true);
      } else {
        Alert.alert(
          t("voice.commandNotRecognized", "Commande non reconnue"),
          `"${textToParse}"`
        );
      }
    }
  }, [products, voiceCommand, t]);

  return (
    <ThemedView type="background" style={{ flex: 1 }}>
      {loading && (
        <ThemedView type="background" style={{ flex: 1, padding: 16 }}>
          <ThemedText
            type="caption"
            style={{ textAlign: "center", marginTop: 40 }}
          >
            {t("sell.loading")}
          </ThemedText>
        </ThemedView>
      )}

      {error && (
        <ThemedView type="background" style={{ flex: 1, padding: 16 }}>
          <ThemedText
            type="body"
            style={{ textAlign: "center", marginTop: 40, color: "red" }}
          >
            {error}
          </ThemedText>
        </ThemedView>
      )}

      {!loading && !error && (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item }) => (
            <View
              style={{ padding: 16, borderBottomWidth: 1, borderColor: "#eee" }}
            >
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <ThemedText type="body" style={{ flex: 1, fontWeight: "600" }}>
                  {item.name}
                </ThemedText>
                <ThemedText type="caption" style={{ color: "#666" }}>
                  {item.sku || ""}
                </ThemedText>
              </View>
              <ThemedText type="caption" style={{ marginTop: 2 }}>
                {item.unit}
              </ThemedText>

              <Pressable
                onPress={() => {
                  // Add one item to cart
                  addItemWithProduct(item, 1);
                }}
                style={{
                  padding: 16,
                  borderWidth: 1,
                  borderColor: "#1B6B3A",
                  borderRadius: 8,
                  marginTop: 8,
                }}
              >
                <ThemedText type="body" style={{ color: "#1B6B3A" }}>
                  {t("sell.add_to_cart")}
                </ThemedText>
              </Pressable>
            </View>
          )}
          ListFooterComponent={
            <View style={{ padding: 16 }}>
              <ThemedText type="body">
                Cart: {itemCount} items - {formatCentimes(total)}
              </ThemedText>
              <Pressable onPress={toggleCart} style={{ marginTop: 8 }}>
                <ThemedText type="body" style={{ color: "#1B6B3A" }}>
                  {t("sell.open_cart")}
                </ThemedText>
              </Pressable>
              <Pressable
                onPress={handleVoiceStart}
                style={{ marginTop: 8, marginLeft: 8 }}
              >
                <ThemedText type="body" style={{ color: "#1B6B3A" }}>
                  {t("voice.microphone")}
                </ThemedText>
              </Pressable>
            </View>
          }
        />
      )}

      {/* Cart Sheet */}
      {cartVisible && (
        <Modal
          visible={cartVisible}
          transparent
          animationType="slide"
          onRequestClose={toggleCart}
        >
          <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.4)" }}>
            <View
              style={{
                flex: 1,
                justifyContent: "flex-end",
                backgroundColor: "#fff",
                padding: 16,
              }}
            >
              <CartList
                items={items}
                onRemove={removeItem}
                onUpdateQuantity={updateQuantity}
                onPreserveCartToggle={togglePreserveCart}
                preserveCart={preserveCart}
                subtotal={subtotal}
                discount={discount}
                total={total}
                setDiscount={setDiscount}
              />
              <ThemedText
                type="small"
                style={{ marginTop: 8, textAlign: "center", color: "#6B7280" }}
              >
                {t("sell.clear_cart")}
              </ThemedText>
            </View>
          </View>
        </Modal>
      )}

      {/* Voice Input Button */}
      <VoiceButton
        onVoiceStart={handleVoiceStart}
        onVoiceEnd={handleVoiceEnd}
        onTranscript={(text) => setVoiceCommand(text)}
        disabled={isSaving}
      />

      {/* Checkout Sheet */}
      {checkoutVisible && (
        <CheckoutSheet
          visible={checkoutVisible}
          onRequestClose={() => setCheckoutVisible(false)}
          onCheckout={handleCheckout}
          cartTotal={total}
          isSaving={isSaving}
          error={errorState}
          setPaymentMethod={setPaymentMethod}
          customerId={customerId || undefined}
          setCustomerId={setCustomerId}
          note={note}
          setNote={setNote}
          t={t}
        />
      )}

      {/* Receipt Preview */}
      {receiptVisible && sale && (
        <ReceiptPreview
          visible={receiptVisible}
          onRequestClose={() => setReceiptVisible(false)}
          onNewSale={() => {
            setReceiptVisible(false);
            // Reset state for new sale
            clearCart();
            setIsSaving(false);
            setSale(null);
          }}
          sale={sale}
          t={t}
        />
      )}

      {/* Voice Review Sheet */}
      {parsedVoice && (
        <ReviewSheet
          isVisible={voiceVisible}
          onClose={() => setVoiceVisible(false)}
          onConfirm={(parsed) => {
            // Add the confirmed item to cart
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
  );
}
