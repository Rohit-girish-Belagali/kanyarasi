import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import type { LocalSettings } from "@shared/schema";

interface SettingsPanelProps {
  open: boolean;
  onClose: () => void;
  settings: LocalSettings;
  onSettingsChange: (settings: Partial<LocalSettings>) => void;
}

export function SettingsPanel({ open, onClose, settings, onSettingsChange }: SettingsPanelProps) {
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent className="w-80 sm:w-96" data-testid="panel-settings">
        <SheetHeader>
          <SheetTitle className="text-2xl font-serif">Settings</SheetTitle>
        </SheetHeader>

        <div className="space-y-6 mt-8">
          {/* Tone Controls */}
          <div className="space-y-3">
            <Label className="text-base font-medium">AI Tone</Label>
            <RadioGroup 
              value={settings.tone} 
              onValueChange={(value) => onSettingsChange({ tone: value as any })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="friendly" id="tone-friendly" data-testid="radio-tone-friendly" />
                <Label htmlFor="tone-friendly" className="font-normal cursor-pointer">
                  Friendly - Warm and casual
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="motivational" id="tone-motivational" data-testid="radio-tone-motivational" />
                <Label htmlFor="tone-motivational" className="font-normal cursor-pointer">
                  Motivational - Energetic and uplifting
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="formal" id="tone-formal" data-testid="radio-tone-formal" />
                <Label htmlFor="tone-formal" className="font-normal cursor-pointer">
                  Formal - Professional and concise
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="neutral" id="tone-neutral" data-testid="radio-tone-neutral" />
                <Label htmlFor="tone-neutral" className="font-normal cursor-pointer">
                  Neutral - Balanced approach
                </Label>
              </div>
            </RadioGroup>
          </div>

          <div className="border-t pt-6 space-y-3">
            <Label className="text-base font-medium">Language</Label>
            <Select 
              value={settings.language} 
              onValueChange={(value) => onSettingsChange({ language: value })}
            >
              <SelectTrigger data-testid="select-language">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="auto">Auto-detect</SelectItem>
                <SelectItem value="en-US">English (US)</SelectItem>
                <SelectItem value="es-ES">Español</SelectItem>
                <SelectItem value="fr-FR">Français</SelectItem>
                <SelectItem value="de-DE">Deutsch</SelectItem>
                <SelectItem value="it-IT">Italiano</SelectItem>
                <SelectItem value="pt-BR">Português</SelectItem>
                <SelectItem value="zh-CN">中文</SelectItem>
                <SelectItem value="ja-JP">日本語</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="border-t pt-6 space-y-4">
            <Label className="text-base font-medium">Voice Settings</Label>
            
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-voice" className="font-normal">Auto-speak responses</Label>
                <p className="text-xs text-muted-foreground">AI will speak responses aloud</p>
              </div>
              <Switch
                id="auto-voice"
                checked={settings.autoVoice}
                onCheckedChange={(checked) => onSettingsChange({ autoVoice: checked })}
                data-testid="switch-auto-voice"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="voice-speed" className="font-normal">Voice speed</Label>
                <span className="text-sm text-muted-foreground">{settings.voiceSpeed}x</span>
              </div>
              <Slider
                id="voice-speed"
                min={0.5}
                max={2}
                step={0.1}
                value={[settings.voiceSpeed]}
                onValueChange={([value]) => onSettingsChange({ voiceSpeed: value })}
                data-testid="slider-voice-speed"
              />
            </div>
          </div>

          <div className="border-t pt-6 space-y-3">
            <Label className="text-base font-medium">Preferred Mode</Label>
            <Select 
              value={settings.preferredMode} 
              onValueChange={(value) => onSettingsChange({ preferredMode: value as any })}
            >
              <SelectTrigger data-testid="select-preferred-mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="emotional">Emotional Support</SelectItem>
                <SelectItem value="secretary">Secretary Mode</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
