import React, { useState, useEffect, useRef } from "react";
import {
    View,
    Modal,
    StyleSheet,
    Pressable,
    ScrollView,
    Dimensions,
} from "react-native";
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

const ITEM_HEIGHT = 44;
const VISIBLE_ITEMS = 5;
const PICKER_HEIGHT = ITEM_HEIGHT * VISIBLE_ITEMS;

const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
];

const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
];

function getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
}

function generateYears(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
        years.push(i);
    }
    return years;
}

function generateDays(year: number, month: number): number[] {
    const daysInMonth = getDaysInMonth(year, month);
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
}

function generateHours(): number[] {
    return Array.from({ length: 12 }, (_, i) => i + 1);
}

function generateMinutes(): number[] {
    return Array.from({ length: 60 }, (_, i) => i);
}

interface WheelPickerProps {
    items: (string | number)[];
    selectedIndex: number;
    onSelect: (index: number) => void;
    width: number;
    formatItem?: (item: string | number) => string;
}

function WheelPicker({ items, selectedIndex, onSelect, width, formatItem }: WheelPickerProps) {
    const { theme, colorScheme } = useTheme();
    const colors = Colors[colorScheme];
    const scrollRef = useRef<ScrollView>(null);
    const [isScrolling, setIsScrolling] = useState(false);

    useEffect(() => {
        if (!isScrolling && scrollRef.current) {
            scrollRef.current.scrollTo({
                y: selectedIndex * ITEM_HEIGHT,
                animated: false,
            });
        }
    }, [selectedIndex, isScrolling]);

    const handleScroll = (event: any) => {
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        if (index >= 0 && index < items.length && index !== selectedIndex) {
            onSelect(index);
        }
    };

    const handleScrollBegin = () => setIsScrolling(true);

    const handleScrollEnd = (event: any) => {
        setIsScrolling(false);
        const y = event.nativeEvent.contentOffset.y;
        const index = Math.round(y / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(index, items.length - 1));

        scrollRef.current?.scrollTo({
            y: clampedIndex * ITEM_HEIGHT,
            animated: true,
        });

        if (clampedIndex !== selectedIndex) {
            onSelect(clampedIndex);
        }
    };

    const padding = (PICKER_HEIGHT - ITEM_HEIGHT) / 2;

    return (
        <View style={[styles.wheelContainer, { width }]}>
            <View
                style={[
                    styles.selectionHighlight,
                    {
                        backgroundColor: colors.primary + "15",
                        top: padding,
                    }
                ]}
                pointerEvents="none"
            />
            <ScrollView
                ref={scrollRef}
                showsVerticalScrollIndicator={false}
                snapToInterval={ITEM_HEIGHT}
                decelerationRate="fast"
                onScroll={handleScroll}
                onScrollBeginDrag={handleScrollBegin}
                onMomentumScrollEnd={handleScrollEnd}
                onScrollEndDrag={handleScrollEnd}
                scrollEventThrottle={16}
                contentContainerStyle={{ paddingVertical: padding }}
            >
                {items.map((item, index) => {
                    const isSelected = index === selectedIndex;
                    const displayText = formatItem ? formatItem(item) : String(item);

                    return (
                        <Pressable
                            key={index}
                            onPress={() => {
                                onSelect(index);
                                scrollRef.current?.scrollTo({
                                    y: index * ITEM_HEIGHT,
                                    animated: true,
                                });
                            }}
                            style={styles.wheelItem}
                        >
                            <ThemedText
                                type={isSelected ? "bodyMedium" : "body"}
                                style={{
                                    color: isSelected ? colors.primary : theme.textSecondary,
                                    fontWeight: isSelected ? "600" : "400",
                                    textAlign: "center",
                                }}
                            >
                                {displayText}
                            </ThemedText>
                        </Pressable>
                    );
                })}
            </ScrollView>
        </View>
    );
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

    const [selectedMonth, setSelectedMonth] = useState(date.getMonth());
    const [selectedDay, setSelectedDay] = useState(date.getDate());
    const [selectedYear, setSelectedYear] = useState(date.getFullYear());
    const [selectedHour, setSelectedHour] = useState(date.getHours() % 12 || 12);
    const [selectedMinute, setSelectedMinute] = useState(date.getMinutes());
    const [selectedAmPm, setSelectedAmPm] = useState(date.getHours() >= 12 ? 1 : 0);

    const years = generateYears();
    const days = generateDays(selectedYear, selectedMonth);
    const hours = generateHours();
    const minutes = generateMinutes();

    useEffect(() => {
        if (isVisible) {
            setSelectedMonth(date.getMonth());
            setSelectedDay(date.getDate());
            setSelectedYear(date.getFullYear());
            setSelectedHour(date.getHours() % 12 || 12);
            setSelectedMinute(date.getMinutes());
            setSelectedAmPm(date.getHours() >= 12 ? 1 : 0);
        }
    }, [isVisible, date]);

    // Adjust day if it exceeds days in selected month
    useEffect(() => {
        const maxDay = getDaysInMonth(selectedYear, selectedMonth);
        if (selectedDay > maxDay) {
            setSelectedDay(maxDay);
        }
    }, [selectedMonth, selectedYear]);

    const handleConfirm = () => {
        let hour24 = selectedHour;
        if (selectedAmPm === 1 && selectedHour !== 12) {
            hour24 = selectedHour + 12;
        } else if (selectedAmPm === 0 && selectedHour === 12) {
            hour24 = 0;
        }

        const newDate = new Date(
            selectedYear,
            selectedMonth,
            selectedDay,
            hour24,
            selectedMinute
        );
        onConfirm(newDate);
    };

    const formatPreview = () => {
        let hour24 = selectedHour;
        if (selectedAmPm === 1 && selectedHour !== 12) {
            hour24 = selectedHour + 12;
        } else if (selectedAmPm === 0 && selectedHour === 12) {
            hour24 = 0;
        }

        const previewDate = new Date(
            selectedYear,
            selectedMonth,
            selectedDay,
            hour24,
            selectedMinute
        );

        if (mode === "date") {
            return previewDate.toLocaleDateString([], {
                weekday: "short",
                month: "short",
                day: "numeric",
                year: "numeric",
            });
        }
        if (mode === "time") {
            return previewDate.toLocaleTimeString([], {
                hour: "numeric",
                minute: "2-digit",
                hour12: true,
            });
        }
        return previewDate.toLocaleString([], {
            weekday: "short",
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
        });
    };

    if (!isVisible) return null;

    const screenWidth = Dimensions.get("window").width;
    const modalWidth = Math.min(screenWidth * 0.9, 380);

    return (
        <Modal visible={isVisible} transparent animationType="fade">
            <Pressable
                style={[styles.modalOverlay, { backgroundColor: "#00000080" }]}
                onPress={onCancel}
            >
                <Pressable
                    style={[
                        styles.modalContent,
                        { backgroundColor: theme.backgroundSecondary, width: modalWidth }
                    ]}
                    onPress={(e) => e.stopPropagation()}
                >
                    <View style={[styles.header, { borderBottomColor: theme.cardBorder }]}>
                        <ThemedText type="h4">{title}</ThemedText>
                    </View>

                    {/* Date Picker */}
                    {(mode === "date" || mode === "datetime") && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Feather name="calendar" size={16} color={colors.primary} />
                                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                    DATE
                                </ThemedText>
                            </View>
                            <View style={styles.pickersRow}>
                                <WheelPicker
                                    items={shortMonths}
                                    selectedIndex={selectedMonth}
                                    onSelect={setSelectedMonth}
                                    width={80}
                                />
                                <WheelPicker
                                    items={days}
                                    selectedIndex={selectedDay - 1}
                                    onSelect={(index) => setSelectedDay(index + 1)}
                                    width={50}
                                />
                                <WheelPicker
                                    items={years}
                                    selectedIndex={years.indexOf(selectedYear)}
                                    onSelect={(index) => setSelectedYear(years[index])}
                                    width={70}
                                />
                            </View>
                        </View>
                    )}

                    {/* Time Picker */}
                    {(mode === "time" || mode === "datetime") && (
                        <View style={styles.section}>
                            <View style={styles.sectionHeader}>
                                <Feather name="clock" size={16} color={colors.secondary} />
                                <ThemedText type="caption" style={{ color: theme.textSecondary }}>
                                    TIME
                                </ThemedText>
                            </View>
                            <View style={styles.pickersRow}>
                                <WheelPicker
                                    items={hours}
                                    selectedIndex={selectedHour - 1}
                                    onSelect={(index) => setSelectedHour(index + 1)}
                                    width={50}
                                />
                                <ThemedText type="h3" style={{ color: theme.textSecondary }}>:</ThemedText>
                                <WheelPicker
                                    items={minutes}
                                    selectedIndex={selectedMinute}
                                    onSelect={setSelectedMinute}
                                    width={50}
                                    formatItem={(item) => String(item).padStart(2, "0")}
                                />
                                <WheelPicker
                                    items={["AM", "PM"]}
                                    selectedIndex={selectedAmPm}
                                    onSelect={setSelectedAmPm}
                                    width={60}
                                />
                            </View>
                        </View>
                    )}

                    {/* Preview */}
                    <View style={[styles.previewContainer, { backgroundColor: theme.backgroundTertiary }]}>
                        <ThemedText type="bodyMedium" style={{ color: colors.primary }}>
                            {formatPreview()}
                        </ThemedText>
                    </View>

                    {/* Footer */}
                    <View style={styles.footer}>
                        <Pressable
                            onPress={onCancel}
                            style={[styles.cancelButton, { backgroundColor: theme.backgroundTertiary }]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: theme.textSecondary }}>
                                Cancel
                            </ThemedText>
                        </Pressable>
                        <Pressable
                            onPress={handleConfirm}
                            style={[
                                styles.confirmButton,
                                { backgroundColor: colors.primary },
                                Shadows.coloredLg(colors.primary)
                            ]}
                        >
                            <ThemedText type="bodyMedium" style={{ color: "#FFFFFF" }}>
                                Confirm
                            </ThemedText>
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
        borderRadius: BorderRadius.xl,
        overflow: "hidden",
    },
    header: {
        padding: Spacing.lg,
        alignItems: "center",
        borderBottomWidth: StyleSheet.hairlineWidth,
    },
    section: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
    },
    sectionHeader: {
        flexDirection: "row",
        alignItems: "center",
        gap: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    pickersRow: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        gap: Spacing.sm,
        height: PICKER_HEIGHT,
    },
    wheelContainer: {
        height: PICKER_HEIGHT,
        overflow: "hidden",
    },
    selectionHighlight: {
        position: "absolute",
        left: 0,
        right: 0,
        height: ITEM_HEIGHT,
        borderRadius: BorderRadius.sm,
    },
    wheelItem: {
        height: ITEM_HEIGHT,
        justifyContent: "center",
        alignItems: "center",
    },
    previewContainer: {
        margin: Spacing.lg,
        padding: Spacing.md,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
    footer: {
        flexDirection: "row",
        padding: Spacing.lg,
        paddingTop: 0,
        gap: Spacing.md,
    },
    cancelButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
    confirmButton: {
        flex: 1,
        padding: Spacing.lg,
        borderRadius: BorderRadius.md,
        alignItems: "center",
    },
});
