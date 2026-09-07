import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { ThemedText } from "@/components/themed-text";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Shadows,
  Spacing,
  Typography,
} from "@/constants/theme";
import { formatCentimes } from "@/utils/money";

interface CartItemProps {
  product: any;
  quantity: number;
  onRemove: (productId: number) => void;
  onUpdateQuantity: (productId: number, quantity: number) => void;
}

export function CartItem({
  product,
  quantity,
  onRemove,
  onUpdateQuantity,
}: CartItemProps) {
  const lineTotal = product.sale_price_centimes * quantity;

  return (
    <View style={styles.card}>
      {/* Product Info Row */}
      <View style={styles.topRow}>
        <View style={styles.iconBox}>
          <SymbolView
            name={{
              ios: "bag.fill" as any,
              android: "shopping_bag" as any,
              web: "shopping_bag" as any,
            }}
            size={20}
            tintColor={Colors.light.primary}
          />
        </View>

        <View style={styles.infoCol}>
          <ThemedText style={styles.productName} numberOfLines={1}>
            {product.name}
          </ThemedText>
          <ThemedText style={styles.unitPrice}>
            Unit: {formatCentimes(product.sale_price_centimes)}
            {product.unit ? ` • ${product.unit}` : ""}
          </ThemedText>
        </View>

        <Pressable
          onPress={() => onRemove(product.id)}
          style={styles.removeBtn}
          accessibilityLabel="Remove item from cart"
          hitSlop={8}
        >
          <SymbolView
            name={{
              ios: "xmark" as any,
              android: "close" as any,
              web: "close" as any,
            }}
            size={16}
            tintColor={Colors.light.textMuted}
          />
        </Pressable>
      </View>

      {/* Stepper and Line Total Row */}
      <View style={styles.bottomRow}>
        <View style={styles.stepperContainer}>
          <Pressable
            onPress={() => {
              const newQty = Math.max(1, quantity - 1);
              onUpdateQuantity(product.id, newQty);
            }}
            style={styles.stepBtn}
            accessibilityLabel="Decrease quantity"
          >
            <SymbolView
              name={{
                ios: "minus" as any,
                android: "remove" as any,
                web: "remove" as any,
              }}
              size={18}
              tintColor={Colors.light.textPrimary}
            />
          </Pressable>

          <View style={styles.qtyBox}>
            <Text style={styles.qtyText}>{quantity}</Text>
          </View>

          <Pressable
            onPress={() => onUpdateQuantity(product.id, quantity + 1)}
            style={[styles.stepBtn, styles.stepBtnAdd]}
            accessibilityLabel="Increase quantity"
          >
            <SymbolView
              name={{
                ios: "plus" as any,
                android: "add" as any,
                web: "add" as any,
              }}
              size={18}
              tintColor={Colors.light.primary}
            />
          </Pressable>
        </View>

        <View style={styles.totalCol}>
          <Text style={styles.lineTotal}>{formatCentimes(lineTotal)}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.xl,
    padding: ComponentDimensions.cardPadding,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: ComponentDimensions.cardGap,
    ...Shadows.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    justifyContent: "center",
    alignItems: "center",
  },
  infoCol: {
    flex: 1,
  },
  productName: {
    ...Typography.label,
    fontSize: 15,
    color: Colors.light.textPrimary,
  },
  unitPrice: {
    ...Typography.caption,
    color: Colors.light.textSecondary,
    marginTop: 2,
  },
  removeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.backgroundElement,
    justifyContent: "center",
    alignItems: "center",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.light.borderLight,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.backgroundElement,
    borderRadius: BorderRadius.lg,
    padding: 2,
  },
  stepBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  stepBtnAdd: {
    backgroundColor: Colors.light.primaryLight,
  },
  qtyBox: {
    minWidth: 36,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  qtyText: {
    ...Typography.body,
    fontWeight: "700",
    color: Colors.light.textPrimary,
  },
  totalCol: {
    alignItems: "flex-end",
  },
  lineTotal: {
    ...Typography.moneySmall,
    color: Colors.light.primary,
    fontWeight: "700",
  },
});
