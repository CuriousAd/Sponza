import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Copy, ExternalLink, Play, Wallet, Settings, IndianRupee, Eye, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Tip {
  id: string;
  donorName: string;
  amount: number;
  message: string;
  timestamp: Date;
}

export default function CreatorDashboard() {
  const { toast } = useToast();
  const [isLive, setIsLive] = useState(false);
  const [walletBalance, setWalletBalance] = useState(2847);
  const [tips, setTips] = useState<Tip[]>([
    {
      id: "1",
      donorName: "Raj Kumar",
      amount: 100,
      message: "Great stream! Keep it up!",
      timestamp: new Date(Date.now() - 1000 * 60 * 2)
    },
    {
      id: "2", 
      donorName: "Priya Sharma",
      amount: 250,
      message: "Love your content ❤️",
      timestamp: new Date(Date.now() - 1000 * 60 * 15)
    },
    {
      id: "3",
      donorName: "Anonymous",
      amount: 50,
      message: "",
      timestamp: new Date(Date.now() - 1000 * 60 * 45)
    }
  ]);

  const creatorUsername = "ronak"; // This would come from auth
  const sponsaLink = `https://sponsa.in/${creatorUsername}`;
  const overlayLink = `https://sponsa.in/overlay/${creatorUsername}`;

  const copyToClipboard = (text: string, type: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${type} copied to clipboard`,
      duration: 2000,
    });
  };

  const startNewSession = () => {
    setIsLive(true);
    toast({
      title: "Sponsa Session Started!",
      description: "Your tip link is now active for this stream",
      duration: 3000,
    });
  };

  // Simulate new tips when live
  useEffect(() => {
    if (!isLive) return;
    
    const interval = setInterval(() => {
      if (Math.random() > 0.8) {
        const donors = ["Arjun", "Sneha", "Vikram", "Kavya", "Anonymous"];
        const amounts = [50, 100, 150, 200, 250, 500];
        const messages = [
          "Amazing content!",
          "Keep going!",
          "First time viewer, loving it!",
          "",
          "Big fan ❤️",
          "Thanks for the entertainment!"
        ];
        
        const newTip: Tip = {
          id: Date.now().toString(),
          donorName: donors[Math.floor(Math.random() * donors.length)],
          amount: amounts[Math.floor(Math.random() * amounts.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          timestamp: new Date()
        };
        
        setTips(prev => [newTip, ...prev]);
        setWalletBalance(prev => prev + Math.floor(newTip.amount * 0.9)); // 90% after 10% fee
        
        toast({
          title: "New Tip!",
          description: `${newTip.donorName} sent ₹${newTip.amount}`,
          duration: 3000,
        });
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [isLive, toast]);

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-primary rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">S</span>
            </div>
            <span className="text-xl font-bold text-foreground">Sponsa</span>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Button>
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-brand-purple rounded-full flex items-center justify-center">
                <span className="text-white text-sm font-medium">R</span>
              </div>
              <span className="text-sm font-medium">{creatorUsername}</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            {/* Session Control */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${isLive ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <span>Session Status</span>
                    </CardTitle>
                    <CardDescription>
                      {isLive ? "Your Sponsa link is active and receiving tips" : "Start a new session to activate tip collection"}
                    </CardDescription>
                  </div>
                  <Button 
                    variant={isLive ? "outline" : "hero"} 
                    onClick={startNewSession}
                    disabled={isLive}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isLive ? "Session Active" : "Start Sponsa"}
                  </Button>
                </div>
              </CardHeader>
            </Card>

            {/* Sponsa Links */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>Your Sponsa Links</CardTitle>
                <CardDescription>Share these with your viewers</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Tip Link</label>
                  <div className="flex space-x-2 mt-1">
                    <Input value={sponsaLink} readOnly className="font-mono text-sm" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(sponsaLink, "Tip link")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm" asChild>
                      <a href={sponsaLink} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground">OBS Overlay</label>
                  <div className="flex space-x-2 mt-1">
                    <Input value={overlayLink} readOnly className="font-mono text-sm" />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => copyToClipboard(overlayLink, "Overlay link")}
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Add as Browser Source in OBS (recommended size: 400x100px)
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Live Tips Feed */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Users className="w-5 h-5" />
                  <span>Live Tips Feed</span>
                  <Badge variant="secondary">{tips.length}</Badge>
                </CardTitle>
                <CardDescription>Recent tips from your viewers</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {tips.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>No tips yet. Share your Sponsa link to start receiving support!</p>
                    </div>
                  ) : (
                    tips.map((tip) => (
                      <div key={tip.id} className="flex items-start space-x-3 p-3 bg-muted/50 rounded-lg animate-fade-in">
                        <div className="w-10 h-10 bg-gradient-primary rounded-full flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <span className="font-medium text-foreground">{tip.donorName}</span>
                            <Badge variant="outline" className="text-brand-purple border-brand-purple">
                              ₹{tip.amount}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {tip.timestamp.toLocaleTimeString()}
                            </span>
                          </div>
                          {tip.message && (
                            <p className="text-sm text-muted-foreground mt-1">{tip.message}</p>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            {/* Wallet */}
            <Card className="bg-gradient-hero text-white border-0 shadow-glow">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Wallet className="w-5 h-5" />
                  <span>Wallet Balance</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold mb-4">₹{walletBalance.toLocaleString('en-IN')}</div>
                <Button variant="orange" className="w-full">
                  <IndianRupee className="w-4 h-4 mr-2" />
                  Withdraw to UPI
                </Button>
                <p className="text-xs text-white/70 mt-2 text-center">
                  Instant withdrawals to your UPI ID
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>Today's Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Tips Received</span>
                  <span className="font-medium">{tips.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Total Amount</span>
                  <span className="font-medium">₹{tips.reduce((sum, tip) => sum + tip.amount, 0)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">After Fees (10%)</span>
                  <span className="font-medium text-brand-purple">
                    ₹{Math.floor(tips.reduce((sum, tip) => sum + tip.amount, 0) * 0.9)}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-gradient-card border-0 shadow-card">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <Button variant="outline" className="w-full justify-start">
                  <Eye className="w-4 h-4 mr-2" />
                  Preview Tip Page
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Settings className="w-4 h-4 mr-2" />
                  Customize Overlay
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}