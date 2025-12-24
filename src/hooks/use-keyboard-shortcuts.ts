import { useEffect, useCallback } from 'react';

export type ModifierKey = 'ctrl' | 'meta' | 'shift' | 'alt';
export type ShortcutScope = 'global' | 'editor';

export interface Shortcut {
  key: string;
  modifiers: ModifierKey[];
  action: () => void;
  description: string;
  scope: ShortcutScope;
}

export interface UseKeyboardShortcutsOptions {
  shortcuts: Shortcut[];
  enabled?: boolean;
  scope?: ShortcutScope;
}

// Detect if running on macOS
export function isMac(): boolean {
  if (typeof navigator === 'undefined') return false;
  return navigator.platform.toUpperCase().indexOf('MAC') >= 0 || 
         navigator.userAgent.toUpperCase().indexOf('MAC') >= 0;
}

// Get the appropriate modifier key label for display
export function getModifierLabel(): string {
  return isMac() ? '⌘' : 'Ctrl';
}

// Check if the event matches the shortcut modifiers
function matchesModifiers(event: KeyboardEvent, modifiers: ModifierKey[]): boolean {
  const mac = isMac();
  
  // For 'ctrl' modifier, use Cmd on Mac and Ctrl on other platforms
  const needsCtrlOrMeta = modifiers.includes('ctrl') || modifiers.includes('meta');
  const hasCtrlOrMeta = mac ? event.metaKey : event.ctrlKey;
  
  if (needsCtrlOrMeta && !hasCtrlOrMeta) return false;
  if (!needsCtrlOrMeta && (event.ctrlKey || event.metaKey)) return false;
  
  const needsShift = modifiers.includes('shift');
  if (needsShift !== event.shiftKey) return false;
  
  const needsAlt = modifiers.includes('alt');
  if (needsAlt !== event.altKey) return false;
  
  return true;
}

// Check if the event target is an input element
function isInputElement(target: EventTarget | null): boolean {
  if (!target || !(target instanceof HTMLElement)) return false;
  
  const tagName = target.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea' || tagName === 'select') {
    return true;
  }
  
  // Check for contenteditable
  if (target.isContentEditable) {
    return true;
  }
  
  return false;
}

export function useKeyboardShortcuts(options: UseKeyboardShortcutsOptions): void {
  const { shortcuts, enabled = true, scope = 'global' } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const isInput = isInputElement(event.target);
    
    for (const shortcut of shortcuts) {
      // Skip if scope doesn't match
      if (scope !== shortcut.scope && shortcut.scope !== 'global') continue;
      
      // For global shortcuts, skip if we're in an input (except for Escape)
      if (shortcut.scope === 'global' && isInput && shortcut.key !== 'Escape') {
        continue;
      }
      
      // Check if key matches (case-insensitive)
      const keyMatches = event.key.toLowerCase() === shortcut.key.toLowerCase() ||
                        event.code.toLowerCase() === `key${shortcut.key.toLowerCase()}`;
      
      if (!keyMatches) continue;
      
      // Check modifiers
      if (!matchesModifiers(event, shortcut.modifiers)) continue;
      
      // Match found - prevent default and execute action
      event.preventDefault();
      event.stopPropagation();
      shortcut.action();
      return;
    }
  }, [shortcuts, enabled, scope]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown, enabled]);
}

// Format shortcut for display
export function formatShortcut(shortcut: Shortcut): string {
  const parts: string[] = [];
  const mac = isMac();
  
  if (shortcut.modifiers.includes('ctrl') || shortcut.modifiers.includes('meta')) {
    parts.push(mac ? '⌘' : 'Ctrl');
  }
  if (shortcut.modifiers.includes('shift')) {
    parts.push(mac ? '⇧' : 'Shift');
  }
  if (shortcut.modifiers.includes('alt')) {
    parts.push(mac ? '⌥' : 'Alt');
  }
  
  // Format the key
  let keyLabel = shortcut.key;
  if (keyLabel === 'Escape') keyLabel = 'Esc';
  if (keyLabel === 'Backspace') keyLabel = mac ? '⌫' : 'Backspace';
  if (keyLabel === ',') keyLabel = ',';
  if (keyLabel === '/') keyLabel = '/';
  
  parts.push(keyLabel.toUpperCase());
  
  return parts.join(mac ? '' : '+');
}
