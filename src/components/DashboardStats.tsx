import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Video, 
  Clock, 
  CheckCircle, 
  Sparkles,
  TrendingUp,
  FileText
} from "lucide-react";

export const DashboardStats = () => {
  const stats = [
    {
      title: "Total Videos",
      value: "24",
      change: "+3 this week",
      icon: Video,
      color: "text-youtube-red",
    },
    {
      title: "Processing Queue",
      value: "3",
      change: "2 in progress",
      icon: Clock,
      color: "text-youtube-orange",
    },
    {
      title: "Completed",
      value: "21",
      change: "87.5% success rate",
      icon: CheckCircle,
      color: "text-success",
    },
    {
      title: "AI Summaries",
      value: "19",
      change: "45K words saved",
      icon: FileText,
      color: "text-accent",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {stats.map((stat, index) => (
        <Card key={index} className="gradient-card shadow-card border-border">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <stat.icon className={`h-4 w-4 ${stat.color}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stat.value}</div>
            <p className="text-xs text-muted-foreground flex items-center mt-1">
              <TrendingUp className="h-3 w-3 mr-1" />
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};