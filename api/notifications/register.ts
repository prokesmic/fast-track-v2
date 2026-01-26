import type { VercelRequest, VercelResponse } from "@vercel/node";
import { db, schema } from "../_lib/db";
import { authenticate, AuthenticatedRequest } from "../_lib/auth";
import { eq, and } from "drizzle-orm";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, DELETE, OPTIONS");
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
    if (req.method === "POST") {
      const { token, platform } = req.body;

      if (!token || !platform) {
        return res.status(400).json({ error: "token and platform are required" });
      }

      // Check if token already exists for this user
      const existingTokens = await db
        .select()
        .from(schema.deviceTokens)
        .where(
          and(
            eq(schema.deviceTokens.userId, userId),
            eq(schema.deviceTokens.token, token)
          )
        )
        .limit(1);

      if (existingTokens.length > 0) {
        // Update existing token to active
        await db
          .update(schema.deviceTokens)
          .set({ isActive: true })
          .where(eq(schema.deviceTokens.id, existingTokens[0].id));

        return res.status(200).json({ success: true, tokenId: existingTokens[0].id });
      }

      // Deactivate other tokens for this user on the same platform
      await db
        .update(schema.deviceTokens)
        .set({ isActive: false })
        .where(
          and(
            eq(schema.deviceTokens.userId, userId),
            eq(schema.deviceTokens.platform, platform)
          )
        );

      // Insert new token
      const [newToken] = await db
        .insert(schema.deviceTokens)
        .values({
          userId,
          token,
          platform,
          isActive: true,
        })
        .returning();

      return res.status(201).json({ success: true, tokenId: newToken.id });
    }

    if (req.method === "DELETE") {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({ error: "token is required" });
      }

      // Deactivate the token
      await db
        .update(schema.deviceTokens)
        .set({ isActive: false })
        .where(
          and(
            eq(schema.deviceTokens.userId, userId),
            eq(schema.deviceTokens.token, token)
          )
        );

      return res.status(200).json({ success: true });
    }

    return res.status(405).json({ error: "Method not allowed" });
  } catch (error) {
    console.error("Device token error:", error);
    return res.status(500).json({ error: "Internal server error" });
  }
}
