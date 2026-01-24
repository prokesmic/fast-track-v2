import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  Pressable,
  Dimensions,
  FlatList,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  useAnimatedStyle,
  withSpring,
  useSharedValue,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { FASTING_STAGES, FastingStage, getStageForDuration } from "@/constants/fastingStages";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const STAGE_ICON_SIZE = 56;

type FastingStagesRouteProp = RouteProp<RootStackParamList, "FastingStages">;

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface StageIconProps {
  stage: FastingStage;
  isActive: boolean;
  isCurrent: boolean;
  onPress: () => void;
}

function StageIcon({ stage, isActive, isCurrent, onPress }: StageIconProps) {
  const { theme } = useTheme();
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <View style={styles.stageIconWrapper}>
      <AnimatedPressable
        onPress={onPress}
        onPressIn={() => {
          scale.value = withSpring(0.9);
        }}
        onPressOut={() => {
          scale.value = withSpring(1);
        }}
        style={[
          styles.stageIcon,
          {
            backgroundColor: isActive ? stage.color + "20" : theme.backgroundSecondary,
            borderWidth: isCurrent ? 3 : 0,
            borderColor: stage.color,
          },
          animatedStyle,
        ]}
      >
        <Feather
          name={stage.icon as any}
          size={24}
          color={isActive ? stage.color : theme.textSecondary}
        />
      </AnimatedPressable>
      {isCurrent ? (
        <View style={[styles.currentDot, { backgroundColor: stage.color }]} />
      ) : null}
    </View>
  );
}

function StageConnector({ isActive }: { isActive: boolean }) {
  const { theme } = useTheme();
  return (
    <View
      style={[
        styles.connector,
        { backgroundColor: isActive ? Colors.light.primary : theme.backgroundTertiary },
      ]}
    />
  );
}

export default function FastingStagesScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<FastingStagesRouteProp>();
  const { theme } = useTheme();
  const hoursElapsed = route.params?.hoursElapsed || 0;
  const currentStage = getStageForDuration(hoursElapsed);

  const [selectedStage, setSelectedStage] = useState<FastingStage>(currentStage);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const index = FASTING_STAGES.findIndex((s) => s.id === currentStage.id);
    if (index >= 0 && flatListRef.current) {
      setTimeout(() => {
        flatListRef.current?.scrollToIndex({
          index,
          animated: true,
          viewPosition: 0.5,
        });
      }, 100);
    }
  }, []);

  const handleStageSelect = (stage: FastingStage) => {
    Haptics.selectionAsync();
    setSelectedStage(stage);
  };

  const renderStageIcon = ({ item, index }: { item: FastingStage; index: number }) => {
    const isActive = hoursElapsed >= item.startHour;
    const isCurrent = item.id === currentStage.id;
    const isSelected = item.id === selectedStage.id;

    return (
      <View style={styles.stageIconContainer}>
        {index > 0 ? <StageConnector isActive={hoursElapsed >= item.startHour} /> : null}
        <StageIcon
          stage={item}
          isActive={isActive || isSelected}
          isCurrent={isCurrent}
          onPress={() => handleStageSelect(item)}
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.backgroundRoot }]}>
      <View style={styles.timelineContainer}>
        <FlatList
          ref={flatListRef}
          data={FASTING_STAGES}
          renderItem={renderStageIcon}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.timelineContent}
          onScrollToIndexFailed={() => { }}
        />
      </View>

      <ScrollView
        style={styles.contentScroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.stageCard, { backgroundColor: theme.backgroundDefault }]}>
          <View style={styles.stageHeader}>
            <View
              style={[
                styles.stageHeaderIcon,
                { backgroundColor: selectedStage.color + "15" },
              ]}
            >
              <Feather
                name={selectedStage.icon as any}
                size={24}
                color={selectedStage.color}
              />
            </View>
            <View style={styles.stageHeaderText}>
              <ThemedText type="h3">{selectedStage.name}</ThemedText>
              <ThemedText type="small" style={{ color: theme.textSecondary }}>
                {selectedStage.timeRange}
              </ThemedText>
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Physiological Changes
            </ThemedText>
            <ThemedText
              type="body"
              style={{ color: theme.textSecondary, lineHeight: 22 }}
            >
              {selectedStage.description}
            </ThemedText>
          </View>

          <View style={styles.section}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              Benefits
            </ThemedText>
            <View style={styles.bulletList}>
              {selectedStage.benefits.map((benefit, index) => (
                <View key={index} style={styles.bulletItem}>
                  <View
                    style={[styles.bulletDot, { backgroundColor: selectedStage.color }]}
                  />
                  <View style={styles.bulletContent}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {benefit.title}:
                    </ThemedText>
                    <ThemedText
                      type="body"
                      style={{ color: theme.textSecondary, marginLeft: 4 }}
                    >
                      {benefit.description}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <ThemedText type="body" style={{ fontWeight: "600" }}>
              What You May Feel
            </ThemedText>
            <View style={styles.bulletList}>
              {selectedStage.feelings.map((feeling, index) => (
                <View key={index} style={styles.bulletItem}>
                  <View
                    style={[styles.bulletDot, { backgroundColor: theme.textSecondary }]}
                  />
                  <View style={styles.bulletContent}>
                    <ThemedText type="body" style={{ fontWeight: "600" }}>
                      {feeling.title}:
                    </ThemedText>
                    <ThemedText
                      type="body"
                      style={{ color: theme.textSecondary, marginLeft: 4 }}
                    >
                      {feeling.description}
                    </ThemedText>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>

        {selectedStage.id === currentStage.id && hoursElapsed > 0 ? (
          <View
            style={[
              styles.currentBadge,
              { backgroundColor: selectedStage.color + "15" },
            ]}
          >
            <Feather name="check-circle" size={16} color={selectedStage.color} />
            <ThemedText
              type="small"
              style={{ color: selectedStage.color, fontWeight: "600" }}
            >
              You are currently in this stage
            </ThemedText>
          </View>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  timelineContainer: {
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.05)",
  },
  timelineContent: {
    paddingHorizontal: Spacing.lg,
    alignItems: "center",
  },
  stageIconContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  stageIconWrapper: {
    alignItems: "center",
  },
  stageIcon: {
    width: STAGE_ICON_SIZE,
    height: STAGE_ICON_SIZE,
    borderRadius: STAGE_ICON_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
  },
  currentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  connector: {
    width: 24,
    height: 3,
    borderRadius: 1.5,
    marginHorizontal: 4,
  },
  contentScroll: {
    flex: 1,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  stageCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.xl,
    gap: Spacing.xl,
  },
  stageHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  stageHeaderIcon: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  stageHeaderText: {
    flex: 1,
    gap: 2,
  },
  section: {
    gap: Spacing.sm,
  },
  bulletList: {
    gap: Spacing.md,
  },
  bulletItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 8,
  },
  bulletContent: {
    flex: 1,
    flexDirection: "row",
    flexWrap: "wrap",
  },
  currentBadge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.full,
    alignSelf: "center",
  },
});
