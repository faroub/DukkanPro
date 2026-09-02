import { View, Text, StyleSheet } from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { Spacing } from '@/constants/theme';

export default function OnboardingScreen() {
  return (
    <ThemedView type="background" style={styles.container}>
      <ThemedView style={styles.content}>
        <ThemedText type="title" style={styles.title}>
          {/* i18n: onboarding.title */}
          Bienvenue / Welcome / خوش آمدید
        </ThemedText>

        <ThemedText type="subtitle" style={styles.subtitle}>
          {/* i18n: onboarding.subtitle */}
          L'application Dukkan OS aide les micro-entrepreneurs algériens à gérer
          leurs ventes, clients et inventaires.
        </ThemedText>

        <ThemedText type="small" style={styles.description}>
          {/* i18n: onboarding.description */}
          Enregistrez les ventes, suivez la créance client, gérez l'inventaire
          et recevez des alertes de stock faible.
        </ThemedText>

        <ThemedView style={styles.buttonContainer}>
          {/* Continue button - will be replaced with onboarding completion handler */}
          <ThemedText type="subtitle" style={{ textAlign: 'center', marginTop: Spacing.lg }}>
            Get Started
          </ThemedText>
        </ThemedView>
      </ThemedView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xxl,
  },
  content: {
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
  },
  title: {
    fontSize: 32,
    fontWeight: 600,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  description: {
    fontSize: 14,
    color: '#1A1A1A',
    marginBottom: Spacing.lg,
    textAlign: 'center',
  },
  buttonContainer: {
    width: '100%',
    alignItems: 'center',
  },
});