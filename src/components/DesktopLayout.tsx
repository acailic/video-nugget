import { ReactNode } from 'react';
import { Header } from './Header';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';

interface DesktopLayoutProps {
  children: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

export const DesktopLayout = ({ children, sidebar, className = '' }: DesktopLayoutProps) => {
  useKeyboardShortcuts();

  return (
    <div className={`min-h-screen bg-background flex flex-col ${className}`}>
      <Header />
      
      <div className="flex-1 flex overflow-hidden">
        {sidebar && (
          <aside className="w-80 border-r border-border/30 bg-card/40 backdrop-blur-sm overflow-y-auto">
            <div className="p-6">
              {sidebar}
            </div>
          </aside>
        )}
        
        <main className="flex-1 overflow-y-auto">
          <div className="container mx-auto px-8 py-8 max-w-none">
            {children}
          </div>
        </main>
      </div>
      
      {/* Desktop status bar */}
      <div className="h-6 bg-muted/20 border-t border-border/20 flex items-center justify-between px-4 text-xs text-muted-foreground">
        <div className="flex items-center space-x-4">
          <span>Ready</span>
          <span>•</span>
          <span>Ctrl+N: New Video</span>
          <span>•</span>
          <span>Ctrl+,: Settings</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-success animate-pulse"></div>
          <span>Desktop Mode</span>
        </div>
      </div>
    </div>
  );
};