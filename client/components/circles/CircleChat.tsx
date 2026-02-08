import React, { useRef, useEffect, useState } from "react";
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
import { Feather } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";

import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { useCircleChat, ChatMessage } from "@/hooks/useCircleChat";
import { Spacing, BorderRadius, Colors } from "@/constants/theme";
import { safeHaptics } from "@/lib/platform";

interface Props {
  circleId: string;
}

function MessageBubble({ message, theme, colors }: { message: ChatMessage; theme: any; colors: any }) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  if (message.type === "system") {
    return (
      <View style={styles.systemMessage}>
        <ThemedText type="caption" style={{ color: theme.textTertiary, textAlign: "center" }}>
          {message.content}
        </ThemedText>
      </View>
    );
  }

  const isOwn = message.isOwn;

  return (
    <View style={[styles.messageRow, isOwn && styles.messageRowOwn]}>
      {!isOwn && (
        <View style={[styles.messageAvatar, { backgroundColor: colors.secondary + "20" }]}>
          <Feather name="user" size={16} color={colors.secondary} />
        </View>
      )}
      <View
        style={[
          styles.messageBubble,
          isOwn
            ? { backgroundColor: colors.primary }
            : { backgroundColor: theme.backgroundSecondary },
        ]}
      >
        {!isOwn && (
          <ThemedText type="caption" style={{ color: colors.primary, fontWeight: "600", marginBottom: 2 }}>
            {message.displayName}
          </ThemedText>
        )}
        <ThemedText
          type="body"
          style={{ color: isOwn ? "#FFFFFF" : theme.text }}
        >
          {message.content}
        </ThemedText>
        <ThemedText
          type="caption"
          style={{
            color: isOwn ? "rgba(255,255,255,0.7)" : theme.textTertiary,
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

export function CircleChat({ circleId }: Props) {
  const { t } = useTranslation();
  const { theme, colorScheme } = useTheme();
  const colors = Colors[colorScheme];
  const flatListRef = useRef<FlatList>(null);

  const {
    messages,
    isLoading,
    isSending,
    hasMore,
    sendMessage,
    loadMore,
  } = useCircleChat(circleId);

  const [inputText, setInputText] = useState("");

  const handleSend = async () => {
    const text = inputText.trim();
    if (!text) return;

    setInputText("");
    safeHaptics.impactAsync();

    await sendMessage(text);
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
    >
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MessageBubble message={item} theme={theme} colors={colors} />
        )}
        contentContainerStyle={styles.messageList}
        onEndReached={hasMore ? loadMore : undefined}
        onEndReachedThreshold={0.5}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Feather name="message-circle" size={48} color={theme.textTertiary} />
            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary, marginTop: Spacing.md }}>
              No messages yet
            </ThemedText>
            <ThemedText type="caption" style={{ color: theme.textTertiary }}>
              Start the conversation!
            </ThemedText>
          </View>
        }
      />

      <View style={[styles.inputContainer, { borderTopColor: theme.cardBorder }]}>
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
          placeholder={t("circles.sendMessage")}
          placeholderTextColor={theme.textTertiary}
          multiline
          maxLength={2000}
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
          {isSending ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Feather name="send" size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
  messageList: {
    padding: Spacing.md,
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: Spacing["2xl"],
  },
  systemMessage: {
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    alignItems: "center",
  },
  messageRow: {
    flexDirection: "row",
    marginBottom: Spacing.sm,
    alignItems: "flex-end",
  },
  messageRowOwn: {
    flexDirection: "row-reverse",
  },
  messageAvatar: {
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
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    borderTopWidth: 1,
    gap: Spacing.sm,
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
