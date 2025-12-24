# Requirements Document

## Introduction

This document defines the requirements for four enhanced user experience features for VaultNotes: Dark/Light Theme Toggle, Keyboard Shortcuts, Trash/Recycle Bin, and Note Statistics. These features aim to improve usability, accessibility, and power user productivity.

## Glossary

- **Theme_System**: The component responsible for managing and persisting the application's visual theme (dark/light mode)
- **Shortcut_Manager**: The component that registers, handles, and displays keyboard shortcuts throughout the application
- **Trash_System**: The component managing soft-deleted notes with restore and permanent deletion capabilities
- **Statistics_Calculator**: The component that computes and displays note metrics (word count, character count, etc.)
- **User**: A person interacting with the VaultNotes application
- **Note**: An encrypted document stored in the user's vault
- **Soft_Delete**: Moving a note to trash without permanent removal, allowing restoration
- **Hard_Delete**: Permanently removing a note from the system with no recovery option

## Requirements

### Requirement 1: Dark/Light Theme Toggle

**User Story:** As a user, I want to switch between dark and light themes, so that I can use the application comfortably in different lighting conditions.

#### Acceptance Criteria

1. THE Theme_System SHALL provide a toggle control accessible from the application header
2. WHEN a user clicks the theme toggle, THE Theme_System SHALL switch between dark and light modes immediately
3. WHEN a theme is selected, THE Theme_System SHALL persist the preference to local storage
4. WHEN the application loads, THE Theme_System SHALL restore the previously selected theme from local storage
5. IF no theme preference exists, THEN THE Theme_System SHALL default to the system's preferred color scheme
6. WHEN the theme changes, THE Theme_System SHALL apply the new theme without requiring a page reload

### Requirement 2: Keyboard Shortcuts

**User Story:** As a power user, I want to use keyboard shortcuts, so that I can navigate and perform actions quickly without using the mouse.

#### Acceptance Criteria

1. THE Shortcut_Manager SHALL support the following global shortcuts:
   - `Ctrl/Cmd + N`: Create new note
   - `Ctrl/Cmd + K`: Open command palette / quick search
   - `Ctrl/Cmd + ,`: Open settings
   - `Escape`: Close dialogs/modals
2. WHEN in the note editor, THE Shortcut_Manager SHALL support:
   - `Ctrl/Cmd + S`: Save note (manual save trigger)
   - `Ctrl/Cmd + Backspace`: Move note to trash
   - `Ctrl/Cmd + B`: Toggle bold
   - `Ctrl/Cmd + I`: Toggle italic
3. WHEN a user presses `Ctrl/Cmd + /`, THE Shortcut_Manager SHALL display a shortcuts help dialog
4. THE Shortcut_Manager SHALL prevent default browser behavior for registered shortcuts
5. WHEN a text input or editor is focused, THE Shortcut_Manager SHALL allow standard text editing shortcuts to function normally
6. THE Shortcut_Manager SHALL use `Cmd` on macOS and `Ctrl` on other platforms

### Requirement 3: Trash/Recycle Bin

**User Story:** As a user, I want deleted notes to go to a trash bin, so that I can recover accidentally deleted notes.

#### Acceptance Criteria

1. WHEN a user deletes a note, THE Trash_System SHALL move the note to trash instead of permanently deleting it
2. THE Trash_System SHALL store the deletion timestamp with each trashed note
3. THE Trash_System SHALL provide a trash view accessible from the vault page
4. WHEN viewing trash, THE User SHALL see a list of deleted notes with their deletion dates
5. WHEN a user selects a trashed note, THE Trash_System SHALL allow restoring it to the vault
6. WHEN a user chooses to permanently delete a trashed note, THE Trash_System SHALL remove it irreversibly
7. THE Trash_System SHALL provide an "Empty Trash" action to permanently delete all trashed notes
8. WHEN a note is restored, THE Trash_System SHALL return it to the main notes list with original timestamps preserved
9. THE Trash_System SHALL encrypt trashed notes using the same vault key as active notes

### Requirement 4: Note Statistics

**User Story:** As a user, I want to see statistics about my notes, so that I can track my writing progress and note details.

#### Acceptance Criteria

1. WHEN viewing a note in the editor, THE Statistics_Calculator SHALL display:
   - Word count
   - Character count (with and without spaces)
   - Line count
   - Paragraph count
   - Estimated reading time
2. THE Statistics_Calculator SHALL update statistics in real-time as the user types
3. THE Statistics_Calculator SHALL display statistics in a non-intrusive status bar at the bottom of the editor
4. WHEN the note is empty, THE Statistics_Calculator SHALL display zero values for all metrics
5. THE Statistics_Calculator SHALL calculate reading time based on an average reading speed of 200 words per minute
6. WHEN viewing the vault overview, THE Statistics_Calculator SHALL display total note count and aggregate statistics
