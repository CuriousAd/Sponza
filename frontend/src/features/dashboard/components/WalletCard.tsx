import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Wallet } from "lucide-react";

interface WalletCardProps {
  balance: number;
}

export function WalletCard({ balance }: WalletCardProps) {
  return (
    <Card className="bg-gradient-hero text-white border-0 shadow-glow">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Wallet className="w-5 h-5" />
          <span>Wallet Balance</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold mb-4">
          ₹{balance.toLocaleString("en-IN")}
        </div>
        <Button variant="orange" className="w-full">
          <IndianRupee className="w-4 h-4 mr-2" />
          Withdraw to UPI
        </Button>
        <p className="text-xs text-white/70 mt-2 text-center">
          Instant withdrawals to your UPI ID
        </p>
      </CardContent>
    </Card>
  );
}
