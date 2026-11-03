import { useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, Platform, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GET_CARS, type CarListItem, type GetCarsData } from '@/api/queries';
import { Button } from '@/components/button';
import { Logo } from '@/components/logo';
import { PressableScale } from '@/components/pressable-scale';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const PAGE_SIZE = 20;

function formatPrice(car: CarListItem): string {
  if (car.carPrice) return `₩${car.carPrice.toLocaleString('en-US')}`;
  if (car.carPriceUsd) return `$${car.carPriceUsd.toLocaleString('en-US')}`;
  return 'Price on request';
}

/** the black block on top: logo and what CarZip is */
function Hero() {
  return (
    <Animated.View entering={FadeInDown.springify().damping(16)} style={styles.hero}>
      <Animated.View entering={ZoomIn.delay(150).springify().damping(10)}>
        <Logo size={34} color="#FFFFFF" />
      </Animated.View>
      <Text style={styles.heroTitle}>
        Used cars from <Text style={styles.heroAccent}>verified dealers</Text>
      </Text>
      <Text style={styles.heroText}>All over Korea. Book a test drive and talk to the dealer directly.</Text>
    </Animated.View>
  );
}

function CarCard({ car, index }: { car: CarListItem; index: number }) {
  const theme = useTheme();
  return (
    // the first cards come in one after another
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 70).springify().damping(16)}>
      <PressableScale
        pressedScale={0.97}
        style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View>
          {car.carImages[0] ? (
            <Image source={car.carImages[0]} style={styles.photo} contentFit="cover" transition={250} />
          ) : (
            <View style={[styles.photo, { backgroundColor: theme.backgroundSelected }]} />
          )}
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(car)}</Text>
          </View>
          <View style={styles.yearBadge}>
            <Text style={styles.yearText}>{car.carYear}</Text>
          </View>
        </View>
        <View style={styles.cardText}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>
            {car.carTitle}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {car.carMileage.toLocaleString('en-US')} km
            {car.agentData ? `  ·  ${car.agentData.agentCompany ?? car.agentData.memberNick}` : ''}
          </ThemedText>
        </View>
      </PressableScale>
    </Animated.View>
  );
}

/** Cars for sale, newest first. Search, filters and the car page come in the next step */
export default function CarsScreen() {
  const { data, loading, error, refetch } = useQuery<GetCarsData>(GET_CARS, {
    variables: { input: { limit: PAGE_SIZE } },
  });

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        {loading && !data ? (
          <ActivityIndicator color={Brand.yellow} size="large" style={styles.center} />
        ) : error && !data ? (
          <View style={styles.center}>
            <ThemedText themeColor="textSecondary">Could not load the cars.</ThemedText>
            <Button title="Try again" onPress={() => refetch()} />
          </View>
        ) : (
          <FlatList
            data={data?.getCars.list ?? []}
            keyExtractor={(car) => car._id}
            renderItem={({ item, index }) => <CarCard car={item} index={index} />}
            ListHeaderComponent={<Hero />}
            contentContainerStyle={styles.list}
            refreshControl={
              <RefreshControl
                refreshing={loading}
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
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
  },
  list: {
    gap: Spacing.three,
    padding: Spacing.three,
    // the web build shows its tab bar on top, the apps at the bottom
    paddingTop: Platform.OS === 'web' ? Spacing.six + Spacing.four : Spacing.three,
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
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  priceBadge: {
    position: 'absolute',
    left: Spacing.three,
    bottom: Spacing.three,
    backgroundColor: Brand.yellow,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
  },
  priceText: {
    color: Brand.ink,
    fontSize: 16,
    fontWeight: 900,
  },
  yearBadge: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    backgroundColor: 'rgba(14,17,22,0.8)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half + 1,
    paddingHorizontal: Spacing.two + 2,
  },
  yearText: {
    color: Brand.yellow,
    fontSize: 13,
    fontWeight: 800,
  },
  cardText: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
});
