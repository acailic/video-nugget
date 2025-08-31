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
  const getStatusConfig = (status: string) => {
    switch (status) {
      case "completed":
        return { 
          color: "bg-success text-success-foreground shadow-[0_0_20px_hsl(var(--success)_/_0.3)]",
          icon: "✅",
          pulse: false
        };
      case "processing":
        return { 
          color: "gradient-youtube text-white shadow-glow animate-pulse-glow",
          icon: "⚡",
          pulse: true
        };
      case "queued":
        return { 
          color: "bg-muted text-muted-foreground",
          icon: "⏳",
          pulse: false
        };
      case "failed":
        return { 
          color: "bg-destructive text-destructive-foreground",
          icon: "❌",
          pulse: false
        };
      default:
        return { 
          color: "bg-muted text-muted-foreground",
          icon: "⏳",
          pulse: false
        };
    }
  };

  const statusConfig = getStatusConfig(status);

  return (
    <Card className="elite-card group animate-fade-in">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0 mr-4">
            <h3 className="font-semibold text-foreground text-lg mb-2 leading-tight group-hover:text-primary transition-colors">
              {title}
            </h3>
            <div className="flex items-center text-sm text-muted-foreground space-x-4">
              <span className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
                <User className="w-3 h-3 mr-1.5" />
                {creator}
              </span>
              <span className="flex items-center bg-muted/50 px-2 py-1 rounded-md">
                <Clock className="w-3 h-3 mr-1.5" />
                {duration}
              </span>
            </div>
          </div>
          <Badge className={`${statusConfig.color} px-3 py-1.5 text-xs font-semibold`}>
            <span className="mr-1">{statusConfig.icon}</span>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </Badge>
        </div>

        {status === "processing" && (
          <div className="mb-4 p-3 gradient-processing rounded-lg border border-primary/20">
            <div className="flex justify-between text-sm font-medium mb-2">
              <span className="text-foreground">AI Processing</span>
              <span className="text-primary font-bold">{processingProgress}%</span>
            </div>
            <div className="w-full bg-muted/50 rounded-full h-2 overflow-hidden">
              <div
                className="gradient-youtube h-2 rounded-full transition-all duration-500 shadow-glow"
                style={{ width: `${processingProgress}%` }}
              />
            </div>
          </div>
        )}

        {summaryPreview && status === "completed" && (
          <div className="mb-4 p-4 bg-success/10 border border-success/20 rounded-lg">
            <p className="text-sm text-success-foreground leading-relaxed">
              ✨ {summaryPreview}
            </p>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            className="flex-1 h-10 border-border/50 hover:border-primary/50 hover:bg-primary/5 micro-bounce"
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            Watch Video
          </Button>
          {status === "completed" && (
            <Button 
              size="sm" 
              className="flex-1 h-10 elite-button micro-bounce"
            >
              <FileText className="w-4 h-4 mr-2" />
              View Summary
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};