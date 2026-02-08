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

// === SOCIAL FEATURES ===

// Friendships table - friend connections between users
export const friendships = pgTable("friendships", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  requesterId: varchar("requester_id")
    .notNull()
    .references(() => users.id),
  addresseeId: varchar("addressee_id")
    .notNull()
    .references(() => users.id),
  status: text("status").notNull().default("pending"), // pending, accepted, rejected, blocked
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Challenges table - group fasting challenges
export const challenges = pgTable("challenges", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // streak, total_hours, longest_fast, most_fasts
  targetValue: integer("target_value").notNull(), // e.g., 7 for 7-day streak
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  isPublic: boolean("is_public").default(true),
  inviteCode: varchar("invite_code").unique(),
  maxParticipants: integer("max_participants").default(100),
  createdAt: timestamp("created_at").defaultNow(),
});

// Challenge participants table - users participating in challenges
export const challengeParticipants = pgTable("challenge_participants", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  challengeId: varchar("challenge_id")
    .notNull()
    .references(() => challenges.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  progress: integer("progress").default(0), // current progress toward target
  rank: integer("rank"), // position on leaderboard
  joinedAt: timestamp("joined_at").defaultNow(),
  completedAt: timestamp("completed_at"), // when they reached the target
});

// Community feed table - shared milestones and achievements
export const communityPosts = pgTable("community_posts", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // fast_completed, badge_earned, streak_milestone, challenge_won
  content: text("content"), // optional message
  metadata: text("metadata"), // JSON with details (fast duration, badge id, etc.)
  visibility: text("visibility").default("friends"), // public, friends, private
  likesCount: integer("likes_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Post likes table - track who liked what
export const postLikes = pgTable("post_likes", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  postId: varchar("post_id")
    .notNull()
    .references(() => communityPosts.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// User search/discovery - store username for finding friends
export const userProfiles = pgTable("user_profiles", {
  userId: varchar("user_id")
    .primaryKey()
    .references(() => users.id),
  username: varchar("username").unique(), // unique username for friend search
  bio: text("bio"),
  isPublic: boolean("is_public").default(true), // allow others to see profile
  showOnLeaderboard: boolean("show_on_leaderboard").default(true),
  language: text("language").default("en"), // user's preferred language
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// === WEEKLY CHALLENGES ===

// Weekly Challenges (auto-generated)
export const weeklyChallenges = pgTable("weekly_challenges", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  weekNumber: integer("week_number").notNull(),
  year: integer("year").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // complete_fasts, total_hours, longest_fast, streak
  targetValue: integer("target_value").notNull(),
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date").notNull(),
  rewardBadgeId: varchar("reward_badge_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Weekly Challenge Participants
export const weeklyChallengeParticipants = pgTable("weekly_challenge_participants", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  weeklyChallengeId: varchar("weekly_challenge_id")
    .notNull()
    .references(() => weeklyChallenges.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  joinedAt: timestamp("joined_at").defaultNow(),
});

// === FASTING CIRCLES ===

// Fasting Circles - small accountability groups
export const fastingCircles = pgTable("fasting_circles", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  creatorId: varchar("creator_id")
    .notNull()
    .references(() => users.id),
  inviteCode: varchar("invite_code").unique().notNull(),
  maxMembers: integer("max_members").default(10),
  isPrivate: boolean("is_private").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Circle Members
export const circleMembers = pgTable("circle_members", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id")
    .notNull()
    .references(() => fastingCircles.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  role: text("role").default("member"), // admin, member
  joinedAt: timestamp("joined_at").defaultNow(),
});

// Circle Messages
export const circleMessages = pgTable("circle_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  circleId: varchar("circle_id")
    .notNull()
    .references(() => fastingCircles.id),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").default("text"), // text, achievement, fast_completed
  content: text("content"),
  metadata: text("metadata"), // JSON string for additional data
  createdAt: timestamp("created_at").defaultNow(),
});

// === AI COACH ===

// AI Conversations
export const aiConversations = pgTable("ai_conversations", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  title: text("title"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// AI Messages
export const aiMessages = pgTable("ai_messages", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  conversationId: varchar("conversation_id")
    .notNull()
    .references(() => aiConversations.id),
  role: text("role").notNull(), // user, assistant
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// === SOCIAL NOTIFICATIONS ===

// Social Notifications
export const socialNotifications = pgTable("social_notifications", {
  id: varchar("id")
    .primaryKey()
    .default(sql`gen_random_uuid()`),
  userId: varchar("user_id")
    .notNull()
    .references(() => users.id),
  type: text("type").notNull(), // circle_message, challenge_update, friend_request, etc.
  title: text("title").notNull(),
  body: text("body"),
  data: text("data"), // JSON string for additional data
  read: boolean("read").default(false),
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

// Social feature schemas
export const insertFriendshipSchema = createInsertSchema(friendships).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChallengeSchema = createInsertSchema(challenges).omit({
  id: true,
  createdAt: true,
});

export const insertChallengeParticipantSchema = createInsertSchema(challengeParticipants).omit({
  id: true,
  joinedAt: true,
});

export const insertCommunityPostSchema = createInsertSchema(communityPosts).omit({
  id: true,
  likesCount: true,
  createdAt: true,
});

export const insertPostLikeSchema = createInsertSchema(postLikes).omit({
  id: true,
  createdAt: true,
});

export const insertUserProfileSchema = createInsertSchema(userProfiles).omit({
  createdAt: true,
  updatedAt: true,
});

// Social feature types
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type Challenge = typeof challenges.$inferSelect;
export type InsertChallenge = z.infer<typeof insertChallengeSchema>;
export type ChallengeParticipant = typeof challengeParticipants.$inferSelect;
export type InsertChallengeParticipant = z.infer<typeof insertChallengeParticipantSchema>;
export type CommunityPost = typeof communityPosts.$inferSelect;
export type InsertCommunityPost = z.infer<typeof insertCommunityPostSchema>;
export type PostLike = typeof postLikes.$inferSelect;
export type InsertPostLike = z.infer<typeof insertPostLikeSchema>;
export type UserProfilePublic = typeof userProfiles.$inferSelect;
export type InsertUserProfile = z.infer<typeof insertUserProfileSchema>;

// Weekly Challenges schemas
export const insertWeeklyChallengeSchema = createInsertSchema(weeklyChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertWeeklyChallengeParticipantSchema = createInsertSchema(weeklyChallengeParticipants).omit({
  id: true,
  joinedAt: true,
});

// Fasting Circles schemas
export const insertFastingCircleSchema = createInsertSchema(fastingCircles).omit({
  id: true,
  createdAt: true,
});

export const insertCircleMemberSchema = createInsertSchema(circleMembers).omit({
  id: true,
  joinedAt: true,
});

export const insertCircleMessageSchema = createInsertSchema(circleMessages).omit({
  id: true,
  createdAt: true,
});

// AI Coach schemas
export const insertAiConversationSchema = createInsertSchema(aiConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAiMessageSchema = createInsertSchema(aiMessages).omit({
  id: true,
  createdAt: true,
});

// Social Notifications schemas
export const insertSocialNotificationSchema = createInsertSchema(socialNotifications).omit({
  id: true,
  createdAt: true,
});

// Weekly Challenges types
export type WeeklyChallenge = typeof weeklyChallenges.$inferSelect;
export type InsertWeeklyChallenge = z.infer<typeof insertWeeklyChallengeSchema>;
export type WeeklyChallengeParticipant = typeof weeklyChallengeParticipants.$inferSelect;
export type InsertWeeklyChallengeParticipant = z.infer<typeof insertWeeklyChallengeParticipantSchema>;

// Fasting Circles types
export type FastingCircle = typeof fastingCircles.$inferSelect;
export type InsertFastingCircle = z.infer<typeof insertFastingCircleSchema>;
export type CircleMember = typeof circleMembers.$inferSelect;
export type InsertCircleMember = z.infer<typeof insertCircleMemberSchema>;
export type CircleMessage = typeof circleMessages.$inferSelect;
export type InsertCircleMessage = z.infer<typeof insertCircleMessageSchema>;

// AI Coach types
export type AiConversation = typeof aiConversations.$inferSelect;
export type InsertAiConversation = z.infer<typeof insertAiConversationSchema>;
export type AiMessage = typeof aiMessages.$inferSelect;
export type InsertAiMessage = z.infer<typeof insertAiMessageSchema>;

// Social Notifications types
export type SocialNotification = typeof socialNotifications.$inferSelect;
export type InsertSocialNotification = z.infer<typeof insertSocialNotificationSchema>;
