import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <h1 className="text-6xl font-bold text-brand-purple">404</h1>
        <p className="text-xl text-muted-foreground">Oops! Page not found</p>
        <Button variant="purple" asChild>
          <Link to="/">Return to Home</Link>
        </Button>
      </div>
    </div>
  );
}
