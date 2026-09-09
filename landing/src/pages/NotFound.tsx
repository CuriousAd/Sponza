import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/Button";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-sponsa-900 px-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-heading font-medium text-sponsa-100">404</h1>
        <p className="text-xl text-sponsa-300/80">Oops! Page not found</p>
        <p className="text-sm text-sponsa-600">
          The page you tried to open does not exist or may have moved.
        </p>
        <Button
          asChild
          className="rounded-xl bg-sponsa-100 text-sponsa-900 hover:bg-sponsa-300"
        >
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
