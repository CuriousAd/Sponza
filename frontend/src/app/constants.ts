export const API_URL =
  import.meta.env.VITE_API_URL !== undefined
    ? import.meta.env.VITE_API_URL
    : import.meta.env.DEV
    ? "http://localhost:8000"
    : "";
export const LANDING_URL = import.meta.env.VITE_LANDING_URL || "https://sponsa.tech";

