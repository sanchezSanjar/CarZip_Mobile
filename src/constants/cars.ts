import i18n from '@/i18n';

/**
 * The backend's car enums (backend libs/common/src/enums/car.enum.ts). The label is the English fallback:
 * screens show enumLabel(value), translated with the website's enum texts.
 */

export const BRANDS: { value: string; label: string }[] = [
  { value: 'HYUNDAI', label: 'Hyundai' },
  { value: 'KIA', label: 'Kia' },
  { value: 'GENESIS', label: 'Genesis' },
  { value: 'BMW', label: 'BMW' },
  { value: 'MERCEDES', label: 'Mercedes' },
  { value: 'AUDI', label: 'Audi' },
  { value: 'TESLA', label: 'Tesla' },
  { value: 'CHEVROLET', label: 'Chevrolet' },
  { value: 'KGM', label: 'KGM' },
  { value: 'RENAULT', label: 'Renault' },
  { value: 'VOLKSWAGEN', label: 'Volkswagen' },
  { value: 'VOLVO', label: 'Volvo' },
  { value: 'LEXUS', label: 'Lexus' },
  { value: 'TOYOTA', label: 'Toyota' },
  { value: 'PORSCHE', label: 'Porsche' },
  { value: 'MINI', label: 'Mini' },
  { value: 'LAND_ROVER', label: 'Land Rover' },
  { value: 'FORD', label: 'Ford' },
  { value: 'JEEP', label: 'Jeep' },
  { value: 'HONDA', label: 'Honda' },
];

export const FUELS: { value: string; label: string }[] = [
  { value: 'GASOLINE', label: 'Gasoline' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'LPG', label: 'LPG' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'PLUG_IN_HYBRID', label: 'Plug-in hybrid' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'HYDROGEN', label: 'Hydrogen' },
];

export const TYPES: { value: string; label: string }[] = [
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'SUV', label: 'SUV' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'COUPE', label: 'Coupe' },
  { value: 'CONVERTIBLE', label: 'Convertible' },
  { value: 'VAN', label: 'Van' },
  { value: 'TRUCK', label: 'Truck' },
];

/** label = a translation key */
export const SORTS: { label: string; sort: string; direction: 'ASC' | 'DESC' }[] = [
  { label: 'filters.sort.newest', sort: 'CREATED_AT', direction: 'DESC' },
  { label: 'filters.sort.priceLow', sort: 'PRICE', direction: 'ASC' },
  { label: 'filters.sort.priceHigh', sort: 'PRICE', direction: 'DESC' },
  { label: 'filters.sort.mileage', sort: 'MILEAGE', direction: 'ASC' },
  { label: 'filters.sort.yearNew', sort: 'YEAR', direction: 'DESC' },
  { label: 'filters.sort.likes', sort: 'LIKES', direction: 'DESC' },
];

/** price ranges in KRW, for the filter sheet (label = a translation key) */
export const PRICE_RANGES: { label: string; start?: number; end?: number }[] = [
  { label: 'filters.prices.any' },
  { label: 'filters.prices.under10', end: 10_000_000 },
  { label: 'filters.prices.10to20', start: 10_000_000, end: 20_000_000 },
  { label: 'filters.prices.20to40', start: 20_000_000, end: 40_000_000 },
  { label: 'filters.prices.over40', start: 40_000_000 },
];

/** an enum value in the current language ('PLUG_IN_HYBRID' -> 'Plug-in hybrid' / '플러그인 하이브리드' ...) */
export function enumLabel(value?: string | null): string {
  if (!value) return '';
  const known = [...BRANDS, ...FUELS, ...TYPES].find((item) => item.value === value)?.label;
  const text = value.toLowerCase().replace(/_/g, ' ');
  const fallback = known ?? text.charAt(0).toUpperCase() + text.slice(1);
  return i18n.t(`enum.${value}`, { defaultValue: fallback });
}

export function formatPrice(car: { carPrice?: number | null; carPriceUsd?: number | null }): string {
  if (car.carPrice) return `₩${car.carPrice.toLocaleString('en-US')}`;
  if (car.carPriceUsd) return `$${car.carPriceUsd.toLocaleString('en-US')}`;
  return i18n.t('cars.priceOnRequest');
}

/** listed in the last 3 days: shown with a NEW badge */
export function isNew(createdAt: string): boolean {
  return Date.now() - Date.parse(createdAt) < 3 * 24 * 60 * 60 * 1000;
}
