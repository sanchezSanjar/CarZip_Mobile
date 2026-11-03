import { useQuery } from '@apollo/client/react';
import { Image } from 'expo-image';
import { ActivityIndicator, FlatList, Platform, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GET_CARS, type CarListItem, type GetCarsData } from '@/api/queries';
import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';

const PAGE_SIZE = 20;

function formatPrice(car: CarListItem): string {
  if (car.carPrice) return `₩${car.carPrice.toLocaleString('en-US')}`;
  if (car.carPriceUsd) return `$${car.carPriceUsd.toLocaleString('en-US')}`;
  return 'Price on request';
}

function CarRow({ car }: { car: CarListItem }) {
  return (
    <ThemedView type="backgroundElement" style={styles.row}>
      {car.carImages[0] ? (
        <Image source={car.carImages[0]} style={styles.photo} contentFit="cover" transition={150} />
      ) : (
        <ThemedView type="backgroundSelected" style={styles.photo} />
      )}
      <View style={styles.rowText}>
        <ThemedText type="smallBold" numberOfLines={2}>
          {car.carTitle}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {car.carYear} · {car.carMileage.toLocaleString('en-US')} km
        </ThemedText>
        <ThemedText type="smallBold" themeColor="brand">
          {formatPrice(car)}
        </ThemedText>
        {car.agentData && (
          <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
            {car.agentData.agentCompany ?? car.agentData.memberNick}
          </ThemedText>
        )}
      </View>
    </ThemedView>
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
          <ActivityIndicator style={styles.center} />
        ) : error && !data ? (
          <View style={styles.center}>
            <ThemedText themeColor="textSecondary">Could not load the cars.</ThemedText>
            <Button title="Try again" variant="secondary" onPress={() => refetch()} />
          </View>
        ) : (
          <FlatList
            data={data?.getCars.list ?? []}
            keyExtractor={(car) => car._id}
            renderItem={({ item }) => <CarRow car={item} />}
            ListHeaderComponent={<ThemedText type="subtitle">Cars</ThemedText>}
            contentContainerStyle={styles.list}
            refreshing={loading}
            onRefresh={() => refetch()}
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
  row: {
    flexDirection: 'row',
    gap: Spacing.three,
    padding: Spacing.two,
    borderRadius: Spacing.three,
  },
  photo: {
    width: 112,
    height: 84,
    borderRadius: Spacing.two,
  },
  rowText: {
    flex: 1,
    gap: Spacing.half,
  },
});
