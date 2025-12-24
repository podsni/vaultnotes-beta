import { useEffect, useState, useMemo, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ShortcutsHelpDialog } from '@/components/ShortcutsHelpDialog';
import { AccountDialog } from '@/components/AccountDialog';
import { useKeyboardShortcuts, Shortcut } from '@/hooks/use-keyboard-shortcuts';
import { calculateStats } from '@/hooks/use-note-stats';
import { Plus, FileText, User, Search, Trash2, Keyboard } from 'lucide-react';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function Vault() {
  const navigate = useNavigate();
  const { vaultId, vaultKey, mnemonic, notes, isLoading, createNote, deleteNote, signOut } = useVault();
  const [accountDialogOpen, setAccountDialogOpen] = useState(false);
  const [shortcutsDialogOpen, setShortcutsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!vaultId || !vaultKey) {
      navigate('/');
    }
  }, [vaultId, vaultKey, navigate]);

  const handleNewNote = async () => {
    try {
      const noteId = await createNote();
      navigate(`/vault/note/${noteId}`);
    } catch {
      toast.error('Failed to create note');
    }
  };

  // Define shortcuts
  const shortcuts: Shortcut[] = useMemo(() => [
    {
      key: 'n',
      modifiers: ['ctrl'],
      action: handleNewNote,
      description: 'Create new note',
      scope: 'global',
    },
    {
      key: 'k',
      modifiers: ['ctrl'],
      action: () => searchInputRef.current?.focus(),
      description: 'Focus search',
      scope: 'global',
    },
    {
      key: '/',
      modifiers: ['ctrl'],
      action: () => setShortcutsDialogOpen(true),
      description: 'Show shortcuts',
      scope: 'global',
    },
    {
      key: 'Escape',
      modifiers: [],
      action: () => {
        setAccountDialogOpen(false);
        setShortcutsDialogOpen(false);
        setDeleteDialogOpen(false);
      },
      description: 'Close dialog',
      scope: 'global',
    },
  ], []);

  useKeyboardShortcuts({ shortcuts, enabled: !!vaultId });

  const handleDeleteClick = (e: React.MouseEvent, noteId: string, noteTitle: string) => {
    e.preventDefault();
    e.stopPropagation();
    setNoteToDelete({ id: noteId, title: noteTitle });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    try {
      await deleteNote(noteToDelete.id);
      toast.success('Note moved to trash');
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleSignOut = () => {
    signOut();
    toast.success('Signed out');
    navigate('/');
  };

  const formatDate = (timestamp: number) => {
    const now = new Date();
    const date = new Date(timestamp);
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getNoteTitle = (content: string) => {
    const firstLine = content.split('\n')[0]?.trim() || '';
    // Remove markdown headers
    const title = firstLine.replace(/^#+\s*/, '');
    return title || 'Untitled';
  };

  const getNotePreview = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim());
    const preview = lines.slice(1, 3).join(' ').trim();
    return preview.slice(0, 100) || 'No content';
  };

  const filteredNotes = notes.filter(note => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return note.content.toLowerCase().includes(query);
  });

  if (!vaultId || !vaultKey) return null;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="px-4 py-3 sm:px-8 md:px-16">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <Logo />
            <div className="flex items-center gap-1">
              <Link
                to="/vault/trash"
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-md transition-colors"
                title="Trash"
              >
                <Trash2 className="h-5 w-5" />
              </Link>
              <button
                onClick={() => setShortcutsDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-md transition-colors"
                title="Keyboard shortcuts"
              >
                <Keyboard className="h-5 w-5" />
              </button>
              <ThemeToggle />
              <button
                onClick={() => setAccountDialogOpen(true)}
                className="text-muted-foreground hover:text-foreground p-2 hover:bg-muted rounded-md transition-colors"
                title="Account"
              >
                <User className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-16">
        <div className="max-w-3xl mx-auto">
          {/* Title & New Note */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              <span className="text-muted-foreground"># </span>Notes
            </h1>
            <button
              onClick={handleNewNote}
              className="inline-flex items-center gap-2 px-4 py-2 bg-accent text-accent-foreground rounded-md font-medium text-sm hover:bg-accent/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">New note</span>
            </button>
          </div>

          {/* Search */}
          {notes.length > 0 && (
            <div className="relative mb-6">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search notes..."
                className="w-full bg-card border border-border rounded-md pl-10 pr-4 py-2.5 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/50 focus:border-accent text-sm transition-all"
              />
            </div>
          )}

          {/* Notes List */}
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <div className="animate-pulse text-muted-foreground">Loading notes...</div>
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">No notes yet</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Create your first note to get started.
              </p>
              <button
                onClick={handleNewNote}
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-md font-medium text-sm hover:bg-accent/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Create note
              </button>
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground text-sm">No notes match your search.</p>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {filteredNotes.map((note) => {
                const title = getNoteTitle(note.content);
                return (
                  <div
                    key={note.id}
                    className="group bg-card border border-border rounded-lg hover:border-accent/50 hover:shadow-sm transition-all overflow-hidden"
                  >
                    <div className="flex items-stretch">
                      {/* Main Content - Clickable */}
                      <Link
                        to={`/vault/note/${note.id}`}
                        className="flex-1 min-w-0 p-3 sm:p-4"
                      >
                        <div className="flex items-start justify-between gap-2 sm:gap-4">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-foreground truncate group-hover:text-accent transition-colors text-sm sm:text-base">
                              {title}
                            </h3>
                            <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
                              {getNotePreview(note.content)}
                            </p>
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground shrink-0 mt-0.5">
                            {formatDate(note.updatedAt)}
                          </span>
                        </div>
                      </Link>
                      
                      {/* Delete Button - Always visible on mobile, hover on desktop */}
                      <button
                        onClick={(e) => handleDeleteClick(e, note.id, title)}
                        className="flex items-center justify-center px-3 sm:px-4 border-l border-border text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all sm:opacity-0 sm:group-hover:opacity-100 active:bg-destructive/20"
                        title="Delete note"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Note Count & Stats */}
          {notes.length > 0 && (
            <div className="text-center text-xs text-muted-foreground mt-8 space-y-1">
              <p>{notes.length} {notes.length === 1 ? 'note' : 'notes'}</p>
              <p>
                {notes.reduce((total, note) => total + calculateStats(note.content).wordCount, 0).toLocaleString()} total words
              </p>
            </div>
          )}
        </div>
      </div>

      <AccountDialog
        open={accountDialogOpen}
        onOpenChange={setAccountDialogOpen}
        vaultId={vaultId}
        vaultKey={vaultKey}
        mnemonic={mnemonic}
        onSignOut={handleSignOut}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Move to trash?</AlertDialogTitle>
            <AlertDialogDescription>
              "{noteToDelete?.title}" will be moved to trash. You can restore it later from the trash.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Move to Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Shortcuts Help Dialog */}
      <ShortcutsHelpDialog
        open={shortcutsDialogOpen}
        onOpenChange={setShortcutsDialogOpen}
        shortcuts={shortcuts}
      />
    </main>
  );
}
