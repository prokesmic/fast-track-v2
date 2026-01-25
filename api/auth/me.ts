import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";
import { eq } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const authResult = await authenticate(req as AuthenticatedRequest);

    if ("error" in authResult) {
      return res.status(authResult.status).json({ error: authResult.error });
    }

    // Get user with profile
    const users = await db
      .select({
        id: schema.users.id,
        email: schema.users.email,
        createdAt: schema.users.createdAt,
      })
      .from(schema.users)
      .where(eq(schema.users.id, authResult.user.userId))
      .limit(1);

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    // Get profile if exists
    const profiles = await db
      .select()
      .from(schema.profiles)
      .where(eq(schema.profiles.userId, authResult.user.userId))
      .limit(1);

    const profile = profiles.length > 0 ? profiles[0] : null;

    return res.status(200).json({
      user: users[0],
      profile,
    });
  } catch (error) {
    console.error("Get user error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
