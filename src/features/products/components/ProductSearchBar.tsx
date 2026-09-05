import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { useState } from 'react';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';
import { useTranslation } from 'react-i18next';
import { useDebounce } from '@/hooks/useDebounce';

interface ProductSearchBarProps {
  onSearch: (query: string) => void;
  onClear: () => void;
  initialQuery?: string;
  disabled?: boolean;
}

export function ProductSearchBar({ onSearch, onClear, initialQuery = '', disabled = false }: ProductSearchBarProps) {
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
          placeholder={t("products:placeholder")}
          value={query}
          onChangeText ={(text: string) => setQuery(text)}
          returnKeyType="search"
          onSubmitEditing={handleSubmit}
        />
        {query.length > 0 && (
          <TouchableOpacity style={styles.clearButton} onPress={onClear}>
            <ThemedText type="small" style={styles.clearButtonText}>
              {t("common:clear")}
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
    backgroundColor: '#FFFFFF',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#E5E5E5',
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
    color: '#6B7280',
    fontSize: 12,
  },
});