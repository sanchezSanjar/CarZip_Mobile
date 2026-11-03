import { Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { FUELS, PRICE_RANGES, SORTS, TYPES } from '@/constants/cars';
import { Radius, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

import { Button } from './button';
import { Chip } from './chip';
import { ThemedText } from './themed-text';

export interface CarFilters {
  sort: number; // index in SORTS
  price: number; // index in PRICE_RANGES
  types: string[];
  fuels: string[];
  testDrive: boolean;
}

export const NO_FILTERS: CarFilters = { sort: 0, price: 0, types: [], fuels: [], testDrive: false };

/** how many filters are on (the number on the Filters button) */
export function countFilters(filters: CarFilters): number {
  return (filters.sort ? 1 : 0) + (filters.price ? 1 : 0) + filters.types.length + filters.fuels.length + (filters.testDrive ? 1 : 0);
}

const toggle = (list: string[], value: string) =>
  list.includes(value) ? list.filter((item) => item !== value) : [...list, value];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      <View style={styles.chips}>{children}</View>
    </View>
  );
}

/** the sheet that slides up from the bottom with sort, price, body type, fuel and test drive */
export function FilterSheet({
  visible,
  filters,
  onChange,
  onClose,
}: {
  visible: boolean;
  filters: CarFilters;
  onChange: (filters: CarFilters) => void;
  onClose: () => void;
}) {
  const theme = useTheme();
  const set = (patch: Partial<CarFilters>) => onChange({ ...filters, ...patch });

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose} accessibilityLabel="Close filters" />
      <SafeAreaView edges={['bottom']} style={[styles.sheet, { backgroundColor: theme.background }]}>
        <View style={[styles.handle, { backgroundColor: theme.border }]} />
        <ScrollView contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Filters</ThemedText>
          <Section title="SORT BY">
            {SORTS.map((sort, index) => (
              <Chip key={sort.label} label={sort.label} selected={filters.sort === index} onPress={() => set({ sort: index })} />
            ))}
          </Section>
          <Section title="PRICE">
            {PRICE_RANGES.map((range, index) => (
              <Chip key={range.label} label={range.label} selected={filters.price === index} onPress={() => set({ price: index })} />
            ))}
          </Section>
          <Section title="BODY TYPE">
            {TYPES.map((type) => (
              <Chip
                key={type.value}
                label={type.label}
                selected={filters.types.includes(type.value)}
                onPress={() => set({ types: toggle(filters.types, type.value) })}
              />
            ))}
          </Section>
          <Section title="FUEL">
            {FUELS.map((fuel) => (
              <Chip
                key={fuel.value}
                label={fuel.label}
                selected={filters.fuels.includes(fuel.value)}
                onPress={() => set({ fuels: toggle(filters.fuels, fuel.value) })}
              />
            ))}
          </Section>
          <Section title="EXTRAS">
            <Chip label="Test drive possible" selected={filters.testDrive} onPress={() => set({ testDrive: !filters.testDrive })} />
          </Section>
        </ScrollView>
        <View style={styles.actions}>
          <Button title="Reset" variant="outline" style={styles.reset} onPress={() => onChange(NO_FILTERS)} />
          <Button title="Show cars" style={styles.show} onPress={onClose} />
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    maxHeight: '85%',
    borderTopLeftRadius: Radius.large,
    borderTopRightRadius: Radius.large,
  },
  handle: {
    alignSelf: 'center',
    width: 44,
    height: 5,
    borderRadius: 3,
    marginTop: Spacing.two,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    letterSpacing: 1,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.two,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.three,
  },
  reset: {
    flex: 1,
  },
  show: {
    flex: 2,
  },
});
