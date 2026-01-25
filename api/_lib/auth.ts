import { VercelRequest } from "@vercel/node";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { db, schema } from "./db";
import { eq } from "drizzle-orm";

const JWT_SECRET = process.env.JWT_SECRET || "your-secret-key-change-in-production";
const JWT_EXPIRES_IN = "7d";

export interface JWTPayload {
  userId: string;
  email: string;
}

export interface AuthenticatedRequest extends VercelRequest {
  user?: JWTPayload;
}

// Hash password with bcrypt
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

// Verify password
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch {
    return null;
  }
}

// Extract token from Authorization header
export function extractToken(req: VercelRequest): string | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }
  return authHeader.substring(7);
}

// Auth middleware - validates token and attaches user to request
export async function authenticate(
  req: AuthenticatedRequest
): Promise<{ user: JWTPayload } | { error: string; status: number }> {
  const token = extractToken(req);

  if (!token) {
    return { error: "No token provided", status: 401 };
  }

  const payload = verifyToken(token);
  if (!payload) {
    return { error: "Invalid or expired token", status: 401 };
  }

  // Verify user still exists
  const user = await db
    .select({ id: schema.users.id, email: schema.users.email })
    .from(schema.users)
    .where(eq(schema.users.id, payload.userId))
    .limit(1);

  if (user.length === 0) {
    return { error: "User not found", status: 401 };
  }

  req.user = payload;
  return { user: payload };
}

// Helper to get authenticated user or send error response
export async function requireAuth(
  req: AuthenticatedRequest
): Promise<JWTPayload | null> {
  const result = await authenticate(req);
  if ("error" in result) {
    return null;
  }
  return result.user;
}
