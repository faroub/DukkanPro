import { View, TextInput, Pressable, StyleSheet } from 'react-native';
import { useTranslation } from "react-i18next";
import { ThemedText } from "@/components/themed-text";

interface CustomerSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  disabled?: boolean;
}

export function CustomerSearchBar({ onSearch, onClear, disabled }: CustomerSearchBarProps) {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <TextInput
        placeholder={t("customers:searchPlaceholder")}
        onChangeText={(text) => onSearch(text)}
        style={disabled ? { ...styles.input, opacity: 0.5 } : styles.input}
      />
      <Pressable
        style={styles.clearButton}
        onPress={onClear}
        disabled={disabled}
      >
        <ThemedText style={styles.clearText}>
          {t("common:clear")}
        </ThemedText>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  input: {
    flex: 1,
    height: 48,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 14,
  },
  clearButton: {
    width: 40,
    height: 48,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
});