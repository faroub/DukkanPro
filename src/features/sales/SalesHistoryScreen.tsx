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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FooterTrademark } from '@/components/FooterTrademark';
import { ThemedText } from '@/components/themed-text';
import { BorderRadius, Shadows, Spacing } from '@/constants/theme';
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
import { useTheme } from '@/hooks/use-theme';

function getLocalDateKey(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function SalesHistoryScreen() {
  const { i18n } = useTranslation();
  const router = useRouter();
  const theme = useTheme();

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
        const todayStr = getLocalDateKey();

        switch (activeFilter) {
          case 'today':
            data = await getSalesByDateRange(todayStr, todayStr);
            break;
          case 'week': {
            const now = new Date();
            const past = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
            data = await getSalesByDateRange(
              getLocalDateKey(past),
              todayStr,
            );
            break;
          }
          case 'month': {
            const now = new Date();
            const past = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
            data = await getSalesByDateRange(
              getLocalDateKey(past),
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
    let isMounted = true;
    (async () => {
      await fetchSalesFromDb();
      if (!isMounted) return;
    })();
    return () => {
      isMounted = false;
    };
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

  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* 1. Top Bar */}
      <View style={[styles.topBar, { backgroundColor: theme.surface, borderBottomColor: theme.border, paddingTop: Math.max(insets.top, Spacing.md) }]}>
        <View style={styles.topBarLeft}>
          <TouchableOpacity
            style={[styles.backButton, { backgroundColor: theme.surfaceAlt }]}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel="Back to dashboard"
          >
            <MaterialIcons
              name="arrow-back"
              size={22}
              color={theme.textPrimary}
            />
          </TouchableOpacity>

          <View style={styles.topBarTitleWrap}>
            <ThemedText style={[styles.topBarTitle, { color: theme.textPrimary }]}>
              {isArabic ? 'المبيعات الأخيرة' : isFrench ? 'Ventes récentes' : 'Recent Sales'}
            </ThemedText>
            <ThemedText style={[styles.topBarSubtitle, { color: theme.textSecondary }]}>
              {isArabic
                ? 'سجل المعاملات والفواتير'
                : isFrench
                ? 'Historique des transactions'
                : 'Transaction history'}
            </ThemedText>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.refreshButton, { backgroundColor: theme.surfaceAlt }]}
          onPress={handleRefresh}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Refresh sales list"
        >
          <MaterialIcons
            name="refresh"
            size={20}
            color={theme.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* 2. Key Summary Metrics Banner */}
      <View style={[styles.summaryBanner, { backgroundColor: theme.surfaceAlt, borderColor: theme.border }]}>
        <View style={styles.summaryBannerLeft}>
          <View style={[styles.statsIconBox, { backgroundColor: theme.surface }]}>
            <MaterialIcons
              name="query-stats"
              size={22}
              color={theme.primary}
            />
          </View>
          <View style={styles.summaryTextGroup}>
            <ThemedText style={[styles.performanceLabel, { color: theme.primary }]}>
              {isArabic ? 'الأداء المالي' : isFrench ? 'PERFORMANCE' : 'PERFORMANCE'}
            </ThemedText>
            <ThemedText style={[styles.performanceValue, { color: theme.textPrimary }]}>
              {validSales.length}{' '}
              {isArabic ? 'عملية' : isFrench ? 'ventes' : 'sales'} • {totalRevenueFormatted}
            </ThemedText>
          </View>
        </View>

        <View style={[styles.trendingBadge, { backgroundColor: theme.surface }]}>
          <MaterialIcons
            name="trending-up"
            size={16}
            color={theme.primary}
          />
          <ThemedText style={[styles.trendingText, { color: theme.primary }]}>
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
      <View style={[styles.searchBarWrapper, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <MaterialIcons
          name="search"
          size={20}
          color={theme.textMuted}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: theme.textPrimary }]}
          placeholder={
            isArabic
              ? 'البحث عن طريق الزبون، السلعة أو رقم الوصل...'
              : isFrench
              ? 'Rechercher par client, article ou n° reçu...'
              : 'Search by customer, product, or receipt #...'
          }
          placeholderTextColor={theme.textMuted}
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
              color={theme.textMuted}
            />
          </TouchableOpacity>
        )}
      </View>

      {/* 5. Sales List Header / Counter */}
      <View style={styles.listHeader}>
        <ThemedText style={[styles.groupLabel, { color: theme.textSecondary }]}>{sectionLabel}</ThemedText>
        <ThemedText style={[styles.resultsCount, { color: theme.textSecondary }]}>
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
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>
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
              colors={[theme.primary]}
              tintColor={theme.primary}
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
              <View style={[styles.emptyIconCircle, { backgroundColor: theme.surfaceAlt }]}>
                <MaterialIcons
                  name="receipt-long"
                  size={36}
                  color={theme.textMuted}
                />
              </View>
              <ThemedText style={[styles.emptyTitle, { color: theme.textPrimary }]}>
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
              <ThemedText style={[styles.emptySubtitle, { color: theme.textSecondary }]}>
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
                  style={[styles.clearFiltersButton, { backgroundColor: theme.primaryLight, borderColor: theme.border }]}
                  onPress={() => {
                    setSearchQuery('');
                    setActiveFilter('all');
                  }}
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name="filter-alt-off"
                    size={16}
                    color={theme.primary}
                  />
                  <ThemedText style={[styles.clearFiltersButtonText, { color: theme.primary }]}>
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
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
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitleWrap: {
    gap: 1,
  },
  topBarTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  topBarSubtitle: {
    fontSize: 12,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
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
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
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
    letterSpacing: 0.8,
  },
  performanceValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  trendingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.pill,
    ...Shadows.sm,
  },
  trendingText: {
    fontSize: 11,
    fontWeight: '700',
  },
  searchBarWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
    marginBottom: Spacing.xs,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 13,
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
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  resultsCount: {
    fontSize: 12,
    fontWeight: '500',
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
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 13,
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
    borderWidth: 1,
  },
  clearFiltersButtonText: {
    fontSize: 13,
    fontWeight: '600',
  },
});
