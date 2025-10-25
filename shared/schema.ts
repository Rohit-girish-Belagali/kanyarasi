import { sql } from "drizzle-orm";
import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User schema for authentication and profiles
export const users = sqliteTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  username: text("username", { length: 50 }).notNull().unique(),
  password: text("password").notNull(), // hashed password
  name: text("name").notNull(),
  age: integer("age"),
  gender: text("gender"), // 'male', 'female', 'other', 'prefer_not_to_say'
  occupation: text("occupation"),
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const insertUserSchema = createInsertSchema(users, {
  username: z.string().min(3).max(50),
  password: z.string().min(6),
  name: z.string().min(1),
  age: z.number().min(1).max(150).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).optional(),
}).omit({
  id: true,
  createdAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Message schema for chat conversations
export const messages = sqliteTable("messages", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'user' or 'assistant'
  content: text("content").notNull(),
  mode: text("mode").notNull(), // 'emotional' or 'secretary'
  timestamp: integer("timestamp", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
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
export const calendarEvents = sqliteTable("calendar_events", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  title: text("title").notNull(),
  description: text("description"),
  startTime: integer("start_time", { mode: 'timestamp' }).notNull(),
  endTime: integer("end_time", { mode: 'timestamp' }),
  priority: text("priority").notNull().$default(() => "medium"), // 'low', 'medium', 'high'
  completed: integer("completed", { mode: 'boolean' }).notNull().$default(() => false),
  category: text("category"), // 'fitness', 'work', 'personal', etc.
  createdAt: integer("created_at", { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

export const insertCalendarEventSchema = createInsertSchema(calendarEvents).omit({
  id: true,
  createdAt: true,
});

export type InsertCalendarEvent = z.infer<typeof insertCalendarEventSchema>;
export type CalendarEvent = typeof calendarEvents.$inferSelect;

// User preferences schema for settings
export const userPreferences = sqliteTable("user_preferences", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  tone: text("tone").notNull().$default(() => "friendly"), // 'friendly', 'motivational', 'formal', 'neutral'
  autoVoice: integer("auto_voice", { mode: 'boolean' }).notNull().$default(() => false),
  voiceSpeed: text("voice_speed").notNull().$default(() => "1.0"), // 0.5 to 2.0
  preferredMode: text("preferred_mode").notNull().$default(() => "emotional"), // 'emotional' or 'secretary'
  language: text("language").notNull().$default(() => "auto"), // 'auto', 'en', 'es', 'fr', etc.
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
