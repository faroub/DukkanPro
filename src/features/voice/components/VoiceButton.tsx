import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import * as Device from 'expo-device';
import * as Permissions from 'expo-permissions';

interface VoiceButtonProps {
  onVoiceStart?: () => void;
  onVoiceEnd?: () => void;
  disabled?: boolean;
}

export function VoiceButton({ onVoiceStart, onVoiceEnd, disabled = false }: VoiceButtonProps) {
  const { t } = useTranslation();
  const [hasPermission, setHasPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // Check if we're on a device (not web/mock)
  const isDevice = Platform.OS !== 'web';

  const requestPermission = async () => {
    try {
      // On web, we can't request microphone permission the same way
      if (!isDevice) {
        setHasPermission(true);
        return;
      }

      const { status } = await Permissions.askAsync(Permissions.MICROPHONE);
      setHasPermission(status === 'granted');
    } catch (error) {
      console.error('Microphone permission error:', error);
      setHasPermission(false);
    }
  };

  const handlePress = async () => {
    if (disabled) return;

    // Request permission if not granted
    if (!hasPermission) {
      await requestPermission();
      if (!hasPermission) {
        Alert.alert(
          t('voice.microphonePermissionRequired'),
          t('voice.microphonePermissionDenied')
        );
        return;
      }
    }

    setIsListening(true);
    onVoiceStart?.();
  };

  const handleEnd = () => {
    setIsListening(false);
    onVoiceEnd?.();
  };

  // Styles - LTR layout, keeps app architecture LTR in all languages
  const styles = StyleSheet.create({
    container: {
      padding: 12,
      backgroundColor: '#f0f9f0',
      borderWidth: 1,
      borderColor: '#1B6B3A',
      borderRadius: 20,
      alignItems: 'center',
      marginVertical: 8,
      // LTR: keep icon on left, text on right regardless of language
      flexDirection: 'row',
      justifyContent: 'center',
    },
    iconContainer: {
      marginRight: 8,
    },
    textContainer: {
      // Arabic text may be right-aligned inside, but layout stays LTR
    },
    buttonText: {
      color: '#1B6B3A',
      fontSize: 14,
    },
    disabledOpacity: {
      opacity: 0.5,
    },
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      onLongPress={handlePress}
      disabled={disabled || !hasPermission}
      style={styles.container}
      accessibilityState={hasPermission ? { disabled: false } : { disabled: true }}
    >
      <View style={styles.iconContainer}>
        {/* Microphone icon - using expo-symbols for Expo SDK 57 compatibility */}
        {hasPermission && !isListening && (
          <Text accessibilityRole="button" accessibilityLabel={t('voice.microphone')}>🎤</Text>
        )}
        {!hasPermission && (
          <Text accessibilityRole="button" accessibilityLabel={t('voice.microphone')}>🎤</Text>
        )}
      </View>
      <Text style={styles.buttonText}>{isListening ? t('voice.listening') : t('voice.microphone')}</Text>
    </TouchableOpacity>
  );
}