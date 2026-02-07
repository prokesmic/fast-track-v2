/**
 * Progress Photos Service
 * Store and manage progress photos locally with cloud sync support
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";

const PHOTOS_STORAGE_KEY = "progress_photos";
const PHOTOS_DIR = `${FileSystem.documentDirectory}progress_photos/`;

export interface ProgressPhoto {
  id: string;
  uri: string;
  takenAt: number;
  weight?: number;
  note?: string;
  fastId?: string; // Link to a specific fast
  category: "front" | "side" | "back" | "other";
}

export interface PhotoComparisonPair {
  before: ProgressPhoto;
  after: ProgressPhoto;
  daysBetween: number;
}

/**
 * Ensure photos directory exists
 */
async function ensurePhotosDir(): Promise<void> {
  const dirInfo = await FileSystem.getInfoAsync(PHOTOS_DIR);
  if (!dirInfo.exists) {
    await FileSystem.makeDirectoryAsync(PHOTOS_DIR, { intermediates: true });
  }
}

/**
 * Request camera and media library permissions
 */
export async function requestPhotoPermissions(): Promise<boolean> {
  const cameraResult = await ImagePicker.requestCameraPermissionsAsync();
  const mediaResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return cameraResult.granted && mediaResult.granted;
}

/**
 * Check if photo permissions are granted
 */
export async function checkPhotoPermissions(): Promise<{
  camera: boolean;
  mediaLibrary: boolean;
}> {
  const camera = await ImagePicker.getCameraPermissionsAsync();
  const mediaLibrary = await ImagePicker.getMediaLibraryPermissionsAsync();
  return {
    camera: camera.granted,
    mediaLibrary: mediaLibrary.granted,
  };
}

/**
 * Take a new progress photo with the camera
 */
export async function takeProgressPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

/**
 * Pick a progress photo from the gallery
 */
export async function pickProgressPhoto(): Promise<string | null> {
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ["images"],
    allowsEditing: true,
    aspect: [3, 4],
    quality: 0.8,
  });

  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

/**
 * Save a progress photo to local storage
 */
export async function saveProgressPhoto(
  tempUri: string,
  metadata: Omit<ProgressPhoto, "id" | "uri" | "takenAt">
): Promise<ProgressPhoto> {
  await ensurePhotosDir();

  const id = `photo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const fileExtension = tempUri.split(".").pop() || "jpg";
  const permanentUri = `${PHOTOS_DIR}${id}.${fileExtension}`;

  // Copy file to permanent storage
  await FileSystem.copyAsync({
    from: tempUri,
    to: permanentUri,
  });

  const photo: ProgressPhoto = {
    id,
    uri: permanentUri,
    takenAt: Date.now(),
    ...metadata,
  };

  // Save to AsyncStorage
  const photos = await getProgressPhotos();
  photos.push(photo);
  await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));

  return photo;
}

/**
 * Get all progress photos
 */
export async function getProgressPhotos(): Promise<ProgressPhoto[]> {
  try {
    const data = await AsyncStorage.getItem(PHOTOS_STORAGE_KEY);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error("[PHOTOS] Failed to get photos:", error);
    return [];
  }
}

/**
 * Get photos by category
 */
export async function getPhotosByCategory(
  category: ProgressPhoto["category"]
): Promise<ProgressPhoto[]> {
  const photos = await getProgressPhotos();
  return photos
    .filter((p) => p.category === category)
    .sort((a, b) => a.takenAt - b.takenAt);
}

/**
 * Get photos within a date range
 */
export async function getPhotosInRange(
  startDate: number,
  endDate: number
): Promise<ProgressPhoto[]> {
  const photos = await getProgressPhotos();
  return photos.filter(
    (p) => p.takenAt >= startDate && p.takenAt <= endDate
  );
}

/**
 * Update photo metadata
 */
export async function updateProgressPhoto(
  id: string,
  updates: Partial<Omit<ProgressPhoto, "id" | "uri" | "takenAt">>
): Promise<ProgressPhoto | null> {
  const photos = await getProgressPhotos();
  const index = photos.findIndex((p) => p.id === id);

  if (index === -1) return null;

  photos[index] = { ...photos[index], ...updates };
  await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(photos));
  return photos[index];
}

/**
 * Delete a progress photo
 */
export async function deleteProgressPhoto(id: string): Promise<boolean> {
  const photos = await getProgressPhotos();
  const photo = photos.find((p) => p.id === id);

  if (!photo) return false;

  // Delete file
  try {
    await FileSystem.deleteAsync(photo.uri, { idempotent: true });
  } catch (error) {
    console.warn("[PHOTOS] Failed to delete file:", error);
  }

  // Remove from storage
  const filtered = photos.filter((p) => p.id !== id);
  await AsyncStorage.setItem(PHOTOS_STORAGE_KEY, JSON.stringify(filtered));
  return true;
}

/**
 * Generate comparison pairs for a category
 */
export async function getComparisonPairs(
  category: ProgressPhoto["category"]
): Promise<PhotoComparisonPair[]> {
  const photos = await getPhotosByCategory(category);
  if (photos.length < 2) return [];

  const pairs: PhotoComparisonPair[] = [];
  const first = photos[0];

  // Compare first photo with each subsequent photo
  for (let i = 1; i < photos.length; i++) {
    const daysBetween = Math.floor(
      (photos[i].takenAt - first.takenAt) / (1000 * 60 * 60 * 24)
    );
    pairs.push({
      before: first,
      after: photos[i],
      daysBetween,
    });
  }

  return pairs;
}

/**
 * Get the latest photo for each category
 */
export async function getLatestPhotos(): Promise<
  Record<ProgressPhoto["category"], ProgressPhoto | null>
> {
  const photos = await getProgressPhotos();

  const latest: Record<ProgressPhoto["category"], ProgressPhoto | null> = {
    front: null,
    side: null,
    back: null,
    other: null,
  };

  for (const photo of photos) {
    if (
      !latest[photo.category] ||
      photo.takenAt > latest[photo.category]!.takenAt
    ) {
      latest[photo.category] = photo;
    }
  }

  return latest;
}

/**
 * Get statistics about progress photos
 */
export async function getPhotoStats(): Promise<{
  total: number;
  byCategory: Record<ProgressPhoto["category"], number>;
  firstPhotoDate: number | null;
  latestPhotoDate: number | null;
  totalDaysTracking: number;
}> {
  const photos = await getProgressPhotos();

  const byCategory: Record<ProgressPhoto["category"], number> = {
    front: 0,
    side: 0,
    back: 0,
    other: 0,
  };

  let firstDate: number | null = null;
  let latestDate: number | null = null;

  for (const photo of photos) {
    byCategory[photo.category]++;
    if (!firstDate || photo.takenAt < firstDate) firstDate = photo.takenAt;
    if (!latestDate || photo.takenAt > latestDate) latestDate = photo.takenAt;
  }

  const totalDays =
    firstDate && latestDate
      ? Math.floor((latestDate - firstDate) / (1000 * 60 * 60 * 24))
      : 0;

  return {
    total: photos.length,
    byCategory,
    firstPhotoDate: firstDate,
    latestPhotoDate: latestDate,
    totalDaysTracking: totalDays,
  };
}

/**
 * Export photos metadata (for backup)
 */
export async function exportPhotosMetadata(): Promise<string> {
  const photos = await getProgressPhotos();
  return JSON.stringify(photos, null, 2);
}
