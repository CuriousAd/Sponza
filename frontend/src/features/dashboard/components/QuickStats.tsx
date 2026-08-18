import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, Settings } from "lucide-react";
import { TipEvent } from "@/types/creator";

interface QuickStatsProps {
  tips: TipEvent[];
  localTipLink: string;
  overlayLink: string;
}

export function QuickStats({ tips, localTipLink, overlayLink }: QuickStatsProps) {
  const totalAmount = tips.reduce((sum, tip) => sum + tip.amount, 0);
  const afterFees = Math.floor(totalAmount * 0.9);

  return (
    <>
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
            <span className="font-medium">
              ₹{totalAmount.toLocaleString("en-IN")}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">After Fees (10%)</span>
            <span className="font-medium text-brand-purple">
              ₹{afterFees.toLocaleString("en-IN")}
            </span>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-gradient-card border-0 shadow-card">
        <CardHeader>
          <CardTitle>Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={localTipLink} target="_blank" rel="noopener noreferrer">
              <Eye className="w-4 h-4 mr-2" />
              Preview Tip Page
            </a>
          </Button>
          <Button variant="outline" className="w-full justify-start" asChild>
            <a href={overlayLink} target="_blank" rel="noopener noreferrer">
              <Settings className="w-4 h-4 mr-2" />
              Preview OBS Overlay
            </a>
          </Button>
        </CardContent>
      </Card>
    </>
  );
}
