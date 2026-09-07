import { SymbolView } from "expo-symbols";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import { ThemedView } from "@/components/themed-view";
import {
  BorderRadius,
  Colors,
  ComponentDimensions,
  Spacing,
  Typography,
} from "@/constants/theme";

export interface SearchInputProps extends TextInputProps {
  placeholder: string;
  onSearch?: () => void;
  locale?: "ar" | "fr" | "en";
  containerStyle?: StyleProp<ViewStyle>;
}

export function SearchInput({
  placeholder,
  onSearch,
  locale = "fr",
  containerStyle,
  style,
  ...rest
}: SearchInputProps) {
  return (
    <ThemedView style={[styles.container, containerStyle]}>
      <View style={styles.iconWrapper}>
        <SymbolView
          name={{
            ios: "magnifyingglass",
            android: "search",
            web: "search",
          }}
          size={18}
          tintColor={Colors.light.textSecondary}
        />
      </View>
      <TextInput
        style={[styles.input, style]}
        placeholder={placeholder}
        placeholderTextColor={Colors.light.textMuted}
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
    backgroundColor: Colors.light.surface,
    height: ComponentDimensions.searchInputHeight,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
  },
  iconWrapper: {
    marginRight: Spacing.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  input: {
    flex: 1,
    ...Typography.body,
    fontSize: 15,
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
});
