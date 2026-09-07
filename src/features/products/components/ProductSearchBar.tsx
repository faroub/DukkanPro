import { ThemedText } from "@/components/themed-text";
import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";
import { useDebounce } from "@/hooks/useDebounce";
import { useState } from "react";
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
  const { t } = useTranslation();
  const [query, setQuery] = useState(initialQuery);

  // Debounced search to avoid too many re-renders
  const debouncedQuery = useDebounce(query, 300);

  const handleSubmit = () => {
    onSearch(debouncedQuery);
  };

  return (
    <ThemedView style={styles.container}>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder={t("products.placeholder")}
          value={query}
          onChangeText={(text: string) => setQuery(text)}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <ThemedText type="small" style={styles.clearButtonText}>
              {t("clear")}
            </ThemedText>
          </TouchableOpacity>
        )}
      </View>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.lg,
  },
  inputContainer: {
    backgroundColor: "#FFFFFF",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    elevation: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: 44,
  },
  clearButton: {
    padding: 6,
  },
  clearButtonText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
});
