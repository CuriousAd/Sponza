import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play, Square } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface SessionControlProps {
  isLive: boolean;
  setIsLive: (val: boolean) => void;
}

export function SessionControl({ isLive, setIsLive }: SessionControlProps) {
  const { toast } = useToast();

  const startNewSession = () => {
    setIsLive(true);
    toast({
      title: "Sponsa Session Started!",
      description: "Your tip link is now active for this stream",
      duration: 3000,
    });
  };

  const stopSession = () => {
    setIsLive(false);
    toast({
      title: "Session Stopped",
      description: "Your Sponsa session has been ended",
      duration: 2000,
    });
  };

  return (
    <Card className="bg-gradient-card border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <div
                className={`w-3 h-3 rounded-full ${isLive ? "bg-green-500 animate-pulse" : "bg-gray-400"}`}
              />
              <span>Session Status</span>
            </CardTitle>
            <CardDescription>
              {isLive
                ? "Your Sponsa link is active and receiving tips"
                : "Start a new session to activate tip collection"}
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            {!isLive ? (
              <Button variant="hero" onClick={startNewSession}>
                <Play className="w-4 h-4 mr-2" />
                Start Sponsa
              </Button>
            ) : (
              <Button variant="destructive" onClick={stopSession}>
                <Square className="w-4 h-4 mr-2" />
                Stop Session
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
