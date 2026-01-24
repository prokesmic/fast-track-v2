import React, { useState } from "react";
import { View, Platform, Modal, StyleSheet, Pressable } from "react-native";
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
