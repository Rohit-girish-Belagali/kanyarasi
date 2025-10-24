import { sql } from "drizzle-orm";
import { pgTable, text, varchar, timestamp, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Message schema for chat conversations
export const messages = pgTable("messages", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  mode: text("mode").notNull(), // 'emotional' or 'secretary'
  timestamp: timestamp("timestamp").notNull().defaultNow(),
});

export const insertMessageSchema = createInsertSchema(messages, {
  mode: z.enum(['emotional', 'secretary']),
}).omit({
  id: true,
  timestamp: true,
});

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// Calendar event schema for goals and tasks
export const calendarEvents = pgTable("calendar_events", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description"),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  priority: text("priority").notNull().default("medium"), // 'low', 'medium', 'high'
  completed: boolean("completed").notNull().default(false),
  category: text("category"), // 'fitness', 'work', 'personal', etc.
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// User preferences schema for settings
export const userPreferences = pgTable("user_preferences", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  tone: text("tone").notNull().default("friendly"), // 'friendly', 'motivational', 'formal', 'neutral'
  autoVoice: boolean("auto_voice").notNull().default(false),
  voiceSpeed: text("voice_speed").notNull().default("1.0"), // 0.5 to 2.0
  preferredMode: text("preferred_mode").notNull().default("emotional"), // 'emotional' or 'secretary'
  language: text("language").notNull().default("auto"), // 'auto', 'en', 'es', 'fr', etc.
});

export const insertUserPreferencesSchema = createInsertSchema(userPreferences).omit({
  id: true,
});

export type InsertUserPreferences = z.infer<typeof insertUserPreferencesSchema>;
export type UserPreferences = typeof userPreferences.$inferSelect;

// Client-side only types for local storage
export interface LocalConversation {
  messages: Message[];
  currentMode: 'emotional' | 'secretary';
}

export interface LocalSettings {
  tone: 'friendly' | 'motivational' | 'formal' | 'neutral';
  autoVoice: boolean;
  voiceSpeed: number;
  preferredMode: 'emotional' | 'secretary';
  language: string;
  isDarkMode: boolean;
}
