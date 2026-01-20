'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_CATEGORIES,
  getGroupedShortcuts,
  searchShortcuts,
  isMac,
  type KeyboardShortcut,
  type ShortcutCategory,
} from '@/lib/shortcuts';

interface KeyboardShortcutsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function KeyboardShortcutsModal({ open, onOpenChange }: KeyboardShortcutsModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [platformIsMac, setPlatformIsMac] = useState(false);
  const [filteredShortcuts, setFilteredShortcuts] = useState(KEYBOARD_SHORTCUTS);
  const [activeCategory, setActiveCategory] = useState<ShortcutCategory | 'all'>('all');

  // Detect platform on mount
  useEffect(() => {
    setPlatformIsMac(isMac());
  }, []);

  // Filter shortcuts based on search and category
  useEffect(() => {
    let results = searchQuery ? searchShortcuts(searchQuery) : KEYBOARD_SHORTCUTS;
    
    if (activeCategory !== 'all') {
      results = results.filter((s) => s.category === activeCategory);
    }

    setFilteredShortcuts(results);
  }, [searchQuery, activeCategory]);

  // Reset search when modal opens
  useEffect(() => {
    if (open) {
      setSearchQuery('');
      setActiveCategory('all');
    }
  }, [open]);

  // Get the appropriate key for display
  const getKey = (shortcut: KeyboardShortcut) => {
    return platformIsMac ? shortcut.keys.mac : shortcut.keys.windows;
  };

  // Group shortcuts by category for display
  const groupedShortcuts = getGroupedShortcuts();

  // Render a single shortcut row
  const ShortcutRow = ({ shortcut }: { shortcut: KeyboardShortcut }) => (
    <div className="flex items-center justify-between py-2.5 px-3 hover:bg-muted/50 rounded-lg transition-colors">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm">{shortcut.action}</p>
        {shortcut.description && (
          <p className="text-xs text-muted-foreground truncate">{shortcut.description}</p>
        )}
      </div>
      <div className="flex-shrink-0 ml-4">
        <kbd className="inline-flex items-center gap-1 px-2 py-1 text-xs font-mono bg-muted rounded border border-border">
          {getKey(shortcut)}
        </kbd>
      </div>
    </div>
  );

  // Render shortcuts grouped by category
  const renderGroupedShortcuts = () => {
    if (searchQuery || activeCategory !== 'all') {
      // Show flat list when searching or filtering by category
      if (filteredShortcuts.length === 0) {
        return (
          <div className="text-center py-8 text-muted-foreground">
            <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p>No shortcuts found for &ldquo;{searchQuery}&rdquo;</p>
          </div>
        );
      }

      return (
        <div className="space-y-1">
          {filteredShortcuts.map((shortcut) => (
            <ShortcutRow key={shortcut.id} shortcut={shortcut} />
          ))}
        </div>
      );
    }

    // Show grouped shortcuts
    return (
      <div className="space-y-6">
        {(Object.keys(SHORTCUT_CATEGORIES) as ShortcutCategory[]).map((category) => {
          const categoryShortcuts = groupedShortcuts[category];
          if (categoryShortcuts.length === 0) return null;

          const { label, icon } = SHORTCUT_CATEGORIES[category];

          return (
            <div key={category}>
              <h3 className="text-sm font-semibold text-muted-foreground mb-2 flex items-center gap-2">
                <span>{icon}</span>
                {label}
              </h3>
              <div className="space-y-1 bg-card rounded-lg border border-border overflow-hidden">
                {categoryShortcuts.map((shortcut) => (
                  <ShortcutRow key={shortcut.id} shortcut={shortcut} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
            </svg>
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="flex-shrink-0 space-y-3 pb-3 border-b border-border">
          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <Input
              type="text"
              placeholder="Search shortcuts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              autoFocus
            />
          </div>

          {/* Category tabs */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors ${
                activeCategory === 'all'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              }`}
            >
              All
            </button>
            {(Object.keys(SHORTCUT_CATEGORIES) as ShortcutCategory[]).map((category) => {
              const { label, icon } = SHORTCUT_CATEGORIES[category];
              return (
                <button
                  key={category}
                  onClick={() => setActiveCategory(category)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-full transition-colors flex items-center gap-1 ${
                    activeCategory === category
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                  }`}
                >
                  <span>{icon}</span>
                  {label}
                </button>
              );
            })}
          </div>

          {/* Platform indicator */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>
              Showing shortcuts for{' '}
              <span className="font-medium text-foreground">
                {platformIsMac ? 'macOS' : 'Windows/Linux'}
              </span>
            </span>
            <button
              onClick={() => setPlatformIsMac(!platformIsMac)}
              className="text-primary hover:underline"
            >
              Show {platformIsMac ? 'Windows/Linux' : 'macOS'} shortcuts
            </button>
          </div>
        </div>

        {/* Shortcuts list */}
        <div className="flex-1 overflow-y-auto py-4 custom-scrollbar">
          {renderGroupedShortcuts()}
        </div>

        {/* Footer hint */}
        <div className="flex-shrink-0 pt-3 border-t border-border text-center text-xs text-muted-foreground">
          Press{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-mono bg-muted rounded border border-border">
            {platformIsMac ? '⌘' : 'Ctrl'} + ?
          </kbd>{' '}
          anytime to open this modal
        </div>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Hook to manage keyboard shortcuts modal state
 * Includes the Cmd/Ctrl+? shortcut to open the modal
 */
export function useKeyboardShortcutsModal() {
  const [isOpen, setIsOpen] = useState(false);

  const openModal = useCallback(() => setIsOpen(true), []);
  const closeModal = useCallback(() => setIsOpen(false), []);
  const toggleModal = useCallback(() => setIsOpen((prev) => !prev), []);

  // Listen for Cmd/Ctrl + ? (which is Cmd/Ctrl + Shift + /)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isMacOS = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
      const modifier = isMacOS ? e.metaKey : e.ctrlKey;

      // Cmd/Ctrl + Shift + / (which produces ?)
      if (modifier && e.shiftKey && e.key === '/') {
        e.preventDefault();
        toggleModal();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleModal]);

  return {
    isOpen,
    setIsOpen,
    openModal,
    closeModal,
    toggleModal,
  };
}
