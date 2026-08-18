import { useEffect, useState } from "react";
import { useParams } from "react"
import { TipEvent } from "@/types/creator";
import { broadcastTip, onTipReceived } from "@/features/dashboard/hooks/useTipFeed";

export default function OverlayPage() {
  const { token } = useParams<{ token?: string }>();
  const [currentTip, setCurrentTip] = useState<TipEvent | null>(null);

  useEffect(() => {
    // 1. Listen via BroadcastChannel
    const cleanupBc = onTipReceived((tip: TipEvent) => {
      triggerAlert(tip);
    });

    // 2. Listen via WebSocket
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${wsProtocol}//${window.location.host.replace("8080", "8000")}/api/overlay/ws/${token || "demo"}`;
    
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(wsUrl);
      ws.onmessage = (evt) => {
        try {
          const data = JSON.parse(evt.data);
          if (data && data.amount) {
            triggerAlert(data);
            broadcastTip(data);
          }
        } catch (e) {
          console.warn("WebSocket payload parse error:", e);
        }
      };
    } catch (err) {
      console.warn("WebSocket connection failed, relying on BroadcastChannel:", err);
    }

    return () => {
      cleanupBc();
      if (ws) ws.close();
    };
  }, [token]);

  const triggerAlert = (tip: TipEvent) => {
    setCurrentTip(tip);
    setTimeout(() => {
      setCurrentTip(null);
    }, 6000);
  };

  if (!currentTip) {
    return <div className="w-full h-full bg-transparent" />;
  }

  const getTierClass = (amount: number) => {
    if (amount >= 1000) return "from-amber-500 to-yellow-300 text-black border-yellow-300";
    if (amount >= 500) return "from-purple-600 to-pink-500 text-white border-pink-400";
    if (amount >= 100) return "from-blue-600 to-indigo-500 text-white border-blue-400";
    return "from-emerald-600 to-teal-500 text-white border-emerald-400";
  };

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent p-4">
      <div
        className={`max-w-md w-full p-6 rounded-2xl bg-gradient-to-r shadow-2xl border-4 transform animate-bounce-in transition-all duration-500 ${getTierClass(
          currentTip.amount
        )}`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-2xl font-black uppercase tracking-wider">
            {currentTip.donorName}
          </span>
          <span className="text-3xl font-extrabold bg-black/20 px-4 py-1 rounded-full">
            ₹{currentTip.amount}
          </span>
        </div>
        {currentTip.message && (
          <p className="text-lg font-medium italic mt-2 opacity-95">
            "{currentTip.message}"
          </p>
        )}
      </div>
    </div>
  );
}
