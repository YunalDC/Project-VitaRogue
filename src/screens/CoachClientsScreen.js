import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar as RNStatusBar,
    Platform,
    Image,
    TextInput,
    FlatList,
    Dimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
    bg: "#0B1220",
    card: "#111827",
    card2: "#0f172a",
    border: "#1f2937",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "#10B981",
    secondary: "#60a5fa",
    accent: "#f59e0b",
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
};

const ALL_CLIENTS = [
    {
        id: 1,
        name: "Mike Johnson",
        avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "2 hours ago",
        progress: 85,
        status: "active",
        goal: "Weight Loss",
        email: "mike.johnson@email.com",
        totalSessions: 45,
        joinDate: "2024-01-15",
        nextSession: "Tomorrow 3:00 PM",
    },
    {
        id: 2,
        name: "Emma Wilson",
        avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "Yesterday",
        progress: 72,
        status: "active",
        goal: "Muscle Gain",
        email: "emma.wilson@email.com",
        totalSessions: 32,
        joinDate: "2024-02-20",
        nextSession: "Today 5:30 PM",
    },
    {
        id: 3,
        name: "David Chen",
        avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "3 days ago",
        progress: 91,
        status: "paused",
        goal: "Strength Training",
        email: "david.chen@email.com",
        totalSessions: 67,
        joinDate: "2023-11-10",
        nextSession: "TBD",
    },
    {
        id: 4,
        name: "Lisa Martinez",
        avatar: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "1 hour ago",
        progress: 68,
        status: "active",
        goal: "General Fitness",
        email: "lisa.martinez@email.com",
        totalSessions: 28,
        joinDate: "2024-03-05",
        nextSession: "Tomorrow 10:00 AM",
    },
    {
        id: 5,
        name: "John Davis",
        avatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "1 week ago",
        progress: 42,
        status: "trial",
        goal: "Weight Loss",
        email: "john.davis@email.com",
        totalSessions: 3,
        joinDate: "2024-08-20",
        nextSession: "Monday 4:00 PM",
    },
    {
        id: 6,
        name: "Sarah Kim",
        avatar: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "2 weeks ago",
        progress: 23,
        status: "paused",
        goal: "Rehabilitation",
        email: "sarah.kim@email.com",
        totalSessions: 12,
        joinDate: "2024-06-15",
        nextSession: "TBD",
    },
    {
        id: 7,
        name: "Robert Taylor",
        avatar: "https://images.pexels.com/photos/91227/pexels-photo-91227.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "Today",
        progress: 55,
        status: "active",
        goal: "Endurance",
        email: "robert.taylor@email.com",
        totalSessions: 22,
        joinDate: "2024-05-10",
        nextSession: "Thursday 6:00 PM",
    },
    {
        id: 8,
        name: "Jessica Brown",
        avatar: "https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=400",
        lastSession: "4 days ago",
        progress: 78,
        status: "trial",
        goal: "Weight Loss",
        email: "jessica.brown@email.com",
        totalSessions: 5,
        joinDate: "2024-08-25",
        nextSession: "Saturday 9:00 AM",
    },
];

const STATUS_FILTERS = [
    { id: "all", label: "All", color: COLORS.muted },
    { id: "active", label: "Active", color: COLORS.success },
    { id: "trial", label: "Trial", color: COLORS.warning },
    { id: "paused", label: "Paused", color: COLORS.danger },
];

export default function CoachClientsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const screenWidth = Dimensions.get("window").width;
    const chipWidth = screenWidth / STATUS_FILTERS.length - 24;

    const filteredClients = useMemo(() => {
        let filtered = ALL_CLIENTS;

        // Filter by status
        if (selectedStatus !== "all") {
            filtered = filtered.filter((client) => client.status === selectedStatus);
        }

        // Filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase().trim();
            filtered = filtered.filter(
                (client) =>
                    client.name.toLowerCase().includes(query) ||
                    client.goal.toLowerCase().includes(query) ||
                    client.email.toLowerCase().includes(query)
            );
        }

        return filtered;
    }, [searchQuery, selectedStatus]);

    const getStatusColor = (status) => {
        switch (status) {
            case "active":
                return COLORS.success;
            case "trial":
                return COLORS.warning;
            case "paused":
                return COLORS.danger;
            default:
                return COLORS.muted;
        }
    };

    const renderClientCard = ({ item }) => (
        <TouchableOpacity
            style={styles.clientCard}
            onPress={() => navigation.navigate("CoachClientProfile", { client: item })}
            activeOpacity={0.7}
        >
            <Image source={{ uri: item.avatar }} style={styles.clientAvatar} />

            <View style={styles.clientInfo}>
                <View style={styles.clientHeader}>
                    <Text style={styles.clientName}>{item.name}</Text>
                    <View
                        style={[
                            styles.statusBadge,
                            { backgroundColor: getStatusColor(item.status) + "20" },
                        ]}
                    >
                        <View
                            style={[
                                styles.statusDot,
                                { backgroundColor: getStatusColor(item.status) },
                            ]}
                        />
                        <Text
                            style={[
                                styles.statusText,
                                { color: getStatusColor(item.status) },
                            ]}
                        >
                            {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                        </Text>
                    </View>
                </View>

                <Text style={styles.clientGoal}>{item.goal}</Text>

                <View style={styles.clientStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
                        <Text style={styles.statText}>{item.totalSessions} sessions</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="trending-up" size={14} color={COLORS.primary} />
                        <Text style={styles.statText}>{item.progress}% progress</Text>
                    </View>
                </View>

                <View style={styles.clientFooter}>
                    <Text style={styles.lastSession}>Last: {item.lastSession}</Text>
                    <TouchableOpacity
                        style={styles.messageIconButton}
                        onPress={() => navigation.navigate("ClientMessaging", { client: item })}
                    >
                        <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>All Clients</Text>

                <View style={styles.headerRight}>
                    <Text style={styles.clientCount}>{filteredClients.length}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, goal, or email..."
                    placeholderTextColor={COLORS.muted}
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery("")}>
                        <Ionicons name="close-circle" size={20} color={COLORS.muted} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Status Filters */}
            <View style={styles.filtersContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.filtersContent}
                >
                    {STATUS_FILTERS.map((filter) => (
                        <TouchableOpacity
                            key={filter.id}
                            style={[
                                styles.filterChip,
                                selectedStatus === filter.id && styles.filterChipActive,
                            ]}
                            onPress={() => setSelectedStatus(filter.id)}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.filterText,
                                    { color: selectedStatus === filter.id ? "white" : filter.color },
                                ]}
                                numberOfLines={1}
                            >
                                {filter.label}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Client List */}
            {filteredClients.length > 0 ? (
                <FlatList
                    data={filteredClients}
                    renderItem={renderClientCard}
                    keyExtractor={(item) => item.id.toString()}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color={COLORS.muted} />
                    <Text style={styles.emptyTitle}>No clients found</Text>
                    <Text style={styles.emptyDesc}>
                        {searchQuery
                            ? "Try adjusting your search or filters"
                            : "Start adding clients to see them here"}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: COLORS.bg,
    },
    header: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
        flex: 1,
        marginLeft: 8,
    },
    headerRight: {
        backgroundColor: COLORS.primary + "20",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    clientCount: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.primary,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    filtersContainer: {
        marginTop: 16,
        marginBottom: 8,
        height: 40,
    },
    filtersContent: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        width: 90,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.muted,
        backgroundColor: COLORS.muted + "20",
    },
    filterChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        includeFontPadding: false,
        textAlign: 'center',
    },

    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    clientCard: {
        flexDirection: "row",
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    clientAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.card2,
    },
    clientInfo: {
        flex: 1,
        marginLeft: 16,
    },
    clientHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    clientName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        flex: 1,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
    },
    clientGoal: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 8,
    },
    clientStats: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 8,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: COLORS.muted,
    },
    clientFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    lastSession: {
        fontSize: 12,
        color: COLORS.muted,
    },
    messageIconButton: {
        padding: 6,
        backgroundColor: COLORS.primary + "20",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: COLORS.muted,
        textAlign: "center",
        marginTop: 8,
    },
});