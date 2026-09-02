import { StyleSheet, TextInput, type TextInputProps } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { Spacing } from "@/constants/theme";

export interface SearchInputProps extends TextInputProps {
  placeholder: string;
  onSearch?: () => void;
  locale?: "ar" | "fr" | "en";
}

export function SearchInput({
  placeholder,
  onSearch,
  locale = "fr",
  ...rest
}: SearchInputProps) {
  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        onSubmitEditing={onSearch}
        {...rest}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E5E5",
    borderRadius: Spacing.md,
    paddingHorizontal: Spacing.md,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1A1A1A",
  },
});
