import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FooterTrademark } from '@/components/FooterTrademark';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Colors, Shadows, Spacing } from '@/constants/theme';
import {
  getAllSales,
  getSalesByDateRange,
  search,
} from '@/database/repositories/saleRepository';
import { SaleCard, SaleCardData } from '@/features/sales/components/SaleCard';
import {
  SaleFilterTabs,
  SaleFilterKey,
} from '@/features/sales/components/SaleFilterTabs';
import { formatCentimes } from '@/utils/money';

export function SalesHistoryScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();

  const lang = i18n.language || 'fr';
  const isArabic = lang.startsWith('ar');
  const isFrench = lang.startsWith('fr');
  const localeParam = isArabic ? 'ar-DZ' : isFrench ? 'fr-DZ' : 'en-DZ';

  const [sales, setSales] = useState<SaleCardData[]>([]);
  const [activeFilter, setActiveFilter] = useState<SaleFilterKey>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalesFromDb = useCallback(async () => {
    try {
      let data: any[] = [];

      if (searchQuery.trim()) {
        data = await search(searchQuery.trim());
      } else {
        const todayStr = new Date().toISOString().split('T')[0];

        switch (activeFilter) {
          case 'today':
            data = await getSalesByDateRange(todayStr, todayStr);
            break;
          case 'week': {
            const past = new Date();
            past.setDate(past.getDate() - 7);
            data = await getSalesByDateRange(
              past.toISOString().split('T')[0],
              todayStr,
            );
            break;
          }
          case 'month': {
            const past = new Date();
            past.setMonth(past.getMonth() - 1);
            data = await getSalesByDateRange(
              past.toISOString().split('T')[0],
              todayStr,
            );
            break;
          }
          case 'paid':
            data = await getAllSales({ status: 'completed' });
            // Filter only fully paid (no remaining balance)
            data = data.filter(
              (s) =>
                s.status === 'completed' &&
                (!s.remaining_balance_centimes ||
                  s.remaining_balance_centimes === 0),
            );
            break;
          case 'partial':
            data = await getAllSales({ hasCredit: true });
            data = data.filter(
              (s) =>
                s.status !== 'cancelled' &&
                s.status !== 'returned' &&
                s.amount_paid_centimes > 0,
            );
            break;
          case 'credit':
            data = await getAllSales({ hasCredit: true });
            data = data.filter(
              (s) =>
                s.status !== 'cancelled' &&
                s.status !== 'returned' &&
                (s.payment_method === 'credit' || s.amount_paid_centimes === 0),
            );
            break;
          case 'cancelled':
            data = await getAllSales({ status: 'cancelled' });
            break;
          case 'returned':
            data = await getAllSales({ status: 'returned' });
            break;
          case 'all':
          default:
            data = await getAllSales({});
            break;
        }
      }

      setSales(data || []);
    } catch (err) {
      console.error('Failed to load sales:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeFilter, searchQuery]);

  useEffect(() => {
    setLoading(true);
    fetchSalesFromDb();
  }, [fetchSalesFromDb]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchSalesFromDb();
  };

  // Calculate metrics for the banner (excluding cancelled & returned sales)
  const validSales = useMemo(
    () => sales.filter((s) => s.status !== 'cancelled' && s.status !== 'returned'),
    [sales],
  );

  const totalRevenueCentimes = useMemo(
    () => validSales.reduce((sum, s) => sum + (s.total_centimes || 0), 0),
    [validSales],
  );

  const totalRevenueFormatted = formatCentimes(totalRevenueCentimes, localeParam);

  // Section Header Label
  let sectionLabel = isArabic
    ? 'جميع المعاملات'
    : isFrench
    ? 'TOUTES LES TRANSACTIONS'
    : 'ALL TRANSACTIONS';

  if (activeFilter === 'today') {
    sectionLabel = isArabic
      ? 'معاملات اليوم'
      : isFrench
      ? 'TRANSACTIONS DU JOUR'
      : 'TODAY’S TRANSACTIONS';
  } else if (activeFilter === 'cancelled') {
    sectionLabel = isArabic
      ? 'المبيعات الملغاة'
      : isFrench
      ? 'VENTES ANNULÉES'
      : 'CANCELLED SALES';
  } else if (activeFilter === 'returned') {
    sectionLabel = isArabic
      ? 'المبيعات المسترجعة'
      : isFrench
      ? 'VENTES RETOURNÉES'
      : 'RETURNED SALES';
  } else if (searchQuery.trim()) {
    sectionLabel = isArabic
      ? 'نتائج البحث'
      : isFrench
      ? 'RÉSULTATS DE RECHERCHE'
      : 'SEARCH RESULTS';
  }

  return (
    <View style={styles.container}>
      {/* 1. Top Bar */}
      <View style={styles.topBar}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <MaterialIcons
              name="arrow-back"
              size={22}
              color={Colors.light.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.topBarTitleWrap}>
            <ThemedText style={styles.topBarTitle}>
              {isArabic ? 'المبيعات الأخيرة' : isFrench ? 'Ventes récentes' : 'Recent Sales'}
            </ThemedText>
            <ThemedText style={styles.topBarSubtitle}>
              {isArabic
                ? 'سجل المعاملات والفواتير'
                : isFrench
                ? 'Historique des transactions'
                : 'Transaction history'}
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={styles.refreshButton}
          onPress={handleRefresh}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Refresh sales list"
        >
          <MaterialIcons
            name="refresh"
            size={20}
            color={Colors.light.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Key Summary Metrics Banner (Google Stitch Design) */}
      <View style={styles.summaryBanner}>
        <View style={styles.summaryBannerLeft}>
          <View style={styles.statsIconBox}>
            <MaterialIcons
              name="query-stats"
              size={22}
              color={Colors.light.primary}
            />
          </View>
          <View style={styles.summaryTextGroup}>
            <ThemedText style={styles.performanceLabel}>
              {isArabic ? 'الأداء المالي' : isFrench ? 'PERFORMANCE' : 'PERFORMANCE'}
            </ThemedText>
            <ThemedText style={styles.performanceValue}>
              {validSales.length}{' '}
              {isArabic ? 'عملية' : isFrench ? 'ventes' : 'sales'} • {totalRevenueFormatted}
            </ThemedText>
          </View>
        </View>

        <View style={styles.trendingBadge}>
          <MaterialIcons
            name="trending-up"
            size={16}
            color={Colors.light.primary}
          />
          <ThemedText style={styles.trendingText}>
            {activeFilter === 'today'
              ? isArabic ? 'اليوم' : 'Today'
              : activeFilter === 'week'
              ? isArabic ? 'هذا الأسبوع' : '7d'
              : activeFilter === 'month'
              ? isArabic ? 'هذا الشهر' : '30d'
              : isArabic ? 'نشط' : 'Active'}
          </ThemedText>
        </View>
      </View>

      {/* 3. Filter Tabs (Period & Status with horizontal scroll) */}
      <SaleFilterTabs
        activeFilter={activeFilter}
        onSelectFilter={(tab) => {
          setActiveFilter(tab);
          setSearchQuery('');
        }}
      />

      {/* 4. Search Input Bar */}
      <View style={styles.searchBarWrapper}>
        <MaterialIcons
          name="search"
          size={20}
          color={Colors.light.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder={
            isArabic
              ? 'البحث عن طريق الزبون، السلعة أو رقم الوصل...'
              : isFrench
              ? 'Rechercher par client, article ou n° reçu...'
              : 'Search by customer, product, or receipt #...'
          }
          placeholderTextColor={Colors.light.textMuted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity
            onPress={() => setSearchQuery('')}
            style={styles.clearSearchButton}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons
              name="cancel"
              size={18}
              color={Colors.light.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. Sales List Header / Counter */}
      <View style={styles.listHeader}>
        <ThemedText style={styles.groupLabel}>{sectionLabel}</ThemedText>
        <ThemedText style={styles.resultsCount}>
          {isArabic
            ? `${sales.length} نتيجة`
            : isFrench
            ? `${sales.length} résultats`
            : `${sales.length} results`}
        </ThemedText>
      </View>

      {/* 6. FlatList Content */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <ThemedText style={styles.loadingText}>
            {isArabic ? 'جارٍ تحميل المبيعات...' : isFrench ? 'Chargement des ventes...' : 'Loading sales...'}
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={sales}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[Colors.light.primary]}
              tintColor={Colors.light.primary}
            />
          }
          renderItem={({ item }) => (
            <SaleCard
              sale={item}
              onPress={() => {
                router.push({
                  pathname: '/sales/[id]',
                  params: { id: String(item.id) },
                });
              }}
            />
          )}
          ListFooterComponent={() => <FooterTrademark />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <MaterialIcons
                  name="receipt-long"
                  size={36}
                  color={Colors.light.textMuted}
                />
              </View>
              <ThemedText style={styles.emptyTitle}>
                {searchQuery
                  ? isArabic
                    ? 'لم يتم العثور على نتائج'
                    : isFrench
                    ? 'Aucun résultat trouvé'
                    : 'No matching sales found'
                  : isArabic
                  ? 'لا توجد مبيعات مسجلة'
                  : isFrench
                  ? 'Aucune vente enregistrée'
                  : 'No sales recorded yet'}
              </ThemedText>
              <ThemedText style={styles.emptySubtitle}>
                {searchQuery
                  ? isArabic
                    ? 'جرب البحث باسم آخر أو مسح حقل البحث'
                    : isFrench
                    ? 'Essayez avec un autre mot-clé ou réinitialisez les filtres'
                    : 'Try checking for spelling errors or clear your search query'
                  : isArabic
                  ? 'قم بتسجيل مبيعات جديدة من الشاشة الرئيسية'
                  : isFrench
                  ? 'Enregistrez votre première vente depuis la caisse'
                  : 'Record sales from the checkout counter to see them here'}
              </ThemedText>
              {(searchQuery.length > 0 || activeFilter !== 'all') && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="filter-alt-off"
                    size={16}
                    color={Colors.light.primary}
                  />
                  <ThemedText style={styles.clearFiltersButtonText}>
                    {isArabic
                      ? 'إعادة ضبط الفلاتر'
                      : isFrench
                      ? 'Réinitialiser les filtres'
                      : 'Reset filters'}
                  </ThemedText>
                </TouchableOpacity>
              )}
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.light.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  topBarLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleWrap: {
    gap: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  topBarSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
    padding: Spacing.md,
    backgroundColor: Colors.light.primaryLight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: '#C7E7D2',
  },
  summaryBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  statsIconBox: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.surface,
    alignItems: 'center',
    justifyContent: 'center',
    ...Shadows.sm,
  },
  summaryTextGroup: {
    flex: 1,
    gap: 2,
  },
  performanceLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.light.primary,
    letterSpacing: 0.8,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textPrimary,
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.surface,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    ...Shadows.sm,
  },
  trendingText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surface,
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textPrimary,
    paddingVertical: 0,
  },
  clearSearchButton: {
    padding: 4,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.xs,
  },
  groupLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.textSecondary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xs,
    paddingBottom: 40,
    gap: Spacing.sm,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.light.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.light.textPrimary,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  clearFiltersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.light.primaryLight,
    borderWidth: 1,
    borderColor: '#C7E7D2',
  },
  clearFiltersButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.primary,
  },
});
