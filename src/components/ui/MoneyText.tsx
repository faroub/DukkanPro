import { StyleSheet, Text, type TextProps } from 'react-native';

import { formatCentimes } from '@/utils/money';
import { useTheme } from '@/hooks/use-theme';

export type MoneyTextProps = TextProps & {
  centimes: number;
  locale?: 'ar' | 'fr' | 'en';
  style?: React.TextProps['style'];
};

export function MoneyText({
  centimes,
  locale = 'fr',
  style,
}: MoneyTextProps) {
  const formatted = formatCentimes(centimes, locale);
  const theme = useTheme();
  const color = centimes >= 0 ? theme.positive : theme.destructive;

  return (
    <Text style={[
      styles.text,
      style,
      { color },
    ]}>
      {formatted}
    </Text>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 16,
    fontWeight: 500,
  },
});