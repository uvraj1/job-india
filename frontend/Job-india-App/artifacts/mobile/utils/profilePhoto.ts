import AsyncStorage from "@react-native-async-storage/async-storage";

const key = (userId: string) => `job_india_profile_photo_${userId}`;

export async function saveProfilePhotoLocally(
  userId: string,
  photoUri: string | null
): Promise<void> {
  if (!photoUri) {
    await AsyncStorage.removeItem(key(userId));
    return;
  }
  await AsyncStorage.setItem(key(userId), photoUri);
}

export async function getProfilePhotoLocally(
  userId: string
): Promise<string | null> {
  return AsyncStorage.getItem(key(userId));
}

/** Keep API payload small — store photo on device only. */
export function photoForApiUpload(photoUri: string | null): string | null | undefined {
  if (!photoUri) return null;
  if (photoUri.startsWith("data:") && photoUri.length > 120_000) {
    return undefined;
  }
  return photoUri;
}
