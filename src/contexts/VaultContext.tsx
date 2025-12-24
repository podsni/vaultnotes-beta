import { createContext, useContext, useState, useCallback, useEffect, ReactNode } from 'react';
import { encrypt, decrypt } from '@/lib/crypto';
import { generateMnemonic, mnemonicToVaultKey, mnemonicToVaultId } from '@/lib/mnemonic';
import { 
  saveNote, 
  getNotesByVault, 
  saveVault, 
  saveSession, 
  getSession, 
  clearSession,
  moveToTrash as moveToTrashDB,
  getTrashedNotes,
  restoreFromTrash as restoreFromTrashDB,
  permanentlyDelete as permanentlyDeleteDB,
  emptyTrash as emptyTrashDB,
  TrashedNote,
} from '@/lib/storage';

export interface ExportedVault {
  version: number;
  exportedAt: string;
  vaultId: string;
  notes: {
    id: string;
    content: string;
    createdAt: number;
    updatedAt: number;
  }[];
}

export interface DecryptedNote {
  id: string;
  content: string;
  createdAt: number;
  updatedAt: number;
}

export interface DecryptedTrashedNote extends DecryptedNote {
  deletedAt: number;
}

interface VaultContextType {
  vaultId: string | null;
  vaultKey: string | null;
  mnemonic: string[] | null;
  notes: DecryptedNote[];
  trashedNotes: DecryptedTrashedNote[];
  isLoading: boolean;
  isRestoring: boolean;
  createVaultWithMnemonic: (mnemonic?: string[], rememberMe?: boolean) => Promise<{ vaultId: string; vaultKey: string; mnemonic: string[] }>;
  signInWithMnemonic: (mnemonic: string[], rememberMe?: boolean) => Promise<boolean>;
  signOut: () => void;
  createNote: () => Promise<string>;
  updateNote: (noteId: string, content: string) => Promise<void>;
  deleteNote: (noteId: string) => Promise<void>;
  getNote: (noteId: string) => DecryptedNote | undefined;
  exportVault: () => ExportedVault | null;
  importNotes: (data: ExportedVault) => Promise<{ imported: number; skipped: number }>;
  // Trash operations
  moveToTrash: (noteId: string) => Promise<void>;
  restoreNote: (noteId: string) => Promise<void>;
  permanentlyDeleteNote: (noteId: string) => Promise<void>;
  emptyTrash: () => Promise<void>;
}

const VaultContext = createContext<VaultContextType | undefined>(undefined);

export function VaultProvider({ children }: { children: ReactNode }) {
  const [vaultId, setVaultId] = useState<string | null>(null);
  const [vaultKey, setVaultKey] = useState<string | null>(null);
  const [mnemonic, setMnemonic] = useState<string[] | null>(null);
  const [notes, setNotes] = useState<DecryptedNote[]>([]);
  const [trashedNotes, setTrashedNotes] = useState<DecryptedTrashedNote[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRestoring, setIsRestoring] = useState(true);

  const loadNotes = useCallback(async (vid: string, vkey: string) => {
    setIsLoading(true);
    try {
      // Load active notes
      const encryptedNotes = await getNotesByVault(vid);
      const decryptedNotes: DecryptedNote[] = [];

      for (const note of encryptedNotes) {
        try {
          const content = await decrypt(note.encryptedContent, vkey);
          decryptedNotes.push({
            id: note.id,
            content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
          });
        } catch {
          console.error('Failed to decrypt note:', note.id);
        }
      }

      setNotes(decryptedNotes.sort((a, b) => b.updatedAt - a.updatedAt));

      // Load trashed notes
      const encryptedTrashed = await getTrashedNotes(vid);
      const decryptedTrashed: DecryptedTrashedNote[] = [];

      for (const note of encryptedTrashed) {
        try {
          const content = await decrypt(note.encryptedContent, vkey);
          decryptedTrashed.push({
            id: note.id,
            content,
            createdAt: note.createdAt,
            updatedAt: note.updatedAt,
            deletedAt: note.deletedAt,
          });
        } catch {
          console.error('Failed to decrypt trashed note:', note.id);
        }
      }

      setTrashedNotes(decryptedTrashed.sort((a, b) => b.deletedAt - a.deletedAt));
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Restore session on mount
  useEffect(() => {
    const restoreSession = async () => {
      const session = getSession();
      if (session) {
        try {
          const vid = await mnemonicToVaultId(session.mnemonic);
          const vkey = await mnemonicToVaultKey(session.mnemonic);
          
          setVaultId(vid);
          setVaultKey(vkey);
          setMnemonic(session.mnemonic);
          await loadNotes(vid, vkey);
        } catch {
          // Invalid session, clear it
          clearSession();
        }
      }
      setIsRestoring(false);
    };

    restoreSession();
  }, [loadNotes]);

  const createVaultWithMnemonic = useCallback(async (providedMnemonic?: string[], rememberMe?: boolean) => {
    const newMnemonic = providedMnemonic || generateMnemonic();
    const newVaultId = await mnemonicToVaultId(newMnemonic);
    const newVaultKey = await mnemonicToVaultKey(newMnemonic);

    await saveVault({ id: newVaultId, createdAt: Date.now() });

    setVaultId(newVaultId);
    setVaultKey(newVaultKey);
    setMnemonic(newMnemonic);
    setNotes([]);
    setTrashedNotes([]);

    // Save session if remember me is enabled
    if (rememberMe) {
      saveSession(newMnemonic);
    }

    return { vaultId: newVaultId, vaultKey: newVaultKey, mnemonic: newMnemonic };
  }, []);

  const signInWithMnemonic = useCallback(async (mnemonicWords: string[], rememberMe?: boolean) => {
    try {
      const vid = await mnemonicToVaultId(mnemonicWords);
      const vkey = await mnemonicToVaultKey(mnemonicWords);
      
      setVaultId(vid);
      setVaultKey(vkey);
      setMnemonic(mnemonicWords);
      await loadNotes(vid, vkey);

      // Save session if remember me is enabled
      if (rememberMe) {
        saveSession(mnemonicWords);
      }

      return true;
    } catch {
      return false;
    }
  }, [loadNotes]);

  const signOut = useCallback(() => {
    setVaultId(null);
    setVaultKey(null);
    setMnemonic(null);
    setNotes([]);
    setTrashedNotes([]);
    clearSession();
  }, []);

  const createNote = useCallback(async () => {
    if (!vaultId || !vaultKey) throw new Error('Not signed in');

    const noteId = crypto.randomUUID();
    const now = Date.now();
    const content = '';
    const encryptedContent = await encrypt(content, vaultKey);

    await saveNote({
      id: noteId,
      vaultId,
      encryptedContent,
      createdAt: now,
      updatedAt: now,
    });

    setNotes(prev => [{ id: noteId, content, createdAt: now, updatedAt: now }, ...prev]);

    return noteId;
  }, [vaultId, vaultKey]);

  const updateNote = useCallback(async (noteId: string, content: string) => {
    if (!vaultId || !vaultKey) throw new Error('Not signed in');

    const now = Date.now();
    const encryptedContent = await encrypt(content, vaultKey);

    const existingNote = notes.find(n => n.id === noteId);
    if (!existingNote) throw new Error('Note not found');

    await saveNote({
      id: noteId,
      vaultId,
      encryptedContent,
      createdAt: existingNote.createdAt,
      updatedAt: now,
    });

    setNotes(prev =>
      prev.map(n => (n.id === noteId ? { ...n, content, updatedAt: now } : n))
        .sort((a, b) => b.updatedAt - a.updatedAt)
    );
  }, [vaultId, vaultKey, notes]);

  // Move note to trash (soft delete)
  const moveToTrash = useCallback(async (noteId: string) => {
    const noteToTrash = notes.find(n => n.id === noteId);
    if (!noteToTrash) throw new Error('Note not found');

    await moveToTrashDB(noteId);

    // Update local state
    setNotes(prev => prev.filter(n => n.id !== noteId));
    setTrashedNotes(prev => [
      { ...noteToTrash, deletedAt: Date.now() },
      ...prev,
    ]);
  }, [notes]);

  // Restore note from trash
  const restoreNote = useCallback(async (noteId: string) => {
    const noteToRestore = trashedNotes.find(n => n.id === noteId);
    if (!noteToRestore) throw new Error('Trashed note not found');

    await restoreFromTrashDB(noteId);

    // Update local state
    setTrashedNotes(prev => prev.filter(n => n.id !== noteId));
    setNotes(prev => [
      {
        id: noteToRestore.id,
        content: noteToRestore.content,
        createdAt: noteToRestore.createdAt,
        updatedAt: noteToRestore.updatedAt,
      },
      ...prev,
    ].sort((a, b) => b.updatedAt - a.updatedAt));
  }, [trashedNotes]);

  // Permanently delete note from trash
  const permanentlyDeleteNote = useCallback(async (noteId: string) => {
    await permanentlyDeleteDB(noteId);
    setTrashedNotes(prev => prev.filter(n => n.id !== noteId));
  }, []);

  // Empty all trash
  const emptyTrash = useCallback(async () => {
    if (!vaultId) throw new Error('Not signed in');
    await emptyTrashDB(vaultId);
    setTrashedNotes([]);
  }, [vaultId]);

  // Legacy delete (now uses moveToTrash)
  const deleteNoteHandler = useCallback(async (noteId: string) => {
    await moveToTrash(noteId);
  }, [moveToTrash]);

  const getNote = useCallback((noteId: string) => {
    return notes.find(n => n.id === noteId);
  }, [notes]);

  const exportVault = useCallback((): ExportedVault | null => {
    if (!vaultId) return null;
    
    return {
      version: 1,
      exportedAt: new Date().toISOString(),
      vaultId,
      notes: notes.map(note => ({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      })),
    };
  }, [vaultId, notes]);

  const importNotes = useCallback(async (data: ExportedVault): Promise<{ imported: number; skipped: number }> => {
    if (!vaultId || !vaultKey) throw new Error('Not signed in');
    
    let imported = 0;
    let skipped = 0;
    const existingIds = new Set(notes.map(n => n.id));
    const newNotes: DecryptedNote[] = [];

    for (const note of data.notes) {
      // Skip if note already exists
      if (existingIds.has(note.id)) {
        skipped++;
        continue;
      }

      const encryptedContent = await encrypt(note.content, vaultKey);
      await saveNote({
        id: note.id,
        vaultId,
        encryptedContent,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      });

      newNotes.push({
        id: note.id,
        content: note.content,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      });
      imported++;
    }

    if (newNotes.length > 0) {
      setNotes(prev => [...newNotes, ...prev].sort((a, b) => b.updatedAt - a.updatedAt));
    }

    return { imported, skipped };
  }, [vaultId, vaultKey, notes]);

  return (
    <VaultContext.Provider
      value={{
        vaultId,
        vaultKey,
        mnemonic,
        notes,
        trashedNotes,
        isLoading,
        isRestoring,
        createVaultWithMnemonic,
        signInWithMnemonic,
        signOut,
        createNote,
        updateNote,
        deleteNote: deleteNoteHandler,
        getNote,
        exportVault,
        importNotes,
        moveToTrash,
        restoreNote,
        permanentlyDeleteNote,
        emptyTrash,
      }}
    >
      {children}
    </VaultContext.Provider>
  );
}

export function useVault() {
  const context = useContext(VaultContext);
  if (!context) {
    throw new Error('useVault must be used within a VaultProvider');
  }
  return context;
}
