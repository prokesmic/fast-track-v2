import React, { useState, useEffect } from "react";
import { View, Platform, Modal, StyleSheet, Pressable, TextInput } from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { ThemedText } from "@/components/ThemedText";
import { useTheme } from "@/hooks/useTheme";
import { Colors, BorderRadius, Spacing } from "@/constants/theme";

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

    // Reset tempDate when date prop changes or modal opens
    useEffect(() => {
        if (isVisible) {
            setTempDate(date);
        }
    }, [isVisible, date]);

    // Web implementation
    if (Platform.OS === "web") {
        if (!isVisible) return null;

        const handleDateChange = (dateString: string) => {
            const [year, month, day] = dateString.split("-").map(Number);
            const newDate = new Date(tempDate);
            newDate.setFullYear(year, month - 1, day);
            setTempDate(newDate);
        };

        const handleTimeChange = (timeString: string) => {
            const [hours, minutes] = timeString.split(":").map(Number);
            const newDate = new Date(tempDate);
            newDate.setHours(hours, minutes);
            setTempDate(newDate);
        };

        return (
            <Modal visible={isVisible} transparent animationType="fade">
                <View style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}>
                    <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
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
                            <Pressable onPress={onCancel} style={styles.button}>
                                <ThemedText type="body" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                            </Pressable>
                            <Pressable onPress={() => onConfirm(tempDate)} style={styles.button}>
                                <ThemedText type="body" style={{ color: colors.primary, fontWeight: "600" }}>Confirm</ThemedText>
                            </Pressable>
                        </View>
                    </View>
                </View>
            </Modal>
        );
    }

    if (Platform.OS === "android") {
        // Android handling requires separate calls usually, but let's stick to simple logic first
        // If visible, show picker.
        if (!isVisible) return null;
        return (
            <DateTimePicker
                value={tempDate}
                mode={mode}
                display="default"
                onChange={(event, selectedDate) => {
                    if (event.type === "set" && selectedDate) {
                        onConfirm(selectedDate);
                    } else {
                        onCancel();
                    }
                }}
            />
        );
    }

    // iOS - Modal implementation
    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <View style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}>
                <View style={[styles.modalContent, { backgroundColor: theme.backgroundSecondary }]}>
                    <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                        <ThemedText type="h4">{title}</ThemedText>
                    </View>

                    <View style={styles.pickerContainer}>
                        <DateTimePicker
                            value={tempDate}
                            mode={mode}
                            display="spinner"
                            onChange={(_, selectedDate) => {
                                if (selectedDate) setTempDate(selectedDate);
                            }}
                            textColor={theme.text}
                            themeVariant={colorScheme}
                        />
                    </View>

                    <View style={[styles.footer, { borderTopColor: theme.cardBorder }]}>
                        <Pressable onPress={onCancel} style={styles.button}>
                            <ThemedText type="body" style={{ color: theme.textSecondary }}>Cancel</ThemedText>
                        </Pressable>
                        <Pressable onPress={() => onConfirm(tempDate)} style={styles.button}>
                            <ThemedText type="body" style={{ color: colors.primary, fontWeight: "600" }}>Confirm</ThemedText>
                        </Pressable>
                    </View>
                </View>
            </View>
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
    pickerContainer: {
        height: 200,
        justifyContent: "center",
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
    footer: {
        flexDirection: "row",
        borderTopWidth: StyleSheet.hairlineWidth,
    },
    button: {
        flex: 1,
        padding: Spacing.lg,
        alignItems: "center",
        justifyContent: "center",
    },
});
