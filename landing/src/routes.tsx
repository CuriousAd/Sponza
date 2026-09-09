import { createBrowserRouter } from "react-router-dom";
import HomePage from "@/pages/HomePage";
import LegalPage from "@/pages/LegalPage";
import NotFound from "@/pages/NotFound";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
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
    path: "/shipping",
    element: <LegalPage />,
  },
  {
    path: "/contact",
    element: <LegalPage />,
  },
  {
    path: "/community-guidelines",
    element: <LegalPage />,
  },
  {
    path: "/about",
    element: <LegalPage />,
  },
  {
    path: "*",
    element: <NotFound />,
  },
]);
