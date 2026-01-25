import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";
import { eq, desc } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, OPTIONS");
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
      // List all fasts for user
      const fasts = await db
        .select()
        .from(schema.fasts)
        .where(eq(schema.fasts.userId, userId))
        .orderBy(desc(schema.fasts.startTime));

      return res.status(200).json({ fasts });
    }

    if (req.method === "POST" || req.method === "PUT") {
      // Create or update fast
      const fastData = req.body;

      if (!fastData.id) {
        return res.status(400).json({ error: "Fast ID is required" });
      }

      // Check if fast exists
      const existingFast = await db
        .select({ id: schema.fasts.id })
        .from(schema.fasts)
        .where(eq(schema.fasts.id, fastData.id))
        .limit(1);

      if (existingFast.length > 0) {
        // Update existing fast
        const [updatedFast] = await db
          .update(schema.fasts)
          .set({
            startTime: fastData.startTime,
            endTime: fastData.endTime,
            targetDuration: fastData.targetDuration,
            planId: fastData.planId,
            planName: fastData.planName,
            completed: fastData.completed,
            note: fastData.note,
            updatedAt: new Date(),
          })
          .where(eq(schema.fasts.id, fastData.id))
          .returning();

        return res.status(200).json({ fast: updatedFast });
      } else {
        // Create new fast
        const [newFast] = await db
          .insert(schema.fasts)
          .values({
            id: fastData.id,
            userId,
            startTime: fastData.startTime,
            endTime: fastData.endTime,
            targetDuration: fastData.targetDuration,
            planId: fastData.planId,
            planName: fastData.planName,
            completed: fastData.completed ?? false,
            note: fastData.note,
          })
          .returning();

        return res.status(201).json({ fast: newFast });
      }
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Fasts error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
