import { Colors, Spacing, Shadows, BorderRadius } from "@/constants/theme";
import { useDebounce } from "@/hooks/useDebounce";
import { useTheme } from "@/hooks/use-theme";
import { Ionicons } from "@expo/vector-icons";
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { StyleSheet, TextInput, TouchableOpacity, View } from "react-native";

interface ProductSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  initialQuery?: string;
  disabled?: boolean;
}

export function ProductSearchBar({
  onSearch,
  onClear,
  initialQuery = "",
  disabled = false,
}: ProductSearchBarProps) {
  const theme = useTheme();
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);

  // Debounced search to avoid too many re-renders
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    onSearch(debouncedQuery);
  }, [debouncedQuery]);

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.searchContainer,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={20}
          color={theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.input, { color: theme.textPrimary }]}
          placeholder={t("products:placeholder")}
          placeholderTextColor={theme.textMuted}
          value={query}
          onChangeText={(text: string) => setQuery(text)}
          returnKeyType="search"
          editable={!disabled}
        />
        {query.length > 0 && (
          <TouchableOpacity
            style={styles.clearButton}
            onPress={() => {
              setQuery("");
              onClear();
            }}
          >
            <Ionicons
              name="close-circle"
              size={18}
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>
      <TouchableOpacity
        style={[
          styles.scanButton,
          { backgroundColor: theme.surface, borderColor: theme.border },
        ]}
        activeOpacity={0.7}
        onPress={() => {
          /* Barcode scanner not implemented in MVP tasks but UI present */
        }}
      >
        <Ionicons name="barcode-outline" size={24} color={theme.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    paddingHorizontal: Spacing.sm,
    height: 48,
    ...Shadows.sm,
  },
  searchIcon: {
    marginRight: Spacing.xs,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.light.textPrimary,
    height: "100%",
  },
  clearButton: {
    padding: Spacing.xs,
  },
  scanButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.light.surface,
    borderRadius: BorderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.sm,
  },
});
