import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface VoiceButtonProps {
  onVoiceStart?: () => void;
  onVoiceEnd?: (finalText?: string) => void;
  onTranscript?: (transcript: string) => void;
  disabled?: boolean;
}

export function VoiceButton({
  onVoiceStart,
  onVoiceEnd,
  onTranscript,
  disabled = false,
}: VoiceButtonProps) {
  const { t, i18n } = useTranslation();
  const [hasPermission, setHasPermission] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);
  const transcriptRef = useRef<string>("");

  // Check if we're on a device (not web/mock)
  const isWeb = Platform.OS === "web";

  // Clean up recognition instance on unmount
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore cleanup errors
        }
      }
    };
  }, []);

  const requestPermission = async (): Promise<boolean> => {
    try {
      if (isWeb) {
        setHasPermission(true);
        return true;
      }

      setHasPermission(true);
      return true;
    } catch (error) {
      console.error("Microphone permission error:", error);
      setHasPermission(false);
      return false;
    }
  };

  /**
   * Start web speech recognition using window.SpeechRecognition or window.webkitSpeechRecognition
   */
  const startWebSpeech = (): boolean => {
    const windowObj = typeof window !== "undefined" ? (window as any) : null;
    const SpeechRecognition =
      windowObj?.SpeechRecognition || windowObj?.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: prompt for manual command text if browser lacks Web Speech API
      const input = windowObj?.prompt?.(
        t("voice.title", "Voice Command") + ": " + t("voice.sayProductName", "Speak or type sale command"),
        ""
      );
      if (input && input.trim()) {
        onTranscript?.(input.trim());
        onVoiceEnd?.(input.trim());
      }
      return false;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      transcriptRef.current = "";

      // Select locale for speech recognition based on current i18n language
      const currentLang = i18n.language || "fr";
      if (currentLang.startsWith("ar")) {
        recognition.lang = "ar-DZ";
      } else if (currentLang.startsWith("fr")) {
        recognition.lang = "fr-DZ";
      } else {
        recognition.lang = "en-US";
      }

      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        onVoiceStart?.();
      };

      recognition.onresult = (event: any) => {
        let currentTranscript = "";
        for (let i = 0; i < event.results.length; i++) {
          currentTranscript += event.results[i][0]?.transcript || "";
        }
        transcriptRef.current = currentTranscript;
        onTranscript?.(currentTranscript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event?.error);
        setIsListening(false);
        if (event?.error === "not-allowed" || event?.error === "permission-denied") {
          Alert.alert(
            t("permissions.microphone", "Microphone access"),
            t("permissions.microphoneDescription", "Microphone permission is required for voice commands.")
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        onVoiceEnd?.(transcriptRef.current);
      };

      recognition.start();
      return true;
    } catch (err) {
      console.error("Failed to start Web Speech Recognition:", err);
      setIsListening(false);
      return false;
    }
  };

  const stopWebSpeech = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
    }
    setIsListening(false);
    onVoiceEnd?.(transcriptRef.current);
  };

  const handlePress = async () => {
    if (disabled) return;

    if (isListening) {
      if (isWeb) {
        stopWebSpeech();
      } else {
        handleEnd();
      }
      return;
    }

    if (isWeb) {
      startWebSpeech();
      return;
    }

    // Native flow
    if (!hasPermission) {
      const permissionGranted = await requestPermission();
      if (!permissionGranted) {
        Alert.alert(
          t("permissions.microphone", "Microphone"),
          t("permissions.microphoneDescription", "Microphone permission required")
        );
        return;
      }
    }

    setIsListening(true);
    onVoiceStart?.();
  };

  const handleEnd = () => {
    setIsListening(false);
    onVoiceEnd?.(transcriptRef.current);
  };

  // Styles - LTR layout, keeps app architecture LTR in all languages
  const styles = StyleSheet.create({
    container: {
      padding: 12,
      backgroundColor: isListening ? "#E8F5E9" : "#f0f9f0",
      borderWidth: isListening ? 2 : 1,
      borderColor: isListening ? "#2E7D32" : "#1B6B3A",
      borderRadius: 20,
      alignItems: "center",
      marginVertical: 8,
      flexDirection: "row",
      justifyContent: "center",
    },
    iconContainer: {
      marginRight: 8,
    },
    buttonText: {
      color: "#1B6B3A",
      fontSize: 14,
      fontWeight: isListening ? "700" : "500",
    },
  });

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      style={styles.container}
      accessibilityRole="button"
      accessibilityLabel={isListening ? t("voice.listening", "Listening...") : t("voice.title", "Voice Command")}
    >
      <View style={styles.iconContainer}>
        <Text>
          {isListening ? "🔴" : "🎤"}
        </Text>
      </View>
      <Text style={styles.buttonText}>
        {isListening ? t("voice.listening", "Listening...") : t("voice.title", "Voice Command")}
      </Text>
    </TouchableOpacity>
  );
}
