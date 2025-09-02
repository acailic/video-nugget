import { useState } from "react";
import { DesktopLayout } from "@/components/DesktopLayout";
import { VideoSubmissionForm } from "@/components/VideoSubmissionForm";
import { SimpleVideoCard } from "@/components/SimpleVideoCard";
import { CommandPalette } from "@/components/CommandPalette";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Filter, Layers, Grid, List } from "lucide-react";

// Simplified sample data
const sampleVideos = [
  {
    title: "React Hooks Tutorial",
    creator: "Tech Educator", 
    duration: "23:45",
    status: "completed" as const,
    summaryPreview: "Covers advanced React Hooks patterns and best practices.",
    url: "https://youtube.com/watch?v=example1",
  },
  {
    title: "AI Fundamentals",
    creator: "AI Academy",
    duration: "18:32", 
    status: "processing" as const,
    processingProgress: 67,
    url: "https://youtube.com/watch?v=example2",
  },
];

const Index = () => {
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');

  const sidebar = (
    <div className="space-y-6">
      <VideoSubmissionForm />
      
      {/* Quick Stats */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground uppercase tracking-wider">
          Quick Stats
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-xl font-bold text-foreground">12</div>
            <div className="text-xs text-muted-foreground">Processed</div>
          </div>
          <div className="p-3 rounded-lg bg-muted/30 border border-border/50">
            <div className="text-xl font-bold text-youtube-red">3</div>
            <div className="text-xs text-muted-foreground">Processing</div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <DesktopLayout sidebar={sidebar}>
      <CommandPalette 
        open={commandPaletteOpen} 
        onOpenChange={setCommandPaletteOpen} 
      />
      
      <div className="space-y-6">
        {/* Desktop-optimized header */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-4xl font-bold text-foreground tracking-tight">
              Content Library
            </h1>
            <p className="text-muted-foreground text-lg">
              Your AI-enhanced video collection • {sampleVideos.length} videos
            </p>
          </div>
          
          <div className="flex items-center space-x-3">
            <div className="flex items-center border border-border/50 rounded-lg p-1 bg-muted/30">
              <Button
                variant={viewMode === 'list' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('list')}
                className="h-8 px-3"
              >
                <List className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === 'grid' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setViewMode('grid')}
                className="h-8 px-3"
              >
                <Grid className="h-4 w-4" />
              </Button>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-4 border-border/50 hover:border-primary/50"
            >
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </Button>
          </div>
        </div>

        {/* Enhanced tabs with desktop styling */}
        <Tabs defaultValue="all" className="w-full">
          <TabsList className="grid grid-cols-3 w-fit h-11 p-1 bg-muted/40 border border-border/50 backdrop-blur-sm">
            <TabsTrigger 
              value="all" 
              className="px-8 text-sm font-semibold data-[state=active]:gradient-youtube data-[state=active]:text-white data-[state=active]:shadow-glow transition-all"
            >
              <Layers className="h-4 w-4 mr-2" />
              All Videos
            </TabsTrigger>
            <TabsTrigger 
              value="completed"
              className="px-8 text-sm font-semibold data-[state=active]:bg-success data-[state=active]:text-success-foreground"
            >
              ✅ Processed
            </TabsTrigger>
            <TabsTrigger 
              value="processing"
              className="px-8 text-sm font-semibold data-[state=active]:gradient-youtube data-[state=active]:text-white"
            >
              ⚡ Processing
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="mt-6">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
              {sampleVideos.map((video, index) => (
                <div 
                  key={index} 
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <SimpleVideoCard {...video} />
                </div>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="completed" className="mt-6">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
              {sampleVideos
                .filter(video => video.status === "completed")
                .map((video, index) => (
                  <div 
                    key={index} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SimpleVideoCard {...video} />
                  </div>
                ))}
            </div>
          </TabsContent>

          <TabsContent value="processing" className="mt-6">
            <div className={viewMode === 'grid' ? 'grid grid-cols-1 lg:grid-cols-2 gap-4' : 'space-y-3'}>
              {sampleVideos
                .filter(video => video.status === "processing")
                .map((video, index) => (
                  <div 
                    key={index} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <SimpleVideoCard {...video} />
                  </div>
                ))}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DesktopLayout>
  );
};

export default Index;