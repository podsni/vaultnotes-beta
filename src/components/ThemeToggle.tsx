import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme, Theme } from '@/contexts/ThemeContext';
import { cn } from '@/lib/utils';

interface ThemeToggleProps {
  className?: string;
}

const themeOrder: Theme[] = ['light', 'dark', 'system'];

export function ThemeToggle({ className }: ThemeToggleProps) {
  const { theme, setTheme } = useTheme();

  const cycleTheme = () => {
    const currentIndex = themeOrder.indexOf(theme);
    const nextIndex = (currentIndex + 1) % themeOrder.length;
    setTheme(themeOrder[nextIndex]);
  };

  const getIcon = () => {
    switch (theme) {
      case 'light':
        return <Sun className="h-5 w-5" />;
      case 'dark':
        return <Moon className="h-5 w-5" />;
      case 'system':
        return <Monitor className="h-5 w-5" />;
    }
  };

  const getLabel = () => {
    switch (theme) {
      case 'light':
        return 'Light mode';
      case 'dark':
        return 'Dark mode';
      case 'system':
        return 'System theme';
    }
  };

  return (
    <button
      onClick={cycleTheme}
      className={cn(
        'p-2 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors',
        className
      )}
      title={getLabel()}
      aria-label={`Current theme: ${getLabel()}. Click to change.`}
    >
      {getIcon()}
    </button>
  );
}
