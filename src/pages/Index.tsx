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
      
      <div className="container mx-auto px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Left Column - Add Video */}
          <div className="lg:col-span-1">
            <VideoSubmissionForm />
          </div>

          {/* Right Column - Videos List */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">Videos</h2>
                <p className="text-muted-foreground">Manage your content queue</p>
              </div>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filter
              </Button>
            </div>

            <Tabs defaultValue="all" className="w-full">
              <TabsList className="grid grid-cols-3 w-fit">
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="completed">Done</TabsTrigger>
                <TabsTrigger value="processing">Processing</TabsTrigger>
              </TabsList>

              <TabsContent value="all" className="mt-6">
                <div className="space-y-3">
                  {sampleVideos.map((video, index) => (
                    <SimpleVideoCard key={index} {...video} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="mt-6">
                <div className="space-y-3">
                  {sampleVideos
                    .filter(video => video.status === "completed")
                    .map((video, index) => (
                      <SimpleVideoCard key={index} {...video} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="processing" className="mt-6">
                <div className="space-y-3">
                  {sampleVideos
                    .filter(video => video.status === "processing")
                    .map((video, index) => (
                      <SimpleVideoCard key={index} {...video} />
                    ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;