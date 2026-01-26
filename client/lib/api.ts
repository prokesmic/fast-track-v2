import { getToken } from "./auth";

// API base URL - adjust based on environment
const getBaseUrl = (): string => {
  // In development, use localhost; in production, use the Vercel URL
  if (__DEV__) {
    // For local development with Vercel dev
    return "http://localhost:3000";
  }
  // Production URL - will be the same domain when deployed to Vercel
  return "";
};

interface ApiResponse<T> {
  data?: T;
  error?: string;
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  requireAuth?: boolean;
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<ApiResponse<T>> {
  const { body, requireAuth = true, ...fetchOptions } = options;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(fetchOptions.headers || {}),
  };

  // Add auth header if required
  if (requireAuth) {
    const token = await getToken();
    if (token) {
      (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
    } else {
      return { error: "Not authenticated" };
    }
  }

  try {
    const baseUrl = getBaseUrl();
    const url = `${baseUrl}${endpoint}`;

    const response = await fetch(url, {
      ...fetchOptions,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const responseData = await response.json();

    if (!response.ok) {
      return { error: responseData.error || `Request failed: ${response.status}` };
    }

    return { data: responseData };
  } catch (error) {
    console.error("API request error:", error);
    return { error: "Network error. Please check your connection." };
  }
}

// Auth endpoints
export interface LoginResponse {
  user: { id: string; email: string };
  token: string;
}

export async function login(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>("/api/auth/login", {
    method: "POST",
    body: { email, password },
    requireAuth: false,
  });
}

export async function register(
  email: string,
  password: string
): Promise<ApiResponse<LoginResponse>> {
  return apiRequest<LoginResponse>("/api/auth/register", {
    method: "POST",
    body: { email, password },
    requireAuth: false,
  });
}

export interface MeResponse {
  user: { id: string; email: string; createdAt: string };
  profile: {
    userId: string;
    displayName: string | null;
    avatarId: number | null;
    customAvatarUri: string | null;
    weightUnit: string | null;
    notificationsEnabled: boolean | null;
    unlockedBadges: string[] | null;
  } | null;
}

export async function getMe(): Promise<ApiResponse<MeResponse>> {
  return apiRequest<MeResponse>("/api/auth/me", { method: "GET" });
}

// Data endpoints
export interface FastData {
  id: string;
  userId?: string;
  startTime: number;
  endTime?: number | null;
  targetDuration: number;
  planId: string;
  planName: string;
  completed?: boolean;
  note?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export async function getFasts(): Promise<ApiResponse<{ fasts: FastData[] }>> {
  return apiRequest("/api/fasts", { method: "GET" });
}

export async function saveFastToCloud(
  fast: FastData
): Promise<ApiResponse<{ fast: FastData }>> {
  return apiRequest("/api/fasts", {
    method: "POST",
    body: fast,
  });
}

export async function deleteFastFromCloud(
  id: string
): Promise<ApiResponse<{ success: boolean }>> {
  return apiRequest(`/api/fasts/${id}`, { method: "DELETE" });
}

// Profile endpoints
export interface ProfileData {
  userId?: string;
  displayName?: string | null;
  avatarId?: number | null;
  customAvatarUri?: string | null;
  weightUnit?: string | null;
  notificationsEnabled?: boolean | null;
  unlockedBadges?: string[] | null;
  // Onboarding fields
  fastingGoal?: string | null;
  experienceLevel?: string | null;
  preferredPlanId?: string | null;
  onboardingCompleted?: boolean | null;
}

export async function getProfile(): Promise<ApiResponse<{ profile: ProfileData }>> {
  return apiRequest("/api/profile", { method: "GET" });
}

export async function updateProfile(
  profile: ProfileData
): Promise<ApiResponse<{ profile: ProfileData }>> {
  return apiRequest("/api/profile", {
    method: "PUT",
    body: profile,
  });
}

// Weight endpoints
export interface WeightData {
  id: string;
  userId?: string;
  date: string;
  weight: number;
}

export async function getWeights(): Promise<ApiResponse<{ weights: WeightData[] }>> {
  return apiRequest("/api/weights", { method: "GET" });
}

export async function saveWeightToCloud(
  weight: WeightData
): Promise<ApiResponse<{ weight: WeightData }>> {
  return apiRequest("/api/weights", {
    method: "POST",
    body: weight,
  });
}

// Sync endpoint
export interface SyncRequest {
  fasts?: FastData[];
  weights?: WeightData[];
  profile?: ProfileData;
  water?: Array<{ date: string; cups: number }>;
}

export interface SyncResponse {
  success: boolean;
  results: {
    fasts: { synced: number; errors: number };
    weights: { synced: number; errors: number };
    profile: { synced: boolean };
    water: { synced: number; errors: number };
  };
  data: {
    fasts: FastData[];
    weights: WeightData[];
    profile: ProfileData | null;
    water: Array<{ date: string; cups: number }>;
  };
}

export async function syncData(
  data: SyncRequest
): Promise<ApiResponse<SyncResponse>> {
  return apiRequest("/api/sync", {
    method: "POST",
    body: data,
  });
}
