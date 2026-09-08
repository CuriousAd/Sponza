import { API_URL } from "@/app/constants";
import { apiClient } from "@/lib/api-client";
import { Creator } from "@/types/creator";

export interface AuthStatusResponse {
  authenticated: boolean;
  creator_id?: string;
  email?: string;
  display_name?: string;
}

export function startGoogleLogin() {
  window.location.href = `${API_URL}/api/auth/google`;
}

export async function fetchCurrentCreatorProfile(): Promise<Creator | null> {
  try {
    const authStatus = await apiClient<AuthStatusResponse>("/api/auth/me");
    if (!authStatus.authenticated) {
      return getDemoSession();
    }
    return await apiClient<Creator>("/api/creators/me");
  } catch (err) {
    console.warn("Failed to fetch real creator profile, using fallback demo session:", err);
    return getDemoSession();
  }
}

export async function logoutUser() {
  try {
    await apiClient("/api/auth/logout", { method: "POST" });
  } catch (e) {
    console.warn("Logout error:", e);
  }
  clearDemoSession();
  window.location.href = "/login";
}

/* ─── Demo Session Fallback ──────────────────────────────── */

const DEMO_SESSION_KEY = "sponsa_demo_session";

export const DEMO_CREATOR: Creator = {
  id: "demo_creator_1",
  slug: "demo",
  display_name: "Demo Creator",
  email: "demo@sponsa.in",
  avatar_url: null,
  youtube_url: "https://youtube.com/@demo",
  upi_id: "demo@upi",
  upi_verified: true,
  wallet_balance: "1250.00",
  obs_token: "demo_obs_token_12345",
};

export function getDemoSession(): Creator | null {
  const stored = localStorage.getItem(DEMO_SESSION_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      localStorage.removeItem(DEMO_SESSION_KEY);
    }
  }
  return DEMO_CREATOR;
}

export function setDemoSession(creator: Creator) {
  localStorage.setItem(DEMO_SESSION_KEY, JSON.stringify(creator));
}

export function clearDemoSession() {
  localStorage.removeItem(DEMO_SESSION_KEY);
}
