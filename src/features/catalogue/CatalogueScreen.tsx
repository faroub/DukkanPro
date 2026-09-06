import React, { useState, useEffect } from 'react';
import {
  View,
  FlatList,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
} from 'react-native';
import { ThemedView } from '@/components/themed-view';
import { ThemedText } from '@/components/themed-text';
import { useTranslation } from 'react-i18next';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { exportCataloguePDF } from '@/services/catalogue/catalogueService';
import { SaleFilterTabs } from '@/features/sales/components/SaleFilterTabs';

export function CatalogueScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState({
    showPrices: true,
    hideOutOfStock: true,
    contact: '',
    address: '',
  });
  const [products, setProducts] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sharing, setSharing] = useState(false);

  // Load products and settings on mount
  useEffect(() => {
    loadCatalogue();
  }, []);

  const loadCatalogue = async () => {
    // In a full implementation, this would load from database/settings
    // For now, use default data
    const defaultProducts = [
      { id: 1, name: 'Wheat Bread', category: 'Bakery', price_centimes: 500, stock: 10 },
      { id: 2, name: 'Milk', category: 'Dairy', price_centimes: 300, stock: 0 },
      { id: 3, name: 'Olive Oil', category: 'Oils', price_centimes: 800, stock: 5 },
    ];
    setProducts(defaultProducts);
  };

  const handleSettingChange = (key: string, value: any) => {
    setSettings({ ...settings, [key]: value });
  };

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const filteredProducts = products.filter((p: any) => {
    const matchesSearch = !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStock = !settings.hideOutOfStock || p.stock > 0;
    return matchesSearch && matchesStock;
  });

  const handleShare = async () => {
    try {
      const result = await exportCataloguePDF({
        showPrices: settings.showPrices,
        hideOutOfStock: settings.hideOutOfStock,
        contact: settings.contact,
        address: settings.address,
      });
      if (result.type === 'pdf') {
        await Sharing.shareAsync(result.uri, {
          mimeType: 'application/pdf',
          title: t('catalogue.share'),
        });
      } else {
        await Sharing.shareAsync(result.text, {
          title: t('catalogue.share'),
        });
      }
      setSharing(false);
    } catch (err) {
      Alert.alert(t('common.error'), t('catalogue.share_failed'));
      setSharing(false);
    }
  };

  return (
    <ScrollView
      contentContainerStyle={{ padding: 16, backgroundColor: '#fafafa' }}
    >
      <ThemedView type="background" style={{ marginBottom: 16 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <ThemedText type="heading" style={{ flex: 1 }}>
            {t('catalogue.catalogue')}
          </ThemedText>
        </View>
      </ThemedView>

      {/* Settings Section */}
      <ThemedView type="background" style={{ marginBottom: 16, padding: 12 }}>
        <ThemedText type="heading" style={{ fontSize: 18, marginBottom: 12 }}>
          {t('catalogue.settings')}
        </ThemedText>

        {/* Show prices toggle */}
        <View style={{ marginBottom: 8 }}>
          <ThemedText type="body" style={{ marginBottom: 4 }}>
            {t('catalogue.show_prices')}
          </ThemedText>
          <TouchableOpacity
            onPress={() => handleSettingChange('showPrices', !settings.showPrices)}
            style={[
              styles.toggleButton,
              settings.showPrices && styles.toggleButtonActive,
            ]}
          >
            <ThemedText type="body" style={{ color: settings.showPrices ? '#1B6B3A' : '#666' }}>
              {t(settings.showPrices ? 'yes' : 'no')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Hide out-of-stock toggle */}
        <View style={{ marginBottom: 8 }}>
          <ThemedText type="body" style={{ marginBottom: 4 }}>
            {t('catalogue.hide_out_of_stock')}
          </ThemedText>
          <TouchableOpacity
            onPress={() => handleSettingChange('hideOutOfStock', !settings.hideOutOfStock)}
            style={[
              styles.toggleButton,
              settings.hideOutOfStock && styles.toggleButtonActive,
            ]}
          >
            <ThemedText type="body" style={{ color: settings.hideOutOfStock ? '#1B6B3A' : '#666' }}>
              {t(settings.hideOutOfStock ? 'yes' : 'no')}
            </ThemedText>
          </TouchableOpacity>
        </View>

        {/* Contact text */}
        <View style={{ marginBottom: 8 }}>
          <ThemedText type="body" style={{ marginBottom: 4 }}>
            {t('catalogue.contact')}
          </ThemedText>
          <TextInput
            placeholder={t('catalogue.enter_contact')}
            value={settings.contact}
            onChangeText_text => handleSettingChange('contact', text)}
            style={styles.input}
            {settings.contact && <ThemedText type="caption" style={{ color: '#666' }}>{settings.contact}</ThemedText>}
          />
        </View>

        {/* Address text */}
        <View style={{ marginBottom: 8 }}>
          <ThemedText type="body" style={{ marginBottom: 4 }}>
            {t('catalogue.address')}
          </ThemedText>
          <TextInput
            placeholder={t('catalogue.enter_address')}
            value={settings.address}
            onChangeText_text => handleSettingChange('address', text)}
            style={styles.input}
            {settings.address && <ThemedText type="caption" style={{ color: '#666' }}>{settings.address}</ThemedText>}
          />
        </View>
      </ThemedView>

      {/* Product Selection Section */}
      <ThemedView type="background" style={{ marginBottom: 16, padding: 12 }}>
        <ThemedText type="heading" style={{ fontSize: 18, marginBottom: 12 }}>
          {t('catalogue.select_products')}
        </ThemedText>

        <View style={{ marginBottom: 8 }}>
          <TextInput
            placeholder={t('catalogue.search_products')}
            value={searchQuery}
            onChangeText={handleSearch}
            style={styles.input}
          />
        </View>

        <FlatList
          data={filteredProducts}
          keyExtractor={(item: any) => item.id.toString()}
          renderItem={({ item }) => (
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 8, marginBottom: 4, backgroundColor: '#fff', borderRadius: 8 }}>
              <View style={{ flex: 1 }}>
                <ThemedText type="body">
                  {item.name} - {item.category}
                </ThemedText>
              </View>
              <ThemedText type="body" style={{ color: item.stock > 0 || !settings.hideOutOfStock ? '#1B6B3A' : '#666' }}>
                {item.stock > 0 ? t('catalogue.available') : t('catalogue.out_of_stock')}
              </ThemedText>
              {settings.showPrices && (
                <ThemedText type="body" style={{ color: '#1B6B3A' }}>
                  {formatCentimes(item.price_centimes)}
                </ThemedText)
              }}
            </View>
          )}
        />

        {/* Share button */}
        <TouchableOpacity onPress={() => setSharing(true)} style={styles.shareButton}>
          <ThemedText type="body" style={{ color: '#1B6B3A' }}>
            {t('catalogue.share')}
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>

      {/* Share Modal */}
      {sharing && (
        <Modal visible={true} transparent={true} statusBarStyle="light-content">
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)' }}>
            <View style={{ margin: 20, backgroundColor: '#fff', borderRadius: 12, padding: 20 }}>
              <ThemedText type="heading" style={{ marginBottom: 12, textAlign: 'center' }}>
                {t('catalogue.sharing')}
              </ThemedText>
              <ThemedText type="body" style={{ textAlign: 'center', marginBottom: 12 }}>
                {t('catalogue.sharing_catalogue')}
              </ThemedText>
              <TouchableOpacity onPress={() => setSharing(false)} style={{ alignSelf: 'flex-end', marginTop: 12 }}>
                <ThemedText type="body">{t('common.close')}</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  toggleButton: {
    padding: 6,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 20,
    backgroundColor: '#fff',
  },
  toggleButtonActive: {
    borderColor: '#1B6B3A',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  shareButton: {
    padding: 12,
    backgroundColor: '#1B6B3A',
    borderRadius: 8,
    marginTop: 8,
  },
});