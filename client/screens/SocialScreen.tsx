import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { WeeklyChallengeCard } from "@/components/social/WeeklyChallengeCard";
import { CircleCard } from "@/components/circles/CircleCard";
import { CreateCircleModal } from "@/components/circles/CreateCircleModal";
import { JoinCircleModal } from "@/components/circles/JoinCircleModal";
import { useTheme } from "@/hooks/useTheme";
import { useCircles } from "@/hooks/useCircles";
import { useAuth } from "@/context/AuthContext";
import {
  useFriends,
  useChallenges,
  useLeaderboard,
  useFeed,
  useSocialProfile,
} from "@/hooks/useSocial";
import { useWeeklyChallenges } from "@/hooks/useWeeklyChallenges";
import { Spacing, Colors, BorderRadius, Shadows } from "@/constants/theme";
import { safeHaptics, showAlert } from "@/lib/platform";

type TabType = "feed" | "friends" | "challenges" | "circles" | "leaderboard";

type RootStackParamList = {
  CircleDetail: { circleId: string };
  AICoach: undefined;
};

export default function SocialScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { t } = useTranslation();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const { isAuthenticated } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>("feed");
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateCircle, setShowCreateCircle] = useState(false);
  const [showJoinCircle, setShowJoinCircle] = useState(false);

  // Weekly challenge hook
  const { refresh: refreshWeeklyChallenge } = useWeeklyChallenges();

  // Circles hook
  const { circles, isLoading: circlesLoading, refresh: refreshCircles } = useCircles();

  // Hooks
  const { friends, pendingReceived, isLoading: friendsLoading, sendRequest, respondToRequest, refresh: refreshFriends } = useFriends();
  const { challenges, isLoading: challengesLoading, joinChallenge, refresh: refreshChallenges } = useChallenges("active");
  const { leaderboard, userRank, isLoading: leaderboardLoading, refresh: refreshLeaderboard } = useLeaderboard();
  const { posts, isLoading: feedLoading, likePost, unlikePost, refresh: refreshFeed } = useFeed();
  const { profile, updateProfile, searchUsers } = useSocialProfile();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    safeHaptics.impactAsync();
    await refreshWeeklyChallenge();
    if (activeTab === "feed") await refreshFeed();
    else if (activeTab === "friends") await refreshFriends();
    else if (activeTab === "challenges") await refreshChallenges();
    else if (activeTab === "leaderboard") await refreshLeaderboard();
    setRefreshing(false);
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <GradientBackground variant="profile" />
        <View style={[styles.centeredContent, { paddingTop: headerHeight }]}>
          <Feather name="users" size={64} color={theme.textTertiary} />
          <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
            Sign in to access social features
          </ThemedText>
          <ThemedText type="body" style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}>
            Connect with friends, join challenges, and compete on leaderboards.
          </ThemedText>
        </View>
      </View>
    );
  }

  const TAB_CONFIG: { key: TabType; icon: string; label: string }[] = [
    { key: "feed", icon: "rss", label: t("social.feed") },
    { key: "friends", icon: "users", label: t("social.friends") },
    { key: "challenges", icon: "flag", label: t("social.challenges") },
    { key: "circles", icon: "circle", label: t("social.circles") },
    { key: "leaderboard", icon: "award", label: t("social.leaderboard") },
  ];

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {TAB_CONFIG.map(({ key, icon, label }) => (
        <Pressable
          key={key}
          onPress={() => {
            safeHaptics.selectionAsync();
            setActiveTab(key);
          }}
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === key ? colors.primary + "20" : "transparent",
              borderColor: activeTab === key ? colors.primary : "transparent",
            },
          ]}
        >
          <Feather
            name={icon as any}
            size={16}
            color={activeTab === key ? colors.primary : theme.textSecondary}
          />
          <ThemedText
            type="caption"
            style={{
              color: activeTab === key ? colors.primary : theme.textSecondary,
              fontWeight: activeTab === key ? "700" : "500",
            }}
          >
            {label}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  const renderFeed = () => (
    <View style={styles.tabContent}>
      {/* Weekly Challenge Banner */}
      <WeeklyChallengeCard />

      {feedLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : posts.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Feather name="inbox" size={48} color={theme.textTertiary} />
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            {t("social.noPosts")}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
            {t("social.createPostHint")}
          </ThemedText>
        </GlassCard>
      ) : (
        posts.map((post) => (
          <GlassCard key={post.id} style={styles.postCard}>
            <View style={styles.postHeader}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="user" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                  {post.displayName}
                </ThemedText>
                {post.username && (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    @{post.username}
                  </ThemedText>
                )}
              </View>
              <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                {new Date(post.createdAt).toLocaleDateString()}
              </ThemedText>
            </View>

            <View style={styles.postContent}>
              {post.type === "fast_completed" && (
                <View style={styles.achievementBadge}>
                  <Feather name="check-circle" size={24} color={colors.success} />
                  <ThemedText type="bodyMedium">
                    Completed a {post.metadata?.duration || ""}h fast!
                  </ThemedText>
                </View>
              )}
              {post.type === "badge_earned" && (
                <View style={styles.achievementBadge}>
                  <Feather name="award" size={24} color={colors.secondary} />
                  <ThemedText type="bodyMedium">
                    Earned the {post.metadata?.badgeName || "new"} badge!
                  </ThemedText>
                </View>
              )}
              {post.type === "streak_milestone" && (
                <View style={styles.achievementBadge}>
                  <Feather name="zap" size={24} color={colors.accent} />
                  <ThemedText type="bodyMedium">
                    {post.metadata?.streak || ""} day streak!
                  </ThemedText>
                </View>
              )}
              {post.content && (
                <ThemedText type="body" style={{ marginTop: Spacing.sm }}>
                  {post.content}
                </ThemedText>
              )}
            </View>

            <View style={styles.postActions}>
              <Pressable
                onPress={() => post.isLiked ? unlikePost(post.id) : likePost(post.id)}
                style={styles.actionButton}
              >
                <Feather
                  name={post.isLiked ? "heart" : "heart"}
                  size={18}
                  color={post.isLiked ? colors.destructive : theme.textSecondary}
                />
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {post.likesCount}
                </ThemedText>
              </Pressable>
            </View>
          </GlassCard>
        ))
      )}
    </View>
  );

  const renderFriends = () => (
    <View style={styles.tabContent}>
      {/* Add Friend */}
      <GlassCard style={styles.searchCard}>
        <ThemedText type="bodyMedium" style={{ fontWeight: "600", marginBottom: Spacing.sm }}>
          Add Friend
        </ThemedText>
        <View style={styles.searchRow}>
          <TextInput
            style={[
              styles.searchInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundSecondary,
                borderColor: theme.cardBorder,
              },
            ]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Enter username"
            placeholderTextColor={theme.textTertiary}
            autoCapitalize="none"
          />
          <Pressable
            onPress={async () => {
              if (!searchQuery.trim()) return;
              safeHaptics.impactAsync();
              const result = await sendRequest(searchQuery.trim());
              if (result.success) {
                showAlert("Success", "Friend request sent!");
                setSearchQuery("");
              } else {
                showAlert("Error", result.error || "Failed to send request");
              }
            }}
            style={[styles.sendButton, { backgroundColor: colors.primary }]}
          >
            <Feather name="user-plus" size={18} color="#FFFFFF" />
          </Pressable>
        </View>
      </GlassCard>

      {/* Pending Requests */}
      {pendingReceived.length > 0 && (
        <View style={styles.section}>
          <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
            Pending Requests ({pendingReceived.length})
          </ThemedText>
          {pendingReceived.map((request) => (
            <GlassCard key={request.id} style={styles.friendCard}>
              <View style={[styles.avatar, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="user" size={20} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyMedium">{request.displayName}</ThemedText>
                {request.username && (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    @{request.username}
                  </ThemedText>
                )}
              </View>
              <View style={styles.requestActions}>
                <Pressable
                  onPress={() => {
                    safeHaptics.impactAsync();
                    respondToRequest(request.id, "accept");
                  }}
                  style={[styles.acceptButton, { backgroundColor: colors.success }]}
                >
                  <Feather name="check" size={16} color="#FFFFFF" />
                </Pressable>
                <Pressable
                  onPress={() => {
                    safeHaptics.impactAsync();
                    respondToRequest(request.id, "reject");
                  }}
                  style={[styles.rejectButton, { backgroundColor: colors.destructive }]}
                >
                  <Feather name="x" size={16} color="#FFFFFF" />
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </View>
      )}

      {/* Friends List */}
      <View style={styles.section}>
        <ThemedText type="h4" style={{ marginBottom: Spacing.md }}>
          Friends ({friends.length})
        </ThemedText>
        {friendsLoading ? (
          <ActivityIndicator size="small" color={colors.primary} />
        ) : friends.length === 0 ? (
          <GlassCard style={styles.emptyCard}>
            <Feather name="users" size={48} color={theme.textTertiary} />
            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No friends yet
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              Add friends by their username above
            </ThemedText>
          </GlassCard>
        ) : (
          friends.map((friend) => (
            <GlassCard key={friend.id} style={styles.friendCard}>
              <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="user" size={20} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyMedium">{friend.displayName}</ThemedText>
                {friend.username && (
                  <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                    @{friend.username}
                  </ThemedText>
                )}
              </View>
            </GlassCard>
          ))
        )}
      </View>
    </View>
  );

  const renderChallenges = () => (
    <View style={styles.tabContent}>
      {challengesLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : challenges.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Feather name="flag" size={48} color={theme.textTertiary} />
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            No active challenges
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textTertiary }}>
            Create or join a challenge to compete with friends
          </ThemedText>
        </GlassCard>
      ) : (
        challenges.map((challenge) => (
          <GlassCard key={challenge.id} style={styles.challengeCard}>
            <View style={styles.challengeHeader}>
              <View style={[styles.challengeIcon, { backgroundColor: colors.secondary + "20" }]}>
                <Feather name="flag" size={24} color={colors.secondary} />
              </View>
              <View style={{ flex: 1 }}>
                <ThemedText type="bodyMedium" style={{ fontWeight: "700" }}>
                  {challenge.name}
                </ThemedText>
                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                  {challenge.participantCount} participants
                </ThemedText>
              </View>
              {!challenge.isJoined && (
                <Pressable
                  onPress={() => {
                    safeHaptics.impactAsync();
                    joinChallenge(challenge.id);
                  }}
                  style={[styles.joinButton, { backgroundColor: colors.primary }]}
                >
                  <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
                    Join
                  </ThemedText>
                </Pressable>
              )}
            </View>

            {challenge.description && (
              <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: Spacing.sm }}>
                {challenge.description}
              </ThemedText>
            )}

            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    backgroundColor: colors.primary,
                    width: `${Math.min(100, (challenge.userProgress / challenge.targetValue) * 100)}%`,
                  },
                ]}
              />
            </View>

            <View style={styles.challengeStats}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                Progress: {challenge.userProgress}/{challenge.targetValue}
              </ThemedText>
              {challenge.userRank && (
                <ThemedText type="caption" style={{ color: colors.primary }}>
                  Rank #{challenge.userRank}
                </ThemedText>
              )}
            </View>
          </GlassCard>
        ))
      )}
    </View>
  );

  const renderLeaderboard = () => (
    <View style={styles.tabContent}>
      {leaderboardLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : leaderboard.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Feather name="award" size={48} color={theme.textTertiary} />
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            No leaderboard data yet
          </ThemedText>
        </GlassCard>
      ) : (
        <>
          {/* Top 3 Podium */}
          <View style={styles.podium}>
            {leaderboard.slice(0, 3).map((entry, index) => (
              <View
                key={entry.userId}
                style={[
                  styles.podiumEntry,
                  index === 0 && styles.podiumFirst,
                  index === 1 && styles.podiumSecond,
                  index === 2 && styles.podiumThird,
                ]}
              >
                <View
                  style={[
                    styles.podiumAvatar,
                    {
                      backgroundColor:
                        index === 0 ? "#FFD700" + "30" :
                        index === 1 ? "#C0C0C0" + "30" :
                        "#CD7F32" + "30",
                    },
                  ]}
                >
                  <ThemedText type="h3">
                    {index === 0 ? "🥇" : index === 1 ? "🥈" : "🥉"}
                  </ThemedText>
                </View>
                <ThemedText
                  type="caption"
                  style={{ fontWeight: "600", marginTop: Spacing.xs }}
                  numberOfLines={1}
                >
                  {entry.displayName}
                </ThemedText>
                <ThemedText type="caption" style={{ color: colors.primary }}>
                  {entry.value}
                </ThemedText>
              </View>
            ))}
          </View>

          {/* Rest of leaderboard */}
          <GlassCard>
            {leaderboard.slice(3).map((entry) => (
              <View
                key={entry.userId}
                style={[
                  styles.leaderboardRow,
                  entry.isCurrentUser && { backgroundColor: colors.primary + "10" },
                ]}
              >
                <ThemedText type="bodyMedium" style={{ width: 30 }}>
                  #{entry.rank}
                </ThemedText>
                <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="user" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyMedium">
                    {entry.displayName}
                    {entry.isCurrentUser && " (You)"}
                  </ThemedText>
                </View>
                <ThemedText type="bodyMedium" style={{ color: colors.primary, fontWeight: "600" }}>
                  {entry.value}
                </ThemedText>
              </View>
            ))}
          </GlassCard>

          {/* User's rank if not in top */}
          {userRank && !leaderboard.find((e) => e.isCurrentUser) && (
            <GlassCard style={{ marginTop: Spacing.md }}>
              <View style={[styles.leaderboardRow, { backgroundColor: colors.primary + "10" }]}>
                <ThemedText type="bodyMedium" style={{ width: 30 }}>
                  #{userRank.rank}
                </ThemedText>
                <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
                  <Feather name="user" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <ThemedText type="bodyMedium">{userRank.displayName} (You)</ThemedText>
                </View>
                <ThemedText type="bodyMedium" style={{ color: colors.primary, fontWeight: "600" }}>
                  {userRank.value}
                </ThemedText>
              </View>
            </GlassCard>
          )}
        </>
      )}
    </View>
  );

  const renderCircles = () => (
    <View style={styles.tabContent}>
      {/* Action buttons */}
      <View style={styles.circleActions}>
        <Pressable
          onPress={() => {
            safeHaptics.impactAsync();
            setShowCreateCircle(true);
          }}
          style={[styles.circleButton, { backgroundColor: colors.primary }]}
        >
          <Feather name="plus" size={16} color="#FFFFFF" />
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {t("circles.create")}
          </ThemedText>
        </Pressable>
        <Pressable
          onPress={() => {
            safeHaptics.impactAsync();
            setShowJoinCircle(true);
          }}
          style={[styles.circleButton, { backgroundColor: colors.secondary }]}
        >
          <Feather name="log-in" size={16} color="#FFFFFF" />
          <ThemedText type="caption" style={{ color: "#FFFFFF", fontWeight: "600" }}>
            {t("circles.join")}
          </ThemedText>
        </Pressable>
      </View>

      {circlesLoading ? (
        <ActivityIndicator size="large" color={colors.primary} />
      ) : circles.length === 0 ? (
        <GlassCard style={styles.emptyCard}>
          <Feather name="users" size={48} color={theme.textTertiary} />
          <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
            {t("circles.noCircles")}
          </ThemedText>
          <ThemedText type="caption" style={{ color: theme.textTertiary, textAlign: "center" }}>
            {t("circles.createHint")}
          </ThemedText>
        </GlassCard>
      ) : (
        circles.map((circle) => (
          <CircleCard
            key={circle.id}
            circle={circle}
            onPress={() => navigation.navigate("CircleDetail", { circleId: circle.id })}
          />
        ))
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <GradientBackground variant="profile" />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{
          paddingTop: headerHeight + Spacing.md,
          paddingBottom: tabBarHeight + Spacing.xl,
          paddingHorizontal: Spacing.lg,
        }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
      >
        {renderTabs()}

        {activeTab === "feed" && renderFeed()}
        {activeTab === "friends" && renderFriends()}
        {activeTab === "challenges" && renderChallenges()}
        {activeTab === "circles" && renderCircles()}
        {activeTab === "leaderboard" && renderLeaderboard()}
      </ScrollView>

      {/* Circle Modals */}
      <CreateCircleModal
        visible={showCreateCircle}
        onClose={() => setShowCreateCircle(false)}
        onCreated={(circleId) => {
          refreshCircles();
          navigation.navigate("CircleDetail", { circleId });
        }}
      />
      <JoinCircleModal
        visible={showJoinCircle}
        onClose={() => setShowJoinCircle(false)}
        onJoined={(circleId) => {
          refreshCircles();
          navigation.navigate("CircleDetail", { circleId });
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  centeredContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  tabContainer: {
    flexDirection: "row",
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  tabContent: {
    gap: Spacing.md,
  },
  emptyCard: {
    alignItems: "center",
    padding: Spacing.xl,
  },
  section: {
    marginTop: Spacing.lg,
  },
  searchCard: {
    padding: Spacing.md,
  },
  searchRow: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  friendCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  requestActions: {
    flexDirection: "row",
    gap: Spacing.sm,
  },
  acceptButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  rejectButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
  },
  postCard: {
    padding: Spacing.md,
  },
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  postContent: {
    marginBottom: Spacing.md,
  },
  achievementBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  postActions: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.1)",
    paddingTop: Spacing.sm,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
  },
  challengeCard: {
    padding: Spacing.md,
  },
  challengeHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  joinButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.sm,
  },
  progressBar: {
    height: 8,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderRadius: 4,
    marginTop: Spacing.md,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 4,
  },
  challengeStats: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  podium: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "flex-end",
    marginBottom: Spacing.lg,
    gap: Spacing.sm,
  },
  podiumEntry: {
    alignItems: "center",
    width: 80,
  },
  podiumFirst: {
    // First place (center) - visual positioning handled in component
  },
  podiumSecond: {
    // Second place (left) - visual positioning handled in component
  },
  podiumThird: {
    // Third place (right) - visual positioning handled in component
  },
  podiumAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    padding: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  circleActions: {
    flexDirection: "row",
    gap: Spacing.md,
    marginTop: Spacing.lg,
  },
  circleButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
});
