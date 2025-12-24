import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NoteStatsBar } from '@/components/NoteStatsBar';
import { TiptapEditor } from '@/components/TiptapEditor';
import { useNoteStats } from '@/hooks/use-note-stats';
import { ArrowLeft, Trash2, Check, MoreVertical, Code, Copy, Download, FileText, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

export default function NoteEditor() {
  const navigate = useNavigate();
  const { noteId } = useParams<{ noteId: string }>();
  const { vaultId, vaultKey, getNote, updateNote, deleteNote } = useVault();
  const isMobile = useIsMobile();

  const [content, setContent] = useState('');
  const [initialContent, setInitialContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [showSaved, setShowSaved] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showSourceDialog, setShowSourceDialog] = useState(false);
  const [copied, setCopied] = useState(false);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Note statistics
  const stats = useNoteStats(content);

  useEffect(() => {
    if (!vaultId || !vaultKey) {
      navigate('/');
      return;
    }

    if (noteId) {
      const note = getNote(noteId);
      if (note) {
        setContent(note.content);
        setInitialContent(note.content);
      }
    }
  }, [vaultId, vaultKey, noteId, getNote, navigate]);

  const saveNote = useCallback(async (newContent: string) => {
    if (!noteId) return;

    setIsSaving(true);
    try {
      await updateNote(noteId, newContent);
      setShowSaved(true);
      setTimeout(() => setShowSaved(false), 2000);
    } catch {
      toast.error('Failed to save');
    } finally {
      setIsSaving(false);
    }
  }, [noteId, updateNote]);

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent);

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      saveNote(newContent);
    }, 500);
  }, [saveNote]);

  const handleDelete = async () => {
    if (!noteId) return;

    if (window.confirm('Move this note to trash?')) {
      try {
        await deleteNote(noteId);
        toast.success('Note moved to trash');
        navigate('/vault');
      } catch {
        toast.error('Failed to delete');
      }
    }
  };

  const handleCopyMarkdown = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy');
    }
  };

  const handleDownloadFromSource = (format: 'md' | 'txt') => {
    const title = getNoteTitleFromContent(content);
    const filename = `${title}.${format}`;
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded as ${filename}`);
  };

  // Get line count for display
  const lineCount = content ? content.split('\n').length : 0;
  const charCount = content ? content.length : 0;

  const getNoteTitleFromContent = (noteContent: string): string => {
    const lines = noteContent.trim().split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        const title = trimmed.replace(/^#+\s*/, '').slice(0, 50);
        return title || 'note';
      }
    }
    return 'note';
  };

  const handleDownload = (format: 'md' | 'txt') => {
    const title = getNoteTitleFromContent(content);
    const filename = `${title}.${format}`;
    const mimeType = format === 'md' ? 'text/markdown' : 'text/plain';
    
    const blob = new Blob([content], { type: `${mimeType};charset=utf-8` });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast.success(`Downloaded as ${filename}`);
    setShowMobileMenu(false);
  };

  // Menu items component for reuse
  const MenuItems = ({ onClose }: { onClose?: () => void }) => (
    <>
      <button
        onClick={() => {
          onClose?.();
          setShowSourceDialog(true);
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors rounded-lg"
      >
        <Code className="h-5 w-5 text-muted-foreground" />
        <span>View Source</span>
      </button>
      <button
        onClick={() => handleDownload('md')}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors rounded-lg"
      >
        <Download className="h-5 w-5 text-muted-foreground" />
        <span>Download as Markdown</span>
      </button>
      <button
        onClick={() => handleDownload('txt')}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-foreground hover:bg-muted transition-colors rounded-lg"
      >
        <FileText className="h-5 w-5 text-muted-foreground" />
        <span>Download as Text</span>
      </button>
      <div className="border-t border-border my-2" />
      <button
        onClick={() => {
          onClose?.();
          handleDelete();
        }}
        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-destructive hover:bg-destructive/10 transition-colors rounded-lg"
      >
        <Trash2 className="h-5 w-5" />
        <span>Delete note</span>
      </button>
    </>
  );

  if (!vaultId || !vaultKey) return null;


  return (
    <main className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="px-4 py-3 sm:px-8 md:px-16">
          <div className="max-w-4xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to="/vault" 
                className="text-muted-foreground hover:text-foreground p-2 -ml-2 hover:bg-muted rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Logo />
            </div>

            <div className="flex items-center gap-2">
              {/* Save Status */}
              <span className="text-xs text-muted-foreground mr-2">
                {isSaving ? (
                  'Saving...'
                ) : showSaved ? (
                  <span className="inline-flex items-center gap-1 text-accent">
                    <Check className="h-3 w-3" /> Saved
                  </span>
                ) : null}
              </span>

              <ThemeToggle />

              {/* Desktop Menu - DropdownMenu */}
              {!isMobile && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-md transition-colors">
                      <MoreVertical className="h-5 w-5" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuItem onClick={() => setShowSourceDialog(true)}>
                      <Code className="h-4 w-4 mr-2" />
                      View Source
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('md')}>
                      <Download className="h-4 w-4 mr-2" />
                      Download as Markdown
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDownload('txt')}>
                      <FileText className="h-4 w-4 mr-2" />
                      Download as Text
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      onClick={handleDelete}
                      className="text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete note
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Mobile Menu - Sheet (Bottom) */}
              {isMobile && (
                <button
                  onClick={() => setShowMobileMenu(true)}
                  className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-md transition-colors"
                >
                  <MoreVertical className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Editor */}
      <div className="flex-1 px-4 py-4 sm:px-8 sm:py-6 md:px-16">
        <div className="max-w-4xl mx-auto h-full">
          <TiptapEditor
            content={initialContent}
            onChange={handleContentChange}
            placeholder="Start writing...

Use markdown shortcuts:
# Heading 1
## Heading 2
- Bullet list
1. Numbered list
> Quote
**bold** *italic* `code`"
            autoFocus
          />
        </div>
      </div>

      {/* Stats Bar */}
      <footer className="sticky bottom-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-t border-border">
        <div className="px-4 sm:px-8 md:px-16">
          <div className="max-w-4xl mx-auto">
            <NoteStatsBar stats={stats} />
          </div>
        </div>
      </footer>      {/* Mobile Bottom Sheet Menu */}
      <Sheet open={showMobileMenu} onOpenChange={setShowMobileMenu}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-8">
          <SheetHeader className="pb-4">
            <SheetTitle className="text-center">Note Options</SheetTitle>
          </SheetHeader>
          <div className="space-y-1">
            <MenuItems onClose={() => setShowMobileMenu(false)} />
          </div>
        </SheetContent>
      </Sheet>

      {/* Markdown Source Dialog - Improved */}
      <Dialog open={showSourceDialog} onOpenChange={setShowSourceDialog}>
        <DialogContent className="max-w-3xl w-[95vw] max-h-[90vh] p-0 gap-0 overflow-hidden bg-card border-border">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border bg-card pr-12">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-accent/50">
              <Code className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <DialogTitle className="text-base font-semibold text-foreground">Markdown Source</DialogTitle>
              <p className="text-xs text-muted-foreground mt-0.5">
                {lineCount} lines · {charCount} characters
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-card">
            <button
              onClick={handleCopyMarkdown}
              className={`flex items-center gap-2 px-3 py-2 text-sm rounded-lg transition-all border ${
                copied 
                  ? 'bg-green-600/20 text-green-500 border-green-600/30' 
                  : 'bg-muted hover:bg-muted/80 text-foreground border-border'
              }`}
            >
              {copied ? (
                <>
                  <CheckCheck className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy
                </>
              )}
            </button>
            <button
              onClick={() => handleDownloadFromSource('md')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">.md</span>
              <span className="sm:hidden">MD</span>
            </button>
            <button
              onClick={() => handleDownloadFromSource('txt')}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-muted hover:bg-muted/80 text-foreground rounded-lg transition-colors border border-border"
            >
              <FileText className="h-4 w-4" />
              <span className="hidden sm:inline">.txt</span>
              <span className="sm:hidden">TXT</span>
            </button>
          </div>

          {/* Code Content with Line Numbers */}
          <div className="overflow-auto max-h-[60vh] bg-muted/50">
            {content ? (
              <div className="flex text-sm font-mono">
                {/* Line Numbers */}
                <div className="flex-shrink-0 py-4 pl-4 pr-3 text-right select-none border-r border-border bg-muted/30 sticky left-0">
                  {content.split('\n').map((_, i) => (
                    <div key={i} className="text-muted-foreground leading-6 text-xs">
                      {i + 1}
                    </div>
                  ))}
                </div>
                {/* Code Content */}
                <pre className="flex-1 py-4 px-4 text-foreground whitespace-pre-wrap break-words leading-6 overflow-x-auto">
                  {content}
                </pre>
              </div>
            ) : (
              <div className="flex items-center justify-center py-16 text-muted-foreground">
                <div className="text-center">
                  <Code className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No content yet</p>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
