import { useState, useEffect } from 'react';
import { Command, CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { useNavigate } from 'react-router-dom';
import { Youtube, Settings, Search, Plus, FileText, Download } from 'lucide-react';

interface CommandPaletteProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CommandPalette = ({ open, onOpenChange }: CommandPaletteProps) => {
  const navigate = useNavigate();

  const commands = [
    {
      group: 'Navigation',
      items: [
        {
          icon: Youtube,
          label: 'Go to Home',
          action: () => navigate('/'),
          shortcut: 'Ctrl+H'
        },
        {
          icon: Settings,
          label: 'Open Settings',
          action: () => navigate('/config'),
          shortcut: 'Ctrl+,'
        }
      ]
    },
    {
      group: 'Actions',
      items: [
        {
          icon: Plus,
          label: 'Add New Video',
          action: () => {
            navigate('/');
            setTimeout(() => {
              const input = document.getElementById('youtube-url') as HTMLInputElement;
              input?.focus();
            }, 100);
          },
          shortcut: 'Ctrl+N'
        },
        {
          icon: Search,
          label: 'Search Videos',
          action: () => {
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
          },
          shortcut: 'Ctrl+F'
        }
      ]
    }
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, onOpenChange]);

  const handleCommand = (action: () => void) => {
    action();
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput 
        placeholder="Type a command or search..." 
        className="h-12 text-base"
      />
      <CommandList className="max-h-[400px]">
        <CommandEmpty>No results found.</CommandEmpty>
        
        {commands.map((group) => (
          <CommandGroup key={group.group} heading={group.group}>
            {group.items.map((item) => (
              <CommandItem
                key={item.label}
                onSelect={() => handleCommand(item.action)}
                className="flex items-center justify-between p-3 cursor-pointer"
              >
                <div className="flex items-center space-x-3">
                  <item.icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100">
                    {item.shortcut}
                  </kbd>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  );
};