import { useState, useEffect } from "react";
import { TipEvent } from "@/types/creator";
import { useToast } from "@/hooks/useToast";

const CHANNEL_NAME = "sponza_tip_events";

export function broadcastTip(tip: TipEvent) {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.postMessage(tip);
    bc.close();
  } catch (e) {
    console.warn("BroadcastChannel not supported", e);
  }
}

export function onTipReceived(callback: (tip: TipEvent) => void) {
  try {
    const bc = new BroadcastChannel(CHANNEL_NAME);
    bc.onmessage = (event) => {
      if (event.data && event.data.amount) {
        callback(event.data as TipEvent);
      }
    };
    return () => bc.close();
  } catch {
    return () => {};
  }
}

export function useTipFeed(initialBalance: number) {
  const { toast } = useToast();
  const [walletBalance, setWalletBalance] = useState(initialBalance);

  const [tips, setTips] = useState<TipEvent[]>([
    {
      id: "seed_1",
      donorName: "Raj Kumar",
      amount: 100,
      message: "Great stream! Keep it up!",
      timestamp: Date.now() - 1000 * 60 * 2,
    },
    {
      id: "seed_2",
      donorName: "Priya Sharma",
      amount: 250,
      message: "Love your content ❤️",
      timestamp: Date.now() - 1000 * 60 * 15,
    },
    {
      id: "seed_3",
      donorName: "Anonymous",
      amount: 50,
      message: "",
      timestamp: Date.now() - 1000 * 60 * 45,
    },
  ]);

  useEffect(() => {
    const cleanup = onTipReceived((tipEvent: TipEvent) => {
      setTips((prev) => [tipEvent, ...prev]);
      setWalletBalance((prev) => prev + Math.floor(tipEvent.amount * 0.9));

      toast({
        title: "💰 New Tip Received!",
        description: `${tipEvent.donorName} sent ₹${tipEvent.amount.toLocaleString("en-IN")}`,
        duration: 4000,
      });
    });

    return cleanup;
  }, [toast]);

  return {
    tips,
    walletBalance,
  };
}
