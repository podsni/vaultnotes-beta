import { Keyboard } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shortcut, formatShortcut } from '@/hooks/use-keyboard-shortcuts';

interface ShortcutsHelpDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  shortcuts: Shortcut[];
}

export function ShortcutsHelpDialog({ open, onOpenChange, shortcuts }: ShortcutsHelpDialogProps) {
  const globalShortcuts = shortcuts.filter(s => s.scope === 'global');
  const editorShortcuts = shortcuts.filter(s => s.scope === 'editor');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Keyboard className="h-5 w-5" />
            Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 mt-4">
          {globalShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Global</h3>
              <div className="space-y-2">
                {globalShortcuts.map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}
          
          {editorShortcuts.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Editor</h3>
              <div className="space-y-2">
                {editorShortcuts.map((shortcut, index) => (
                  <ShortcutRow key={index} shortcut={shortcut} />
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ShortcutRow({ shortcut }: { shortcut: Shortcut }) {
  return (
    <div className="flex items-center justify-between py-1.5">
      <span className="text-sm text-foreground">{shortcut.description}</span>
      <kbd className="px-2 py-1 text-xs font-mono bg-muted text-muted-foreground rounded border border-border">
        {formatShortcut(shortcut)}
      </kbd>
    </div>
  );
}
