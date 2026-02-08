import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useHeaderHeight } from "@react-navigation/elements";
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { GlassCard } from "@/components/GlassCard";
import { GradientBackground } from "@/components/GradientBackground";
import { useTheme } from "@/hooks/useTheme";
import { useAICoach, AIMessage } from "@/hooks/useAICoach";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { safeHaptics } from "@/lib/platform";

function MessageBubble({
  message,
  theme,
  colors,
}: {
  message: AIMessage;
  theme: any;
  colors: any;
}) {
  const isUser = message.role === "user";

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <View style={[styles.messageRow, isUser && styles.messageRowUser]}>
      {!isUser && (
        <View style={[styles.assistantAvatar, { backgroundColor: colors.primary + "20" }]}>
          <Feather name="cpu" size={16} color={colors.primary} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isUser
            ? { backgroundColor: colors.primary }
            : { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        <ThemedText type="body" style={{ color: isUser ? "#FFFFFF" : theme.text }}>
          {message.content}
        </ThemedText>
        <ThemedText
          type="caption"
          style={{
            color: isUser ? "rgba(255,255,255,0.7)" : theme.textTertiary,
            textAlign: "right",
            marginTop: 4,
          }}
        >
          {formatTime(message.createdAt)}
        </ThemedText>
      </View>
    </View>
  );
}

function QuickQuestions({
  questions,
  onSelect,
  theme,
  colors,
}: {
  questions: string[];
  onSelect: (question: string) => void;
  theme: any;
  colors: any;
}) {
  const { t } = useTranslation();

  if (questions.length === 0) return null;

  return (
    <View style={styles.quickQuestionsContainer}>
      <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.sm }}>
        {t("aiCoach.quickQuestions")}
      </ThemedText>
      <View style={styles.quickQuestionsGrid}>
        {questions.map((question, index) => (
          <Pressable
            key={index}
            onPress={() => {
              safeHaptics.selectionAsync();
              onSelect(question);
            }}
            style={[
              styles.quickQuestionChip,
              { backgroundColor: colors.primary + "15", borderColor: colors.primary + "30" },
            ]}
          >
            <ThemedText type="caption" style={{ color: colors.primary }}>
              {question}
            </ThemedText>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

export default function AICoachScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const headerHeight = useHeaderHeight();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    quickQuestions,
    isLoading,
    isSending,
    sendMessage,
    startNewConversation,
  } = useAICoach();

  const [inputText, setInputText] = useState("");

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    safeHaptics.impactAsync();

    await sendMessage(text);
  };

  const handleQuickQuestion = async (question: string) => {
    await sendMessage(question);
  };

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages.length]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <GradientBackground variant="profile" />
        <View style={[styles.loadingContainer, { paddingTop: headerHeight }]}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <GradientBackground variant="profile" />

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={headerHeight}
      >
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MessageBubble message={item} theme={theme} colors={colors} />
          )}
          contentContainerStyle={[
            styles.messageList,
            { paddingTop: headerHeight + Spacing.md },
          ]}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={[styles.coachAvatar, { backgroundColor: colors.primary + "20" }]}>
                <Feather name="cpu" size={48} color={colors.primary} />
              </View>
              <ThemedText type="h3" style={{ marginTop: Spacing.lg }}>
                {t("aiCoach.title")}
              </ThemedText>
              <ThemedText
                type="body"
                style={{ color: theme.textSecondary, textAlign: "center", marginTop: Spacing.sm }}
              >
                {t("aiCoach.greeting")}
              </ThemedText>

              <QuickQuestions
                questions={quickQuestions}
                onSelect={handleQuickQuestion}
                theme={theme}
                colors={colors}
              />
            </View>
          }
          ListFooterComponent={
            messages.length > 0 ? (
              <QuickQuestions
                questions={quickQuestions}
                onSelect={handleQuickQuestion}
                theme={theme}
                colors={colors}
              />
            ) : null
          }
        />

        {/* Typing indicator */}
        {isSending && (
          <View style={styles.typingIndicator}>
            <View style={[styles.assistantAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Feather name="cpu" size={12} color={colors.primary} />
            </View>
            <View style={[styles.typingBubble, { backgroundColor: theme.backgroundSecondary }]}>
              <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                {t("aiCoach.thinking")}
              </ThemedText>
              <ActivityIndicator size="small" color={colors.primary} style={{ marginLeft: Spacing.sm }} />
            </View>
          </View>
        )}

        {/* Input area */}
        <View
          style={[
            styles.inputContainer,
            {
              borderTopColor: theme.cardBorder,
              paddingBottom: insets.bottom + Spacing.sm,
            },
          ]}
        >
          <Pressable
            onPress={() => {
              safeHaptics.impactAsync();
              startNewConversation();
            }}
            style={[styles.newChatButton, { backgroundColor: theme.backgroundSecondary }]}
          >
            <Feather name="plus" size={20} color={theme.textSecondary} />
          </Pressable>

          <TextInput
            style={[
              styles.textInput,
              {
                color: theme.text,
                backgroundColor: theme.backgroundSecondary,
              },
            ]}
            value={inputText}
            onChangeText={setInputText}
            placeholder={t("aiCoach.placeholder")}
            placeholderTextColor={theme.textTertiary}
            multiline
            maxLength={2000}
            editable={!isSending}
          />

          <Pressable
            onPress={handleSend}
            disabled={isSending || !inputText.trim()}
            style={[
              styles.sendButton,
              {
                backgroundColor: colors.primary,
                opacity: isSending || !inputText.trim() ? 0.5 : 1,
              },
            ]}
          >
            <Feather name="send" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  keyboardContainer: {
    flex: 1,
  },
  messageList: {
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
    paddingHorizontal: Spacing.xl,
  },
  coachAvatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    alignItems: "flex-end",
  },
  messageRowUser: {
    flexDirection: "row-reverse",
  },
  assistantAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginRight: Spacing.xs,
  },
  messageBubble: {
    maxWidth: "75%",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
  },
  quickQuestionsContainer: {
    paddingTop: Spacing.xl,
    paddingHorizontal: Spacing.md,
  },
  quickQuestionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  quickQuestionChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  newChatButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    maxHeight: 100,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
});
