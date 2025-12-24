import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useVault } from '@/contexts/VaultContext';
import { Logo } from '@/components/Logo';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ArrowLeft, Trash2, RotateCcw, AlertTriangle } from 'lucide-react';
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

export default function Trash() {
  const navigate = useNavigate();
  const { vaultId, vaultKey, trashedNotes, restoreNote, permanentlyDeleteNote, emptyTrash } = useVault();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [emptyTrashDialogOpen, setEmptyTrashDialogOpen] = useState(false);
  const [noteToDelete, setNoteToDelete] = useState<{ id: string; title: string } | null>(null);

  useEffect(() => {
    if (!vaultId || !vaultKey) {
      navigate('/');
    }
  }, [vaultId, vaultKey, navigate]);

  const handleRestore = async (noteId: string) => {
    try {
      await restoreNote(noteId);
      toast.success('Note restored');
    } catch {
      toast.error('Failed to restore note');
    }
  };

  const handleDeleteClick = (noteId: string, noteTitle: string) => {
    setNoteToDelete({ id: noteId, title: noteTitle });
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!noteToDelete) return;
    
    try {
      await permanentlyDeleteNote(noteToDelete.id);
      toast.success('Note permanently deleted');
    } catch {
      toast.error('Failed to delete note');
    } finally {
      setDeleteDialogOpen(false);
      setNoteToDelete(null);
    }
  };

  const handleEmptyTrash = async () => {
    try {
      await emptyTrash();
      toast.success('Trash emptied');
    } catch {
      toast.error('Failed to empty trash');
    } finally {
      setEmptyTrashDialogOpen(false);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getNoteTitle = (content: string) => {
    const firstLine = content.split('\n')[0]?.trim() || '';
    const title = firstLine.replace(/^#+\s*/, '');
    return title || 'Untitled';
  };

  const getNotePreview = (content: string) => {
    const lines = content.split('\n').filter(l => l.trim());
    const preview = lines.slice(1, 3).join(' ').trim();
    return preview.slice(0, 100) || 'No content';
  };

  if (!vaultId || !vaultKey) return null;

  return (
    <main className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 border-b border-border">
        <div className="px-4 py-3 sm:px-8 md:px-16">
          <div className="max-w-3xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link 
                to="/vault" 
                className="text-muted-foreground hover:text-foreground p-2 -ml-2 hover:bg-muted rounded-md transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <Logo />
            </div>
            <ThemeToggle />
          </div>
        </div>
      </header>

      <div className="px-4 py-6 sm:px-8 sm:py-8 md:px-16">
        <div className="max-w-3xl mx-auto">
          {/* Title & Empty Trash */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground">
              <span className="text-muted-foreground"># </span>Trash
            </h1>
            {trashedNotes.length > 0 && (
              <button
                onClick={() => setEmptyTrashDialogOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-destructive text-destructive-foreground rounded-md font-medium text-sm hover:bg-destructive/90 transition-colors"
              >
                <Trash2 className="h-4 w-4" />
                <span className="hidden sm:inline">Empty Trash</span>
              </button>
            )}
          </div>

          {/* Trash List */}
          {trashedNotes.length === 0 ? (
            <div className="text-center py-16 sm:py-20">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
                <Trash2 className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-lg font-medium text-foreground mb-2">Trash is empty</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Deleted notes will appear here.
              </p>
              <Link
                to="/vault"
                className="inline-flex items-center gap-2 px-6 py-2.5 bg-accent text-accent-foreground rounded-md font-medium text-sm hover:bg-accent/90 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Notes
              </Link>
            </div>
          ) : (
            <div className="space-y-2 sm:space-y-3">
              {trashedNotes.map((note) => {
                const title = getNoteTitle(note.content);
                return (
                  <div
                    key={note.id}
                    className="group bg-card border border-border rounded-lg hover:border-muted-foreground/30 transition-all overflow-hidden"
                  >
                    <div className="p-3 sm:p-4">
                      <div className="flex items-start justify-between gap-2 sm:gap-4 mb-2">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground truncate text-sm sm:text-base">
                            {title}
                          </h3>
                          <p className="text-muted-foreground text-xs sm:text-sm mt-0.5 sm:mt-1 line-clamp-1 sm:line-clamp-2">
                            {getNotePreview(note.content)}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
                        <span className="text-xs text-muted-foreground">
                          Deleted {formatDate(note.deletedAt)}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleRestore(note.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-foreground bg-muted hover:bg-muted/80 rounded-md transition-colors"
                          >
                            <RotateCcw className="h-3.5 w-3.5" />
                            Restore
                          </button>
                          <button
                            onClick={() => handleDeleteClick(note.id, title)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-destructive bg-destructive/10 hover:bg-destructive/20 rounded-md transition-colors"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Trash Count */}
          {trashedNotes.length > 0 && (
            <p className="text-center text-xs text-muted-foreground mt-8">
              {trashedNotes.length} {trashedNotes.length === 1 ? 'note' : 'notes'} in trash
            </p>
          )}
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permanently delete?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete "{noteToDelete?.title}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Forever
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Empty Trash Confirmation Dialog */}
      <AlertDialog open={emptyTrashDialogOpen} onOpenChange={setEmptyTrashDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Empty trash?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete all {trashedNotes.length} {trashedNotes.length === 1 ? 'note' : 'notes'} in trash? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleEmptyTrash}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Empty Trash
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
