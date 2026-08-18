import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Zap, Shield, Wallet, Users, IndianRupee, Youtube } from "lucide-react";
import { Link } from "react-router-dom";
import heroImage from "@/assets/hero-bg.jpg";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">Sponza</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button variant="purple" asChild>
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center space-x-2 bg-brand-purple/10 text-brand-purple px-4 py-2 rounded-full mb-6 animate-fade-in">
              <Zap className="w-4 h-4" />
              <span className="text-sm font-medium">Lower fees than YouTube Super Chat</span>
            </div>
            
            <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 animate-slide-up">
              Empower Your{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Creator Journey
              </span>
              {" "}with UPI Tips
            </h1>
            
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto animate-slide-up">
              Accept real-time tips from your viewers with just 5-10% fees. 
              Built for Indian YouTube creators who deserve better than 30% platform cuts.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center animate-slide-up">
              <Button variant="hero" size="xl" asChild>
                <Link to="/signup">
                  Start Earning Now <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
              <Button variant="outline" size="xl" asChild>
                <Link to="/dashboard">
                  See How It Works
                </Link>
              </Button>
            </div>
            
            <div className="mt-12 flex items-center justify-center space-x-8 text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-brand-purple" />
                <span>Secure UPI</span>
              </div>
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-brand-orange" />
                <span>Real-time Tips</span>
              </div>
              <div className="flex items-center space-x-2">
                <Wallet className="w-5 h-5 text-brand-purple" />
                <span>Instant Wallet</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
              Why Choose Sponza?
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Built specifically for Indian creators, with features that actually matter for your growth.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <IndianRupee className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Lower Fees</CardTitle>
                <CardDescription>
                  Keep 90-95% of your earnings vs YouTube's 70% after their 30% cut
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <CardTitle>Real-time Updates</CardTitle>
                <CardDescription>
                  See tips instantly in your dashboard and OBS overlay as they happen
                </CardDescription>
              </CardHeader>
            </Card>
            
            <Card className="bg-gradient-card border-0 shadow-card hover:shadow-glow transition-all duration-300">
              <CardHeader>
                <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle>UPI Security</CardTitle>
                <CardDescription>
                  Powered by trusted payment gateways with bank-level security
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="flex items-center space-x-2 mb-4 md:mb-0">
              <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">S</span>
              </div>
              <span className="text-xl font-bold text-foreground">Sponza</span>
            </div>
            <div className="text-muted-foreground">
              © {new Date().getFullYear()} Sponza. Built for creators, by creators.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
