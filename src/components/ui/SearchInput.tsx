import { SymbolView } from "expo-symbols";
import {
  StyleProp,
  StyleSheet,
  TextInput,
  type TextInputProps,
  View,
  ViewStyle,
} from "react-native";

import {
  BorderRadius,
  ComponentDimensions,
  Spacing,
  Typography,
} from "@/constants/theme";
import { useTheme } from "@/hooks/use-theme";

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
  const theme = useTheme();
  const isArabic = locale?.startsWith("ar");

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderColor: theme.border,
        },
        containerStyle,
      ]}
    >
      <View style={styles.iconWrapper}>
        <SymbolView
          name={{
            ios: "magnifyingglass",
            android: "search",
            web: "search",
          }}
          size={18}
          tintColor={theme.textSecondary}
        />
      </View>
      <TextInput
        style={[
          styles.input,
          { color: theme.textPrimary },
          isArabic && { textAlign: "right" },
          style,
        ]}
        placeholder={placeholder}
        placeholderTextColor={theme.textMuted}
        onSubmitEditing={onSearch}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    height: ComponentDimensions.searchInputHeight,
    borderWidth: 1,
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
    paddingVertical: 0,
  },
});
