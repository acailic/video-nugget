import { useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

interface KeyboardShortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  action: () => void;
  description: string;
}

export const useKeyboardShortcuts = () => {
  const navigate = useNavigate();

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'n',
      ctrl: true,
      action: () => {
        const urlInput = document.getElementById('youtube-url') as HTMLInputElement;
        urlInput?.focus();
      },
      description: 'Focus on new video input'
    },
    {
      key: ',',
      ctrl: true,
      action: () => navigate('/config'),
      description: 'Open settings'
    },
    {
      key: 'h',
      ctrl: true,
      action: () => navigate('/'),
      description: 'Go to home'
    },
    {
      key: 'f',
      ctrl: true,
      action: () => {
        const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
        searchInput?.focus();
      },
      description: 'Focus search'
    },
    {
      key: 'Escape',
      action: () => {
        // Close any open modals or focus states
        (document.activeElement as HTMLElement)?.blur();
      },
      description: 'Clear focus/close modals'
    }
  ];

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const shortcut = shortcuts.find(s => 
      s.key.toLowerCase() === event.key.toLowerCase() &&
      !!s.ctrl === event.ctrlKey &&
      !!s.alt === event.altKey &&
      !!s.shift === event.shiftKey
    );

    if (shortcut) {
      event.preventDefault();
      shortcut.action();
    }
  }, [shortcuts]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts };
};