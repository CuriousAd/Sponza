import { createBrowserRouter, Outlet } from "react-router-dom";
import { lazy, Suspense } from "react";
import HomePage from "@/pages/HomePage";
import NotFound from "@/pages/NotFound";

const LegalPage = lazy(() => import("@/pages/LegalPage"));

const SuspenseWrapper = () => (
  <Suspense fallback={<div className="min-h-screen bg-sponsa-900 flex items-center justify-center text-sponsa-100">Loading...</div>}>
    <Outlet />
  </Suspense>
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    element: <SuspenseWrapper />,
    children: [
      { path: "/terms", element: <LegalPage /> },
      { path: "/privacy", element: <LegalPage /> },
      { path: "/refund", element: <LegalPage /> },
      { path: "/shipping", element: <LegalPage /> },
      { path: "/contact", element: <LegalPage /> },
      { path: "/community-guidelines", element: <LegalPage /> },
      { path: "/about", element: <LegalPage /> },
    ],
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
