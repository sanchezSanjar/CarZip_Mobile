import { useQuery } from '@apollo/client/react';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { enterUp, enterFade } from '@/constants/motion';

import { GET_CARS, type GetCarsData } from '@/api/queries';
import { Button } from '@/components/button';
import { CarCard } from '@/components/car-card';
import { Chip } from '@/components/chip';
import { countFilters, FilterSheet, NO_FILTERS, type CarFilters } from '@/components/filter-sheet';
import { Logo, LogoMark } from '@/components/logo';
import { PressableScale } from '@/components/pressable-scale';
import { CarCardSkeleton } from '@/components/skeleton';
import { ThemeToggle } from '@/components/theme-toggle';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BRANDS, enumLabel, PRICE_RANGES, SORTS } from '@/constants/cars';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 10;

/** the backend's CarsInquiry for what the user picked */
function buildInput(text: string, brands: string[], filters: CarFilters) {
  const sort = SORTS[filters.sort];
  const price = PRICE_RANGES[filters.price];
  const search = {
    ...(text.trim().length >= 2 && { text: text.trim() }), // the backend wants 2–50 characters
    ...(brands.length && { brandList: brands }),
    ...(filters.types.length && { typeList: filters.types }),
    ...(filters.fuels.length && { fuelList: filters.fuels }),
    ...(filters.testDrive && { testDrive: true }),
    ...((price.start || price.end) && { priceRange: { start: price.start ?? 0, end: price.end ?? 10_000_000_000 } }),
  };
  return { limit: PAGE_SIZE, sort: sort.sort, direction: sort.direction, search };
}

/** waits until the user stops typing, so every key doesn't start a search */
function useDebounced<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

/** the black block on top of the list: logo and what CarZip is */
function Hero() {
  const { t } = useTranslation();
  return (
    <Animated.View entering={enterUp()} style={styles.hero}>
      <Animated.View entering={enterFade(150)}>
        <Logo size={34} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.heroTitle}>
        {t('cars.heroTitle')} <Text style={styles.heroAccent}>{t('cars.heroAccent')}</Text>
      </Text>
      <Text style={styles.heroText}>{t('cars.heroText')}</Text>
    </Animated.View>
  );
}

/** Cars for sale: search, brand chips, filters, and more cars while scrolling */
export default function CarsScreen() {
  const { t } = useTranslation();
  const theme = useTheme();
  const [text, setText] = useState('');
  const [brands, setBrands] = useState<string[]>([]);
  const [filters, setFilters] = useState<CarFilters>(NO_FILTERS);
  const [sheetOpen, setSheetOpen] = useState(false);
  const input = buildInput(useDebounced(text), brands, filters);

  const { data, loading, error, refetch, fetchMore } = useQuery<GetCarsData>(GET_CARS, {
    variables: { input },
    notifyOnNetworkStatusChange: true,
  });
  const cars = data?.getCars.list ?? [];
  const nextCursor = data?.getCars.nextCursor;
  const [loadingMore, setLoadingMore] = useState(false);

  const loadMore = async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      await fetchMore({ variables: { input: { ...input, cursor: nextCursor } } });
    } finally {
      setLoadingMore(false);
    }
  };

  // the small logo in the search bar appears once the big black block has scrolled away
  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  const barStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(scrollY.get(), [0, 80], [0, 0.15], 'clamp'),
  }));
  const miniLogoStyle = useAnimatedStyle(() => {
    const shown = interpolate(scrollY.get(), [120, 200], [0, 1], 'clamp');
    return { opacity: shown, width: 32 * shown, marginRight: Spacing.two * shown, transform: [{ scale: 0.6 + 0.4 * shown }] };
  });

  const filterCount = countFilters(filters);
  const toggleBrand = (value: string) =>
    setBrands((list) => (list.includes(value) ? list.filter((item) => item !== value) : [...list, value]));

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {/* search bar and brand chips stay on top while the list scrolls under them */}
        <Animated.View style={[styles.bar, { backgroundColor: theme.background }, barStyle]}>
          <View style={styles.searchRow}>
            <Animated.View style={miniLogoStyle}>
              <LogoMark size={32} />
            </Animated.View>
            <View style={[styles.search, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
              <Text style={[styles.searchIcon, { color: theme.textSecondary }]}>⌕</Text>
              <TextInput
                value={text}
                onChangeText={setText}
                placeholder={t('cars.search')}
                placeholderTextColor={theme.textSecondary}
                style={[styles.searchInput, { color: theme.text }]}
                returnKeyType="search"
                autoCorrect={false}
              />
              {!!text && (
                <PressableScale onPress={() => setText('')} accessibilityLabel={t('cars.clearSearch')} style={styles.clear}>
                  <Text style={[styles.clearText, { color: theme.textSecondary }]}>✕</Text>
                </PressableScale>
              )}
            </View>
            <PressableScale
              onPress={() => setSheetOpen(true)}
              accessibilityLabel={t('cars.filters')}
              style={[styles.filterButton, filterCount > 0 && styles.filterButtonOn]}>
              <Text style={[styles.filterIcon, { color: filterCount > 0 ? Brand.ink : Brand.yellow }]}>☰</Text>
              {filterCount > 0 && (
                <Animated.View entering={enterFade()} style={styles.filterCount}>
                  <Text style={styles.filterCountText}>{filterCount}</Text>
                </Animated.View>
              )}
            </PressableScale>
            <ThemeToggle />
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.brandRow}>
            <Chip label={t('cars.allBrands')} selected={!brands.length} onPress={() => setBrands([])} />
            {BRANDS.map((brand) => (
              <Chip key={brand.value} label={enumLabel(brand.value)} selected={brands.includes(brand.value)} onPress={() => toggleBrand(brand.value)} />
            ))}
          </ScrollView>
        </Animated.View>

        {loading && !data ? (
          <View style={styles.list}>
            <CarCardSkeleton />
            <CarCardSkeleton />
          </View>
        ) : error && !data ? (
          <View style={styles.center}>
            <ThemedText themeColor="textSecondary">{t('cars.loadFailed')}</ThemedText>
            <Button title={t('common.tryAgain')} onPress={() => refetch()} />
          </View>
        ) : (
          <Animated.FlatList
            data={cars}
            keyExtractor={(car) => car._id}
            renderItem={({ item, index }) => <CarCard car={item} index={index} />}
            ListHeaderComponent={<Hero />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText type="smallBold">{t('cars.noMatch')}</ThemedText>
                <Button title={t('cars.clearFilters')} variant="dark" onPress={() => { setText(''); setBrands([]); setFilters(NO_FILTERS); }} />
              </View>
            }
            ListFooterComponent={loadingMore ? <CarCardSkeleton /> : undefined}
            onEndReached={loadMore}
            onEndReachedThreshold={0.6}
            onScroll={onScroll}
            scrollEventThrottle={16}
            keyboardDismissMode="on-drag"
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={loading && !loadingMore && !!data}
                onRefresh={() => {
                  refetch();
                }}
                tintColor={Brand.yellow}
                colors={[Brand.yellow]}
                progressBackgroundColor={Brand.ink}
              />
            }
          />
        )}
      </SafeAreaView>
      <FilterSheet visible={sheetOpen} filters={filters} onChange={setFilters} onClose={() => setSheetOpen(false)} />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  safeArea: {
    flex: 1,
    maxWidth: MaxContentWidth,
  },
  bar: {
    // the web build shows its tab bar on top
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.two,
    paddingBottom: Spacing.two,
    gap: Spacing.two,
    zIndex: 2,
    shadowColor: '#000',
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    gap: Spacing.two,
  },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingHorizontal: Spacing.three,
    minHeight: 46,
  },
  searchIcon: {
    fontSize: 20,
    marginRight: Spacing.two,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    fontWeight: 500,
    minHeight: 44,
  },
  clear: {
    padding: Spacing.one,
  },
  clearText: {
    fontSize: 14,
    fontWeight: 800,
  },
  filterButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterButtonOn: {
    backgroundColor: Brand.yellow,
  },
  filterIcon: {
    fontSize: 18,
    fontWeight: 900,
  },
  filterCount: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Brand.ink,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  filterCountText: {
    color: Brand.yellow,
    fontSize: 12,
    fontWeight: 900,
  },
  brandRow: {
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  empty: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.five,
  },
  list: {
    gap: Spacing.three,
    padding: Spacing.three,
    paddingBottom: BottomTabInset + Spacing.three,
  },
  hero: {
    backgroundColor: Brand.ink,
    borderRadius: Radius.large,
    padding: Spacing.four,
    gap: Spacing.three,
    overflow: 'hidden',
  },
  heroTitle: {
    color: '#FFFFFF',
    fontSize: 30,
    lineHeight: 34,
    fontWeight: 900,
    letterSpacing: -1,
  },
  heroAccent: {
    color: Brand.yellow,
  },
  heroText: {
    color: '#C9CED6',
    fontSize: 15,
    lineHeight: 21,
  },
});
