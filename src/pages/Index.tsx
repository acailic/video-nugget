import { Header } from "@/components/Header";
import { VideoSubmissionForm } from "@/components/VideoSubmissionForm";
import { VideoCard } from "@/components/VideoCard";
import { DashboardStats } from "@/components/DashboardStats";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Filter, SortAsc } from "lucide-react";

// Sample data for demonstration
import videoThumbnail1 from "@/assets/video-thumbnail-1.jpg";
import videoThumbnail2 from "@/assets/video-thumbnail-2.jpg";
import videoThumbnail3 from "@/assets/video-thumbnail-3.jpg";

const sampleVideos = [
  {
    title: "Complete Guide to React Hooks - Advanced Patterns and Best Practices",
    creator: "Tech Educator",
    duration: "23:45",
    thumbnail: videoThumbnail1,
    status: "completed" as const,
    summaryPreview: "This comprehensive tutorial covers advanced React Hooks patterns including custom hooks, optimization techniques, and real-world use cases. Key takeaways include proper dependency management and performance considerations.",
    url: "https://youtube.com/watch?v=example1",
  },
  {
    title: "AI and Machine Learning Fundamentals for Developers",
    creator: "AI Academy",
    duration: "18:32",
    thumbnail: videoThumbnail2,
    status: "processing" as const,
    processingProgress: 67,
    url: "https://youtube.com/watch?v=example2",
  },
  {
    title: "Building Scalable Web Applications with Modern Architecture",
    creator: "System Design Pro",
    duration: "31:12",
    thumbnail: videoThumbnail3,
    status: "completed" as const,
    summaryPreview: "Explores microservices architecture, containerization, and cloud deployment strategies. Emphasizes scalability patterns and performance optimization techniques for enterprise applications.",
    url: "https://youtube.com/watch?v=example3",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Content */}
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Content Dashboard
              </h2>
              <p className="text-muted-foreground">
                Manage your YouTube content with AI-powered summaries and insights.
              </p>
            </div>

            <DashboardStats />

            <Tabs defaultValue="all" className="w-full">
              <div className="flex items-center justify-between mb-6">
                <TabsList className="grid grid-cols-4 w-fit">
                  <TabsTrigger value="all">All Videos</TabsTrigger>
                  <TabsTrigger value="completed">Completed</TabsTrigger>
                  <TabsTrigger value="processing">Processing</TabsTrigger>
                  <TabsTrigger value="queued">Queued</TabsTrigger>
                </TabsList>
                
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    <SortAsc className="h-4 w-4 mr-2" />
                    Sort
                  </Button>
                </div>
              </div>

              <TabsContent value="all" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleVideos.map((video, index) => (
                    <VideoCard key={index} {...video} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="completed" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleVideos
                    .filter(video => video.status === "completed")
                    .map((video, index) => (
                      <VideoCard key={index} {...video} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="processing" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {sampleVideos
                    .filter(video => video.status === "processing")
                    .map((video, index) => (
                      <VideoCard key={index} {...video} />
                    ))}
                </div>
              </TabsContent>

              <TabsContent value="queued" className="space-y-6">
                <div className="text-center py-12">
                  <p className="text-muted-foreground">No videos in queue</p>
                </div>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            <VideoSubmissionForm />
            
            {/* Quick Actions */}
            <div className="gradient-card shadow-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  Export All Summaries
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Batch Process Queue
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  Custom Prompt Templates
                </Button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="gradient-card shadow-card border border-border rounded-lg p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Activity</h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Badge className="bg-success text-success-foreground">Completed</Badge>
                  <div className="text-sm">
                    <p className="text-foreground">React Hooks Tutorial</p>
                    <p className="text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className="bg-youtube-orange text-white">Processing</Badge>
                  <div className="text-sm">
                    <p className="text-foreground">AI Fundamentals</p>
                    <p className="text-muted-foreground">5 minutes ago</p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge variant="outline">Added</Badge>
                  <div className="text-sm">
                    <p className="text-foreground">Web Architecture</p>
                    <p className="text-muted-foreground">12 minutes ago</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;