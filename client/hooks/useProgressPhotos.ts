/**
 * Progress Photos Hook
 * Manage progress photo state and operations
 */

import { useState, useEffect, useCallback } from "react";
import {
  ProgressPhoto,
  PhotoComparisonPair,
  getProgressPhotos,
  getPhotosByCategory,
  getComparisonPairs,
  getLatestPhotos,
  getPhotoStats,
  saveProgressPhoto,
  deleteProgressPhoto,
  updateProgressPhoto,
  takeProgressPhoto,
  pickProgressPhoto,
  requestPhotoPermissions,
  checkPhotoPermissions,
} from "@/lib/progressPhotos";

export function useProgressPhotos() {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [permissions, setPermissions] = useState({
    camera: false,
    mediaLibrary: false,
  });

  // Load photos on mount
  useEffect(() => {
    loadPhotos();
    checkPermissions();
  }, []);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await getProgressPhotos();
      setPhotos(data.sort((a, b) => b.takenAt - a.takenAt));
    } finally {
      setLoading(false);
    }
  };

  const checkPermissions = async () => {
    const perms = await checkPhotoPermissions();
    setPermissions(perms);
  };

  const requestPermissions = useCallback(async () => {
    const granted = await requestPhotoPermissions();
    await checkPermissions();
    return granted;
  }, []);

  const takePhoto = useCallback(
    async (
      category: ProgressPhoto["category"],
      metadata?: { weight?: number; note?: string; fastId?: string }
    ) => {
      if (!permissions.camera) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      const uri = await takeProgressPhoto();
      if (!uri) return null;

      const photo = await saveProgressPhoto(uri, {
        category,
        ...metadata,
      });
      await loadPhotos();
      return photo;
    },
    [permissions.camera, requestPermissions]
  );

  const pickPhoto = useCallback(
    async (
      category: ProgressPhoto["category"],
      metadata?: { weight?: number; note?: string; fastId?: string }
    ) => {
      if (!permissions.mediaLibrary) {
        const granted = await requestPermissions();
        if (!granted) return null;
      }

      const uri = await pickProgressPhoto();
      if (!uri) return null;

      const photo = await saveProgressPhoto(uri, {
        category,
        ...metadata,
      });
      await loadPhotos();
      return photo;
    },
    [permissions.mediaLibrary, requestPermissions]
  );

  const removePhoto = useCallback(async (id: string) => {
    const success = await deleteProgressPhoto(id);
    if (success) {
      await loadPhotos();
    }
    return success;
  }, []);

  const updatePhoto = useCallback(
    async (
      id: string,
      updates: { weight?: number; note?: string; category?: ProgressPhoto["category"] }
    ) => {
      const updated = await updateProgressPhoto(id, updates);
      if (updated) {
        await loadPhotos();
      }
      return updated;
    },
    []
  );

  return {
    photos,
    loading,
    permissions,
    requestPermissions,
    takePhoto,
    pickPhoto,
    removePhoto,
    updatePhoto,
    refresh: loadPhotos,
  };
}

export function usePhotoComparison(category: ProgressPhoto["category"]) {
  const [pairs, setPairs] = useState<PhotoComparisonPair[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPairs();
  }, [category]);

  const loadPairs = async () => {
    setLoading(true);
    try {
      const data = await getComparisonPairs(category);
      setPairs(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    pairs,
    loading,
    refresh: loadPairs,
  };
}

export function useLatestPhotos() {
  const [latest, setLatest] = useState<
    Record<ProgressPhoto["category"], ProgressPhoto | null>
  >({
    front: null,
    side: null,
    back: null,
    other: null,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLatest();
  }, []);

  const loadLatest = async () => {
    setLoading(true);
    try {
      const data = await getLatestPhotos();
      setLatest(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    latest,
    loading,
    refresh: loadLatest,
  };
}

export function usePhotoStats() {
  const [stats, setStats] = useState<{
    total: number;
    byCategory: Record<ProgressPhoto["category"], number>;
    firstPhotoDate: number | null;
    latestPhotoDate: number | null;
    totalDaysTracking: number;
  }>({
    total: 0,
    byCategory: { front: 0, side: 0, back: 0, other: 0 },
    firstPhotoDate: null,
    latestPhotoDate: null,
    totalDaysTracking: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    setLoading(true);
    try {
      const data = await getPhotoStats();
      setStats(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    stats,
    loading,
    refresh: loadStats,
  };
}

export function useCategoryPhotos(category: ProgressPhoto["category"]) {
  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
  }, [category]);

  const loadPhotos = async () => {
    setLoading(true);
    try {
      const data = await getPhotosByCategory(category);
      setPhotos(data);
    } finally {
      setLoading(false);
    }
  };

  return {
    photos,
    loading,
    refresh: loadPhotos,
  };
}
