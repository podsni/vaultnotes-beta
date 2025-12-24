import { useMemo } from 'react';

export interface NoteStats {
  wordCount: number;
  characterCount: number;
  characterCountNoSpaces: number;
  lineCount: number;
  paragraphCount: number;
  readingTimeMinutes: number;
}

const WORDS_PER_MINUTE = 200;

export function useNoteStats(content: string): NoteStats {
  return useMemo(() => calculateStats(content), [content]);
}

export function calculateStats(content: string): NoteStats {
  if (!content || content.trim().length === 0) {
    return {
      wordCount: 0,
      characterCount: 0,
      characterCountNoSpaces: 0,
      lineCount: 0,
      paragraphCount: 0,
      readingTimeMinutes: 0,
    };
  }

  // Character counts
  const characterCount = content.length;
  const characterCountNoSpaces = content.replace(/\s/g, '').length;

  // Word count - split by whitespace and filter empty strings
  const words = content.trim().split(/\s+/).filter(word => word.length > 0);
  const wordCount = words.length;

  // Line count - number of newlines + 1
  const lineCount = content.split('\n').length;

  // Paragraph count - blocks separated by double newlines
  const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
  const paragraphCount = paragraphs.length || (content.trim().length > 0 ? 1 : 0);

  // Reading time - based on average reading speed
  const readingTimeMinutes = Math.ceil(wordCount / WORDS_PER_MINUTE);

  return {
    wordCount,
    characterCount,
    characterCountNoSpaces,
    lineCount,
    paragraphCount,
    readingTimeMinutes,
  };
}

// Format reading time for display
export function formatReadingTime(minutes: number): string {
  if (minutes === 0) return '< 1 min read';
  if (minutes === 1) return '1 min read';
  return `${minutes} min read`;
}
