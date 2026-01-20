/**
 * Centralized keyboard shortcuts definition
 * All shortcuts are defined here for consistency across the app
 */

export interface KeyboardShortcut {
  id: string;
  keys: {
    mac: string;
    windows: string;
  };
  action: string;
  description?: string;
  category: ShortcutCategory;
}

export type ShortcutCategory = 'editor' | 'navigation' | 'actions' | 'ide';

export const SHORTCUT_CATEGORIES: Record<ShortcutCategory, { label: string; icon: string }> = {
  editor: {
    label: 'Editor',
    icon: '✏️',
  },
  navigation: {
    label: 'Navigation',
    icon: '🧭',
  },
  actions: {
    label: 'Actions',
    icon: '⚡',
  },
  ide: {
    label: 'IDE Features',
    icon: '🛠️',
  },
};

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  // Editor shortcuts
  {
    id: 'save',
    keys: { mac: '⌘ + S', windows: 'Ctrl + S' },
    action: 'Save current file',
    description: 'Saves your code to the server',
    category: 'editor',
  },
  {
    id: 'undo',
    keys: { mac: '⌘ + Z', windows: 'Ctrl + Z' },
    action: 'Undo',
    description: 'Undo the last change',
    category: 'editor',
  },
  {
    id: 'redo',
    keys: { mac: '⌘ + ⇧ + Z', windows: 'Ctrl + Shift + Z' },
    action: 'Redo',
    description: 'Redo the last undone change',
    category: 'editor',
  },
  {
    id: 'comment',
    keys: { mac: '⌘ + /', windows: 'Ctrl + /' },
    action: 'Toggle comment',
    description: 'Comment or uncomment selected lines',
    category: 'editor',
  },
  {
    id: 'find',
    keys: { mac: '⌘ + F', windows: 'Ctrl + F' },
    action: 'Find in file',
    description: 'Search for text in the current file',
    category: 'editor',
  },
  {
    id: 'replace',
    keys: { mac: '⌘ + H', windows: 'Ctrl + H' },
    action: 'Find and replace',
    description: 'Find and replace text',
    category: 'editor',
  },
  {
    id: 'select-next',
    keys: { mac: '⌘ + D', windows: 'Ctrl + D' },
    action: 'Select next occurrence',
    description: 'Select the next occurrence of current selection',
    category: 'editor',
  },
  {
    id: 'move-line',
    keys: { mac: '⌥ + ↑/↓', windows: 'Alt + Up/Down' },
    action: 'Move line up/down',
    description: 'Move the current line or selection up/down',
    category: 'editor',
  },
  {
    id: 'duplicate-line',
    keys: { mac: '⌘ + ⇧ + D', windows: 'Ctrl + Shift + D' },
    action: 'Duplicate line',
    description: 'Duplicate the current line',
    category: 'editor',
  },
  {
    id: 'select-all',
    keys: { mac: '⌘ + A', windows: 'Ctrl + A' },
    action: 'Select all',
    description: 'Select all text in the editor',
    category: 'editor',
  },

  // Navigation shortcuts
  {
    id: 'go-to-line',
    keys: { mac: '⌘ + G', windows: 'Ctrl + G' },
    action: 'Go to line',
    description: 'Jump to a specific line number',
    category: 'navigation',
  },
  {
    id: 'go-to-start',
    keys: { mac: '⌘ + ↑', windows: 'Ctrl + Home' },
    action: 'Go to start',
    description: 'Jump to the beginning of the file',
    category: 'navigation',
  },
  {
    id: 'go-to-end',
    keys: { mac: '⌘ + ↓', windows: 'Ctrl + End' },
    action: 'Go to end',
    description: 'Jump to the end of the file',
    category: 'navigation',
  },
  {
    id: 'go-to-bracket',
    keys: { mac: '⌘ + ⇧ + \\', windows: 'Ctrl + Shift + \\' },
    action: 'Go to matching bracket',
    description: 'Jump to the matching bracket',
    category: 'navigation',
  },

  // Action shortcuts
  {
    id: 'compile',
    keys: { mac: '⌘ + B', windows: 'Ctrl + B' },
    action: 'Compile/Build',
    description: 'Compile the current Solidity code',
    category: 'actions',
  },
  {
    id: 'format',
    keys: { mac: '⌘ + ⇧ + F', windows: 'Ctrl + Shift + F' },
    action: 'Format code',
    description: 'Auto-format the current file with Prettier',
    category: 'actions',
  },
  {
    id: 'search-global',
    keys: { mac: '⌘ + K', windows: 'Ctrl + K' },
    action: 'Global search',
    description: 'Open the global search modal',
    category: 'actions',
  },

  // IDE Feature shortcuts
  {
    id: 'help',
    keys: { mac: '⌘ + ?', windows: 'Ctrl + ?' },
    action: 'Keyboard shortcuts',
    description: 'Show this keyboard shortcuts modal',
    category: 'ide',
  },
  {
    id: 'toggle-chat',
    keys: { mac: '⌘ + ⇧ + C', windows: 'Ctrl + Shift + C' },
    action: 'Toggle AI chat',
    description: 'Show or hide the AI tutor chat panel',
    category: 'ide',
  },
  {
    id: 'toggle-sidebar',
    keys: { mac: '⌘ + \\', windows: 'Ctrl + \\' },
    action: 'Toggle sidebar',
    description: 'Show or hide the lessons sidebar',
    category: 'ide',
  },
  {
    id: 'close-modal',
    keys: { mac: 'Esc', windows: 'Esc' },
    action: 'Close modal/panel',
    description: 'Close any open modal or panel',
    category: 'ide',
  },
];

/**
 * Get shortcuts by category
 */
export function getShortcutsByCategory(category: ShortcutCategory): KeyboardShortcut[] {
  return KEYBOARD_SHORTCUTS.filter((s) => s.category === category);
}

/**
 * Get all categories with their shortcuts
 */
export function getGroupedShortcuts(): Record<ShortcutCategory, KeyboardShortcut[]> {
  return {
    editor: getShortcutsByCategory('editor'),
    navigation: getShortcutsByCategory('navigation'),
    actions: getShortcutsByCategory('actions'),
    ide: getShortcutsByCategory('ide'),
  };
}

/**
 * Search shortcuts by action or description
 */
export function searchShortcuts(query: string): KeyboardShortcut[] {
  const normalizedQuery = query.toLowerCase().trim();
  if (!normalizedQuery) return KEYBOARD_SHORTCUTS;

  return KEYBOARD_SHORTCUTS.filter(
    (s) =>
      s.action.toLowerCase().includes(normalizedQuery) ||
      s.description?.toLowerCase().includes(normalizedQuery) ||
      s.keys.mac.toLowerCase().includes(normalizedQuery) ||
      s.keys.windows.toLowerCase().includes(normalizedQuery)
  );
}

/**
 * Detect if user is on Mac
 */
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0;
}

/**
 * Get the appropriate key display for the current platform
 */
export function getKeyForPlatform(shortcut: KeyboardShortcut): string {
  return isMac() ? shortcut.keys.mac : shortcut.keys.windows;
}

/**
 * Format a simple shortcut for display (e.g., "Ctrl/Cmd + S")
 */
export function formatShortcutDisplay(shortcut: KeyboardShortcut): string {
  // Return a generic format if both are similar
  const mac = shortcut.keys.mac;
  const win = shortcut.keys.windows;

  // If they're essentially the same (just Cmd vs Ctrl), return combined format
  if (mac.replace('⌘', 'Ctrl').replace('⌥', 'Alt').replace('⇧', 'Shift') === win) {
    return win.replace('Ctrl', 'Ctrl/Cmd');
  }

  return `${mac} / ${win}`;
}
