import { useEffect, useRef, useState } from 'react';

import type { LatLng } from '@/src/lib/directions';

const COUNT = 6;

/**
 * Lightweight “live” vehicles around the rider for the Explore map demo (no backend).
 */
export function useMockNearbyDrivers(origin: LatLng | null): LatLng[] {
  const [drivers, setDrivers] = useState<LatLng[]>([]);
  const phase = useRef(0);
  const baseRef = useRef<LatLng[]>([]);

  useEffect(() => {
    if (!origin) {
      setDrivers([]);
      baseRef.current = [];
      return;
    }

    const base = Array.from({ length: COUNT }, (_, i) => {
      const angle = (i / COUNT) * Math.PI * 2;
      const r = 0.0032 + (i % 3) * 0.0009;
      return {
        latitude: origin.latitude + r * Math.sin(angle),
        longitude: origin.longitude + r * Math.cos(angle),
      };
    });
    baseRef.current = base;
    setDrivers(base);

    const id = setInterval(() => {
      phase.current += 0.12;
      const b = baseRef.current;
      setDrivers(
        b.map((p, i) => ({
          latitude: p.latitude + 0.00025 * Math.sin(phase.current + i * 1.1),
          longitude: p.longitude + 0.00025 * Math.cos(phase.current * 0.85 + i),
        })),
      );
    }, 1800);

    return () => clearInterval(id);
  }, [origin?.latitude, origin?.longitude]);

  return drivers;
}
