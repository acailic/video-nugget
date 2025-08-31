import { useState } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Save } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const Config = () => {
  const [apiProvider, setApiProvider] = useState("openai");
  const [apiKey, setApiKey] = useState("");
  const [summaryPrompt, setSummaryPrompt] = useState("Summarize this video content in a clear, concise manner. Focus on key insights and actionable points.");
  const [nuggetsPrompt, setNuggetsPrompt] = useState("Extract the most valuable insights and key takeaways from this content. Present them as short, actionable nuggets.");
  const { toast } = useToast();

  const handleSave = () => {
    // Save to localStorage or send to backend
    localStorage.setItem('contentai-config', JSON.stringify({
      apiProvider,
      apiKey,
      summaryPrompt,
      nuggetsPrompt
    }));
    
    toast({
      title: "Settings Saved",
      description: "Your configuration has been saved successfully.",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground mb-2">Configuration</h1>
          <p className="text-muted-foreground">
            Configure your AI provider and custom prompts for video summarization.
          </p>
        </div>

        <div className="space-y-6">
          {/* API Configuration */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>AI Provider Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="api-provider">AI Provider</Label>
                <Select value={apiProvider} onValueChange={setApiProvider}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="openai">OpenAI (GPT-4)</SelectItem>
                    <SelectItem value="claude">Anthropic Claude</SelectItem>
                    <SelectItem value="gemini">Google Gemini</SelectItem>
                    <SelectItem value="ollama">Ollama (Local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="api-key">API Key</Label>
                <Input
                  id="api-key"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key..."
                  className="font-mono"
                />
                <p className="text-xs text-muted-foreground">
                  Your API key is stored locally and never shared.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Configuration */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Custom Prompts</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="summary-prompt">Summary Prompt</Label>
                <Textarea
                  id="summary-prompt"
                  value={summaryPrompt}
                  onChange={(e) => setSummaryPrompt(e.target.value)}
                  placeholder="Enter your custom summary prompt..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be used to generate comprehensive summaries.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="nuggets-prompt">Nuggets Prompt</Label>
                <Textarea
                  id="nuggets-prompt"
                  value={nuggetsPrompt}
                  onChange={(e) => setNuggetsPrompt(e.target.value)}
                  placeholder="Enter your custom nuggets extraction prompt..."
                  className="min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground">
                  This prompt will be used to extract key insights and nuggets.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Quick Prompt Templates */}
          <Card className="shadow-card border-border">
            <CardHeader>
              <CardTitle>Quick Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Button variant="outline" size="sm" onClick={() => setSummaryPrompt("Summarize this video content in a clear, concise manner. Focus on key insights and actionable points.")}>
                  Default Summary
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSummaryPrompt("Create a detailed summary suitable for technical content. Include code examples and implementation details.")}>
                  Technical Focus
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSummaryPrompt("Summarize for business professionals. Focus on strategy, insights, and actionable business advice.")}>
                  Business Focus
                </Button>
                <Button variant="outline" size="sm" onClick={() => setSummaryPrompt("Create an educational summary. Focus on learning objectives and key concepts for students.")}>
                  Educational
                </Button>
              </div>
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSave} className="gradient-youtube text-white">
              <Save className="mr-2 h-4 w-4" />
              Save Configuration
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Config;