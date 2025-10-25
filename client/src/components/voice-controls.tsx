import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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
  isVoiceMode?: boolean;
  toggleVoiceMode?: () => void;
}

export const VoiceControls = forwardRef<{
  speakText: (text: string, onEnd?: () => void) => void;
  toggleListening: () => void;
}, VoiceControlsProps>(({ 
  currentMode, 
  settings,
  isLoading,
  onSendMessage,
  isVoiceMode = false,
  toggleVoiceMode,
}, ref) => {
  const [inputText, setInputText] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const recognitionRef = useRef<any>(null);
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
          setIsListening(false);
          if (transcript) {
            if (isVoiceMode) {
              onSendMessage(transcript);
            } else {
              setInputText(transcript);
            }
          }
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

    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
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

  const speakText = async (text: string, onEnd?: () => void) => {
    if (!text.trim()) {
      onEnd?.();
      return;
    }

    setIsSpeaking(true);
    try {
      const response = await apiRequest('POST', '/api/tts', { text });
      
      if (!response.ok) {
        throw new Error('Failed to fetch audio from TTS endpoint.');
      }

      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const audioBuffer = await response.arrayBuffer();
      const decodedAudio = await audioContext.decodeAudioData(audioBuffer);

      const source = audioContext.createBufferSource();
      source.buffer = decodedAudio;
      source.connect(audioContext.destination);
      source.start(0);

      source.onended = () => {
        setIsSpeaking(false);
        onEnd?.();
      };

    } catch (error) {
      console.error("Speech synthesis error:", error);
      toast({ title: 'Speech synthesis failed', variant: 'destructive' });
      setIsSpeaking(false);
      onEnd?.();
    }
  };


    const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = inputText.trim();
    if (!trimmedInput || isLoading) return;

    onSendMessage(trimmedInput);
    setInputText("");
  };

  useImperativeHandle(ref, () => ({
    speakText,
    toggleListening,
  }));

  if (isVoiceMode) {
    return (
      <div className="relative flex flex-col items-center justify-center p-8" data-testid="voice-controls-container-focused">
        <div className="relative w-32 h-32">
          <div className={`absolute inset-0 rounded-full bg-primary/20 ${isListening || isSpeaking ? 'animate-pulse' : ''}`} />
          <div className={`absolute inset-4 rounded-full bg-primary/40 ${isListening || isSpeaking ? 'animate-pulse' : ''}`} style={{ animationDelay: '150ms' }} />
          <div className={`absolute inset-8 rounded-full bg-primary/60 ${isListening || isSpeaking ? 'animate-pulse' : ''}`} style={{ animationDelay: '300ms' }} />
          <Button
            type="button"
            size="icon"
            variant={isListening ? "default" : "outline"}
            onClick={toggleListening}
            className="absolute inset-0 w-full h-full rounded-full transition-all duration-300 ease-in-out transform hover:scale-105 active:scale-95 shadow-lg"
            disabled={isLoading || isSpeaking}
            data-testid="button-voice-focused"
          >
            {isListening ? <MicOff className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
          </Button>
        </div>
        <span className="text-lg font-medium text-primary mt-6" data-testid="text-voice-status-focused">
          {isListening ? 'Listening...' : isSpeaking ? 'Speaking...' : (isLoading ? 'Thinking...' : 'Tap to speak')}
        </span>
      </div>
    );
  }

  return (
    <div className="relative z-20" style={{ marginBottom: '25px', backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(14px)' }} data-testid="voice-controls-container-default">
      <form onSubmit={handleSubmit} className="px-8 py-4">
        <div className="max-w-3xl mx-auto relative">
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
              variant="ghost"
              onClick={toggleVoiceMode}
              className="absolute right-14 w-10 h-10 rounded-full"
              disabled={isLoading}
              data-testid="button-voice-default"
            >
              <Mic className="w-5 h-5" />
            </Button>

            <Button
              type="submit"
              size="icon"
              className="absolute right-2 w-10 h-10 rounded-full"
              style={{ backgroundColor: '#000000', color: '#ffffff' }}
              disabled={!inputText.trim() || isLoading || isListening}
              data-testid="button-send"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {isLoading && (
            <div className="mt-2 text-center" data-testid="text-thinking">
              <span className="text-sm text-white">Thinking...</span>
            </div>
          )}
        </div>
      </form>
    </div>
  );
});
