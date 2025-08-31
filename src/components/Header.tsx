import { Button } from "@/components/ui/button";
import { Youtube, Settings, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const Header = () => {
  return (
    <header className="border-b border-border/30 bg-card/80 backdrop-blur-md sticky top-0 z-50 shadow-card">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="p-3 rounded-2xl gradient-youtube shadow-glow animate-float">
              <Youtube className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight">
                Content<span className="gradient-youtube bg-clip-text text-transparent">AI</span>
              </h1>
              <p className="text-sm text-muted-foreground font-medium">
                Elite YouTube Intelligence Platform
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search your content library..."
                className="pl-10 w-72 elite-input h-11 text-base"
              />
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              asChild 
              className="h-11 w-11 rounded-xl hover:bg-muted/80 micro-bounce"
            >
              <a href="/config">
                <Settings className="h-6 w-6" />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};