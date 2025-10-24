import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Heart, Calendar as CalendarIcon, Settings as SettingsIcon } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import { VoiceControls } from "@/components/voice-controls";
import { ModeToggle } from "@/components/mode-toggle";
import { CalendarSidebar } from "@/components/calendar-sidebar";
import { SettingsPanel } from "@/components/settings-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import type { Message, CalendarEvent, LocalSettings } from "@shared/schema";

export default function Home() {
  const [currentMode, setCurrentMode] = useState<'emotional' | 'secretary'>('emotional');
  const [messages, setMessages] = useState<Message[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [settings, setSettings] = useState<LocalSettings>({
    tone: 'friendly',
    autoVoice: false,
    voiceSpeed: 1.0,
    preferredMode: 'emotional',
    language: 'auto',
    isDarkMode: false,
  });

  // Load from localStorage on mount
  useEffect(() => {
    const savedMessages = localStorage.getItem('moodai-messages');
    const savedSettings = localStorage.getItem('moodai-settings');
    const savedMode = localStorage.getItem('moodai-mode');

    if (savedMessages) {
      try {
        setMessages(JSON.parse(savedMessages));
      } catch (e) {
        console.error('Failed to load messages:', e);
      }
    }

    if (savedSettings) {
      try {
        const loaded = JSON.parse(savedSettings);
        setSettings(loaded);
        // Apply dark mode
        if (loaded.isDarkMode) {
          document.documentElement.classList.add('dark');
        }
      } catch (e) {
        console.error('Failed to load settings:', e);
      }
    }

    if (savedMode) {
      setCurrentMode(savedMode as 'emotional' | 'secretary');
    }
  }, []);

  // Save to localStorage when data changes
  useEffect(() => {
    localStorage.setItem('moodai-messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('moodai-settings', JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem('moodai-mode', currentMode);
  }, [currentMode]);

  const handleModeChange = (mode: 'emotional' | 'secretary') => {
    setCurrentMode(mode);
    setShowBanner(true);
  };

  const handleSettingsChange = (newSettings: Partial<LocalSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
    
    // Handle dark mode toggle
    if (newSettings.isDarkMode !== undefined) {
      if (newSettings.isDarkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif font-medium text-primary" data-testid="text-app-title">Mood.ai</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <ModeToggle currentMode={currentMode} onModeChange={handleModeChange} />
          <ThemeToggle 
            isDark={settings.isDarkMode} 
            onToggle={(isDark) => handleSettingsChange({ isDarkMode: isDark })}
          />
          <Button
            size="icon"
            variant="ghost"
            onClick={() => setShowSettings(true)}
            data-testid="button-settings"
          >
            <SettingsIcon className="w-5 h-5" />
          </Button>
        </div>
      </header>

      {/* Mode Indicator Banner */}
      {showBanner && (
        <div className="h-12 bg-accent/50 border-b flex items-center justify-between gap-4 px-6" data-testid="banner-mode-indicator">
          <div className="flex items-center gap-3">
            {currentMode === 'emotional' ? (
              <>
                <Heart className="w-5 h-5 text-primary" data-testid="icon-mode-emotional" />
                <span className="text-sm font-medium" data-testid="text-mode-description">Emotional Support Mode: I'm here to listen</span>
              </>
            ) : (
              <>
                <CalendarIcon className="w-5 h-5 text-primary" data-testid="icon-mode-secretary" />
                <span className="text-sm font-medium" data-testid="text-mode-description">Secretary Mode: Let's organize your day</span>
              </>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowBanner(false)}
            className="h-6 w-6 p-0"
            data-testid="button-close-banner"
          >
            ✕
          </Button>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex gap-8 overflow-hidden">
        {/* Chat Area - 60% on desktop */}
        <div className="flex-1 flex flex-col lg:w-3/5 lg:border-r">
          <ChatInterface
            messages={messages}
            currentMode={currentMode}
            onMessagesChange={setMessages}
            settings={settings}
            isLoading={isLoadingResponse}
          />
        </div>

        {/* Calendar Sidebar - 40% on desktop */}
        <div className="hidden lg:flex lg:w-2/5 overflow-auto">
          <CalendarSidebar currentMode={currentMode} />
        </div>
      </div>

      {/* Voice Controls at bottom */}
      <VoiceControls
        currentMode={currentMode}
        messages={messages}
        onMessagesChange={setMessages}
        settings={settings}
        onModeChange={setCurrentMode}
        isLoading={isLoadingResponse}
        onLoadingChange={setIsLoadingResponse}
      />

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />
    </div>
  );
}
