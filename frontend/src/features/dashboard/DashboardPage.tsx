import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LogOut, Settings } from "lucide-react";
import { useAuth } from "@/features/auth/useAuth";
import { useTipFeed } from "@/features/dashboard/hooks/useTipFeed";
import { SessionControl } from "@/features/dashboard/components/SessionControl";
import { SponsaLinks } from "@/features/dashboard/components/SponsaLinks";
import { LiveTipsFeed } from "@/features/dashboard/components/LiveTipsFeed";
import { WalletCard } from "@/features/dashboard/components/WalletCard";
import { QuickStats } from "@/features/dashboard/components/QuickStats";

export default function DashboardPage() {
  const { creator, logout } = useAuth();
  const [isLive, setIsLive] = useState(false);

  const initialBalance = creator ? Math.round(parseFloat(creator.wallet_balance)) : 0;
  const { tips, walletBalance } = useTipFeed(initialBalance);

  const creatorSlug = creator?.slug ?? "creator";
  const creatorName = creator?.display_name ?? "Creator";
  const obsToken = creator?.obs_token ?? "token";
  const sponsaLink = `https://sponsa.in/${creatorSlug}`;
  const localTipLink = `${window.location.origin}/tip/${creatorSlug}`;
  const overlayLink = `${window.location.origin}/overlay/${obsToken}`;

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
                <span className="text-white text-sm font-medium">
                  {creatorName.charAt(0)}
                </span>
              </div>
              <span className="text-sm font-medium">{creatorSlug}</span>
            </div>
            <Button variant="ghost" size="sm" onClick={logout}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </nav>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <SessionControl isLive={isLive} setIsLive={setIsLive} />
            <SponsaLinks sponsaLink={sponsaLink} localTipLink={localTipLink} overlayLink={overlayLink} />
            <LiveTipsFeed tips={tips} />
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <WalletCard balance={walletBalance} />
            <QuickStats tips={tips} localTipLink={localTipLink} overlayLink={overlayLink} />
          </div>
        </div>
      </div>
    </div>
  );
}
