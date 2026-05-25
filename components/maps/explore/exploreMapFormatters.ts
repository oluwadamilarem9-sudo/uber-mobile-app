export function formatDuration(sec: number): string {
  if (!sec || sec < 60) {
    return '< 1 min';
  }
  const m = Math.round(sec / 60);
  if (m < 60) {
    return `${m} min`;
  }
  const h = Math.floor(m / 60);
  const rest = m % 60;
  return rest ? `${h} hr ${rest} min` : `${h} hr`;
}

export function formatDistance(meters: number): string {
  if (!meters) {
    return '—';
  }
  if (meters < 1000) {
    return `${Math.round(meters)} m`;
  }
  return `${(meters / 1000).toFixed(1)} km`;
}
