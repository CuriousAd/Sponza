import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Copy, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/useToast";

interface SponsaLinksProps {
  sponsaLink: string;
  localTipLink: string;
  overlayLink: string;
}

export function SponsaLinks({ sponsaLink, localTipLink, overlayLink }: SponsaLinksProps) {
  const { toast } = useToast();

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      duration: 2000,
    });
  };

  return (
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
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(sponsaLink, "Tip link")}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={localTipLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Open{" "}
            <a href={localTipLink} target="_blank" rel="noopener noreferrer" className="text-brand-purple hover:underline font-mono">
              {localTipLink}
            </a>{" "}
            to test locally
          </p>
        </div>

        <div>
          <label className="text-sm font-medium text-muted-foreground">OBS Overlay</label>
          <div className="flex space-x-2 mt-1">
            <Input value={overlayLink} readOnly className="font-mono text-sm" />
            <Button variant="outline" size="sm" onClick={() => copyToClipboard(overlayLink, "Overlay link")}>
              <Copy className="w-4 h-4" />
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a href={overlayLink} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Add as Browser Source in OBS (recommended size: 800×200px)
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
