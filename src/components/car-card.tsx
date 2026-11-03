import { Image } from 'expo-image';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import type { CarListItem } from '@/api/queries';
import { enumLabel, formatPrice, isNew } from '@/constants/cars';
import { enterUp } from '@/constants/motion';
import { Brand, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { LikeButton } from './like-button';
import { PressableScale } from './pressable-scale';
import { ThemedText } from './themed-text';

export function CarCard({ car, index }: { car: CarListItem; index: number }) {
  const theme = useTheme();
  const liked = !!car.meLiked?.[0]?.myFavorite;

  return (
    // the first cards come in one after another
    <Animated.View entering={enterUp(Math.min(index, 4) * 40)}>
      <PressableScale
        pressedScale={0.97}
        onPress={() => router.push({ pathname: '/car/[id]', params: { id: car._id } })}
        style={[styles.card, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
        <View>
          {car.carImages[0] ? (
            <Image source={car.carImages[0]} style={styles.photo} contentFit="cover" transition={250} />
          ) : (
            <View style={[styles.photo, { backgroundColor: theme.backgroundSelected }]} />
          )}
          <View style={styles.topRow}>
            <View style={styles.darkBadge}>
              <Text style={styles.darkBadgeText}>{car.carYear}</Text>
            </View>
            {isNew(car.createdAt) && (
              <View style={styles.newBadge}>
                <Text style={styles.newText}>NEW</Text>
              </View>
            )}
            <View style={styles.spacer} />
            <LikeButton carId={car._id} liked={liked} size={38} />
          </View>
          <View style={styles.priceBadge}>
            <Text style={styles.priceText}>{formatPrice(car)}</Text>
          </View>
        </View>
        <View style={styles.cardText}>
          <ThemedText type="smallBold" numberOfLines={1} style={styles.cardTitle}>
            {car.carTitle}
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {car.carMileage.toLocaleString('en-US')} km · {enumLabel(car.carFuelType)} · {enumLabel(car.carLocation)}
          </ThemedText>
          {car.agentData && (
            <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
              {car.agentData.agentCompany ?? car.agentData.memberNick}
              {car.carTestDrive ? '  ·  Test drive' : ''}
            </ThemedText>
          )}
        </View>
      </PressableScale>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.large,
    borderWidth: 1,
    overflow: 'hidden',
  },
  photo: {
    width: '100%',
    aspectRatio: 16 / 10,
  },
  topRow: {
    position: 'absolute',
    top: Spacing.three,
    left: Spacing.three,
    right: Spacing.three,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  spacer: {
    flex: 1,
  },
  darkBadge: {
    backgroundColor: 'rgba(14,17,22,0.8)',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half + 1,
    paddingHorizontal: Spacing.two + 2,
  },
  darkBadgeText: {
    color: Brand.yellow,
    fontSize: 13,
    fontWeight: 800,
  },
  newBadge: {
    backgroundColor: Brand.yellow,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.half + 1,
    paddingHorizontal: Spacing.two + 2,
  },
  newText: {
    color: Brand.ink,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
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
  cardText: {
    padding: Spacing.three,
    gap: Spacing.half,
  },
  cardTitle: {
    fontSize: 17,
    lineHeight: 22,
  },
});
