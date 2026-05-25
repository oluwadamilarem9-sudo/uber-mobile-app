import type { RideProductId } from '@/src/lib/rideEstimates';

export type MockDriverProfile = {
  photoUrl: string;
  rating: number;
  reviewCount: number;
  vehicleModel: string;
  plate: string;
};

const VEHICLES = ['Toyota Camry', 'Honda Accord', 'Tesla Model 3', 'Hyundai Ioniq 5', 'Subaru Outback'];
const PLATES = ['OTR-4821', 'OTR-9920', 'OTR-1104', 'OTR-7733', 'OTR-2208'];
const PHOTOS = [
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&q=80&auto=format&fit=crop',
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
}

/** Deterministic “driver” details for demos — not stored in Firebase. */
export function getMockDriverProfile(
  driverId: string,
  driverName: string | null | undefined,
  productId?: RideProductId | null,
): MockDriverProfile {
  const seed = hashString(driverId + (driverName ?? ''));
  const v = VEHICLES[seed % VEHICLES.length];
  const plate = PLATES[seed % PLATES.length];
  const rating = 4.75 + (seed % 20) / 100;
  const reviews = 120 + (seed % 800);
  const vehicleModel =
    productId === 'otter_xl'
      ? 'Toyota Sienna'
      : productId === 'otter_comfort'
        ? 'Lexus ES'
        : v;

  return {
    photoUrl: PHOTOS[seed % PHOTOS.length],
    rating: Math.round(rating * 100) / 100,
    reviewCount: reviews,
    vehicleModel,
    plate,
  };
}
