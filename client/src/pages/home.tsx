import { useState, useEffect, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Heart, Calendar as CalendarIcon, Settings as SettingsIcon, PlusSquare, BarChart3, X, LogOut } from "lucide-react";
import { ChatInterface } from "@/components/chat-interface";
import { VoiceControls } from "@/components/voice-controls";
import { ModeToggle } from "@/components/mode-toggle";
import { CalendarSidebar } from "@/components/calendar-sidebar";
import { SettingsPanel } from "@/components/settings-panel";
import { ThemeToggle } from "@/components/theme-toggle";
import { AuthDialog } from "@/components/auth-dialog";
import { Button } from "@/components/ui/button";
import type { Message, User, CalendarEvent, LocalSettings } from "@shared/schema";

export default function Home() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showAuthDialog, setShowAuthDialog] = useState(false);
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
  const voiceControlsRef = useRef<{ 
    speakText: (text: string, onEnd?: () => void) => void; 
    toggleListening: () => void; 
  }>(null);

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
        if (isVoiceMode) {
          // In voice mode, speak the response and then immediately start listening again.
          voiceControlsRef.current.speakText(data.message.content, () => {
            voiceControlsRef.current?.toggleListening();
          });
        } else if (settings.autoVoice) {
          // When not in voice mode, only speak if auto-voice is enabled.
          voiceControlsRef.current.speakText(data.message.content);
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

  // Check for logged-in user on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('moodai-user');
    if (savedUser) {
      try {
        setCurrentUser(JSON.parse(savedUser));
      } catch (e) {
        console.error('Failed to load user:', e);
        setShowAuthDialog(true);
      }
    } else {
      setShowAuthDialog(true);
    }
  }, []);

  // Load from localStorage on mount
  useEffect(() => {
    if (!currentUser) return;
    
    const userKey = `moodai-user-${currentUser.id}`;
    const savedEmotionalMessages = localStorage.getItem(`${userKey}-messages-emotional`);
    const savedSecretaryMessages = localStorage.getItem(`${userKey}-messages-secretary`);
    const savedSettings = localStorage.getItem(`${userKey}-settings`);
    const savedMode = localStorage.getItem(`${userKey}-mode`);

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
  }, [currentUser]);

  // Save to localStorage when data changes
  useEffect(() => {
    if (!currentUser) return;
    const userKey = `moodai-user-${currentUser.id}`;
    localStorage.setItem(`${userKey}-messages-emotional`, JSON.stringify(messages.emotional));
    localStorage.setItem(`${userKey}-messages-secretary`, JSON.stringify(messages.secretary));
  }, [messages, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `moodai-user-${currentUser.id}`;
    localStorage.setItem(`${userKey}-settings`, JSON.stringify(settings));
  }, [settings, currentUser]);

  useEffect(() => {
    if (!currentUser) return;
    const userKey = `moodai-user-${currentUser.id}`;
    localStorage.setItem(`${userKey}-mode`, currentMode);
  }, [currentMode, currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('moodai-user', JSON.stringify(user));
    setShowAuthDialog(false);
    toast({
      title: `Welcome back, ${user.name}!`,
      description: "Your chat history has been restored.",
    });
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('moodai-user');
    setMessages({ emotional: [], secretary: [] });
    setShowAuthDialog(true);
    toast({
      title: "Logged out successfully",
      description: "See you next time!",
    });
  };

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

  const hasMessages = (messages[currentMode] || []).length > 0;

  return (
    <div className="flex flex-col h-screen w-full relative overflow-hidden p-8">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: 'url(/bg.jpeg)' }}
      />
      <div className="absolute inset-0 bg-black/10" />
      {/* Header */}
      <header className="relative z-10 h-20 flex items-center justify-between gap-4 px-8 mb-4">
        <div className="flex items-center gap-4">
          <h1 className="text-4xl font-bold text-gray-900" data-testid="text-app-title">Mood.ai</h1>
        </div>
        
        <div className="flex items-center gap-4">
          <Button
            size="icon"
            variant="ghost"
            onClick={handleNewChat}
            className="hover:bg-black/10"
            data-testid="button-new-chat"
          >
            <PlusSquare className="w-5 h-5 text-gray-900" />
          </Button>
          <ModeToggle currentMode={currentMode} onModeChange={handleModeChange} />
        </div>
      </header>


      {/* Main Content Area */}
      <div className="relative z-10 flex-1 flex overflow-hidden gap-4">
        {/* Left Sidebar - Statistics & Chat History */}
        <div className="hidden lg:flex lg:flex-col w-64 gap-4" style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(14px)', borderRadius: '1.5rem', padding: '1rem' }}>
          {/* Statistics Cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl p-4 shadow-lg" style={{ backgroundColor: 'rgba(202, 195, 168, 0.6)', backdropFilter: 'blur(14px)' }}>
              <BarChart3 className="w-8 h-8 text-gray-900 mb-2" />
              <p className="text-xs text-gray-800 font-medium">Statistics</p>
            </div>
            <div className="rounded-2xl p-4 shadow-lg" style={{ backgroundColor: 'rgba(202, 195, 168, 0.6)', backdropFilter: 'blur(14px)' }}>
              <BarChart3 className="w-8 h-8 text-gray-900 mb-2" />
              <p className="text-xs text-gray-800 font-medium">Statistics</p>
            </div>
            <div className="rounded-2xl p-4 shadow-lg" style={{ backgroundColor: 'rgba(202, 195, 168, 0.6)', backdropFilter: 'blur(14px)' }}>
              <BarChart3 className="w-8 h-8 text-gray-900 mb-2" />
              <p className="text-xs text-gray-800 font-medium">Statistics</p>
            </div>
            <div className="rounded-2xl p-4 shadow-lg" style={{ backgroundColor: 'rgba(202, 195, 168, 0.6)', backdropFilter: 'blur(14px)' }}>
              <BarChart3 className="w-8 h-8 text-gray-900 mb-2" />
              <p className="text-xs text-gray-800 font-medium">Statistics</p>
            </div>
          </div>

          {/* Chat History */}
          <div className="flex-1 rounded-2xl p-4 shadow-lg overflow-auto" style={{ backgroundColor: 'rgba(202, 195, 168, 0.6)', backdropFilter: 'blur(14px)' }}>
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Chat History</h3>
            <div className="space-y-2">
              {messages[currentMode]?.slice(-4).reverse().map((msg, idx) => (
                msg.role === 'user' && (
                  <div key={idx} className="flex items-start gap-2 text-xs text-gray-800">
                    <div className="w-2 h-2 rounded-full bg-green-500 mt-1 flex-shrink-0" />
                    <p className="line-clamp-2">{msg.content}</p>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* User Info */}
          <div className="flex items-center justify-between rounded-2xl p-3 shadow-lg" style={{ backgroundColor: 'rgba(202, 195, 168, 0.6)', backdropFilter: 'blur(14px)' }}>
            <span className="text-sm font-medium text-gray-900">{currentUser?.name || 'Guest'}</span>
            <div className="flex gap-1">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => setShowSettings(true)}
                className="h-8 w-8 hover:bg-black/10"
                title="Settings"
              >
                <SettingsIcon className="w-4 h-4 text-gray-900" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                onClick={handleLogout}
                className="h-8 w-8 hover:bg-black/10"
                title="Logout"
              >
                <LogOut className="w-4 h-4 text-gray-900" />
              </Button>
            </div>
          </div>
        </div>

        {/* Center Content Area */}
        <div className="flex-1 flex flex-col items-center justify-center px-8">
          {!hasMessages ? (
            /* Welcome Screen */
            <div className="flex flex-col items-center justify-center max-w-4xl w-full space-y-8">
              <h1 className="text-5xl lg:text-6xl font-bold text-center text-gray-900 leading-tight">
                Companion for all your<br />Emotional needs
              </h1>
              <div className="w-full max-w-2xl">
                <h2 className="text-2xl font-bold text-center text-gray-900 mb-4">
                  HOW IS YOUR DAY??
                </h2>
              </div>
            </div>
          ) : (
            /* Chat Messages */
            <div className="flex-1 w-full max-w-4xl overflow-auto py-8">
              <div className="space-y-4">
                {messages[currentMode]?.map((msg, idx) => (
                  <div
                    key={msg.id}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className="max-w-[70%] px-6 py-3 rounded-3xl shadow-lg text-gray-900"
                      style={{ 
                        backgroundColor: msg.role === 'user' ? '#FABA85' : '#CAC3A8',
                        backdropFilter: 'blur(14px)'
                      }}
                    >
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))}
                {chatMutation.isPending && (
                  <div className="flex justify-start">
                    <div className="max-w-[70%] px-6 py-3 rounded-3xl shadow-lg" style={{ backgroundColor: '#CAC3A8', backdropFilter: 'blur(14px)' }}>
                      <p className="text-sm text-gray-900">Thinking...</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar - Calendar (hidden on mobile) */}
        <div className="hidden xl:flex xl:w-80 overflow-auto">
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

      {/* Auth Dialog */}
      {showAuthDialog && (
        <AuthDialog
          onLogin={handleLogin}
          onClose={() => {
            // Don't allow closing without logging in
            if (!currentUser) {
              toast({
                title: "Login required",
                description: "Please login or create an account to continue",
                variant: "destructive",
              });
            } else {
              setShowAuthDialog(false);
            }
          }}
        />
      )}
    </div>
  );
}
