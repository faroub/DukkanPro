import { View, ScrollView, StyleSheet, TextInput, Pressable, Modal } from 'react-native';
import { useState, useCallback, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useRoute } from "expo-router";
import { Typography } from "@/constants/theme";
import { ThemedView } from "@/components/themed-view";
import { ThemedText } from "@/components/themed-text";
import { useCustomers } from "@/hooks/useCustomers";
import { Customer } from "@/types/entities";
import { getAll } from "@/database/repositories/customerRepository";
import { create } from "@/database/repositories/customerRepository";
import { update } from "@/database/repositories/customerRepository";

interface CustomerFormScreenProps {
  customerId?: number;
}

export function CustomerFormScreen({ customerId }: CustomerFormScreenProps) {
  const { t } = useTranslation();
  const [editing, setEditing] = useState<boolean>(false);
  const [name, setName] = useState<string>("");
  const [phone, setPhone] = useState<string>("");
  const [note, setNote] = useState<string>("");
  const [isSaving, setIsSaving] = useState(false);
  const route = useRoute();

  // Determine if we're editing or creating from route params
  useEffect(() => {
    const customer = (route.params as any)?.customer;
    if (customer) {
      setEditing(true);
      setName(customer.name || "");
      setPhone(customer.phone || "");
      setNote(customer.note || "");
    }
  }, [route.params]);

  const saveCustomer = useCallback(async () => {
    if (!name.trim()) {
      return;
    }

    setIsSaving(true);
    try {
      if (editing && customerId) {
        // Update existing customer
        await update(customerId, { name, phone, note, is_active: true });
      } else {
        // Create new customer
        await create({ name, phone, note, is_active: true });
      }
    } catch (err) {
      // Show error
    } finally {
      setIsSaving(false);
    }
  }, [editing, customerId, name, phone, note]);

  return (
    <ThemedView type="background" style={styles.container}>
      <ScrollView style={styles.content}>
        <View style={styles.header}>
          <ThemedText type="title" style={styles.title}>
            {editing ? t('customers:editCustomer') : t('customers:newCustomer')}
          </ThemedText>
        </View>

        <View style={styles.formSection}>
          <ThemedText type="body" style={styles.formLabel}>
            {t('customers:customerName')}
          </ThemedText>
          <TextInput
            value={name}
            onChangeText={(text) => setName(text)}
            placeholder={t('customers:customerNamePlaceholder')}
            autoCapitalize="words"
            style={isSaving ? { ...styles.input, opacity: 0.5 } : styles.input}
          />

          <ThemedText type="body" style={{ ...styles.formLabel, marginTop: 16 }}>
            {t('customers:phone')}
          </ThemedText>
          <TextInput
            value={phone}
            onChangeText={(text) => setPhone(text)}
            placeholder={t('customers:phonePlaceholder')}
            keyboardType="phone-pad"
            autoCapitalize="none"
            style={isSaving ? { ...styles.input, opacity: 0.5 } : styles.input}
          />

          {note !== '' && (
            <View style={styles.formSection}>
              <ThemedText type="body" style={{ ...styles.formLabel, marginTop: 16 }}>
                {t('customers:note')}
              </ThemedText>
              <TextInput
                value={note}
                onChangeText={(text) => setNote(text)}
                placeholder={t('customers:notePlaceholder')}
                multiline
                numberOfLines={3}
                style={isSaving ? { ...styles.input, opacity: 0.5 } : styles.input}
              />
            </View>
          )}
        </View>

        <View style={styles.actions}>
          <Pressable onPress={() => {}} style={[styles.cancelButton, { marginRight: 12 }]}>
            <ThemedText type="body" style={styles.cancelText}>
              {t('common:cancel')}
            </ThemedText>
          </Pressable>
          <Pressable style={styles.saveButton} onPress={saveCustomer} disabled={isSaving}>
            <ThemedText type="body" style={styles.saveText}>
              {editing ? t('customers:saveChanges') : t('customers:createCustomer')}
            </ThemedText>
          </Pressable>
        </View>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    padding: 24,
  },
  header: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderColor: Colors.light.border,
  },
  title: {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 8,
    textAlign: 'center',
  },
  formSection: {
    marginBottom: 24,
  },
  formLabel: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginBottom: 8,
  },
  cancelText: {
    color: '#6B7280',
    fontSize: 14,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  input: {
    width: '100%',
    height: 52,
    backgroundColor: Colors.light.surface,
    borderWidth: 1,
    borderColor: Colors.light.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    marginBottom: 16,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 24,
  },
  cancelButton: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.light.border,
    backgroundColor: Colors.light.surface,
    marginRight: 8,
  },
  saveButton: {
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
  },
});