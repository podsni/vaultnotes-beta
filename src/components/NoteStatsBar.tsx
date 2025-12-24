import { NoteStats, formatReadingTime } from '@/hooks/use-note-stats';
import { cn } from '@/lib/utils';

interface NoteStatsBarProps {
  stats: NoteStats;
  className?: string;
}

export function NoteStatsBar({ stats, className }: NoteStatsBarProps) {
  return (
    <div 
      className={cn(
        'flex items-center gap-4 text-xs text-muted-foreground py-2 px-1',
        className
      )}
    >
      <span>{stats.wordCount} {stats.wordCount === 1 ? 'word' : 'words'}</span>
      <span className="text-border">•</span>
      <span>{stats.characterCount} {stats.characterCount === 1 ? 'char' : 'chars'}</span>
      <span className="text-border">•</span>
      <span>{stats.lineCount} {stats.lineCount === 1 ? 'line' : 'lines'}</span>
      <span className="text-border hidden sm:inline">•</span>
      <span className="hidden sm:inline">{formatReadingTime(stats.readingTimeMinutes)}</span>
    </div>
  );
}
