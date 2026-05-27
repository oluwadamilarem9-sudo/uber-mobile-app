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
  {
    id: '4',
    driverName: 'Priya Nair',
    tagline: 'Airport specialist',
    priceLabel: '$26/hr',
    vehicleName: 'Honda Accord',
    etaMins: '5 min',
    rating: 4.9,
    reviewCount: 512,
    yearsExperience: 5,
    completedTrips: 2100,
    vehicleColor: 'Silver',
    licensePlate: 'OTR 119',
    availability: 'available',
    about: 'Early-morning airport runs and luggage help included. Calm, punctual, and always on time.',
    reviews: [
      { author: 'Leo M.', rating: 5, text: 'Made a tight flight with minutes to spare. Highly recommend.' },
    ],
  },
  {
    id: '5',
    driverName: 'Marcus Chen',
    tagline: 'City shortcuts pro',
    priceLabel: '$21/hr',
    vehicleName: 'Hyundai Ioniq 5',
    etaMins: '6 min',
    rating: 4.86,
    reviewCount: 389,
    yearsExperience: 3,
    completedTrips: 1420,
    vehicleColor: 'Graphite',
    licensePlate: 'OTR 442',
    availability: 'available',
    about: 'EV driver focused on smooth, quiet rides. Great for downtown and evening commutes.',
    reviews: [
      { author: 'Nina R.', rating: 5, text: 'Silent cabin and super clean — loved it.' },
    ],
  },
  {
    id: '6',
    driverName: 'Elena Vasquez',
    tagline: 'Family-friendly rides',
    priceLabel: '$23/hr',
    vehicleName: 'Kia Carnival',
    etaMins: '9 min',
    rating: 4.91,
    reviewCount: 276,
    yearsExperience: 7,
    completedTrips: 1680,
    vehicleColor: 'Pearl white',
    licensePlate: 'OTR 903',
    availability: 'available',
    about: 'Spacious van for groups, kids, and extra bags. Car seats available on request.',
    reviews: [
      { author: 'Jamie L.', rating: 5, text: 'Perfect for our family airport trip.' },
    ],
  },
];
