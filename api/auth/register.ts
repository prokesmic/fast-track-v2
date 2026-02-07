import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { hashPassword, generateToken } from "../_lib/auth";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: "Invalid email format" });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    // Check if user already exists
    const existingUser = await db
      .select({ id: schema.users.id })
      .from(schema.users)
      .where(eq(schema.users.email, email.toLowerCase()))
      .limit(1);

    if (existingUser.length > 0) {
      return res.status(409).json({ error: "Email already registered" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const [newUser] = await db
      .insert(schema.users)
      .values({
        email: email.toLowerCase(),
        password: hashedPassword,
      })
      .returning({ id: schema.users.id, email: schema.users.email });

    // Create default profile for user
    await db.insert(schema.profiles).values({
      userId: newUser.id,
    });

    // Generate JWT token
    const token = generateToken({ userId: newUser.id, email: newUser.email });

    return res.status(201).json({
      user: { id: newUser.id, email: newUser.email },
      token,
    });
  } catch (error) {
    console.error("Registration error:", error);
    // Return more detailed error for debugging
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return res.status(500).json({ error: "Internal server error", details: errorMessage });
  }
}
