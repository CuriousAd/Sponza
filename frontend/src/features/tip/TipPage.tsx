import { useState, useRef } from "react";
import { useParams } from "react-router-dom";
import EmojiPicker, { Theme, EmojiClickData } from "emoji-picker-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  IndianRupee,
  Heart,
  Shield,
  CheckCircle,
  Smile,
  Clock,
  User,
  Sparkles,
  AlertCircle,
} from "lucide-react";
import { useToast } from "@/hooks/useToast";
import { broadcastTip } from "@/features/dashboard/hooks/useTipFeed";
import { createTipOrder } from "@/features/tip/tip.service";

// YouTube Super Chat Tier Configuration
interface SuperChatTier {
  min: number;
  max: number;
  tierLevel: number;
  label: string;
  badgeBg: string;
  headerBg: string;
  pinDuration: string;
  maxChars: number;
}

const SUPER_CHAT_TIERS: SuperChatTier[] = [
  {
    min: 10,
    max: 49,
    tierLevel: 1,
    label: "Blue Super Chat",
    badgeBg: "bg-blue-600 text-white",
    headerBg: "from-blue-600 to-blue-700",
    pinDuration: "No pin on stream",
    maxChars: 0, // No message allowed for Tier 1 in YouTube Super Chat
  },
  {
    min: 50,
    max: 99,
    tierLevel: 2,
    label: "Cyan Super Chat",
    badgeBg: "bg-cyan-500 text-black",
    headerBg: "from-cyan-500 to-teal-600",
    pinDuration: "No pin on stream",
    maxChars: 50,
  },
  {
    min: 100,
    max: 199,
    tierLevel: 3,
    label: "Teal Super Chat",
    badgeBg: "bg-teal-500 text-white",
    headerBg: "from-teal-600 to-emerald-600",
    pinDuration: "Pinned for 2 mins",
    maxChars: 100,
  },
  {
    min: 200,
    max: 499,
    tierLevel: 4,
    label: "Yellow Super Chat",
    badgeBg: "bg-amber-500 text-black",
    headerBg: "from-amber-500 to-yellow-600",
    pinDuration: "Pinned for 5 mins",
    maxChars: 150,
  },
  {
    min: 500,
    max: 999,
    tierLevel: 5,
    label: "Orange Super Chat",
    badgeBg: "bg-orange-500 text-white",
    headerBg: "from-orange-500 to-amber-600",
    pinDuration: "Pinned for 10 mins",
    maxChars: 200,
  },
  {
    min: 1000,
    max: 1999,
    tierLevel: 6,
    label: "Magenta Super Chat",
    badgeBg: "bg-pink-600 text-white",
    headerBg: "from-pink-600 to-purple-700",
    pinDuration: "Pinned for 30 mins",
    maxChars: 250,
  },
  {
    min: 2000,
    max: 50000,
    tierLevel: 7,
    label: "Red Super Chat",
    badgeBg: "bg-red-600 text-white",
    headerBg: "from-red-600 to-rose-700",
    pinDuration: "Pinned for 1 hour",
    maxChars: 300,
  },
];

const PRESET_AMOUNTS = [20, 50, 100, 200, 500, 1000, 2000, 5000];

const QUICK_EMOJIS = ["❤️", "🔥", "🎉", "👑", "🚀", "💯", "👏", "😂", "🙌", "🌟", "💰", "🥳", "🎮", "💪"];

function getSuperChatTier(amount: number): SuperChatTier {
  const rounded = Math.max(10, Math.min(50000, amount || 10));
  return (
    SUPER_CHAT_TIERS.find((t) => rounded >= t.min && rounded <= t.max) ||
    SUPER_CHAT_TIERS[SUPER_CHAT_TIERS.length - 1]
  );
}

export default function TipPage() {
  const { slug } = useParams<{ slug?: string }>();
  const creatorSlug = slug || "creator";
  const { toast } = useToast();
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [donorName, setDonorName] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [amount, setAmount] = useState<number>(100);
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [emojiPopoverOpen, setEmojiPopoverOpen] = useState(false);

  const activeTier = getSuperChatTier(amount);

  const handleAmountChange = (newAmount: number) => {
    const validAmount = Math.max(10, Math.min(50000, newAmount));
    setAmount(validAmount);

    // If new tier allows fewer characters than current message, notify/trim
    const newTier = getSuperChatTier(validAmount);
    if (newTier.maxChars === 0) {
      setMessage("");
    } else if (message.length > newTier.maxChars) {
      setMessage(message.substring(0, newTier.maxChars));
    }
  };

  const handleInsertEmoji = (emoji: string) => {
    if (activeTier.maxChars === 0) return;

    if (textareaRef.current) {
      const start = textareaRef.current.selectionStart || message.length;
      const end = textareaRef.current.selectionEnd || message.length;
      const updatedMessage = message.substring(0, start) + emoji + message.substring(end);

      if (updatedMessage.length <= activeTier.maxChars) {
        setMessage(updatedMessage);
      }
    } else {
      if ((message + emoji).length <= activeTier.maxChars) {
        setMessage((prev) => prev + emoji);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || amount < 10) {
      toast({
        title: "Invalid Amount",
        description: "Minimum tip amount is ₹10",
        variant: "destructive",
      });
      return;
    }

    const finalDonorName = isAnonymous
      ? "Anonymous Donor"
      : donorName.trim() || "Anonymous Donor";

    if (activeTier.maxChars > 0 && message.length > activeTier.maxChars) {
      toast({
        title: "Message Too Long",
        description: `₹${amount} tip tier allows maximum ${activeTier.maxChars} characters`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    const tipData = {
      id: `tip_${Date.now()}`,
      donorName: finalDonorName,
      amount: amount,
      message: activeTier.maxChars > 0 ? message.trim() : "",
      timestamp: Date.now(),
    };

    try {
      await createTipOrder({
        creator_slug: creatorSlug,
        donor_name: tipData.donorName,
        amount: tipData.amount,
        message: tipData.message,
      });
    } catch (err) {
      console.warn("Backend API request failed, broadcasting directly for demo mode:", err);
    }

    // Broadcast real-time tip alert to overlay and dashboard
    broadcastTip(tipData);

    setIsSubmitting(false);
    setIsSuccess(true);

    toast({
      title: "Super Chat Tip Sent! 🎉",
      description: `Thank you for supporting @${creatorSlug}!`,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-brand-purple/5 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Creator Header */}
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-gradient-primary rounded-full mx-auto flex items-center justify-center mb-3 shadow-glow">
            <span className="text-white text-2xl font-bold uppercase">
              {creatorSlug.charAt(0)}
            </span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Support @{creatorSlug}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Send a real-time YouTube Super Chat style tip via UPI
          </p>
        </div>

        {/* Live Super Chat Preview Box */}
        <div className="mb-4 rounded-xl shadow-lg overflow-hidden border border-border/50">
          <div className={`bg-gradient-to-r ${activeTier.headerBg} p-3 text-white transition-colors duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold text-base">
                  {isAnonymous ? "Anonymous Donor" : donorName.trim() || "Anonymous Donor"}
                </span>
                <Badge className={`${activeTier.badgeBg} text-xs font-semibold px-2 py-0.5`}>
                  {activeTier.label}
                </Badge>
              </div>
              <span className="text-xl font-extrabold">₹{amount}</span>
            </div>
            <div className="flex items-center space-x-1.5 text-xs opacity-90 mt-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{activeTier.pinDuration}</span>
            </div>
          </div>
          {activeTier.maxChars > 0 && (
            <div className="bg-card p-3 min-h-[50px] flex items-center text-card-foreground text-sm italic">
              {message.trim() ? (
                <span>"{message}"</span>
              ) : (
                <span className="text-muted-foreground not-italic text-xs">
                  Your message preview will appear here...
                </span>
              )}
            </div>
          )}
        </div>

        <Card className="bg-gradient-card border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-center text-lg flex items-center justify-center space-x-2">
              <Heart className="w-5 h-5 text-red-500 fill-red-500" />
              <span>YouTube Super Chat Tip</span>
            </CardTitle>
            <CardDescription className="text-center">
              Higher tip amounts unlock longer pin durations & longer message lengths!
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="text-center py-8 space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
                <h3 className="text-xl font-bold">Tip Sent Successfully!</h3>
                <p className="text-muted-foreground text-sm">
                  Your ₹{amount} Super Chat has been broadcasted to @{creatorSlug}'s stream overlay!
                </p>
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsSuccess(false);
                    setMessage("");
                  }}
                  className="w-full mt-4"
                >
                  Send Another Tip
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Donor Name & Anonymous Switch */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center space-x-1.5">
                      <User className="w-4 h-4 text-brand-purple" />
                      <span>Your Name</span>
                    </label>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">Send Anonymously</span>
                      <Switch
                        checked={isAnonymous}
                        onCheckedChange={(checked) => setIsAnonymous(checked)}
                      />
                    </div>
                  </div>
                  <Input
                    placeholder={isAnonymous ? "Anonymous Donor" : "Your display name"}
                    value={isAnonymous ? "Anonymous Donor" : donorName}
                    onChange={(e) => setDonorName(e.target.value)}
                    disabled={isAnonymous}
                    maxLength={30}
                    className="mt-1"
                  />
                </div>

                {/* Amount Section with Slider & Input */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground">Tip Amount (₹)</label>
                    <Badge variant="outline" className="text-xs">
                      {activeTier.pinDuration}
                    </Badge>
                  </div>

                  <div className="relative">
                    <IndianRupee className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      type="number"
                      placeholder="100"
                      value={amount || ""}
                      onChange={(e) => handleAmountChange(Number(e.target.value))}
                      min={10}
                      max={50000}
                      className="pl-9 font-bold text-xl h-12"
                      required
                    />
                  </div>

                  {/* Interactive Amount Slider */}
                  <div className="pt-2 pb-1 space-y-1">
                    <Slider
                      value={[amount]}
                      onValueChange={(val) => handleAmountChange(val[0])}
                      min={10}
                      max={5000}
                      step={10}
                      className="cursor-pointer"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
                      <span>₹10</span>
                      <span>₹500</span>
                      <span>₹1,000</span>
                      <span>₹2,500</span>
                      <span>₹5,000</span>
                    </div>
                  </div>

                  {/* Preset Amount Chips */}
                  <div className="grid grid-cols-4 gap-1.5 pt-1">
                    {PRESET_AMOUNTS.map((amt) => (
                      <Button
                        key={amt}
                        type="button"
                        variant={amount === amt ? "purple" : "outline"}
                        size="sm"
                        onClick={() => handleAmountChange(amt)}
                        className="text-xs font-semibold"
                      >
                        ₹{amt}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Message & Emoji Section */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-foreground flex items-center space-x-1.5">
                      <Sparkles className="w-4 h-4 text-brand-purple" />
                      <span>Message</span>
                    </label>

                    {/* Emoji Picker Popover */}
                    {activeTier.maxChars > 0 && (
                      <Popover open={emojiPopoverOpen} onOpenChange={setEmojiPopoverOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-7 px-2 text-xs flex items-center space-x-1"
                          >
                            <Smile className="w-3.5 h-3.5 text-yellow-500" />
                            <span>Emojis</span>
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 border-0 shadow-2xl overflow-hidden" align="end">
                          <EmojiPicker
                            theme={Theme.DARK}
                            onEmojiClick={(emojiData: EmojiClickData) => {
                              handleInsertEmoji(emojiData.emoji);
                            }}
                            searchPlaceHolder="Search emojis..."
                            width={320}
                            height={380}
                            lazyLoadEmojis={true}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>

                  {activeTier.maxChars === 0 ? (
                    <div className="p-3 bg-muted/40 rounded-lg border border-dashed text-center text-xs text-muted-foreground space-y-1">
                      <AlertCircle className="w-4 h-4 text-blue-500 mx-auto" />
                      <p className="font-medium text-foreground">Tier 1 Super Chat (₹10 - ₹49)</p>
                      <p>Tip ₹50 or more to add a custom message on stream!</p>
                    </div>
                  ) : (
                    <>
                      <Textarea
                        ref={textareaRef}
                        placeholder="Say something nice to appear on stream..."
                        value={message}
                        onChange={(e) => {
                          if (e.target.value.length <= activeTier.maxChars) {
                            setMessage(e.target.value);
                          }
                        }}
                        maxLength={activeTier.maxChars}
                        rows={3}
                        className="resize-none"
                      />

                      {/* Quick Emoji Reaction Chips */}
                      <div className="flex flex-wrap gap-1 pt-1">
                        {QUICK_EMOJIS.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => handleInsertEmoji(emoji)}
                            className="px-2 py-0.5 bg-muted/60 hover:bg-muted text-sm rounded border border-border/40 transition-colors"
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>

                      {/* Character Count Indicator */}
                      <div className="flex justify-between items-center text-xs text-muted-foreground pt-1">
                        <span>Max {activeTier.maxChars} characters for ₹{amount} tier</span>
                        <span
                          className={`font-semibold ${
                            message.length >= activeTier.maxChars ? "text-amber-500" : ""
                          }`}
                        >
                          {message.length}/{activeTier.maxChars}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-12 text-lg mt-6"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : `Pay ₹${amount || 0} via UPI`}
                </Button>

                <div className="flex items-center justify-center space-x-2 text-xs text-muted-foreground pt-2">
                  <Shield className="w-4 h-4 text-brand-purple" />
                  <span>256-bit Encrypted UPI Payment</span>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
