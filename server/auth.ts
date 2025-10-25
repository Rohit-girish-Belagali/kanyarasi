import { storage } from "./storage";
import { type InsertUser, type User } from "@shared/schema";
import crypto from "crypto";

// Simple password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export async function createUser(userData: InsertUser): Promise<User> {
  const hashedPassword = hashPassword(userData.password);
  
  const user = await storage.createUser({
    ...userData,
    password: hashedPassword,
  });
  
  return user;
}

export async function authenticateUser(username: string, password: string): Promise<User | null> {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    return null;
  }
  
  if (!verifyPassword(password, user.password)) {
    return null;
  }
  
  return user;
}

export async function getUserById(userId: string): Promise<User | null> {
  const user = await storage.getUserById(userId);
  return user || null;
}

export async function checkUsernameExists(username: string): Promise<boolean> {
  const user = await storage.getUserByUsername(username);
  return !!user;
}
