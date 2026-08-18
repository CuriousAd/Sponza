import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { IndianRupee, Maximize2, Moon, Sun, Users } from "lucide-react";
import { TipEvent } from "@/types/creator";

interface LiveTipsFeedProps {
  tips: TipEvent[];
}

export function LiveTipsFeed({ tips }: LiveTipsFeedProps) {
  const [isDarkMode, setIsDarkMode] = useState(false);

  return (
    <Card className="bg-gradient-card border-0 shadow-card">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="w-5 h-5" />
            <span className="text-lg font-semibold">Live Tips Feed</span>
            <Badge variant="secondary">{tips.length}</Badge>
          </div>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Maximize2 className="w-4 h-4 mr-2" />
                Enlarge View
              </Button>
            </DialogTrigger>
            <DialogContent
              className={`max-w-full w-screen h-screen m-0 p-0 ${isDarkMode ? "bg-gray-900 text-white" : "bg-white"}`}
            >
              <div className={`flex flex-col h-full ${isDarkMode ? "bg-gray-900" : "bg-white"}`}>
                <DialogHeader
                  className={`flex-shrink-0 p-8 border-b ${isDarkMode ? "border-gray-700 bg-gray-800" : "border-gray-200 bg-gray-50"}`}
                >
                  <div className="flex items-center justify-between">
                    <DialogTitle className="flex items-center space-x-3">
                      <Users className="w-7 h-7" />
                      <span className="text-2xl font-bold">Live Tips Feed - Full Screen</span>
                      <Badge variant="secondary" className="text-lg px-4 py-2">
                        {tips.length}
                      </Badge>
                    </DialogTitle>
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-3">
                        <Sun className={`w-5 h-5 ${isDarkMode ? "text-gray-400" : "text-yellow-500"}`} />
                        <Switch checked={isDarkMode} onCheckedChange={setIsDarkMode} className="data-[state=checked]:bg-gray-600" />
                        <Moon className={`w-5 h-5 ${isDarkMode ? "text-blue-400" : "text-gray-400"}`} />
                      </div>
                    </div>
                  </div>
                </DialogHeader>
                <div className="flex-1 overflow-y-auto p-8">
                  <div className="max-w-6xl mx-auto space-y-6">
                    {tips.length === 0 ? (
                      <div className={`text-center py-24 ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                        <Users className="w-24 h-24 mx-auto mb-8 opacity-50" />
                        <p className="text-2xl font-medium">
                          No tips yet. Share your Sponza link to start receiving support!
                        </p>
                      </div>
                    ) : (
                      tips.map((tip) => (
                        <div
                          key={tip.id}
                          className={`flex items-start space-x-6 p-8 rounded-xl animate-fade-in border-2 ${
                            isDarkMode
                              ? "bg-gray-800 border-gray-700 hover:bg-gray-750"
                              : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                          } transition-colors duration-200`}
                        >
                          <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center flex-shrink-0">
                            <IndianRupee className="w-8 h-8 text-white" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-4 mb-3">
                              <span className={`text-2xl font-bold ${isDarkMode ? "text-white" : "text-gray-900"}`}>
                                {tip.donorName}
                              </span>
                              <Badge
                                variant="outline"
                                className={`text-xl px-4 py-2 font-semibold ${
                                  isDarkMode
                                    ? "text-purple-400 border-purple-400 bg-purple-900/20"
                                    : "text-brand-purple border-brand-purple bg-purple-50"
                                }`}
                              >
                                ₹{tip.amount}
                              </Badge>
                              <span className={`text-lg ${isDarkMode ? "text-gray-400" : "text-muted-foreground"}`}>
                                {new Date(tip.timestamp).toLocaleTimeString()}
                              </span>
                            </div>
                            {tip.message && (
                              <p className={`text-xl leading-relaxed ${isDarkMode ? "text-gray-300" : "text-gray-700"}`}>
                                {tip.message}
                              </p>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
        <CardDescription>Recent tips from your viewers</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {tips.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No tips yet. Share your Sponza link to start receiving support!</p>
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
                      {new Date(tip.timestamp).toLocaleTimeString()}
                    </span>
                  </div>
                  {tip.message && <p className="text-sm text-muted-foreground mt-1">{tip.message}</p>}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
