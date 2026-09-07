import { SymbolView } from "expo-symbols";
import { Pressable, StyleSheet, type PressableProps } from "react-native";

import { ThemedView } from "@/components/themed-view";
import { useTheme } from "@/hooks/use-theme";

export type IconButtonIcon =
  | "chevron-left"
  | "chevron-right"
  | "menu"
  | "search"
  | "download"
  | "upload"
  | "trash"
  | "edit"
  | "save"
  | "delete"
  | "arrow-left"
  | "arrow-right";

export interface IconButtonProps extends PressableProps {
  icon: IconButtonIcon;
  accessibleLabel: string;
  size?: number;
  locale?: "ar" | "fr" | "en";
}

export function IconButton({
  icon,
  accessibleLabel,
  size = 24,
  onPress,
  ...rest
}: IconButtonProps) {
  const theme = useTheme();

  return (
    <Pressable
      style={styles.button}
      onPress={onPress}
      accessibilityLabel={accessibleLabel}
      {...rest}
    >
      <ThemedView style={styles.iconContainer}>
        <SymbolView
          name={getIconName(icon) as never}
          size={size}
          weight="bold"
          tintColor={theme.text}
        />
      </ThemedView>
    </Pressable>
  );
}

function getIconName(icon: IconButtonIcon): string {
  const map: Record<string, { ios: string; android: string; web: string }> = {
    "chevron-left": {
      ios: "chevron.left",
      android: "chevron_left",
      web: "chevron_left",
    },
    "chevron-right": {
      ios: "chevron.right",
      android: "chevron_right",
      web: "chevron_right",
    },
    menu: { ios: "menu", android: "menu", web: "menu" },
    search: { ios: "search", android: "search", web: "search" },
    download: { ios: "download", android: "download", web: "download" },
    upload: { ios: "upload", android: "upload", web: "upload" },
    trash: { ios: "trash", android: "trash", web: "trash" },
    edit: { ios: "edit", android: "edit", web: "edit" },
    save: { ios: "save", android: "save", web: "save" },
    delete: { ios: "trash", android: "trash", web: "trash" },
    "arrow-left": {
      ios: "arrow-left",
      android: "arrow_left",
      web: "arrow-left",
    },
    "arrow-right": {
      ios: "arrow-right",
      android: "arrow_right",
      web: "arrow-right",
    },
  };
  return map[icon]?.ios || map["chevron-left"]?.ios;
}

const styles = StyleSheet.create({
  button: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.light.surface,
  },
  iconContainer: {
    width: 24,
    height: 24,
  },
});
