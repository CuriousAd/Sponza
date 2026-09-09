import { createBrowserRouter, Navigate } from "react-router-dom";
import AuthPage from "@/features/auth/AuthPage";
import ProtectedRoute from "@/features/auth/ProtectedRoute";
import DashboardPage from "@/features/dashboard/DashboardPage";
import TipPage from "@/features/tip/TipPage";
import OverlayPage from "@/features/overlay/OverlayPage";
import NotFound from "@/app/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <Navigate to="/dashboard" replace />,
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
