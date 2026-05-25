import { Image, type ImageSourcePropType } from 'react-native';

type Props = {
  compact?: boolean;
  /** `onYellow`: splash on brand yellow. `heroOnDark`: white wordmark on photo / map slides. */
  variant?: 'default' | 'onYellow' | 'heroOnDark';
};

const LOGO_HERO: ImageSourcePropType = require('@/assets/logo.png');
const LOGO_ON_YELLOW: ImageSourcePropType = require('@/assets/logo-on-yellow.png');
const LOGO_INK: ImageSourcePropType = require('@/assets/logo-ink.png');

export function OtterLogo({ compact, variant = 'default' }: Props) {
  const height = compact ? 36 : 52;
  const width = compact ? 200 : 280;

  const source =
    variant === 'heroOnDark' ? LOGO_HERO : variant === 'onYellow' ? LOGO_ON_YELLOW : LOGO_INK;

  return (
    <Image
      source={source}
      style={{ width, height }}
      resizeMode="contain"
      accessibilityLabel="OtterRide"
    />
  );
}
