import type { ImageSourcePropType } from 'react-native';

/** Bundled driver imagery — reliable offline/APK loading. */
export const DRIVER_BANNERS: Record<string, ImageSourcePropType> = {
  '1': require('@/assets/drivers/banner-1.jpg'),
  '2': require('@/assets/drivers/banner-2.jpg'),
  '3': require('@/assets/drivers/banner-3.jpg'),
  '4': require('@/assets/drivers/banner-4.jpg'),
  '5': require('@/assets/drivers/banner-5.jpg'),
  '6': require('@/assets/drivers/banner-6.jpg'),
};

export const DRIVER_AVATARS: Record<string, ImageSourcePropType> = {
  '1': require('@/assets/drivers/avatar-1.jpg'),
  '2': require('@/assets/drivers/avatar-2.jpg'),
  '3': require('@/assets/drivers/avatar-3.jpg'),
  '4': require('@/assets/drivers/avatar-4.jpg'),
  '5': require('@/assets/drivers/avatar-5.jpg'),
  '6': require('@/assets/drivers/avatar-6.jpg'),
};

export function getDriverBanner(id: string): ImageSourcePropType {
  return DRIVER_BANNERS[id] ?? DRIVER_BANNERS['1'];
}

export function getDriverAvatar(id: string): ImageSourcePropType {
  return DRIVER_AVATARS[id] ?? DRIVER_AVATARS['1'];
}
