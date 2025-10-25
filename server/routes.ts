import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { generateChatResponse } from "./gemini";
import { synthesizeSpeech } from './elevenlabs';
import { insertMessageSchema, insertCalendarEventSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
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

      // If AI detected a task to create, add it to the calendar
      let createdTask = null;
      if (response.taskToCreate) {
        try {
          createdTask = await storage.createCalendarEvent(response.taskToCreate);
        } catch (error) {
          console.error('Failed to create task:', error);
        }
      }

      res.json({
        message: aiMessage,
        detectedMode: response.detectedMode,
        createdTask,
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
      // Convert string dates to Date objects before validation
      const processedData = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      
      const validatedData = insertCalendarEventSchema.parse(processedData);
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
      
      // Convert string dates to Date objects before validation
      const processedData = {
        ...req.body,
        startTime: req.body.startTime ? new Date(req.body.startTime) : undefined,
        endTime: req.body.endTime ? new Date(req.body.endTime) : undefined,
      };
      
      // Validate update data - only allow specific fields
      const updateSchema = insertCalendarEventSchema.partial();
      
      const validationResult = updateSchema.safeParse(processedData);
      
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
