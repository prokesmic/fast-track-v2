import React, { useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { Spacing, Colors, BorderRadius } from "@/constants/theme";
import { safeHaptics } from "@/lib/platform";
import {
  FASTING_GUIDES,
  SCIENCE_ARTICLES,
  FAST_BREAK_GUIDES,
  FastingGuide,
  ScienceArticle,
  FastBreakGuide,
} from "@/constants/content";

type TabType = "guides" | "science" | "meals";
type CategoryFilter = "all" | "beginner" | "intermediate" | "advanced";

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const tabBarHeight = useBottomTabBarHeight();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];

  const [activeTab, setActiveTab] = useState<TabType>("guides");
  const [categoryFilter, setCategoryFilter] = useState<CategoryFilter>("all");
  const [selectedGuide, setSelectedGuide] = useState<FastingGuide | null>(null);
  const [selectedArticle, setSelectedArticle] = useState<ScienceArticle | null>(null);
  const [selectedMealGuide, setSelectedMealGuide] = useState<FastBreakGuide | null>(null);

  const filteredGuides =
    categoryFilter === "all"
      ? FASTING_GUIDES
      : FASTING_GUIDES.filter((g) => g.category === categoryFilter);

  const renderTabs = () => (
    <View style={styles.tabContainer}>
      {(["guides", "science", "meals"] as TabType[]).map((tab) => (
        <Pressable
          key={tab}
          onPress={() => {
            safeHaptics.selectionAsync();
            setActiveTab(tab);
          }}
          style={[
            styles.tab,
            {
              backgroundColor: activeTab === tab ? colors.primary + "20" : "transparent",
              borderColor: activeTab === tab ? colors.primary : "transparent",
            },
          ]}
        >
          <Feather
            name={
              tab === "guides" ? "book-open" :
              tab === "science" ? "cpu" : "coffee"
            }
            size={16}
            color={activeTab === tab ? colors.primary : theme.textSecondary}
          />
          <ThemedText
            type="caption"
            style={{
              color: activeTab === tab ? colors.primary : theme.textSecondary,
              fontWeight: activeTab === tab ? "700" : "500",
            }}
          >
            {tab === "guides" ? "Guides" : tab === "science" ? "Science" : "Meal Ideas"}
          </ThemedText>
        </Pressable>
      ))}
    </View>
  );

  const renderCategoryFilters = () => (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={styles.filterScroll}
      contentContainerStyle={styles.filterContainer}
    >
      {(["all", "beginner", "intermediate", "advanced"] as CategoryFilter[]).map((cat) => (
        <Pressable
          key={cat}
          onPress={() => {
            safeHaptics.selectionAsync();
            setCategoryFilter(cat);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor:
                categoryFilter === cat ? colors.primary : theme.backgroundSecondary,
            },
          ]}
        >
          <ThemedText
            type="caption"
            style={{
              color: categoryFilter === cat ? "#FFFFFF" : theme.textSecondary,
              fontWeight: "600",
            }}
          >
            {cat.charAt(0).toUpperCase() + cat.slice(1)}
          </ThemedText>
        </Pressable>
      ))}
    </ScrollView>
  );

  const renderGuides = () => (
    <View style={styles.content}>
      {renderCategoryFilters()}
      {filteredGuides.map((guide) => (
        <Pressable
          key={guide.id}
          onPress={() => {
            safeHaptics.impactAsync();
            setSelectedGuide(guide);
          }}
        >
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: guide.color + "20" }]}>
                <Feather name={guide.icon as any} size={24} color={guide.color} />
              </View>
              <View style={styles.cardMeta}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: guide.color + "15" },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: guide.color, fontWeight: "600", fontSize: 10 }}
                  >
                    {guide.category.toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                  {guide.readTime} min read
                </ThemedText>
              </View>
            </View>
            <ThemedText type="bodyMedium" style={{ fontWeight: "700", marginTop: Spacing.sm }}>
              {guide.title}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {guide.subtitle}
            </ThemedText>
          </GlassCard>
        </Pressable>
      ))}
    </View>
  );

  const renderScience = () => (
    <View style={styles.content}>
      {SCIENCE_ARTICLES.map((article) => (
        <Pressable
          key={article.id}
          onPress={() => {
            safeHaptics.impactAsync();
            setSelectedArticle(article);
          }}
        >
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: article.color + "20" }]}>
                <Feather name={article.icon as any} size={24} color={article.color} />
              </View>
              <View style={styles.cardMeta}>
                <View
                  style={[
                    styles.categoryBadge,
                    { backgroundColor: article.color + "15" },
                  ]}
                >
                  <ThemedText
                    type="caption"
                    style={{ color: article.color, fontWeight: "600", fontSize: 10 }}
                  >
                    {article.category.toUpperCase()}
                  </ThemedText>
                </View>
                <ThemedText type="caption" style={{ color: theme.textTertiary }}>
                  {article.readTime} min read
                </ThemedText>
              </View>
            </View>
            <ThemedText type="bodyMedium" style={{ fontWeight: "700", marginTop: Spacing.sm }}>
              {article.title}
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textSecondary, marginTop: 4 }}>
              {article.summary}
            </ThemedText>
          </GlassCard>
        </Pressable>
      ))}
    </View>
  );

  const renderMeals = () => (
    <View style={styles.content}>
      <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.md }}>
        What to eat when breaking your fast, based on fast duration.
      </ThemedText>
      {FAST_BREAK_GUIDES.map((guide) => (
        <Pressable
          key={guide.fastDurationRange.join("-")}
          onPress={() => {
            safeHaptics.impactAsync();
            setSelectedMealGuide(guide);
          }}
        >
          <GlassCard style={styles.card}>
            <View style={styles.cardHeader}>
              <View style={[styles.cardIcon, { backgroundColor: colors.success + "20" }]}>
                <Feather name="coffee" size={24} color={colors.success} />
              </View>
              <View>
                <ThemedText type="caption" style={{ color: colors.success, fontWeight: "600" }}>
                  {guide.fastDurationRange[0]}-{guide.fastDurationRange[1]} HOURS
                </ThemedText>
              </View>
            </View>
            <ThemedText type="bodyMedium" style={{ fontWeight: "700", marginTop: Spacing.sm }}>
              {guide.title}
            </ThemedText>
            <ThemedText
              type="caption"
              style={{ color: theme.textSecondary, marginTop: 4 }}
              numberOfLines={2}
            >
              {guide.overview}
            </ThemedText>
          </GlassCard>
        </Pressable>
      ))}
    </View>
  );

  // Guide Detail Modal
  const renderGuideModal = () => (
    <Modal
      visible={!!selectedGuide}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedGuide(null)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => setSelectedGuide(null)}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
        >
          {selectedGuide && (
            <>
              <View
                style={[
                  styles.modalIcon,
                  { backgroundColor: selectedGuide.color + "20" },
                ]}
              >
                <Feather
                  name={selectedGuide.icon as any}
                  size={40}
                  color={selectedGuide.color}
                />
              </View>
              <ThemedText type="h2" style={{ textAlign: "center", marginTop: Spacing.md }}>
                {selectedGuide.title}
              </ThemedText>
              <ThemedText
                type="body"
                style={{ textAlign: "center", color: theme.textSecondary, marginTop: Spacing.xs }}
              >
                {selectedGuide.subtitle}
              </ThemedText>

              {selectedGuide.sections.map((section, index) => (
                <View key={index} style={styles.section}>
                  <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
                    {section.title}
                  </ThemedText>
                  <ThemedText type="body" style={{ lineHeight: 24 }}>
                    {section.content}
                  </ThemedText>
                </View>
              ))}

              <View style={styles.tipsSection}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
                  Key Tips
                </ThemedText>
                {selectedGuide.tips.map((tip, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Feather name="check" size={16} color={colors.success} />
                    <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
                      {tip}
                    </ThemedText>
                  </View>
                ))}
              </View>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Article Detail Modal
  const renderArticleModal = () => (
    <Modal
      visible={!!selectedArticle}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedArticle(null)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => setSelectedArticle(null)}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
        >
          {selectedArticle && (
            <>
              <View
                style={[
                  styles.modalIcon,
                  { backgroundColor: selectedArticle.color + "20" },
                ]}
              >
                <Feather
                  name={selectedArticle.icon as any}
                  size={40}
                  color={selectedArticle.color}
                />
              </View>
              <ThemedText type="h2" style={{ textAlign: "center", marginTop: Spacing.md }}>
                {selectedArticle.title}
              </ThemedText>
              <ThemedText
                type="body"
                style={{ textAlign: "center", color: theme.textSecondary, marginTop: Spacing.xs }}
              >
                {selectedArticle.subtitle}
              </ThemedText>

              {selectedArticle.content.map((paragraph, index) => (
                <ThemedText
                  key={index}
                  type="body"
                  style={{ lineHeight: 24, marginTop: Spacing.md }}
                >
                  {paragraph}
                </ThemedText>
              ))}

              {selectedArticle.references && selectedArticle.references.length > 0 && (
                <View style={styles.referencesSection}>
                  <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
                    References
                  </ThemedText>
                  {selectedArticle.references.map((ref, index) => (
                    <ThemedText
                      key={index}
                      type="caption"
                      style={{ color: theme.textSecondary, marginBottom: 4 }}
                    >
                      {index + 1}. {ref}
                    </ThemedText>
                  ))}
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );

  // Meal Guide Detail Modal
  const renderMealModal = () => (
    <Modal
      visible={!!selectedMealGuide}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setSelectedMealGuide(null)}
    >
      <View style={[styles.modalContainer, { backgroundColor: theme.backgroundRoot }]}>
        <View style={styles.modalHeader}>
          <Pressable
            onPress={() => setSelectedMealGuide(null)}
            style={styles.closeButton}
          >
            <Feather name="x" size={24} color={theme.text} />
          </Pressable>
        </View>
        <ScrollView
          style={styles.modalScroll}
          contentContainerStyle={styles.modalContent}
        >
          {selectedMealGuide && (
            <>
              <View
                style={[styles.modalIcon, { backgroundColor: colors.success + "20" }]}
              >
                <Feather name="coffee" size={40} color={colors.success} />
              </View>
              <ThemedText type="h2" style={{ textAlign: "center", marginTop: Spacing.md }}>
                {selectedMealGuide.title}
              </ThemedText>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, marginTop: Spacing.md, lineHeight: 24 }}
              >
                {selectedMealGuide.overview}
              </ThemedText>

              <View style={styles.keyPointsSection}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.sm }}>
                  Key Points
                </ThemedText>
                {selectedMealGuide.keyPoints.map((point, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Feather name="check-circle" size={16} color={colors.success} />
                    <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
                      {point}
                    </ThemedText>
                  </View>
                ))}
              </View>

              <View style={styles.avoidSection}>
                <ThemedText type="h4" style={{ marginBottom: Spacing.sm, color: colors.destructive }}>
                  Avoid
                </ThemedText>
                {selectedMealGuide.avoid.map((item, index) => (
                  <View key={index} style={styles.tipItem}>
                    <Feather name="x-circle" size={16} color={colors.destructive} />
                    <ThemedText type="body" style={{ flex: 1, marginLeft: Spacing.sm }}>
                      {item}
                    </ThemedText>
                  </View>
                ))}
              </View>

              {selectedMealGuide.categories.map((category, catIndex) => (
                <View key={catIndex} style={styles.mealCategory}>
                  <ThemedText type="h4">{category.title}</ThemedText>
                  <ThemedText
                    type="caption"
                    style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}
                  >
                    {category.description}
                  </ThemedText>
                  {category.suggestions.map((suggestion) => (
                    <View
                      key={suggestion.id}
                      style={[styles.suggestionCard, { backgroundColor: theme.backgroundSecondary }]}
                    >
                      <View style={[styles.suggestionIcon, { backgroundColor: suggestion.color + "20" }]}>
                        <Feather name={suggestion.icon as any} size={20} color={suggestion.color} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <ThemedText type="bodyMedium" style={{ fontWeight: "600" }}>
                          {suggestion.name}
                        </ThemedText>
                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                          {suggestion.description}
                        </ThemedText>
                      </View>
                    </View>
                  ))}
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
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
      >
        <ThemedText type="h2" style={{ marginBottom: Spacing.sm }}>
          Learn
        </ThemedText>
        <ThemedText type="body" style={{ color: theme.textSecondary, marginBottom: Spacing.lg }}>
          Master the science and art of fasting
        </ThemedText>

        {renderTabs()}

        {activeTab === "guides" && renderGuides()}
        {activeTab === "science" && renderScience()}
        {activeTab === "meals" && renderMeals()}
      </ScrollView>

      {renderGuideModal()}
      {renderArticleModal()}
      {renderMealModal()}
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
  filterScroll: {
    marginBottom: Spacing.md,
  },
  filterContainer: {
    gap: Spacing.sm,
    paddingRight: Spacing.md,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
  },
  content: {
    gap: Spacing.md,
  },
  card: {
    padding: Spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: "center",
    alignItems: "center",
  },
  cardMeta: {
    alignItems: "flex-end",
    gap: 4,
  },
  categoryBadge: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: Spacing.md,
  },
  closeButton: {
    padding: Spacing.sm,
  },
  modalScroll: {
    flex: 1,
  },
  modalContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing["2xl"],
  },
  modalIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
  },
  section: {
    marginTop: Spacing.xl,
  },
  tipsSection: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: "rgba(16, 185, 129, 0.1)",
    borderRadius: BorderRadius.md,
  },
  tipItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: Spacing.sm,
  },
  referencesSection: {
    marginTop: Spacing.xl,
    padding: Spacing.md,
    backgroundColor: "rgba(0, 0, 0, 0.05)",
    borderRadius: BorderRadius.md,
  },
  keyPointsSection: {
    marginTop: Spacing.xl,
  },
  avoidSection: {
    marginTop: Spacing.lg,
  },
  mealCategory: {
    marginTop: Spacing.xl,
  },
  suggestionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
    gap: Spacing.md,
  },
  suggestionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
});
