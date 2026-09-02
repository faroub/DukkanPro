import { Platform, StyleSheet, Text, type TextProps } from 'react-native';

import { Fonts } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getTextAlignment, textStyle } from '@/utils/text';

export type AppTextProps = TextProps & {
  align?: 'left' | 'right' | 'center' | 'auto';
  locale?: 'ar' | 'fr' | 'en';
};

export function AppText({ align = 'left', locale = 'fr', style, ...rest }: AppTextProps) {
  const theme = useTheme();
  const alignment = align === 'auto' ? getTextAlignment(locale as 'ar' | 'fr' | 'en') : align;

  return (
    <Text
      style={[
        styles.base,
        // Apply alignment at text level only, never reverse parent layout
        { textAlign: alignment },
        style,
      ]}
      {...rest}
    />
  );
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.body.fontFamily,
    fontSize: Fonts.body.fontSize,
    lineHeight: Fonts.body.lineHeight,
    letterSpacing: Fonts.body.letterSpacing,
  },
});