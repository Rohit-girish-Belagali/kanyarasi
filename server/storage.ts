import { 
  type Message, 
  type InsertMessage,
  type CalendarEvent,
  type InsertCalendarEvent,
  type UserPreferences,
  type InsertUserPreferences
} from "@shared/schema";
import { randomUUID } from "crypto";

export interface IStorage {
  // Message operations
  getMessages(): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(): Promise<void>;

  // Calendar event operations
  getCalendarEvents(): Promise<CalendarEvent[]>;
  getCalendarEvent(id: string): Promise<CalendarEvent | undefined>;
  createCalendarEvent(event: InsertCalendarEvent): Promise<CalendarEvent>;
  updateCalendarEvent(id: string, event: Partial<CalendarEvent>): Promise<CalendarEvent | undefined>;
  deleteCalendarEvent(id: string): Promise<boolean>;

  // User preferences operations
  getUserPreferences(): Promise<UserPreferences | undefined>;
  updateUserPreferences(preferences: Partial<InsertUserPreferences>): Promise<UserPreferences>;
}

export class MemStorage implements IStorage {
  private messages: Map<string, Message>;
  private calendarEvents: Map<string, CalendarEvent>;
  private userPreferences: UserPreferences | null;

  constructor() {
    this.messages = new Map();
    this.calendarEvents = new Map();
    this.userPreferences = null;
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = randomUUID();
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async clearMessages(): Promise<void> {
    this.messages.clear();
  }

  // Calendar event operations
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return Array.from(this.calendarEvents.values()).sort(
      (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime()
    );
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    return this.calendarEvents.get(id);
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const id = randomUUID();
    const event: CalendarEvent = {
      ...insertEvent,
      id,
      createdAt: new Date(),
    };
    this.calendarEvents.set(id, event);
    return event;
  }

  async updateCalendarEvent(
    id: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent | undefined> {
    const existing = this.calendarEvents.get(id);
    if (!existing) return undefined;

    // Prevent overwriting protected fields
    const { id: _, createdAt: __, ...safeUpdates } = updates;

    const updated = { ...existing, ...safeUpdates };
    this.calendarEvents.set(id, updated);
    return updated;
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    return this.calendarEvents.delete(id);
  }

  // User preferences operations
  async getUserPreferences(): Promise<UserPreferences | undefined> {
    return this.userPreferences || undefined;
  }

  async updateUserPreferences(updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    if (!this.userPreferences) {
      const id = randomUUID();
      this.userPreferences = {
        id,
        tone: 'friendly',
        autoVoice: false,
        voiceSpeed: '1.0',
        preferredMode: 'emotional',
        language: 'auto',
        ...updates,
      };
    } else {
      this.userPreferences = {
        ...this.userPreferences,
        ...updates,
      };
    }
    return this.userPreferences;
  }
}

export const storage = new MemStorage();
