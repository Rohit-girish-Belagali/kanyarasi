import { 
  type Message, 
  type InsertMessage,
  type CalendarEvent,
  type InsertCalendarEvent,
  type UserPreferences,
  type InsertUserPreferences,
  type User,
  type InsertUser,
  users,
  messages,
  calendarEvents,
  userPreferences
} from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import { randomUUID } from "crypto";

export interface IStorage {
  // User operations
  getUsers(): Promise<User[]>;
  getUserById(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Message operations
  getMessages(): Promise<Message[]>;
  getMessagesByUserId(userId: string): Promise<Message[]>;
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
  private users: Map<string, User>;
  private messages: Map<string, Message>;
  private calendarEvents: Map<string, CalendarEvent>;
  private userPreferences: UserPreferences | null;

  constructor() {
    this.users = new Map();
    this.messages = new Map();
    this.calendarEvents = new Map();
    this.userPreferences = null;
  }

  // User operations
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async getUserById(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = {
      ...insertUser,
      id,
      createdAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return Array.from(this.messages.values()).sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }

  async getMessagesByUserId(userId: string): Promise<Message[]> {
    return Array.from(this.messages.values())
      .filter(m => m.userId === userId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
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

// Export database storage for production, or use MemStorage for testing
export { storage } from './db-storage';
// export const storage = new MemStorage(); // Uncomment for in-memory testing
