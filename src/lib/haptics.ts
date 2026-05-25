import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

const native = Platform.OS === 'ios' || Platform.OS === 'android';

/** Light tap — buttons, toggles, star rows. */
export function hapticSelection(): void {
  if (!native) {
    return;
  }
  try {
    void Haptics.selectionAsync();
  } catch {
    /* no-op */
  }
}

/** Primary action / success. */
export function hapticImpactLight(): void {
  if (!native) {
    return;
  }
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {
    /* no-op */
  }
}

export function hapticImpactMedium(): void {
  if (!native) {
    return;
  }
  try {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {
    /* no-op */
  }
}

export function hapticSuccess(): void {
  if (!native) {
    return;
  }
  try {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {
    /* no-op */
  }
}
