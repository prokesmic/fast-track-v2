import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "DELETE") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  // Authenticate
  const authResult = await authenticate(req as AuthenticatedRequest);
  if ("error" in authResult) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const userId = authResult.user.userId;
  const fastId = req.query.id as string;

  if (!fastId) {
    return res.status(400).json({ error: "Fast ID is required" });
  }

  try {
    // Delete fast (only if it belongs to user)
    const result = await db
      .delete(schema.fasts)
      .where(and(eq(schema.fasts.id, fastId), eq(schema.fasts.userId, userId)))
      .returning({ id: schema.fasts.id });

    if (result.length === 0) {
      return res.status(404).json({ error: "Fast not found" });
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Delete fast error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
