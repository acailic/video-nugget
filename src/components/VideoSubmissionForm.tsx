import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Youtube, Sparkles } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

export const VideoSubmissionForm = () => {
  const [url, setUrl] = useState("");
  const [customPrompt, setCustomPrompt] = useState("");
  const [summaryType, setSummaryType] = useState("comprehensive");
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Basic URL validation
    const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)/;
    if (!youtubeRegex.test(url)) {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid YouTube URL",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Video Added to Queue",
      description: "Your video has been queued for AI processing",
    });

    // Reset form
    setUrl("");
    setCustomPrompt("");
    setSummaryType("comprehensive");
  };

  return (
    <Card className="gradient-card shadow-card border-border">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-foreground">
          <div className="p-2 rounded-lg bg-gradient-to-r from-youtube-red to-youtube-orange">
            <Plus className="h-4 w-4 text-white" />
          </div>
          <span>Add YouTube Video</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <div className="relative">
              <Youtube className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="youtube-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://www.youtube.com/watch?v=..."
                className="pl-10"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="summary-type">Summary Type</Label>
            <Select value={summaryType} onValueChange={setSummaryType}>
              <SelectTrigger>
                <SelectValue placeholder="Choose summary type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="comprehensive">Comprehensive Summary</SelectItem>
                <SelectItem value="key-points">Key Points Only</SelectItem>
                <SelectItem value="nuggets">Best Nuggets</SelectItem>
                <SelectItem value="action-items">Action Items</SelectItem>
                <SelectItem value="custom">Custom Prompt</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {summaryType === "custom" && (
            <div className="space-y-2">
              <Label htmlFor="custom-prompt">Custom Prompt</Label>
              <Textarea
                id="custom-prompt"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Enter your custom prompt for AI processing..."
                className="min-h-[100px]"
              />
            </div>
          )}

          <Button type="submit" className="w-full gradient-youtube text-white shadow-youtube hover:shadow-glow transition-all duration-300">
            <Sparkles className="mr-2 h-4 w-4" />
            Process with AI
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};