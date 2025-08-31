import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, PlayCircle, FileText } from "lucide-react";

interface SimpleVideoCardProps {
  title: string;
  creator: string;
  duration: string;
  status: "queued" | "processing" | "completed" | "failed";
  processingProgress?: number;
  summaryPreview?: string;
  url: string;
}

export const SimpleVideoCard = ({
  title,
  creator,
  duration,
  status,
  processingProgress = 0,
  summaryPreview,
}: SimpleVideoCardProps) => {
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
    <Card className="shadow-card border-border hover:shadow-lg transition-all">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="font-medium text-foreground truncate mb-1">{title}</h3>
            <div className="flex items-center text-sm text-muted-foreground space-x-3">
              <span className="flex items-center">
                <User className="w-3 h-3 mr-1" />
                {creator}
              </span>
              <span className="flex items-center">
                <Clock className="w-3 h-3 mr-1" />
                {duration}
              </span>
            </div>
          </div>
          <Badge className={getStatusColor(status)}>
            {status}
          </Badge>
        </div>

        {status === "processing" && (
          <div className="mb-3">
            <div className="flex justify-between text-xs text-muted-foreground mb-1">
              <span>Processing</span>
              <span>{processingProgress}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1.5">
              <div
                className="gradient-youtube h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {summaryPreview && status === "completed" && (
          <div className="mb-3 p-3 bg-muted/30 rounded text-sm text-muted-foreground">
            {summaryPreview}
          </div>
        )}

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="flex-1">
            <PlayCircle className="w-3 h-3 mr-1" />
            Watch
          </Button>
          {status === "completed" && (
            <Button variant="default" size="sm" className="flex-1">
              <FileText className="w-3 h-3 mr-1" />
              Summary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};