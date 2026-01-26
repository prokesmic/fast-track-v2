import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";

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

  // Authentication is optional for analytics (to track anonymous events)
  let userId: string | null = null;
  const authResult = await authenticate(req as AuthenticatedRequest);
  if (!("error" in authResult)) {
    userId = authResult.user.userId;
  }

  try {
    const { eventName, eventData, platform } = req.body;

    if (!eventName) {
      return res.status(400).json({ error: "eventName is required" });
    }

    // Insert analytics event
    const [event] = await db
      .insert(schema.analyticsEvents)
      .values({
        userId,
        eventName,
        eventData: eventData ? JSON.stringify(eventData) : null,
        platform: platform || null,
      })
      .returning();

    return res.status(201).json({ success: true, eventId: event.id });
  } catch (error) {
    console.error("Analytics track error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
