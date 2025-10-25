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
import type { IStorage } from "./storage";

export class DbStorage implements IStorage {
  // User operations
  async getUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getUserById(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Message operations
  async getMessages(): Promise<Message[]> {
    return await db.select().from(messages).orderBy(messages.timestamp);
  }

  async getMessagesByUserId(userId: string): Promise<Message[]> {
    return await db.select().from(messages)
      .where(eq(messages.userId, userId))
      .orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const result = await db.insert(messages).values(insertMessage).returning();
    return result[0];
  }

  async clearMessages(): Promise<void> {
    await db.delete(messages);
  }

  // Calendar event operations
  async getCalendarEvents(): Promise<CalendarEvent[]> {
    return await db.select().from(calendarEvents).orderBy(calendarEvents.startTime);
  }

  async getCalendarEvent(id: string): Promise<CalendarEvent | undefined> {
    const result = await db.select().from(calendarEvents).where(eq(calendarEvents.id, id));
    return result[0];
  }

  async createCalendarEvent(insertEvent: InsertCalendarEvent): Promise<CalendarEvent> {
    const result = await db.insert(calendarEvents).values(insertEvent).returning();
    return result[0];
  }

  async updateCalendarEvent(
    id: string,
    updates: Partial<CalendarEvent>
  ): Promise<CalendarEvent | undefined> {
    const result = await db.update(calendarEvents)
      .set(updates)
      .where(eq(calendarEvents.id, id))
      .returning();
    return result[0];
  }

  async deleteCalendarEvent(id: string): Promise<boolean> {
    const result = await db.delete(calendarEvents).where(eq(calendarEvents.id, id));
    return result.changes > 0;
  }

  // User preferences operations
  async getUserPreferences(): Promise<UserPreferences | undefined> {
    const result = await db.select().from(userPreferences).limit(1);
    return result[0];
  }

  async updateUserPreferences(updates: Partial<InsertUserPreferences>): Promise<UserPreferences> {
    const existing = await this.getUserPreferences();
    
    if (!existing) {
      const result = await db.insert(userPreferences).values(updates as InsertUserPreferences).returning();
      return result[0];
    } else {
      const result = await db.update(userPreferences)
        .set(updates)
        .where(eq(userPreferences.id, existing.id))
        .returning();
      return result[0];
    }
  }
}

export const storage = new DbStorage();
