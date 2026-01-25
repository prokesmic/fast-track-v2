import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "./_lib/db";
import { authenticate, AuthenticatedRequest } from "./_lib/auth";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Authenticate
  const authResult = await authenticate(req as AuthenticatedRequest);
  if ("error" in authResult) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;

  try {
    if (req.method === "GET") {
      // List all weight entries for user
      const weights = await db
        .select()
        .from(schema.weights)
        .where(eq(schema.weights.userId, userId))
        .orderBy(desc(schema.weights.date));

      return res.status(200).json({ weights });
    }

    if (req.method === "POST") {
      // Create or update weight entry
      const { id, date, weight } = req.body;

      if (!id || !date || weight === undefined) {
        return res.status(400).json({ error: "ID, date, and weight are required" });
      }

      // Check if weight entry exists
      const existingWeight = await db
        .select({ id: schema.weights.id })
        .from(schema.weights)
        .where(eq(schema.weights.id, id))
        .limit(1);

      if (existingWeight.length > 0) {
        // Update existing entry
        const [updatedWeight] = await db
          .update(schema.weights)
          .set({ date, weight })
          .where(eq(schema.weights.id, id))
          .returning();

        return res.status(200).json({ weight: updatedWeight });
      } else {
        // Create new entry
        const [newWeight] = await db
          .insert(schema.weights)
          .values({ id, userId, date, weight })
          .returning();

        return res.status(201).json({ weight: newWeight });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Weights error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
