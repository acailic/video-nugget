import { Button } from "@/components/ui/button";
import { Youtube, Settings, Search, Command, Minimize2, Square, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { tauri } from "@/lib/tauri";

export const Header = () => {
  return (
    <header className="h-16 border-b border-border/30 bg-card/90 backdrop-blur-xl sticky top-0 z-50 shadow-card">
      <div className="h-full flex items-center justify-between px-6">
        {/* Left: App branding */}
        <div className="flex items-center space-x-4">
          <div className="p-2.5 rounded-2xl gradient-youtube shadow-glow animate-float">
            <Youtube className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground tracking-tight">
              Content<span className="gradient-youtube bg-clip-text text-transparent">AI</span>
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              Desktop Intelligence Platform
            </p>
          </div>
        </div>
        
        {/* Center: Search with command palette hint */}
        <div className="flex-1 max-w-md mx-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search videos... (Ctrl+K for commands)"
              className="pl-10 pr-20 elite-input h-10 text-sm"
            />
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
              <kbd className="px-1.5 py-0.5 text-xs bg-muted rounded border text-muted-foreground">
                ⌘K
              </kbd>
            </div>
          </div>
        </div>
        
        {/* Right: Controls */}
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            asChild 
            className="h-9 w-9 rounded-lg hover:bg-muted/80"
          >
            <a href="/config" title="Settings (Ctrl+,)">
              <Settings className="h-4 w-4" />
            </a>
          </Button>
          
          {/* Desktop window controls (only show in Tauri) */}
          <div className="hidden desktop:flex items-center space-x-1 ml-4 pl-4 border-l border-border/30">
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-yellow-500/20"
              onClick={() => tauri.window.minimize()}
            >
              <Minimize2 className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-green-500/20"
              onClick={() => tauri.window.maximize()}
            >
              <Square className="h-3 w-3" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-7 w-7 hover:bg-destructive/20"
              onClick={() => tauri.window.close()}
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
};