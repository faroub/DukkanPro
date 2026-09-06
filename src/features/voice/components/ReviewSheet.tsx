import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  FlatList,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { parseSaleCommand } from '@/services/voice/voiceSaleParser';
import type { AvailableProduct } from '@/services/voice/voiceSaleParser';

interface ReviewSheetProps {
  isVisible: boolean;
  onClose: () => void;
  onConfirm: (parsed: any) => void;
  availableProducts: AvailableProduct[];
  commandText: string;
}

export function ReviewSheet({ isVisible, onClose, onConfirm, availableProducts, commandText }: ReviewSheetProps) {
  const { t } = useTranslation();
  const [parsed, setParsed] = useState<any | null>(null);
  const [showAmbiguityChoices, setShowAmbiguityChoices] = useState(false);
  const [ambiguousChoices, setAmbiguousChoices] = useState<any[]>([]);

  // Parse the command when text changes or sheet opens
  React.useEffect(() => {
    const result = parseSaleCommand(commandText, availableProducts);
    if (result) {
      setParsed(result);
      // Check if ambiguous and show choices
      if (result.matchType === 'ambiguous') {
        setShowAmbiguityChoices(true);
        setAmbiguousChoices(result.productMatchResult?.choices || []);
      } else {
        setShowAmbiguityChoices(false);
      }
    } else {
      setParsed(null);
      setShowAmbiguityChoices(false);
    }
  }, [commandText, availableProducts]);

  if (!isVisible || !parsed) {
    return null;
  }

  const handleConfirm = () => {
    if (parsed.matchType === 'ambiguous') {
      // Show choices and wait for user selection
      // In a full implementation, this would open a choice sheet
      Alert.alert(t('voice.commandNotRecognized'), t('voice.pleaseSelectProduct'));
      return;
    }

    if (parsed.matchType === 'none') {
      Alert.alert(t('voice.commandNotRecognized'), t('voice.noProductFound'));
      return;
    }

    onConfirm(parsed);
  };

  const handleClose = () => {
    onClose();
  };

  const styles = StyleSheet.create({
    modalContainer: {
      margin: 0,
      marginTop: 20,
      backgroundColor: '#fff',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      maxHeight: '80%',
    },
    header: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
      justifyContent: 'space-between',
    },
    title: {
      fontSize: 18,
      fontWeight: '600',
    },
    closeButton: {
      padding: 8,
    },
    listItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: '#eee',
    },
    productInfo: {
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    quantityText: {
      fontSize: 14,
      color: '#666',
    },
    paymentText: {
      fontSize: 12,
      color: '#888',
    },
    confirmButton: {
      padding: 12,
      backgroundColor: '#1B6B3A',
      margin: 12,
      borderRadius: 8,
      alignItems: 'center',
    },
    confirmButtonText: {
      color: '#fff',
      fontSize: 16,
    },
    ambiguityList: {
      marginHorizontal: 12,
      marginBottom: 8,
    },
    ambiguityItem: {
      padding: 8,
      backgroundColor: '#fafafa',
      borderRadius: 6,
      marginBottom: 4,
    },
  });

  return (
    <Modal
      visible={isVisible}
      transparent={false}
      animationType="fade"
      statusBarStyle="default"
    >
      <View style={styles.modalContainer}>
        <View style={styles.header}>
          <Text style={styles.title}>{t('voice.reviewSheetTitle')}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text>{t('common.close')}</Text>
          </TouchableOpacity>
        </View>

        {/* Parsed items summary */}
        <FlatList
          data={parsed ? [{ quantity: parsed.quantity, product: parsed.productName, payment: parsed.paymentMethod }] : []}
          keyExtractor={(item) => item.product}
          renderItem={({ item }) => (
            <View style={styles.listItem}>
              <View style={styles.productInfo}>
                <Text style={styles.productName}>{parsed.productName}</Text>
                <Text style={styles.quantityText}>x{parsed.quantity}</Text>
              </View>
              <Text style={styles.paymentText}>
                {parsed.paymentMethod === 'cash' ? t('cash') : t('credit')}
              </Text>
            </View>
          )}
        />

        {/* Ambiguity choices if needed */}
        {parsed.matchType === 'ambiguous' && showAmbiguityChoices && (
          <View style={styles.ambiguityList}>
            <Text>{t('voice.ambiguousProduct')}</Text>
            {ambiguousChoices.map((choice, index) => (
              <View key={index} style={styles.ambiguityItem}>
                <Text>{choice.name}</Text>
                <TouchableOpacity onPress={() => {
                  // User selected this choice
                  const newParsed = { ...parsed, productName: choice.name };
                  onConfirm(newParsed);
                }}>
                  <Text style={{ color: '#1B6B3A' }}>{t('select')}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* Confirmation button */}
        <TouchableOpacity onPress={handleConfirm} style={styles.confirmButton}>
          <Text style={styles.confirmButtonText}>{t('common.add')}</Text>
        </TouchableOpacity>

        {handleClose}
      </View>
    </Modal>
  );
}