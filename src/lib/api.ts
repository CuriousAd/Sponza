export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000";

export interface Creator {
  id: string;
  email: string;
  display_name: string;
  slug: string;
  avatar_url: string | null;
  youtube_url: string | null;
  upi_id: string | null;
  upi_verified: boolean;
  wallet_balance: string;
  obs_token: string;
}

export async function fetchCurrentCreator(): Promise<Creator | null> {
  try {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      credentials: "include",
    });
    if (!res.ok) return null;
    return (await res.json()) as Creator;
  } catch {
    return null;
  }
}

export function startGoogleLogin(): void {
  window.location.href = `${API_URL}/api/auth/google`;
}
