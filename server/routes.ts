import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./gemini";
import { synthesizeSpeech } from './elevenlabs';
import { insertMessageSchema, insertCalendarEventSchema, insertUserSchema } from "@shared/schema";
import { createUser, authenticateUser, checkUsernameExists } from "./auth";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth endpoints
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const userValidation = insertUserSchema.safeParse(req.body);
      
      if (!userValidation.success) {
        return res.status(400).json({ 
          error: "Invalid user data",
          details: userValidation.error.errors
        });
      }
      
      // Check if username already exists
      const exists = await checkUsernameExists(userValidation.data.username);
      if (exists) {
        return res.status(409).json({ error: "Username already exists" });
      }
      
      const user = await createUser(userValidation.data);
      
      // Don't send password back
      const { password, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ error: "Failed to create user" });
    }
  });
  
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ error: "Username and password required" });
      }
      
      const user = await authenticateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }
      
      // Don't send password back
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });
  
  app.post("/api/auth/check-username", async (req, res) => {
    try {
      const { username } = req.body;
      
      if (!username) {
        return res.status(400).json({ error: "Username required" });
      }
      
      const exists = await checkUsernameExists(username);
      res.json({ exists });
    } catch (error) {
      console.error("Check username error:", error);
      res.status(500).json({ error: "Failed to check username" });
    }
  });

  // Chat endpoint - POST /api/chat
  app.post("/api/chat", async (req, res) => {
    try {
      // Validate message content and mode
      const messageValidation = insertMessageSchema.safeParse({
        role: 'user',
        content: req.body.content,
        mode: req.body.mode,
      });

      if (!messageValidation.success) {
        return res.status(400).json({ 
          error: "Invalid request data",
          details: messageValidation.error.errors
        });
      }

      // Validate tone parameter
      const toneSchema = z.enum(['friendly', 'motivational', 'formal', 'neutral']);
      const toneValidation = toneSchema.safeParse(req.body.tone);

      if (!toneValidation.success) {
        return res.status(400).json({ 
          error: "Invalid tone. Must be one of: friendly, motivational, formal, neutral" 
        });
      }

      const { content, mode } = messageValidation.data;
      const tone = toneValidation.data;

      // Save user message to storage FIRST
      await storage.createMessage({
        role: 'user',
        content,
        mode,
      });

      // Get conversation history for context (last 10 messages including the one we just saved)
      const messages = await storage.getMessages();
      const recentMessages = messages.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Get calendar events for context
      const calendarEvents = await storage.getCalendarEvents();

      // Generate AI response
      const response = await generateChatResponse({
        content,
        mode,
        tone,
        conversationHistory: recentMessages,
        calendarEvents,
      });

      // Save AI response to storage
      const aiMessage = await storage.createMessage({
        role: 'assistant',
        content: response.message,
        mode: response.detectedMode || mode,
      });

      res.json({
        message: aiMessage,
        detectedMode: response.detectedMode,
      });
    } catch (error) {
      console.error('Chat error:', error);
      res.status(500).json({ 
        error: "Failed to generate response" 
      });
    }
  });

  // Calendar endpoints
  
  // GET /api/calendar - Get all calendar events
  app.get("/api/calendar", async (req, res) => {
    try {
      const events = await storage.getCalendarEvents();
      res.json(events);
    } catch (error) {
      console.error('Get calendar events error:', error);
      res.status(500).json({ error: "Failed to retrieve calendar events" });
    }
  });

  // POST /api/calendar - Create new calendar event
  app.post("/api/calendar", async (req, res) => {
    try {
      const validatedData = insertCalendarEventSchema.parse(req.body);
      const event = await storage.createCalendarEvent(validatedData);
      res.status(201).json(event);
    } catch (error: any) {
      console.error('Create calendar event error:', error);
      res.status(400).json({ 
        error: "Invalid event data",
        details: error.errors || error.message
      });
    }
  });

  // PATCH /api/calendar/:id - Update calendar event
  app.patch("/api/calendar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      
      // Validate update data - only allow specific fields
      const updateSchema = insertCalendarEventSchema.partial();
      
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          error: "Invalid update data",
          details: validationResult.error.errors
        });
      }
      
      const updates = validationResult.data;
      const updatedEvent = await storage.updateCalendarEvent(id, updates);
      
      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error('Update calendar event error:', error);
      res.status(500).json({ error: "Failed to update event" });
    }
  });

  // TTS endpoint - POST /api/tts
  app.post("/api/tts", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }

      const audioStream = await synthesizeSpeech(text);

      if (audioStream) {
        res.setHeader('Content-Type', 'audio/mpeg');
        audioStream.pipe(res);
      } else {
        res.status(500).json({ error: 'Failed to synthesize speech' });
      }
    } catch (error) {
      console.error('TTS error:', error);
      res.status(500).json({ error: 'Failed to synthesize speech' });
    }
  });

  // DELETE /api/calendar/:id - Delete calendar event
  app.delete("/api/calendar/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const deleted = await storage.deleteCalendarEvent(id);
      
      if (!deleted) {
        return res.status(404).json({ error: "Event not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error('Delete calendar event error:', error);
      res.status(500).json({ error: "Failed to delete event" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
