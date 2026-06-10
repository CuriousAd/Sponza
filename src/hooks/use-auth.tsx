import { useEffect, useState } from "react";
import { Creator, fetchCurrentCreator } from "@/lib/api";

export interface AuthState {
  creator: Creator | null;
  loading: boolean;
  isAuthenticated: boolean;
}

export function useAuth(): AuthState {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    fetchCurrentCreator()
      .then((data) => {
        if (active) setCreator(data);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  return { creator, loading, isAuthenticated: !!creator };
}
