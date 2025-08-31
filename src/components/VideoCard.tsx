import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, PlayCircle, Sparkles, FileText, ExternalLink } from "lucide-react";

interface VideoCardProps {
  title: string;
  creator: string;
  duration: string;
  thumbnail: string;
  status: "queued" | "processing" | "completed" | "failed";
  processingProgress?: number;
  summaryPreview?: string;
  url: string;
}

export const VideoCard = ({
  title,
  creator,
  duration,
  thumbnail,
  status,
  processingProgress = 0,
  summaryPreview,
  url,
}: VideoCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-success text-success-foreground";
      case "processing":
        return "bg-youtube-orange text-white";
      case "queued":
        return "bg-muted text-muted-foreground";
      case "failed":
        return "bg-destructive text-destructive-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  return (
    <Card className="video-card-hover gradient-card shadow-card border-border overflow-hidden">
      <div className="relative">
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-48 object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 right-3">
          <Badge variant="secondary" className="bg-black/70 text-white">
            <Clock className="w-3 h-3 mr-1" />
            {duration}
          </Badge>
        </div>
        <div className="absolute top-3 left-3">
          <Badge className={getStatusColor(status)}>
            {status === "processing" && <Sparkles className="w-3 h-3 mr-1 animate-spin" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>
      </div>

      <CardContent className="p-6 space-y-4">
        <div>
          <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{title}</h3>
          <div className="flex items-center text-sm text-muted-foreground">
            <User className="w-4 h-4 mr-1" />
            {creator}
          </div>
        </div>

        {status === "processing" && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Processing...</span>
              <span>{processingProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="gradient-youtube h-2 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {summaryPreview && status === "completed" && (
          <div className="p-4 bg-muted/50 rounded-lg border border-border">
            <p className="text-sm text-muted-foreground mb-2 flex items-center">
              <FileText className="w-4 h-4 mr-1" />
              Summary Preview
            </p>
            <p className="text-sm text-foreground line-clamp-3">{summaryPreview}</p>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <Button variant="outline" size="sm" className="flex-1">
            <PlayCircle className="w-4 h-4 mr-2" />
            Watch
          </Button>
          {status === "completed" && (
            <Button variant="default" size="sm" className="flex-1">
              <FileText className="w-4 h-4 mr-2" />
              View Summary
            </Button>
          )}
          <Button variant="ghost" size="sm">
            <ExternalLink className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};