// IndexedDB storage for encrypted notes

const DB_NAME = 'leafvault';
const DB_VERSION = 2; // Incremented for trash store
const NOTES_STORE = 'notes';
const VAULTS_STORE = 'vaults';
const TRASH_STORE = 'trashedNotes';

export interface Note {
  id: string;
  vaultId: string;
  encryptedContent: string;
  createdAt: number;
  updatedAt: number;
}

export interface TrashedNote extends Note {
  deletedAt: number;
}

export interface VaultInfo {
  id: string;
  createdAt: number;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(NOTES_STORE)) {
        const notesStore = db.createObjectStore(NOTES_STORE, { keyPath: 'id' });
        notesStore.createIndex('vaultId', 'vaultId', { unique: false });
        notesStore.createIndex('updatedAt', 'updatedAt', { unique: false });
      }

      if (!db.objectStoreNames.contains(VAULTS_STORE)) {
        db.createObjectStore(VAULTS_STORE, { keyPath: 'id' });
      }

      // New trash store for version 2
      if (!db.objectStoreNames.contains(TRASH_STORE)) {
        const trashStore = db.createObjectStore(TRASH_STORE, { keyPath: 'id' });
        trashStore.createIndex('vaultId', 'vaultId', { unique: false });
        trashStore.createIndex('deletedAt', 'deletedAt', { unique: false });
      }
    };
  });
}

export async function saveNote(note: Note): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.put(note);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getNote(noteId: string): Promise<Note | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.get(noteId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function getNotesByVault(vaultId: string): Promise<Note[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readonly');
    const store = transaction.objectStore(NOTES_STORE);
    const index = store.index('vaultId');
    const request = index.getAll(vaultId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const notes = request.result.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(notes);
    };
  });
}

export async function deleteNote(noteId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(NOTES_STORE, 'readwrite');
    const store = transaction.objectStore(NOTES_STORE);
    const request = store.delete(noteId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

// Trash operations
export async function moveToTrash(noteId: string): Promise<void> {
  const db = await openDB();
  
  // Get the note first
  const note = await getNote(noteId);
  if (!note) {
    throw new Error('Note not found');
  }

  const trashedNote: TrashedNote = {
    ...note,
    deletedAt: Date.now(),
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE, TRASH_STORE], 'readwrite');
    const notesStore = transaction.objectStore(NOTES_STORE);
    const trashStore = transaction.objectStore(TRASH_STORE);

    // Add to trash
    const addRequest = trashStore.put(trashedNote);
    addRequest.onerror = () => reject(addRequest.error);
    
    // Remove from notes
    const deleteRequest = notesStore.delete(noteId);
    deleteRequest.onerror = () => reject(deleteRequest.error);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function getTrashedNotes(vaultId: string): Promise<TrashedNote[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRASH_STORE, 'readonly');
    const store = transaction.objectStore(TRASH_STORE);
    const index = store.index('vaultId');
    const request = index.getAll(vaultId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const notes = request.result.sort((a, b) => b.deletedAt - a.deletedAt);
      resolve(notes);
    };
  });
}

export async function restoreFromTrash(noteId: string): Promise<void> {
  const db = await openDB();
  
  // Get the trashed note first
  const trashedNote = await new Promise<TrashedNote | undefined>((resolve, reject) => {
    const transaction = db.transaction(TRASH_STORE, 'readonly');
    const store = transaction.objectStore(TRASH_STORE);
    const request = store.get(noteId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });

  if (!trashedNote) {
    throw new Error('Trashed note not found');
  }

  // Restore to notes (without deletedAt)
  const restoredNote: Note = {
    id: trashedNote.id,
    vaultId: trashedNote.vaultId,
    encryptedContent: trashedNote.encryptedContent,
    createdAt: trashedNote.createdAt,
    updatedAt: trashedNote.updatedAt,
  };

  return new Promise((resolve, reject) => {
    const transaction = db.transaction([NOTES_STORE, TRASH_STORE], 'readwrite');
    const notesStore = transaction.objectStore(NOTES_STORE);
    const trashStore = transaction.objectStore(TRASH_STORE);

    // Add back to notes
    const addRequest = notesStore.put(restoredNote);
    addRequest.onerror = () => reject(addRequest.error);
    
    // Remove from trash
    const deleteRequest = trashStore.delete(noteId);
    deleteRequest.onerror = () => reject(deleteRequest.error);

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function permanentlyDelete(noteId: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRASH_STORE, 'readwrite');
    const store = transaction.objectStore(TRASH_STORE);
    const request = store.delete(noteId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function emptyTrash(vaultId: string): Promise<void> {
  const db = await openDB();
  const trashedNotes = await getTrashedNotes(vaultId);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(TRASH_STORE, 'readwrite');
    const store = transaction.objectStore(TRASH_STORE);
    
    for (const note of trashedNotes) {
      store.delete(note.id);
    }

    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error);
  });
}

export async function saveVault(vault: VaultInfo): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VAULTS_STORE, 'readwrite');
    const store = transaction.objectStore(VAULTS_STORE);
    const request = store.put(vault);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getVault(vaultId: string): Promise<VaultInfo | undefined> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(VAULTS_STORE, 'readonly');
    const store = transaction.objectStore(VAULTS_STORE);
    const request = store.get(vaultId);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

export async function exportVaultData(vaultId: string): Promise<Note[]> {
  return getNotesByVault(vaultId);
}

export async function importVaultData(notes: Note[]): Promise<void> {
  for (const note of notes) {
    await saveNote(note);
  }
}

// Session persistence for "Remember Me" feature
const SESSION_KEY = 'leafvault_session';

export interface SavedSession {
  mnemonic: string[];
  savedAt: number;
}

export function saveSession(mnemonic: string[]): void {
  const session: SavedSession = {
    mnemonic,
    savedAt: Date.now(),
  };
  localStorage.setItem(SESSION_KEY, JSON.stringify(session));
}

export function getSession(): SavedSession | null {
  try {
    const data = localStorage.getItem(SESSION_KEY);
    if (!data) return null;
    return JSON.parse(data) as SavedSession;
  } catch {
    return null;
  }
}

export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY);
}
