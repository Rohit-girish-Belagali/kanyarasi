import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Calendar as CalendarIcon, Settings as SettingsIcon, PlusSquare } from "lucide-react";
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
  const [messages, setMessages] = useState<{[key: string]: Message[]}>({ emotional: [], secretary: [] });
  const [showSettings, setShowSettings] = useState(false);
  const [showBanner, setShowBanner] = useState(true);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [settings, setSettings] = useState<LocalSettings>({
    tone: 'friendly',
    autoVoice: false,
    voiceSpeed: 1.0,
    preferredMode: 'emotional',
    language: 'auto',
    isDarkMode: false,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const voiceControlsRef = useRef<{ speakText: (text: string) => void }>(null);

  const chatMutation = useMutation({
    mutationFn: (userMessage: string) => {
      return apiRequest('POST', '/api/chat', {
        content: userMessage,
        mode: currentMode,
        tone: settings.tone,
        conversationHistory: (messages[currentMode] || []).slice(-5).map(({ role, content }) => ({ role, content }))
      }).then(res => res.json() as Promise<{ message: Message }>);
    },
    onSuccess: (data, variables) => {
      if (!data || !data.message) {
        toast({ title: "Invalid response from server", variant: "destructive" });
        // Revert the optimistic update
        setMessages(prev => ({ ...prev, [currentMode]: prev[currentMode].slice(0, -1) }));
        return;
      }
      // Append the assistant's response to the message list
      setMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), data.message] }));

      // If the response indicates a calendar event was added, invalidate the query
      if (data.message.content.toLowerCase().includes('added to your calendar')) {
        queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
      }

      // Speak the response if auto-voice is on
      if (voiceControlsRef.current && data.message.content) {
        const onSpeechEnd = () => {
          if (isVoiceMode) {
            setIsVoiceMode(false);
          }
        };

        if (isVoiceMode || settings.autoVoice) {
          voiceControlsRef.current.speakText(data.message.content, onSpeechEnd);
        } else {
          // If voice mode is off and auto-voice is off, we still need to handle the case where we were in voice mode
          // and need to exit it, even if we don't speak.
          onSpeechEnd();
        }
      }
    },
    onError: () => {
      toast({
        title: "Failed to get response",
        description: "Please check your API key and try again.",
        variant: "destructive",
      });
      // Revert the optimistic update
      setMessages(prev => ({ ...prev, [currentMode]: prev[currentMode].slice(0, -1) }));
    },
  });

  const handleNewChat = () => {
    setMessages(prev => ({ ...prev, [currentMode]: [] }));
  };

  const handleSendMessage = (text: string) => {
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: text,
      mode: currentMode,
      timestamp: new Date(),
    };
    setMessages(prev => ({ ...prev, [currentMode]: [...(prev[currentMode] || []), userMsg] }));
    chatMutation.mutate(text);
  };

  // Load from localStorage on mount
  useEffect(() => {
    const savedEmotionalMessages = localStorage.getItem('moodai-messages-emotional');
    const savedSecretaryMessages = localStorage.getItem('moodai-messages-secretary');
    const savedSettings = localStorage.getItem('moodai-settings');
    const savedMode = localStorage.getItem('moodai-mode');

    const newMessages: {[key: string]: Message[]} = { emotional: [], secretary: [] };
    if (savedEmotionalMessages) {
      try {
        newMessages.emotional = JSON.parse(savedEmotionalMessages);
      } catch (e) {
        console.error('Failed to load emotional messages:', e);
      }
    }
    if (savedSecretaryMessages) {
      try {
        newMessages.secretary = JSON.parse(savedSecretaryMessages);
      } catch (e) {
        console.error('Failed to load secretary messages:', e);
      }
    }
    setMessages(newMessages);

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
    localStorage.setItem('moodai-messages-emotional', JSON.stringify(messages.emotional));
    localStorage.setItem('moodai-messages-secretary', JSON.stringify(messages.secretary));
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

  const toggleVoiceMode = () => {
    setIsVoiceMode(prev => !prev);
  };

  return (
    <div className="flex flex-col h-screen w-full bg-background text-foreground">
      {/* Header */}
      <header className="h-16 border-b flex items-center justify-between gap-4 px-4 lg:px-8">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-serif font-medium text-primary" data-testid="text-app-title">Mood.ai</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNewChat}
            data-testid="button-new-chat"
          >
            <PlusSquare className="w-5 h-5" />
          </Button>
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
            messages={messages[currentMode] || []}
            currentMode={currentMode}
            onMessagesChange={(newMessages) => setMessages(prev => ({ ...prev, [currentMode]: newMessages }))}
            settings={settings}
            isLoading={chatMutation.isPending}
          />
        </div>

        {/* Calendar Sidebar - 40% on desktop */}
        <div className="hidden lg:flex lg:w-2/5 overflow-auto">
          <CalendarSidebar currentMode={currentMode} />
        </div>
      </div>

      {/* Voice Controls at bottom */}
      <VoiceControls
        ref={voiceControlsRef}
        currentMode={currentMode}
        settings={settings}
        isLoading={chatMutation.isPending}
        onSendMessage={handleSendMessage}
        toggleVoiceMode={toggleVoiceMode}
      />

      {/* Settings Panel */}
      <SettingsPanel
        open={showSettings}
        onClose={() => setShowSettings(false)}
        settings={settings}
        onSettingsChange={handleSettingsChange}
      />

      {isVoiceMode && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setIsVoiceMode(false)}>
          <div onClick={(e) => e.stopPropagation()}>
            <VoiceControls
              ref={voiceControlsRef}
              currentMode={currentMode}
              settings={settings}
              isLoading={chatMutation.isPending}
              onSendMessage={handleSendMessage}
              isVoiceMode={true}
              toggleVoiceMode={() => setIsVoiceMode(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
