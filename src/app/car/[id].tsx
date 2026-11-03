import { useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GET_CAR, type GetCarData } from '@/api/queries';
import { useAuth } from '@/auth/auth-context';
import { Button } from '@/components/button';
import { LikeButton } from '@/components/like-button';
import { PressableScale } from '@/components/pressable-scale';
import { Skeleton } from '@/components/skeleton';
import { TestDriveSheet } from '@/components/test-drive-sheet';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { enumLabel, formatPrice, isNew } from '@/constants/cars';
import { enterUp } from '@/constants/motion';
import { Brand, MaxContentWidth, Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

const GALLERY_HEIGHT = 300;

/** swipe through the photos; the photo zooms a little when pulled down */
function Gallery({ images, scrollY }: { images: string[]; scrollY: { get: () => number } }) {
  const { width } = useWindowDimensions();
  const galleryWidth = Math.min(width, MaxContentWidth);
  const [page, setPage] = useState(0);
  const stretch = useAnimatedStyle(() => {
    const y = scrollY.get();
    return {
      transform: [
        { translateY: y < 0 ? y / 2 : y * 0.4 },
        { scale: y < 0 ? 1 + -y / GALLERY_HEIGHT : 1 },
      ],
    };
  });

  return (
    <Animated.View style={[{ height: GALLERY_HEIGHT }, stretch]}>
      <ScrollView
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) => setPage(Math.round(event.nativeEvent.contentOffset.x / galleryWidth))}>
        {(images.length ? images : ['']).map((uri, index) =>
          uri ? (
            <Image key={uri + index} source={uri} style={{ width: galleryWidth, height: GALLERY_HEIGHT }} contentFit="cover" transition={250} />
          ) : (
            <View key="empty" style={{ width: galleryWidth, height: GALLERY_HEIGHT, backgroundColor: Brand.ink }} />
          ),
        )}
      </ScrollView>
      {images.length > 1 && (
        <View style={styles.dots}>
          {images.map((uri, index) => (
            <View key={uri + index} style={[styles.dot, index === page && styles.dotActive]} />
          ))}
        </View>
      )}
      <View style={styles.counter}>
        <Text style={styles.counterText}>
          {Math.min(page + 1, Math.max(images.length, 1))} / {Math.max(images.length, 1)}
        </Text>
      </View>
    </Animated.View>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  const theme = useTheme();
  return (
    <View style={[styles.fact, { backgroundColor: theme.backgroundElement, borderColor: theme.border }]}>
      <ThemedText type="small" themeColor="textSecondary">
        {label}
      </ThemedText>
      <ThemedText type="smallBold">{value}</ThemedText>
    </View>
  );
}

/** one car: photos, price, facts, options, description, the dealer, like and test drive */
export default function CarScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const theme = useTheme();
  const { member } = useAuth();
  const [bookingOpen, setBookingOpen] = useState(false);
  const { data, loading, error, refetch } = useQuery<GetCarData>(GET_CAR, { variables: { carId: id } });
  const car = data?.getCar;

  const scrollY = useSharedValue(0);
  const onScroll = useAnimatedScrollHandler((event) => {
    scrollY.set(event.contentOffset.y);
  });
  // the black title bar appears once the photos have scrolled away
  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.get(), [GALLERY_HEIGHT - 120, GALLERY_HEIGHT - 40], [0, 1], 'clamp'),
  }));

  const bookTestDrive = () => (member ? setBookingOpen(true) : router.push('/login'));
  const agent = car?.agentData;
  const liked = !!car?.meLiked?.[0]?.myFavorite;

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {loading && !car ? (
        <View>
          <Skeleton height={GALLERY_HEIGHT} radius={0} />
          <View style={styles.body}>
            <Skeleton width="40%" height={30} />
            <Skeleton width="80%" height={22} />
            <Skeleton height={120} radius={Radius.large} />
          </View>
        </View>
      ) : error || !car ? (
        <SafeAreaView style={styles.center}>
          <ThemedText themeColor="textSecondary">This car could not be loaded.</ThemedText>
          <Button title="Try again" onPress={() => refetch()} />
          <Button title="Back" variant="outline" onPress={() => router.back()} />
        </SafeAreaView>
      ) : (
        <>
          <Animated.ScrollView onScroll={onScroll} scrollEventThrottle={16} contentContainerStyle={styles.scroll}>
            <Gallery images={car.carImages} scrollY={scrollY} />
            <View style={[styles.sheet, { backgroundColor: theme.background }]}>
              <Animated.View entering={enterUp()} style={styles.body}>
                <View style={styles.priceRow}>
                  <View style={styles.priceBadge}>
                    <Text style={styles.priceText}>{formatPrice(car)}</Text>
                  </View>
                  {isNew(car.createdAt) && (
                    <View style={styles.newBadge}>
                      <Text style={styles.newText}>NEW</Text>
                    </View>
                  )}
                  {car.carStatus === 'SOLD' && (
                    <View style={styles.soldBadge}>
                      <Text style={styles.soldText}>SOLD</Text>
                    </View>
                  )}
                </View>
                <ThemedText type="subtitle">{car.carTitle}</ThemedText>
                <ThemedText themeColor="textSecondary">
                  {enumLabel(car.carBrand)} {car.carModel} · {enumLabel(car.carLocation)} · ♥ {car.carLikes} · 👁 {car.carViews}
                </ThemedText>
              </Animated.View>

              <Animated.View entering={enterUp(80)} style={styles.facts}>
                <Fact label="Year" value={String(car.carYear)} />
                <Fact label="Mileage" value={`${car.carMileage.toLocaleString('en-US')} km`} />
                <Fact label="Fuel" value={enumLabel(car.carFuelType)} />
                <Fact label="Gearbox" value={enumLabel(car.carTransmission)} />
                <Fact label="Body" value={enumLabel(car.carType)} />
                <Fact label="Color" value={enumLabel(car.carColor)} />
                <Fact label="Condition" value={enumLabel(car.carCondition)} />
                <Fact label="Sold for" value={car.carMarket === 'EXPORT' ? 'Export' : car.carMarket === 'BOTH' ? 'Korea + export' : 'Korea'} />
              </Animated.View>

              {car.carOptions.length > 0 && (
                <Animated.View entering={enterUp(140)} style={styles.block}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                    OPTIONS
                  </ThemedText>
                  <View style={styles.options}>
                    {car.carOptions.map((option) => (
                      <View key={option} style={[styles.option, { borderColor: Brand.yellow }]}>
                        <ThemedText type="small">{enumLabel(option)}</ThemedText>
                      </View>
                    ))}
                  </View>
                </Animated.View>
              )}

              {!!car.carDesc && (
                <Animated.View entering={enterUp(180)} style={styles.block}>
                  <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
                    ABOUT THIS CAR
                  </ThemedText>
                  <ThemedText>{car.carDesc}</ThemedText>
                </Animated.View>
              )}

              {agent && (
                <Animated.View entering={enterUp(220)} style={styles.dealer}>
                  <View style={styles.dealerRow}>
                    {agent.memberImage ? (
                      <Image source={agent.memberImage} style={styles.dealerPhoto} />
                    ) : (
                      <View style={[styles.dealerPhoto, styles.dealerInitial]}>
                        <Text style={styles.dealerInitialText}>{agent.memberNick.charAt(0).toUpperCase()}</Text>
                      </View>
                    )}
                    <View style={styles.dealerText}>
                      <Text style={styles.dealerName}>{agent.agentCompany ?? agent.memberNick}</Text>
                      <Text style={styles.dealerSub}>Verified dealer · {car.carAddress}</Text>
                    </View>
                  </View>
                  <View style={styles.dealerActions}>
                    {!!agent.contactPhone && (
                      <Button title="Call" style={styles.flex} onPress={() => Linking.openURL(`tel:${agent.contactPhone}`)} />
                    )}
                    {!!agent.contactKakao && (
                      <Button title={`Kakao: ${agent.contactKakao}`} variant="outline" style={[styles.flex, styles.onDark]} />
                    )}
                  </View>
                </Animated.View>
              )}
            </View>
          </Animated.ScrollView>

          {/* black title bar on top, appearing while scrolling; back and like stay on the photo before that */}
          <SafeAreaView edges={['top']} style={styles.topBar} pointerEvents="box-none">
            <Animated.View style={[StyleSheet.absoluteFill, styles.topBarBack, headerStyle]} />
            <View style={styles.topBarRow}>
              <PressableScale onPress={() => router.back()} accessibilityLabel="Back" style={styles.round}>
                <Text style={styles.roundText}>‹</Text>
              </PressableScale>
              <Animated.Text numberOfLines={1} style={[styles.topTitle, headerStyle]}>
                {car.carTitle}
              </Animated.Text>
              <LikeButton carId={car._id} liked={liked} />
            </View>
          </SafeAreaView>

          {car.carStatus === 'ACTIVE' && car.carTestDrive && member?.memberType !== 'AGENT' && (
            <SafeAreaView edges={['bottom']} style={[styles.bottomBar, { backgroundColor: theme.background, borderColor: theme.border }]}>
              <Button title="Book a test drive" onPress={bookTestDrive} />
            </SafeAreaView>
          )}
          <TestDriveSheet carId={car._id} visible={bookingOpen} onClose={() => setBookingOpen(false)} />
        </>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: 120,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  sheet: {
    marginTop: -Radius.large,
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
    paddingTop: Spacing.two,
  },
  body: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.three,
    padding: Spacing.four,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
  },
  priceBadge: {
    backgroundColor: Brand.yellow,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one + 2,
    paddingHorizontal: Spacing.three,
  },
  priceText: {
    color: Brand.ink,
    fontSize: 22,
    fontWeight: 900,
  },
  newBadge: {
    backgroundColor: Brand.ink,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
  },
  newText: {
    color: Brand.yellow,
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
  },
  soldBadge: {
    backgroundColor: '#D93025',
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.two + 2,
  },
  soldText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 900,
    letterSpacing: 1,
  },
  facts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
  },
  fact: {
    width: '48.5%',
    flexGrow: 1,
    borderWidth: 1,
    borderRadius: Radius.medium,
    padding: Spacing.three,
    gap: Spacing.half,
  },
  block: {
    padding: Spacing.three,
    gap: Spacing.two,
  },
  label: {
    letterSpacing: 1,
  },
  options: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  option: {
    borderWidth: 1.5,
    borderRadius: Radius.pill,
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
  },
  dealer: {
    margin: Spacing.three,
    backgroundColor: Brand.ink,
    borderRadius: Radius.large,
    padding: Spacing.three,
    gap: Spacing.three,
  },
  dealerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
  },
  dealerPhoto: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 2,
    borderColor: Brand.yellow,
  },
  dealerInitial: {
    backgroundColor: Brand.yellow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dealerInitialText: {
    color: Brand.ink,
    fontSize: 22,
    fontWeight: 900,
  },
  dealerText: {
    flex: 1,
    gap: 2,
  },
  dealerName: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: 800,
  },
  dealerSub: {
    color: '#C9CED6',
    fontSize: 13,
  },
  dealerActions: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  onDark: {
    borderColor: '#3A414B',
  },
  dots: {
    position: 'absolute',
    bottom: Spacing.five,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.55)',
  },
  dotActive: {
    width: 20,
    backgroundColor: Brand.yellow,
  },
  counter: {
    position: 'absolute',
    right: Spacing.three,
    bottom: Spacing.five,
    backgroundColor: 'rgba(14,17,22,0.75)',
    borderRadius: Radius.pill,
    paddingVertical: 3,
    paddingHorizontal: Spacing.two + 2,
  },
  counterText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 700,
  },
  topBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  topBarBack: {
    backgroundColor: Brand.black,
  },
  topBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14,17,22,0.75)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roundText: {
    color: Brand.yellow,
    fontSize: 30,
    fontWeight: 700,
    marginTop: -4,
  },
  topTitle: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 800,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: Spacing.three,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.three,
    borderTopWidth: 1,
  },
});
