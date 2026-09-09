import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { LANDING_URL } from "@/app/constants";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-6">
      <div className="text-center space-y-4 max-w-md">
        <h1 className="text-6xl font-heading font-medium text-foreground">404</h1>
        <p className="text-xl text-muted-foreground">Page not found</p>
        <p className="text-sm text-muted-foreground/80">
          The dashboard or tip page you are looking for does not exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
          <Button asChild className="w-full sm:w-auto">
            <Link to="/dashboard">Go to Dashboard</Link>
          </Button>
          <Button asChild variant="outline" className="w-full sm:w-auto">
            <a href={LANDING_URL}>Visit Sponsa Home</a>
          </Button>
        </div>
      </div>
    </div>
  );
}
