import { useQuery } from '@tanstack/react-query';
import { doc, getDoc } from 'firebase/firestore';

import { getFirestoreDb } from '@/src/firebase/firestore';
import { hasFirebaseConfig } from '@/src/firebase/config';
import type { UserProfileDoc } from '@/src/types/profile';

function parseProfile(data: Record<string, unknown>): UserProfileDoc | null {
  const displayName = typeof data.displayName === 'string' ? data.displayName.trim() : '';
  const role = data.role === 'rider' || data.role === 'driver' ? data.role : undefined;
  const mode = data.mode === 'rider' || data.mode === 'driver' ? data.mode : undefined;
  const phone = typeof data.phone === 'string' ? data.phone.trim() : undefined;
  const avatarUrl =
    typeof data.avatarUrl === 'string' && data.avatarUrl.trim().length > 0
      ? data.avatarUrl.trim()
      : undefined;

  if (!displayName || !role) {
    return null;
  }

  return {
    displayName,
    avatarUrl,
    phone: phone || undefined,
    role,
    mode: mode ?? role,
  };
}

export function useUserProfile(uid: string | undefined) {
  return useQuery({
    queryKey: ['userProfile', uid ?? 'none'],
    enabled: Boolean(uid) && hasFirebaseConfig,
    staleTime: 60_000,
    queryFn: async (): Promise<UserProfileDoc | null> => {
      const snap = await getDoc(doc(getFirestoreDb(), 'users', uid!));
      if (!snap.exists()) {
        return null;
      }
      return parseProfile(snap.data() as Record<string, unknown>);
    },
  });
}
