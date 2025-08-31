import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Youtube, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export const VideoSubmissionForm = () => {
  const [url, setUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [summaryType, setSummaryType] = useState("comprehensive");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Basic URL validation with enhanced feedback
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/;
    if (!youtubeRegex.test(url)) {
      toast({
        title: "⚠️ Invalid YouTube URL",
        description: "Please enter a valid YouTube URL (youtube.com or youtu.be)",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    // Simulate processing delay for premium feel
    await new Promise(resolve => setTimeout(resolve, 800));

    toast({
      title: "✨ Video Queued Successfully",
      description: "Your video is now being processed with AI",
    });

    // Reset form with smooth animation
    setUrl("");
    setCustomPrompt("");
    setSummaryType("comprehensive");
    setIsSubmitting(false);
  };

  return (
    <Card className="elite-card animate-slide-up group">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-3 text-foreground">
          <div className="p-2.5 rounded-xl gradient-youtube shadow-glow animate-float group-hover:animate-pulse-glow">
            <Plus className="h-5 w-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold">Add YouTube Video</span>
            <p className="text-sm text-muted-foreground font-normal mt-0.5">
              Transform any video into AI insights
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="youtube-url" className="text-sm font-semibold text-foreground">
              YouTube URL
            </Label>
            <div className="relative group/input">
              <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within/input:text-primary transition-colors" />
              <Input
                id="youtube-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-10 elite-input h-12 text-base"
                required
                disabled={isSubmitting}
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label htmlFor="summary-type" className="text-sm font-semibold text-foreground">
              AI Processing Type
            </Label>
            <Select value={summaryType} onValueChange={setSummaryType} disabled={isSubmitting}>
              <SelectTrigger className="elite-input h-12">
                <SelectValue placeholder="Choose processing type" />
              </SelectTrigger>
              <SelectContent className="gradient-card border-border/50">
                <SelectItem value="comprehensive">📚 Comprehensive Summary</SelectItem>
                <SelectItem value="key-points">🎯 Key Points Only</SelectItem>
                <SelectItem value="nuggets">💎 Best Nuggets</SelectItem>
                <SelectItem value="action-items">✅ Action Items</SelectItem>
                <SelectItem value="custom">🎨 Custom Prompt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {summaryType === "custom" && (
            <div className="space-y-3 animate-slide-up">
              <Label htmlFor="custom-prompt" className="text-sm font-semibold text-foreground">
                Custom AI Instructions
              </Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe exactly what you want the AI to extract from this video..."
                className="min-h-[120px] elite-input resize-none"
                disabled={isSubmitting}
              />
            </div>
          )}

          <Button 
            type="submit" 
            className="w-full h-12 elite-button text-base font-semibold micro-bounce"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
                Processing...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Transform with AI
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};