import React, { useState, useEffect } from "react";
import { View, Platform, Modal, StyleSheet, Pressable, TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Spacing, Shadows } from "@/constants/theme";

interface DateTimePickerProps {
    isVisible: boolean;
    date: Date;
    onConfirm: (date: Date) => void;
    onCancel: () => void;
    title?: string;
    mode?: "date" | "time" | "datetime";
}

function formatDateForInput(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

function formatTimeForInput(date: Date): string {
    const hours = String(date.getHours()).padStart(2, "0");
    const minutes = String(date.getMinutes()).padStart(2, "0");
    return `${hours}:${minutes}`;
}

function formatDateDisplay(date: Date): string {
    return date.toLocaleDateString([], {
        weekday: "short",
        month: "short",
        day: "numeric",
        year: "numeric",
    });
}

function formatTimeDisplay(date: Date): string {
    return date.toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
    });
}

export function CustomDateTimePicker({
    isVisible,
    date,
    onConfirm,
    onCancel,
    title = "Select Date & Time",
    mode = "datetime",
}: DateTimePickerProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const [tempDate, setTempDate] = useState(date);
    const [activeTab, setActiveTab] = useState<"date" | "time">("date");

    // Android-specific state for sequential picker
    const [androidPickerMode, setAndroidPickerMode] = useState<"date" | "time" | null>(null);

    // Reset tempDate when date prop changes or modal opens
    useEffect(() => {
        if (isVisible) {
            setTempDate(date);
            setActiveTab("date");
            setAndroidPickerMode(null);
        }
    }, [isVisible, date]);

    // Web implementation
    if (Platform.OS === "web") {
        if (!isVisible) return null;

        const handleDateChange = (dateString: string) => {
            if (!dateString) return;
            const [year, month, day] = dateString.split("-").map(Number);
            const newDate = new Date(tempDate);
            newDate.setFullYear(year, month - 1, day);
            setTempDate(newDate);
        };

        const handleTimeChange = (timeString: string) => {
            if (!timeString) return;
            const [hours, minutes] = timeString.split(":").map(Number);
            const newDate = new Date(tempDate);
            newDate.setHours(hours, minutes);
            setTempDate(newDate);
        };

        return (
            <Modal visible={isVisible} transparent animationType="fade">
                <Pressable style={[styles.modalOverlay, { backgroundColor: "#00000080" }]} onPress={onCancel}>
                    <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]} onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                            <ThemedText type="h4">{title}</ThemedText>
                        </View>

                        <View style={styles.webPickerContainer}>
                            {(mode === "date" || mode === "datetime") && (
                                <View style={styles.webInputGroup}>
                                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                                        Date
                                    </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.webInput,
                                            {
                                                backgroundColor: theme.backgroundDefault,
                                                color: theme.text,
                                                borderColor: theme.cardBorder,
                                            },
                                        ]}
                                        value={formatDateForInput(tempDate)}
                                        onChange={(e: any) => handleDateChange(e.target.value)}
                                        // @ts-ignore - web-specific prop
                                        type="date"
                                    />
                                </View>
                            )}
                            {(mode === "time" || mode === "datetime") && (
                                <View style={styles.webInputGroup}>
                                    <ThemedText type="caption" style={{ color: theme.textSecondary, marginBottom: Spacing.xs }}>
                                        Time
                                    </ThemedText>
                                    <TextInput
                                        style={[
                                            styles.webInput,
                                            {
                                                backgroundColor: theme.backgroundDefault,
                                                color: theme.text,
                                                borderColor: theme.cardBorder,
                                            },
                                        ]}
                                        value={formatTimeForInput(tempDate)}
                                        onChange={(e: any) => handleTimeChange(e.target.value)}
                                        // @ts-ignore - web-specific prop
                                        type="time"
                                    />
                                </View>
                            )}
                        </View>

                        <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
                            <Pressable onPress={onCancel} style={styles.footerButton}>
                                <ThemedText type="body" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                            </Pressable>
                            <Pressable onPress={() => onConfirm(tempDate)} style={styles.footerButton}>
                                <ThemedText type="body" style={{ color: colors.primary, fontWeight: "600" }}>Confirm</ThemedText>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    }

    // Android - Sequential date then time picker
    if (Platform.OS === "android") {
        if (!isVisible) return null;

        // Show native Android picker
        if (androidPickerMode) {
            return (
                <DateTimePicker
                    value={tempDate}
                    mode={androidPickerMode}
                    display="default"
                    onChange={(event, selectedDate) => {
                        if (event.type === "dismissed") {
                            setAndroidPickerMode(null);
                            return;
                        }
                        if (event.type === "set" && selectedDate) {
                            setTempDate(selectedDate);
                            if (androidPickerMode === "date" && mode === "datetime") {
                                // After date, show time picker
                                setAndroidPickerMode("time");
                            } else {
                                // Done - confirm and close
                                setAndroidPickerMode(null);
                                onConfirm(selectedDate);
                            }
                        }
                    }}
                />
            );
        }

        // Show selection UI
        return (
            <Modal visible={isVisible} transparent animationType="fade">
                <Pressable style={[styles.modalOverlay, { backgroundColor: "#00000080" }]} onPress={onCancel}>
                    <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]} onPress={(e) => e.stopPropagation()}>
                        <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                            <ThemedText type="h4">{title}</ThemedText>
                        </View>

                        <View style={styles.androidContainer}>
                            {(mode === "date" || mode === "datetime") && (
                                <Pressable
                                    style={[styles.androidButton, { backgroundColor: theme.backgroundTertiary }]}
                                    onPress={() => setAndroidPickerMode("date")}
                                >
                                    <View style={[styles.androidIconContainer, { backgroundColor: colors.primary + "20" }]}>
                                        <Feather name="calendar" size={20} color={colors.primary} />
                                    </View>
                                    <View style={styles.androidButtonText}>
                                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>Date</ThemedText>
                                        <ThemedText type="bodyMedium">{formatDateDisplay(tempDate)}</ThemedText>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={theme.textTertiary} />
                                </Pressable>
                            )}

                            {(mode === "time" || mode === "datetime") && (
                                <Pressable
                                    style={[styles.androidButton, { backgroundColor: theme.backgroundTertiary }]}
                                    onPress={() => setAndroidPickerMode("time")}
                                >
                                    <View style={[styles.androidIconContainer, { backgroundColor: colors.secondary + "20" }]}>
                                        <Feather name="clock" size={20} color={colors.secondary} />
                                    </View>
                                    <View style={styles.androidButtonText}>
                                        <ThemedText type="caption" style={{ color: theme.textSecondary }}>Time</ThemedText>
                                        <ThemedText type="bodyMedium">{formatTimeDisplay(tempDate)}</ThemedText>
                                    </View>
                                    <Feather name="chevron-right" size={20} color={theme.textTertiary} />
                                </Pressable>
                            )}
                        </View>

                        <View style={styles.androidFooter}>
                            <Pressable
                                onPress={onCancel}
                                style={[styles.androidCancelButton, { backgroundColor: theme.backgroundTertiary }]}
                            >
                                <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                            </Pressable>
                            <Pressable
                                onPress={() => onConfirm(tempDate)}
                                style={[styles.androidConfirmButton, { backgroundColor: colors.primary }, Shadows.coloredLg(colors.primary)]}
                            >
                                <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>Confirm</ThemedText>
                            </Pressable>
                        </View>
                    </Pressable>
                </Pressable>
            </Modal>
        );
    }

    // iOS - Tabbed date/time picker
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <Pressable style={[styles.modalOverlay, { backgroundColor: "#00000080" }]} onPress={onCancel}>
                <Pressable style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]} onPress={(e) => e.stopPropagation()}>
                    <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                        <ThemedText type="h4">{title}</ThemedText>
                    </View>

                    {mode === "datetime" && (
                        <View style={[styles.tabContainer, { backgroundColor: theme.backgroundTertiary }]}>
                            <Pressable
                                style={[
                                    styles.tab,
                                    activeTab === "date" && { backgroundColor: theme.backgroundSecondary },
                                ]}
                                onPress={() => setActiveTab("date")}
                            >
                                <Feather
                                    name="calendar"
                                    size={16}
                                    color={activeTab === "date" ? colors.primary : theme.textSecondary}
                                />
                                <ThemedText
                                    type="bodyMedium"
                                    style={{ color: activeTab === "date" ? colors.primary : theme.textSecondary }}
                                >
                                    Date
                                </ThemedText>
                            </Pressable>
                            <Pressable
                                style={[
                                    styles.tab,
                                    activeTab === "time" && { backgroundColor: theme.backgroundSecondary },
                                ]}
                                onPress={() => setActiveTab("time")}
                            >
                                <Feather
                                    name="clock"
                                    size={16}
                                    color={activeTab === "time" ? colors.primary : theme.textSecondary}
                                />
                                <ThemedText
                                    type="bodyMedium"
                                    style={{ color: activeTab === "time" ? colors.primary : theme.textSecondary }}
                                >
                                    Time
                                </ThemedText>
                            </Pressable>
                        </View>
                    )}

                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            value={tempDate}
                            mode={mode === "datetime" ? activeTab : mode}
                            display="spinner"
                            onChange={(_, selectedDate) => {
                                if (selectedDate) setTempDate(selectedDate);
                            }}
                            textColor={theme.text}
                            themeVariant={colorScheme}
                        />
                    </View>

                    {/* Preview of selected datetime */}
                    {mode === "datetime" && (
                        <View style={[styles.previewContainer, { backgroundColor: theme.backgroundTertiary }]}>
                            <ThemedText type="caption" style={{ color: theme.textSecondary }}>Selected:</ThemedText>
                            <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                                {formatDateDisplay(tempDate)} at {formatTimeDisplay(tempDate)}
                            </ThemedText>
                        </View>
                    )}

                    <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
                        <Pressable onPress={onCancel} style={styles.footerButton}>
                            <ThemedText type="body" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                        </Pressable>
                        <Pressable onPress={() => onConfirm(tempDate)} style={styles.footerButton}>
                            <ThemedText type="body" style={{ color: colors.primary, fontWeight: "600" }}>Confirm</ThemedText>
                        </Pressable>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    );
}

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "85%",
        maxWidth: 400,
        borderRadius: BorderRadius.xl,
        overflow: "hidden",
    },
    header: {
        padding: Spacing.lg,
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    tabContainer: {
        flexDirection: "row",
        margin: Spacing.lg,
        marginBottom: 0,
        borderRadius: BorderRadius.md,
        padding: Spacing.xs,
    },
    tab: {
        flex: 1,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: Spacing.sm,
        paddingVertical: Spacing.sm,
        borderRadius: BorderRadius.sm,
    },
    pickerContainer: {
        height: 200,
        justifyContent: "center",
    },
    previewContainer: {
        marginHorizontal: Spacing.lg,
        marginBottom: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: "center",
        gap: Spacing.xs,
    },
    webPickerContainer: {
        padding: Spacing.xl,
        gap: Spacing.lg,
    },
    webInputGroup: {
        width: "100%",
    },
    webInput: {
        width: "100%",
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        borderWidth: 1,
        fontSize: 16,
    },
    androidContainer: {
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    androidButton: {
        flexDirection: "row",
        alignItems: "center",
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        gap: Spacing.md,
    },
    androidIconContainer: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.sm,
        alignItems: "center",
        justifyContent: "center",
    },
    androidButtonText: {
        flex: 1,
        gap: 2,
    },
    androidFooter: {
        flexDirection: "row",
        padding: Spacing.lg,
        paddingTop: Spacing.sm,
        gap: Spacing.md,
    },
    androidCancelButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
    androidConfirmButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
    footer: {
        flexDirection: "row",
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    footerButton: {
        flex: 1,
        padding: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
});
