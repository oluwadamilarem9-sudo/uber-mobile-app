import { deleteObject, getDownloadURL, ref, uploadBytes } from 'firebase/storage';

import { getFirebaseStorage } from '@/src/firebase/storage';

const objectPath = (uid: string) => `avatars/${uid}.jpg`;

export async function uploadProfileAvatarFromUri(uid: string, localUri: string): Promise<string> {
  const storage = getFirebaseStorage();
  if (!storage) {
    throw new Error('Cloud storage is not available. Check your app configuration.');
  }
  const response = await fetch(localUri);
  const blob = await response.blob();
  const fileRef = ref(storage, objectPath(uid));
  await uploadBytes(fileRef, blob, { contentType: 'image/jpeg' });
  return getDownloadURL(fileRef);
}

export async function deleteProfileAvatarObject(uid: string): Promise<void> {
  const storage = getFirebaseStorage();
  if (!storage) {
    return;
  }
  try {
    await deleteObject(ref(storage, objectPath(uid)));
  } catch {
    // Object may not exist yet.
  }
}
