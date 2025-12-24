# Implementation Plan: Enhanced UX Features

## Overview

This plan implements four enhanced UX features: Dark/Light Theme Toggle, Keyboard Shortcuts, Trash/Recycle Bin, and Note Statistics. Tasks are ordered to build foundational components first, then integrate them into the UI.

## Tasks

- [x] 1. Set up Theme System
  - [x] 1.1 Create ThemeContext with theme state management
    - Create `src/contexts/ThemeContext.tsx`
    - Implement Theme type ('light' | 'dark' | 'system')
    - Add localStorage persistence for theme preference
    - Detect system color scheme preference
    - Apply theme class to document root
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 1.6_
  - [x] 1.2 Create ThemeToggle component
    - Create `src/components/ThemeToggle.tsx`
    - Implement toggle button with Sun/Moon/Monitor icons
    - Cycle through light → dark → system on click
    - _Requirements: 1.1, 1.2_
  - [ ]* 1.3 Write property test for theme persistence round-trip
    - **Property 1: Theme Persistence Round-Trip**
    - **Validates: Requirements 1.3, 1.4**
  - [x] 1.4 Integrate ThemeToggle into application header
    - Add ThemeProvider to App.tsx
    - Add ThemeToggle to Vault page header
    - Add ThemeToggle to NoteEditor header
    - _Requirements: 1.1_

- [x] 2. Implement Keyboard Shortcuts System
  - [x] 2.1 Create useKeyboardShortcuts hook
    - Create `src/hooks/use-keyboard-shortcuts.ts`
    - Implement shortcut registration and matching
    - Handle platform-specific modifier keys (Cmd vs Ctrl)
    - Prevent default browser behavior for registered shortcuts
    - Filter shortcuts by scope (global vs editor)
    - _Requirements: 2.1, 2.2, 2.4, 2.5, 2.6_
  - [x] 2.2 Create ShortcutsHelpDialog component
    - Create `src/components/ShortcutsHelpDialog.tsx`
    - Display all shortcuts grouped by scope
    - Show platform-appropriate modifier key labels
    - _Requirements: 2.3_
  - [ ]* 2.3 Write property test for shortcut action triggering
    - **Property 3: Shortcut Action Triggering**
    - **Validates: Requirements 2.1, 2.2**
  - [ ]* 2.4 Write property test for platform-aware modifier keys
    - **Property 5: Platform-Aware Modifier Keys**
    - **Validates: Requirements 2.6**
  - [x] 2.5 Integrate shortcuts into Vault and NoteEditor pages
    - Add global shortcuts (Ctrl+N, Ctrl+K, Ctrl+/, Escape)
    - Add editor shortcuts (Ctrl+S, Ctrl+Backspace)
    - Wire up Ctrl+/ to open ShortcutsHelpDialog
    - _Requirements: 2.1, 2.2, 2.3_

- [x] 3. Checkpoint - Theme and Shortcuts
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Implement Trash/Recycle Bin System
  - [x] 4.1 Extend IndexedDB storage for trash
    - Update `src/lib/storage.ts` with new object store 'trashedNotes'
    - Increment DB_VERSION and handle migration
    - Implement moveToTrash function
    - Implement getTrashedNotes function
    - Implement restoreFromTrash function
    - Implement permanentlyDelete function
    - Implement emptyTrash function
    - _Requirements: 3.1, 3.2, 3.5, 3.6, 3.7, 3.9_
  - [x] 4.2 Extend VaultContext with trash operations
    - Add trashedNotes state
    - Add moveToTrash, restoreNote, permanentlyDeleteNote, emptyTrash methods
    - Load trashed notes on vault sign-in
    - Decrypt trashed notes using vault key
    - _Requirements: 3.1, 3.5, 3.6, 3.7, 3.8, 3.9_
  - [ ]* 4.3 Write property test for trash soft-delete invariant
    - **Property 6: Trash Soft-Delete Invariant**
    - **Validates: Requirements 3.1, 3.2**
  - [ ]* 4.4 Write property test for trash restore round-trip
    - **Property 7: Trash Restore Round-Trip**
    - **Validates: Requirements 3.5, 3.8**
  - [x] 4.5 Create TrashView page component
    - Create `src/pages/Trash.tsx`
    - Display list of trashed notes with deletion dates
    - Add restore button for each note
    - Add permanent delete button for each note
    - Add "Empty Trash" button
    - Add confirmation dialog for permanent delete actions
    - _Requirements: 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 4.6 Update delete functionality in NoteEditor
    - Change delete action to move to trash instead of permanent delete
    - Update confirmation message
    - _Requirements: 3.1_
  - [x] 4.7 Add trash navigation to Vault page
    - Add trash icon/link in vault header or sidebar
    - Show trash count badge if trash is not empty
    - Add route for /vault/trash
    - _Requirements: 3.3_

- [x] 5. Checkpoint - Trash System
  - Ensure all tests pass, ask the user if questions arise.

- [x] 6. Implement Note Statistics System
  - [x] 6.1 Create useNoteStats hook
    - Create `src/hooks/use-note-stats.ts`
    - Calculate word count (whitespace-separated tokens)
    - Calculate character count (with and without spaces)
    - Calculate line count
    - Calculate paragraph count
    - Calculate reading time (words / 200, rounded up)
    - _Requirements: 4.1, 4.2, 4.4, 4.5_
  - [ ]* 6.2 Write property test for statistics calculation
    - **Property 9: Statistics Calculation Correctness**
    - **Validates: Requirements 4.1, 4.2**
  - [ ]* 6.3 Write property test for reading time calculation
    - **Property 10: Reading Time Calculation**
    - **Validates: Requirements 4.5**
  - [x] 6.4 Create NoteStatsBar component
    - Create `src/components/NoteStatsBar.tsx`
    - Display word count, character count, reading time
    - Compact, non-intrusive design
    - _Requirements: 4.1, 4.3_
  - [x] 6.5 Integrate NoteStatsBar into NoteEditor
    - Add stats bar at bottom of editor
    - Connect to useNoteStats hook with editor content
    - Update in real-time as user types
    - _Requirements: 4.1, 4.2, 4.3_
  - [x] 6.6 Add aggregate statistics to Vault page
    - Display total note count
    - Display total word count across all notes
    - _Requirements: 4.6_

- [x] 7. Final Checkpoint
  - Ensure all tests pass, ask the user if questions arise.
  - Verify all features work together
  - Test theme toggle in both vault and editor views
  - Test keyboard shortcuts in different contexts
  - Test trash flow: delete → view trash → restore/permanent delete
  - Test statistics update in real-time

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties
- The trash system requires IndexedDB migration - existing users will get the new store on next app load
