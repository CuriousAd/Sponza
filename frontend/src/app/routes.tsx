import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/features/landing/HomePage";
import LegalPage from "@/features/landing/LegalPage";
import AuthPage from "@/features/auth/AuthPage";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import DashboardPage from "@/features/dashboard/DashboardPage";
import TipPage from "@/features/tip/TipPage";
import OverlayPage from "@/features/overlay/OverlayPage";
import NotFound from "@/features/landing/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    path: "/login",
    element: <AuthPage type="login" />,
  },
  {
    path: "/signup",
    element: <AuthPage type="signup" />,
  },
  {
    path: "/terms",
    element: <LegalPage />,
  },
  {
    path: "/privacy",
    element: <LegalPage />,
  },
  {
    path: "/refund",
    element: <LegalPage />,
  },
  {
    path: "/contact",
    element: <LegalPage />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    ),
  },
  {
    path: "/tip/:slug",
    element: <TipPage />,
  },
  {
    path: "/overlay/:token",
    element: <OverlayPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
