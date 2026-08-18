import { useState, useEffect } from "react";
import { Creator } from "@/types/creator";
import { fetchCurrentCreatorProfile, logoutUser } from "@/features/auth/auth.service";

export function useAuth() {
  const [creator, setCreator] = useState<Creator | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCurrentCreatorProfile()
      .then((profile) => {
        setCreator(profile);
      })
      .catch(() => {
        setCreator(null);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return {
    creator,
    loading,
    isAuthenticated: !!creator,
    logout: logoutUser,
  };
}
