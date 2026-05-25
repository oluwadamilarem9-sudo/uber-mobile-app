export type DriverReview = {
  author: string;
  rating: number;
  text: string;
};

export type FeaturedRide = {
  id: string;
  driverName: string;
  tagline: string;
  priceLabel: string;
  vehicleName: string;
  etaMins: string;
  imageUrl: string;
  avatarUrl: string;
  rating: number;
  reviewCount: number;
  yearsExperience: number;
  completedTrips: number;
  vehicleColor: string;
  licensePlate: string;
  availability: 'available' | 'on_trip' | 'offline';
  about: string;
  reviews: DriverReview[];
};

export function getFeaturedRideById(id: string): FeaturedRide | undefined {
  return FEATURED_RIDES.find((r) => r.id === id);
}

export const FEATURED_RIDES: FeaturedRide[] = [
  {
    id: '1',
    driverName: 'Jordan Lee',
    tagline: 'On-time, calm driving',
    priceLabel: '$24/hr',
    vehicleName: 'Tesla Model 3',
    etaMins: '4 min',
    imageUrl: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?w=900&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80',
    rating: 4.92,
    reviewCount: 428,
    yearsExperience: 6,
    completedTrips: 1840,
    vehicleColor: 'Pearl white',
    licensePlate: 'OTR 204',
    availability: 'available',
    about:
      'Former hospitality manager who loves early airport runs and quiet highway miles. Water and phone chargers always available.',
    reviews: [
      { author: 'Maya K.', rating: 5, text: 'Spotless car, smooth ride, great conversation when I wanted it.' },
      { author: 'Chris P.', rating: 5, text: 'Arrived two minutes early. Felt very safe the whole way.' },
      { author: 'Priya S.', rating: 4, text: 'Comfortable and professional. Would book again.' },
    ],
  },
  {
    id: '2',
    driverName: 'Sam Rivera',
    tagline: 'Top-rated smooth rides',
    priceLabel: '$22/hr',
    vehicleName: 'Toyota Camry',
    etaMins: '7 min',
    imageUrl: 'https://images.unsplash.com/photo-1621007947382-bb3c3994e3fb?w=900&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80',
    rating: 4.88,
    reviewCount: 612,
    yearsExperience: 4,
    completedTrips: 2260,
    vehicleColor: 'Midnight blue',
    licensePlate: 'OTR 881',
    availability: 'available',
    about:
      'Full-time rider favorite for downtown pickups. Knows the fastest lanes and keeps the cabin spotless.',
    reviews: [
      { author: 'Alex R.', rating: 5, text: 'So smooth I almost fell asleep—in the best way.' },
      { author: 'Jordan T.', rating: 5, text: 'Friendly, fast, and respectful. Five stars.' },
    ],
  },
  {
    id: '3',
    driverName: 'Alex Morgan',
    tagline: 'Premium comfort',
    priceLabel: '$32/hr',
    vehicleName: 'BMW 5 Series',
    etaMins: '12 min',
    imageUrl: 'https://images.unsplash.com/photo-1555215695-3004980ad54e?w=900&q=80',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&q=80',
    rating: 4.95,
    reviewCount: 301,
    yearsExperience: 8,
    completedTrips: 980,
    vehicleColor: 'Jet black',
    licensePlate: 'OTR 552',
    availability: 'on_trip',
    about:
      'Executive-style service with extra legroom, climate zones, and curated playlists—or silence if you prefer.',
    reviews: [
      { author: 'Taylor B.', rating: 5, text: 'Worth every penny for a long ride after a red-eye.' },
      { author: 'Sam D.', rating: 5, text: 'Immaculate vehicle and very discreet.' },
    ],
  },
];
