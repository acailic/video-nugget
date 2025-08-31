import { Header } from "@/components/Header";
import { VideoSubmissionForm } from "@/components/VideoSubmissionForm";
import { SimpleVideoCard } from "@/components/SimpleVideoCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";

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
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-10 max-w-7xl">
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-8">
          {/* Left Column - Add Video */}
          <div className="xl:col-span-2">
            <VideoSubmissionForm />
          </div>

          {/* Right Column - Videos Library */}
          <div className="xl:col-span-3 space-y-8">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <h2 className="text-3xl font-bold text-foreground tracking-tight">
                  Content Library
                </h2>
                <p className="text-muted-foreground text-lg">
                  Your AI-enhanced video collection
                </p>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                className="h-10 px-4 border-border/50 hover:border-primary/50 micro-bounce"
              >
                <Filter className="h-4 w-4 mr-2" />
                Filter & Sort
              </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 w-fit h-12 p-1 bg-muted/50 border border-border/50">
                <TabsTrigger 
                  value="all" 
                  className="px-6 text-sm font-semibold data-[state=active]:gradient-youtube data-[state=active]:text-white data-[state=active]:shadow-glow"
                >
                  All Videos
                </TabsTrigger>
                <TabsTrigger 
                  value="completed"
                  className="px-6 text-sm font-semibold data-[state=active]:bg-success data-[state=active]:text-success-foreground"
                >
                  ✅ Processed
                </TabsTrigger>
                <TabsTrigger 
                  value="processing"
                  className="px-6 text-sm font-semibold data-[state=active]:gradient-youtube data-[state=active]:text-white"
                >
                  ⚡ Processing
                </TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-8 space-y-4">
                {sampleVideos.map((video, index) => (
                  <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
                    <SimpleVideoCard {...video} />
                  </div>
                ))}
              </TabsContent>

              <TabsContent value="completed" className="mt-8 space-y-4">
                {sampleVideos
                  .filter(video => video.status === "completed")
                  .map((video, index) => (
                    <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
                      <SimpleVideoCard {...video} />
                    </div>
                  ))}
              </TabsContent>

              <TabsContent value="processing" className="mt-8 space-y-4">
                {sampleVideos
                  .filter(video => video.status === "processing")
                  .map((video, index) => (
                    <div key={index} style={{ animationDelay: `${index * 100}ms` }}>
                      <SimpleVideoCard {...video} />
                    </div>
                  ))}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;