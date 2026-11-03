/** labels for the backend's car enums (backend libs/common/src/enums/car.enum.ts) */

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

export const SORTS: { label: string; sort: string; direction: 'ASC' | 'DESC' }[] = [
  { label: 'Newest', sort: 'CREATED_AT', direction: 'DESC' },
  { label: 'Price: low', sort: 'PRICE', direction: 'ASC' },
  { label: 'Price: high', sort: 'PRICE', direction: 'DESC' },
  { label: 'Mileage', sort: 'MILEAGE', direction: 'ASC' },
  { label: 'Year: newest', sort: 'YEAR', direction: 'DESC' },
  { label: 'Most liked', sort: 'LIKES', direction: 'DESC' },
];

/** price ranges in KRW, for the filter sheet */
export const PRICE_RANGES: { label: string; start?: number; end?: number }[] = [
  { label: 'Any price' },
  { label: 'Under ₩10M', end: 10_000_000 },
  { label: '₩10–20M', start: 10_000_000, end: 20_000_000 },
  { label: '₩20–40M', start: 20_000_000, end: 40_000_000 },
  { label: 'Over ₩40M', start: 40_000_000 },
];

/** 'PLUG_IN_HYBRID' -> 'Plug in hybrid', for enum values without a label above */
export function enumLabel(value?: string | null): string {
  if (!value) return '';
  const all = [...BRANDS, ...FUELS, ...TYPES];
  const known = all.find((item) => item.value === value);
  if (known) return known.label;
  const text = value.toLowerCase().replace(/_/g, ' ');
  return text.charAt(0).toUpperCase() + text.slice(1);
}

export function formatPrice(car: { carPrice?: number | null; carPriceUsd?: number | null }): string {
  if (car.carPrice) return `₩${car.carPrice.toLocaleString('en-US')}`;
  if (car.carPriceUsd) return `$${car.carPriceUsd.toLocaleString('en-US')}`;
  return 'Price on request';
}

/** listed in the last 3 days: shown with a NEW badge */
export function isNew(createdAt: string): boolean {
  return Date.now() - Date.parse(createdAt) < 3 * 24 * 60 * 60 * 1000;
}
