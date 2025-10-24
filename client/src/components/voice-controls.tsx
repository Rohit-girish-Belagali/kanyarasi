import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Message, LocalSettings } from "@shared/schema";

interface VoiceControlsProps {
  currentMode: 'emotional' | 'secretary';
  settings: LocalSettings;
  isLoading: boolean;
  onSendMessage: (message: string) => void;
}

export function VoiceControls({ 
  currentMode, 
  settings,
  isLoading,
  onSendMessage,
}: VoiceControlsProps) {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const { toast } = useToast();

  // Initialize Web Speech API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check for Speech Recognition
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        recognitionRef.current.continuous = false;
        recognitionRef.current.interimResults = false;
        recognitionRef.current.lang = settings.language === 'auto' ? 'en-US' : settings.language;

        recognitionRef.current.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setInputText(transcript);
          setIsListening(false);
        };

        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          toast({
            title: "Voice input error",
            description: "Please check microphone permissions and try again.",
            variant: "destructive",
          });
        };

        recognitionRef.current.onend = () => {
          setIsListening(false);
        };
      }

      // Initialize Speech Synthesis
      synthRef.current = window.speechSynthesis;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, [settings.language, toast]);


  const toggleListening = () => {
    if (!recognitionRef.current) {
      toast({
        title: "Voice input not supported",
        description: "Your browser doesn't support voice input. Please type your message instead.",
        variant: "destructive",
      });
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  const speakText = (text: string) => {
    if (!synthRef.current) return;

    synthRef.current.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings.voiceSpeed;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    
    synthRef.current.speak(utterance);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInputText("");
  };

  return (
    <div className="border-t bg-background" data-testid="voice-controls-container">
      <form onSubmit={handleSubmit} className="px-4 lg:px-8 py-4">
        <div className="max-w-3xl mx-auto relative">
          {/* Voice visualization when active */}
          {(isListening || isSpeaking) && (
            <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2" data-testid="voice-visualization">
              <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full bg-primary/20 animate-pulse" />
                <div className="absolute inset-2 rounded-full bg-primary/40 animate-pulse" style={{ animationDelay: '150ms' }} />
                <div className="absolute inset-4 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '300ms' }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Mic className="w-6 h-6 text-primary" />
                </div>
              </div>
              <span className="text-sm font-medium text-primary" data-testid="text-voice-status">
                {isListening ? 'Listening...' : 'Speaking...'}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <Input
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type a message or press the mic..."
              className="h-12 rounded-full px-6 pr-24"
              disabled={isLoading || isListening}
              data-testid="input-message"
            />
            
            <Button
              type="button"
              size="icon"
              variant={isListening ? "default" : "ghost"}
              onClick={toggleListening}
              className="absolute right-14 w-10 h-10 rounded-full"
              disabled={isLoading}
              data-testid="button-voice"
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>

            <Button
              type="submit"
              size="icon"
              variant="default"
              className="absolute right-2 w-10 h-10 rounded-full"
              disabled={!inputText.trim() || isLoading || isListening}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {isLoading && (
            <div className="mt-2 text-center" data-testid="text-thinking">
              <span className="text-sm text-muted-foreground">Thinking...</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
