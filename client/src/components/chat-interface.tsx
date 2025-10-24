import { useEffect, useRef } from "react";
import { format } from "date-fns";
import { ChatBubbleLeftRightIcon } from "@heroicons/react/24/outline";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import type { Message, LocalSettings } from "@shared/schema";

interface ChatInterfaceProps {
  messages: Message[];
  currentMode: 'emotional' | 'secretary';
  onMessagesChange: (messages: Message[]) => void;
  settings: LocalSettings;
  isLoading?: boolean;
}

export function ChatInterface({ messages, currentMode, settings, isLoading = false }: ChatInterfaceProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  if (messages.length === 0 && !isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-8" data-testid="empty-chat">
        <ChatBubbleLeftRightIcon className="w-16 h-16 opacity-20 mb-4" data-testid="icon-empty-chat" />
        <h2 className="text-2xl font-serif font-medium mb-2" data-testid="text-empty-title">Start a conversation</h2>
        <p className="text-base opacity-60 mb-6" data-testid="text-empty-subtitle">Say hello or ask me anything...</p>
        
        <div className="flex flex-wrap gap-2 justify-center max-w-2xl">
          <Badge 
            variant="outline" 
            className="px-4 py-2 cursor-pointer hover-elevate"
            data-testid="chip-prompt-1"
          >
            I'm feeling stressed today
          </Badge>
          <Badge 
            variant="outline" 
            className="px-4 py-2 cursor-pointer hover-elevate"
            data-testid="chip-prompt-2"
          >
            Help me plan my week
          </Badge>
          <Badge 
            variant="outline" 
            className="px-4 py-2 cursor-pointer hover-elevate"
            data-testid="chip-prompt-3"
          >
            I need motivation
          </Badge>
          <Badge 
            variant="outline" 
            className="px-4 py-2 cursor-pointer hover-elevate"
            data-testid="chip-prompt-4"
          >
            What's on my schedule?
          </Badge>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto px-4 lg:px-8 py-8 scroll-smooth" data-testid="chat-messages-container">
      <div className="max-w-3xl mx-auto space-y-4">
        {messages && messages.map((message, index) => (
          <div
            key={message.id || index}
            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            data-testid={`message-${message.role}-${index}`}
          >
            <div className={`flex flex-col ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              {message.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2 ml-2">
                  <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center" data-testid="avatar-ai">
                    <span className="text-sm font-medium text-primary">M</span>
                  </div>
                  <span className="text-xs font-medium opacity-60" data-testid="text-ai-name">Mood.ai</span>
                </div>
              )}
              
              <div
                className={`px-4 py-3 ${
                  message.role === 'user'
                    ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm max-w-md ml-auto'
                    : 'bg-card border border-card-border rounded-2xl rounded-tl-sm max-w-lg mr-auto'
                }`}
                data-testid={`bubble-${message.role}-${index}`}
              >
                <p className="text-base leading-relaxed whitespace-pre-wrap">{message.content}</p>
              </div>
              
              <span className="text-xs opacity-60 px-4 mt-1" data-testid={`timestamp-${index}`}>
                {message.timestamp ? format(new Date(message.timestamp), 'h:mm a') : 'Just now'}
              </span>
            </div>
          </div>
        ))}
        
        {/* Loading skeleton */}
        {isLoading && (
          <div className="flex justify-start" data-testid="skeleton-ai-message">
            <div className="flex flex-col items-start">
              <div className="flex items-center gap-2 mb-2 ml-2">
                <Skeleton className="w-8 h-8 rounded-full" />
                <Skeleton className="w-16 h-3" />
              </div>
              <div className="bg-card border border-card-border rounded-2xl rounded-tl-sm max-w-lg p-4">
                <Skeleton className="h-4 w-64 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
