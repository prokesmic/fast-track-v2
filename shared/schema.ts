import { sql } from "drizzle-orm";
import {
  pgTable,
  text,
  varchar,
  timestamp,
  bigint,
  integer,
  boolean,
  real,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table - authentication
export const users = pgTable("users", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  password: text("password").notNull(), // bcrypt hashed
  createdAt: timestamp("created_at").defaultNow(),
});

// Fasts table - user's fasting records
export const fasts = pgTable("fasts", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  startTime: bigint("start_time", { mode: "number" }).notNull(),
  endTime: bigint("end_time", { mode: "number" }),
  targetDuration: integer("target_duration").notNull(),
  planId: text("plan_id").notNull(),
  planName: text("plan_name").notNull(),
  completed: boolean("completed").default(false),
  note: text("note"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Profiles table - user settings and preferences
export const profiles = pgTable("profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id),
  displayName: text("display_name").default(""),
  avatarId: integer("avatar_id").default(0),
  customAvatarUri: text("custom_avatar_uri"),
  weightUnit: text("weight_unit").default("lbs"),
  notificationsEnabled: boolean("notifications_enabled").default(false),
  unlockedBadges: text("unlocked_badges")
    .array()
    .default(sql`'{}'::text[]`),
  // Onboarding fields
  fastingGoal: text("fasting_goal"), // weight_loss, health, longevity
  experienceLevel: text("experience_level"), // beginner, intermediate, advanced
  preferredPlanId: text("preferred_plan_id"),
  onboardingCompleted: boolean("onboarding_completed").default(false),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Weights table - weight tracking entries
export const weights = pgTable("weights", {
  id: varchar("id").primaryKey(),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  weight: real("weight").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Water table - daily water intake
export const water = pgTable("water", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  date: text("date").notNull(),
  cups: integer("cups").default(0),
});

// Analytics events table - for tracking user behavior
export const analyticsEvents = pgTable("analytics_events", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id").references(() => users.id),
  eventName: text("event_name").notNull(),
  eventData: text("event_data"), // JSON string
  platform: text("platform"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Device tokens table - for push notifications
export const deviceTokens = pgTable("device_tokens", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  token: text("token").notNull(),
  platform: text("platform").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Notification settings table - user preferences for notifications
export const notificationSettings = pgTable("notification_settings", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id),
  fastReminder: boolean("fast_reminder").default(true),
  milestoneReached: boolean("milestone_reached").default(true),
  streakAtRisk: boolean("streak_at_risk").default(true),
  dailyMotivation: boolean("daily_motivation").default(true),
  reminderHour: integer("reminder_hour").default(20),
});

// AI insights cache table - cache Claude AI responses
export const aiInsightsCache = pgTable("ai_insights_cache", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  insightType: text("insight_type").notNull(), // recommendation, motivation, pattern, optimization
  content: text("content").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
});

export const insertFastSchema = createInsertSchema(fasts).omit({
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  updatedAt: true,
});

export const insertWeightSchema = createInsertSchema(weights).omit({
  createdAt: true,
});

export const insertWaterSchema = createInsertSchema(water);

export const insertAnalyticsEventSchema = createInsertSchema(analyticsEvents).omit({
  id: true,
  createdAt: true,
});

export const insertDeviceTokenSchema = createInsertSchema(deviceTokens).omit({
  id: true,
  createdAt: true,
});

export const insertNotificationSettingsSchema = createInsertSchema(notificationSettings);

export const insertAiInsightsCacheSchema = createInsertSchema(aiInsightsCache).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Fast = typeof fasts.$inferSelect;
export type InsertFast = z.infer<typeof insertFastSchema>;
export type Profile = typeof profiles.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Weight = typeof weights.$inferSelect;
export type InsertWeight = z.infer<typeof insertWeightSchema>;
export type Water = typeof water.$inferSelect;
export type InsertWater = z.infer<typeof insertWaterSchema>;
export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type InsertAnalyticsEvent = z.infer<typeof insertAnalyticsEventSchema>;
export type DeviceToken = typeof deviceTokens.$inferSelect;
export type InsertDeviceToken = z.infer<typeof insertDeviceTokenSchema>;
export type NotificationSetting = typeof notificationSettings.$inferSelect;
export type InsertNotificationSetting = z.infer<typeof insertNotificationSettingsSchema>;
export type AiInsightsCache = typeof aiInsightsCache.$inferSelect;
export type InsertAiInsightsCache = z.infer<typeof insertAiInsightsCacheSchema>;
