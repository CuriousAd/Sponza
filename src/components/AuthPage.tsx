import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { startGoogleLogin } from "@/lib/api";

interface AuthPageProps {
  type: "login" | "signup";
}

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
      <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
      <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 35.091 26.715 36 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
      <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
    </svg>
  );
}

export default function AuthPage({ type }: AuthPageProps) {
  const isLogin = type === "login";

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-brand-purple/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-2xl font-bold text-foreground">Sponsa</span>
          </Link>
        </div>

        <Card className="bg-gradient-card border-0 shadow-glow">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">
              {isLogin ? "Welcome Back" : "Create Account"}
            </CardTitle>
            <CardDescription>
              {isLogin
                ? "Sign in to access your creator dashboard"
                : "Join thousands of creators earning more with Sponsa"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              onClick={startGoogleLogin}
              variant="outline"
              className="w-full h-12 text-base bg-white text-gray-800 hover:bg-gray-50"
            >
              <span className="flex items-center space-x-3">
                <GoogleIcon />
                <span>Continue with Google</span>
              </span>
            </Button>

            <p className="mt-6 text-center text-xs text-muted-foreground">
              We only use Google to verify your identity. No passwords required.
            </p>

            <div className="mt-6 text-center">
              <p className="text-sm text-muted-foreground">
                {isLogin ? "New to Sponsa?" : "Already have an account?"}{" "}
                <Link
                  to={isLogin ? "/signup" : "/login"}
                  className="font-medium text-brand-purple hover:underline"
                >
                  {isLogin ? "Get started" : "Sign in"}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-sm text-muted-foreground">
            Need help? Contact{" "}
            <a href="mailto:support@sponsa.in" className="text-brand-purple hover:underline">
              support@sponsa.in
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}
