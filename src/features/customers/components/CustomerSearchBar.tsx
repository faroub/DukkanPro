import React, { useState } from "react";
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { useTranslation } from "react-i18next";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Spacing, BorderRadius } from "@/constants/theme";

interface CustomerSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function CustomerSearchBar({
  onSearch,
  onClear,
  disabled,
}: CustomerSearchBarProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");

  const handleChangeText = (text: string) => {
    setQuery(text);
    onSearch(text);
  };

  const handleClear = () => {
    setQuery("");
    onClear();
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <MaterialIcons
          name="search"
          size={20}
          color={Colors.light.textSecondary}
        />
      </View>
      <TextInput
        value={query}
        onChangeText={handleChangeText}
        placeholder={t("customers:searchPlaceholder")}
        placeholderTextColor={Colors.light.textMuted}
        editable={!disabled}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, disabled && styles.inputDisabled]}
      />
      {query.length > 0 && (
        <TouchableOpacity
          onPress={handleClear}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          style={styles.clearButton}
          accessibilityLabel={t("common:clear")}
        >
          <MaterialIcons
            name="close"
            size={18}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surfaceAlt,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.md,
    height: 48,
    marginBottom: Spacing.md,
  },
  iconContainer: {
    marginRight: Spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
  inputDisabled: {
    opacity: 0.5,
  },
  clearButton: {
    padding: Spacing.xs,
  },
});
