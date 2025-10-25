import { Button } from "@/components/ui/button";

interface ModeToggleProps {
  currentMode: 'emotional' | 'secretary';
  onModeChange: (mode: 'emotional' | 'secretary') => void;
}

export function ModeToggle({ currentMode, onModeChange }: ModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 p-1 rounded-lg" style={{ backgroundColor: '#CAC3A8' }}>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onModeChange('emotional')}
        className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
          currentMode === 'emotional'
            ? 'text-gray-900'
            : 'text-gray-700 hover:bg-black/5'
        }`}
        style={currentMode === 'emotional' ? { backgroundColor: '#FABA85' } : {}}
        data-testid="button-mode-emotional"
      >
        Emotional Support
      </Button>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => onModeChange('secretary')}
        className={`px-4 py-2 text-sm font-medium transition-all duration-300 rounded-md ${
          currentMode === 'secretary'
            ? 'text-gray-900'
            : 'text-gray-700 hover:bg-black/5'
        }`}
        style={currentMode === 'secretary' ? { backgroundColor: '#FABA85' } : {}}
        data-testid="button-mode-secretary"
      >
        Secretary Mode
      </Button>
    </div>
  );
}
