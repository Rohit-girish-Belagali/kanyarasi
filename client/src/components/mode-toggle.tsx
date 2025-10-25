import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  currentMode: 'emotional' | 'secretary';
  onModeChange: (mode: 'emotional' | 'secretary') => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 bg-muted rounded-lg">
      <Button
        size="sm"
        variant={currentMode === 'emotional' ? 'default' : 'ghost'}
        onClick={() => onModeChange('emotional')}
        className="px-4 py-2 text-sm font-medium transition-all duration-300 rounded-md"
        data-testid="button-mode-emotional"
      >
        Emotional Support
      </Button>
      <Button
        size="sm"
        variant={currentMode === 'secretary' ? 'default' : 'ghost'}
        onClick={() => onModeChange('secretary')}
        className="px-4 py-2 text-sm font-medium transition-all duration-300 rounded-md"
        data-testid="button-mode-secretary"
      >
        Secretary Mode
      </Button>
    </div>
  );
}
