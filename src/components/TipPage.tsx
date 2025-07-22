import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Heart, IndianRupee, Smartphone, CreditCard, Wallet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function TipPage() {
  const { username } = useParams();
  const { toast } = useToast();
  const [donorName, setDonorName] = useState("");
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const quickAmounts = [50, 100, 200, 500, 1000];

  const handleTip = async () => {
    if (!donorName.trim() || !amount || parseFloat(amount) <= 0) {
      toast({
        title: "Missing Information",
        description: "Please enter your name and a valid amount",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    
    // Simulate payment processing
    setTimeout(() => {
      toast({
        title: "Thank You! 🎉",
        description: `Your ₹${amount} tip has been sent to ${username}!`,
        duration: 5000,
      });
      
      // Reset form
      setDonorName("");
      setAmount("");
      setMessage("");
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-brand-purple/5">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Creator Info */}
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-white">
                {username?.charAt(0).toUpperCase()}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Support {username}
            </h1>
            <p className="text-muted-foreground">
              Show your appreciation with a tip via UPI
            </p>
          </div>

          {/* Tip Form */}
          <Card className="bg-gradient-card border-0 shadow-glow">
            <CardHeader className="text-center">
              <CardTitle className="flex items-center justify-center space-x-2">
                <Heart className="w-5 h-5 text-red-500" />
                <span>Send a Tip</span>
              </CardTitle>
              <CardDescription>
                Your message will be visible only to the creator
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Name Input */}
              <div className="space-y-2">
                <Label htmlFor="name">Your Name</Label>
                <Input
                  id="name"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="Enter your name"
                  className="text-center"
                />
              </div>

              {/* Amount Selection */}
              <div className="space-y-2">
                <Label>Tip Amount</Label>
                <div className="grid grid-cols-3 gap-2 mb-3">
                  {quickAmounts.map((quickAmount) => (
                    <Button
                      key={quickAmount}
                      variant={amount === quickAmount.toString() ? "purple" : "outline"}
                      size="sm"
                      onClick={() => setAmount(quickAmount.toString())}
                      className="h-12"
                    >
                      ₹{quickAmount}
                    </Button>
                  ))}
                </div>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter custom amount"
                    className="pl-10 text-center text-lg font-semibold"
                    min="1"
                  />
                </div>
              </div>

              {/* Message Input */}
              <div className="space-y-2">
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Write a message for the creator..."
                  className="resize-none"
                  rows={3}
                />
                <p className="text-xs text-muted-foreground">
                  This message is private and visible only to {username}
                </p>
              </div>

              {/* Payment Button */}
              <Button
                onClick={handleTip}
                disabled={isProcessing}
                className="w-full h-14 text-lg font-semibold"
                variant="hero"
              >
                {isProcessing ? (
                  <div className="flex items-center space-x-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Processing...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5" />
                    <span>Pay ₹{amount || "0"} via UPI</span>
                  </div>
                )}
              </Button>

              {/* Payment Methods */}
              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border">
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Smartphone className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">UPI Apps</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-accent rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CreditCard className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">QR Code</span>
                </div>
                <div className="text-center">
                  <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Wallet className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-muted-foreground">UPI ID</span>
                </div>
              </div>

              {/* Security Notice */}
              <div className="text-center p-4 bg-muted/50 rounded-lg">
                <p className="text-xs text-muted-foreground">
                  🔒 Secure payments powered by trusted payment gateways
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="text-center mt-8">
            <p className="text-sm text-muted-foreground">
              Powered by{" "}
              <span className="font-semibold text-brand-purple">Sponsa</span>
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Supporting creators across India
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}