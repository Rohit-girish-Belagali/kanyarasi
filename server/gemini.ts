// DON'T DELETE THIS COMMENT
// Using Gemini blueprint: gemini-2.5-flash for conversational AI

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

import type { CalendarEvent } from "@shared/schema";

interface ChatOptions {
  content: string;
  mode: 'emotional' | 'secretary';
  tone: 'friendly' | 'motivational' | 'formal' | 'neutral';
  conversationHistory?: Array<{ role: string; content: string }>;
  calendarEvents?: CalendarEvent[];
}

interface ChatResponse {
  message: string;
  detectedMode?: 'emotional' | 'secretary';
}

export async function generateChatResponse(options: ChatOptions): Promise<ChatResponse> {
  const { content, mode, tone, conversationHistory = [], calendarEvents = [] } = options;

  // Build system instruction based on mode and tone
  const systemInstruction = buildSystemInstruction(mode, tone, calendarEvents);

  // Detect if we should switch modes based on user input
  const detectedMode = detectModeFromContent(content);

  try {
    // Build conversation history for context
    const contents = [
      ...conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'model',
        parts: [{ text: msg.content }],
      })),
      {
        role: 'user',
        parts: [{ text: content }],
      },
    ];

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      config: {
        systemInstruction,
        temperature: tone === 'formal' ? 0.7 : tone === 'motivational' ? 0.9 : 0.8,
        maxOutputTokens: 300, // Keep responses under 120 words as specified
      },
      contents,
    });

    const messageText = response.text || "I'm here to help. How can I assist you today?";

    return {
      message: messageText,
    };
  } catch (error) {
    console.error('Gemini API error:', error);
    throw new Error(`Failed to generate response: ${error}`);
  }
}

function buildSystemInstruction(
  mode: 'emotional' | 'secretary',
  tone: 'friendly' | 'motivational' | 'formal' | 'neutral',
  calendarEvents: CalendarEvent[]
): string {
  const baseInstructions = `You are Mood.ai — an intelligent multilingual emotional companion and productivity assistant that interacts naturally through both voice and text.

Auto-detect and respond in the user's language.
Keep replies conversational and clear for both text and voice output.
Keep responses under 120 words unless more detail is requested.
End every message with a natural conversational cue or question that encourages continued engagement.`;

  const toneInstructions = {
    friendly: "Use warm, casual, and approachable language. Be conversational and personable.",
    motivational: "Be energetic, uplifting, and encouraging. Focus on positive outcomes and possibilities.",
    formal: "Maintain a professional, concise, and polished tone. Be respectful and clear.",
    neutral: "Use balanced, measured language. Be helpful without being overly casual or formal.",
  };

  const modeInstructions = {
    emotional: `EMOTIONAL SUPPORT MODE:
Be a warm, empathetic friend who listens and provides emotional comfort.
Respond gently, validating the user's feelings, and use encouraging, optimistic language.
If the user expresses sadness, anxiety, or stress, focus on reassurance and simple cope ideas like journaling, deep breathing, or reaching out to loved ones.
Avoid medical or psychiatric advice.
Always end responses with a comforting or supportive follow-up question.`,
    secretary: `SECRETARY MODE:
Act as a proactive digital assistant that manages the user's goals, schedules, and tasks.
Create, update, and retrieve tasks or goals from the user's calendar.
Suggest structured daily plans or weekly routines.
Speak in a concise, professional, and motivating tone.
When discussing plans, clearly mention the time, duration, and priority of tasks.
Offer to add tasks to their calendar when they mention goals or objectives.`,
  };

  const calendarContext = calendarEvents.length > 0
    ? `\n\nCURRENT CALENDAR:\n${calendarEvents.map(e => `- ${e.title} at ${new Date(e.startTime).toLocaleString()}`).join('\n')}`
    : '';

  return `${baseInstructions}\n\n${toneInstructions[tone]}\n\n${modeInstructions[mode]}${calendarContext}`;
}

function detectModeFromContent(content: string): 'emotional' | 'secretary' {
  const lowerContent = content.toLowerCase();
  const productivityKeywords = [
    'schedule', 'calendar', 'task', 'meeting', 'deadline', 'plan', 'organize',
    'remind', 'appointment', 'event', 'goal', 'work', 'productivity',
    'time', 'manage', 'routine', 'agenda', 'to-do', 'todo',
  ];

  // Keywords that suggest emotional support mode
  const emotionalKeywords = [
    'feel', 'feeling', 'sad', 'happy', 'anxious', 'stress', 'worried', 'depressed',
    'lonely', 'overwhelmed', 'frustrated', 'angry', 'scared', 'nervous', 'upset',
    'emotional', 'mood', 'hurt', 'afraid', 'comfort', 'support', 'talk', 'listen',
  ];

  const productivityScore = productivityKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  ).length;

  const emotionalScore = emotionalKeywords.filter(keyword => 
    lowerContent.includes(keyword)
  ).length;

  // Return detected mode, defaulting to emotional if unclear
  if (productivityScore > emotionalScore) {
    return 'secretary';
  }
  return 'emotional';
}
