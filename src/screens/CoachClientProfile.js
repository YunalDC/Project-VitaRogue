import React, { useState, useEffect } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar as RNStatusBar,
    Platform,
    Image,
    Dimensions,
    Alert,
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

const screenWidth = Dimensions.get("window").width;

// Mock data for client profile
const CLIENT_DATA = {
    id: 1,
    name: "Mike Johnson",
    email: "mike.johnson@email.com",
    phone: "+1 (555) 0123",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    age: 28,
    height: "5'11\"",
    weight: "185 lbs",
    goal: "Weight Loss",
    targetWeight: "170 lbs",
    joinDate: "2024-01-15",
    totalSessions: 45,
    completedSessions: 42,
    cancelledSessions: 3,
    progress: 85,
    status: "active",
    lastSession: "2 hours ago",
    nextSession: "Tomorrow 3:00 PM",
    calorieGoal: 2200,
    currentWeight: 178,
    startingWeight: 195,
    bodyFat: 15.2,
    muscle: 42.8,
};

const PROGRESS_DATA = {
    weight: [195, 192, 189, 185, 182, 180, 178],
    dates: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"],
};

const RECENT_SESSIONS = [
    {
        id: 1,
        date: "2024-07-15",
        type: "Full Body Strength",
        duration: 60,
        calories: 420,
        notes: "Great form on deadlifts. Increased weight by 10lbs.",
        exercises: ["Deadlifts", "Squats", "Bench Press", "Pull-ups"],
    },
    {
        id: 2,
        date: "2024-07-12",
        type: "HIIT Cardio",
        duration: 45,
        calories: 380,
        notes: "Excellent intensity. Recovery time improving.",
        exercises: ["Burpees", "Mountain Climbers", "Jump Squats"],
    },
    {
        id: 3,
        date: "2024-07-10",
        type: "Upper Body",
        duration: 50,
        calories: 295,
        notes: "Focus on form. Shoulder mobility improving.",
        exercises: ["Overhead Press", "Rows", "Lat Pulldowns"],
    },
];

const TABS = ["Overview", "Progress", "Plans", "Check-ins"];

export default function CoachClientProfile({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [activeTab, setActiveTab] = useState(0);
    const [clientData, setClientData] = useState(CLIENT_DATA);
    const [savedPlans, setSavedPlans] = useState([]);


    // Get client data AND existing plans from route params
    useEffect(() => {
        if (route?.params?.client) {
            setClientData({ ...CLIENT_DATA, ...route.params.client });
        }

        // Load existing plans if passed
        if (route?.params?.existingPlans) {
            setSavedPlans(route.params.existingPlans);
        }
    }, [route?.params?.client, route?.params?.existingPlans]);

    // Handle new plan added
    useEffect(() => {
        if (route?.params?.newPlan) {
            setSavedPlans(prev => {
                const updated = [...prev, { ...route.params.newPlan, id: Date.now() }];
                return updated;
            });
        }
    }, [route?.params?.newPlan]);

    const renderOverview = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            {/* Stats Cards */}
            <View style={styles.statsGrid}>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{clientData.totalSessions}</Text>
                    <Text style={styles.statLabel}>Total Sessions</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{clientData.completedSessions || clientData.totalSessions}</Text>
                    <Text style={styles.statLabel}>Completed</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{clientData.progress}%</Text>
                    <Text style={styles.statLabel}>Progress</Text>
                </View>
                <View style={styles.statCard}>
                    <Text style={styles.statValue}>{clientData.currentWeight || clientData.weight}</Text>
                    <Text style={styles.statLabel}>Current Weight</Text>
                </View>
            </View>

            {/* Goals Section */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Current Goals</Text>
                <View style={styles.goalCard}>
                    <View style={styles.goalItem}>
                        <Text style={styles.goalLabel}>Primary Goal</Text>
                        <Text style={styles.goalValue}>{clientData.goal}</Text>
                    </View>
                    <View style={styles.goalItem}>
                        <Text style={styles.goalLabel}>Target Weight</Text>
                        <Text style={styles.goalValue}>{clientData.targetWeight || "Not set"}</Text>
                    </View>
                    <View style={styles.goalItem}>
                        <Text style={styles.goalLabel}>Daily Calories</Text>
                        <Text style={styles.goalValue}>{clientData.calorieGoal || "2200"}</Text>
                    </View>
                </View>
            </View>

            {/* Body Composition */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Body Composition</Text>
                <View style={styles.compositionCard}>
                    <View style={styles.compositionItem}>
                        <Ionicons name="fitness-outline" size={24} color={COLORS.primary} />
                        <View>
                            <Text style={styles.compositionValue}>{clientData.muscle || "42.8"}kg</Text>
                            <Text style={styles.compositionLabel}>Muscle Mass</Text>
                        </View>
                    </View>
                    <View style={styles.compositionItem}>
                        <Ionicons name="analytics-outline" size={24} color={COLORS.warning} />
                        <View>
                            <Text style={styles.compositionValue}>{clientData.bodyFat || "15.2"}%</Text>
                            <Text style={styles.compositionLabel}>Body Fat</Text>
                        </View>
                    </View>
                </View>
            </View>

            {/* Recent Sessions */}
            <View style={styles.section}>
                <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Recent Sessions</Text>
                    <TouchableOpacity>
                        <Text style={styles.viewAllLink}>View All</Text>
                    </TouchableOpacity>
                </View>
                {RECENT_SESSIONS.slice(0, 3).map((session) => (
                    <View key={session.id} style={styles.sessionItem}>
                        <View style={styles.sessionHeader}>
                            <Text style={styles.sessionType}>{session.type}</Text>
                            <Text style={styles.sessionDate}>{session.date}</Text>
                        </View>
                        <Text style={styles.sessionDuration}>{session.duration} min • {session.calories} cal</Text>
                        <Text style={styles.sessionNotes}>{session.notes}</Text>
                    </View>
                ))}
            </View>
        </ScrollView>
    );

    const renderProgress = () => (
        <ScrollView showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Progress Tracking</Text>
                <View style={styles.progressCard}>
                    <Text style={styles.progressTitle}>Weight Progress</Text>
                    <Text style={styles.progressValue}>
                        Started: {clientData.startingWeight || "195 lbs"} → Current: {clientData.currentWeight || clientData.weight}
                    </Text>
                    <Text style={styles.progressChange}>
                        Lost: {parseInt(clientData.startingWeight || 195) - parseInt(clientData.currentWeight || clientData.weight || 178)} lbs
                    </Text>
                </View>

                {/* Progress Visualization - Simple bars instead of charts */}
                <View style={styles.progressSection}>
                    <Text style={styles.progressSectionTitle}>Goal Progress</Text>

                    <View style={styles.progressItem}>
                        <View style={styles.progressItemHeader}>
                            <Text style={styles.progressItemLabel}>Weight Loss</Text>
                            <Text style={styles.progressItemValue}>{clientData.progress}%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: `${clientData.progress}%`, backgroundColor: COLORS.primary }
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.progressItem}>
                        <View style={styles.progressItemHeader}>
                            <Text style={styles.progressItemLabel}>Strength</Text>
                            <Text style={styles.progressItemValue}>78%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: '78%', backgroundColor: COLORS.secondary }
                                ]}
                            />
                        </View>
                    </View>

                    <View style={styles.progressItem}>
                        <View style={styles.progressItemHeader}>
                            <Text style={styles.progressItemLabel}>Endurance</Text>
                            <Text style={styles.progressItemValue}>65%</Text>
                        </View>
                        <View style={styles.progressBarContainer}>
                            <View
                                style={[
                                    styles.progressBarFill,
                                    { width: '65%', backgroundColor: COLORS.accent }
                                ]}
                            />
                        </View>
                    </View>
                </View>
            </View>

            {/* Milestones */}
            <View style={styles.section}>
                <Text style={styles.sectionTitle}>Milestones</Text>
                <View style={styles.milestoneItem}>
                    <Ionicons name="trophy" size={24} color={COLORS.accent} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.milestoneTitle}>Weight Loss Goal</Text>
                        <Text style={styles.milestoneDesc}>Making great progress towards target</Text>
                    </View>
                    <Text style={styles.milestoneDate}>Current</Text>
                </View>
                <View style={styles.milestoneItem}>
                    <Ionicons name="medal" size={24} color={COLORS.primary} />
                    <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={styles.milestoneTitle}>Consistency Streak</Text>
                        <Text style={styles.milestoneDesc}>{clientData.totalSessions} sessions completed</Text>
                    </View>
                    <Text style={styles.milestoneDate}>Ongoing</Text>
                </View>
            </View>
        </ScrollView>
    );

    const renderPlans = () => {
        const workoutPlans = savedPlans.filter(p => p.type === "workout");
        const nutritionPlans = savedPlans.filter(p => p.type === "nutrition");

        return (
            <ScrollView showsVerticalScrollIndicator={false}>
                {/* Workout Plans Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Workout Plans</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('WorkoutNutritionPlans', {
                            client: clientData,
                            existingPlans: savedPlans // Pass current saved plans
                        })}>
                            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {workoutPlans.length === 0 ? (
                        <View style={styles.emptyPlanCard}>
                            <Ionicons name="barbell-outline" size={32} color={COLORS.muted} />
                            <Text style={styles.emptyPlanText}>No workout plans yet</Text>
                        </View>
                    ) : (
                        workoutPlans.map(plan => (
                            <TouchableOpacity key={plan.id} style={styles.planCard}>
                                <View style={[styles.planIcon, { backgroundColor: COLORS.primary + "20" }]}>
                                    <Ionicons name="barbell" size={24} color={COLORS.primary} />
                                </View>
                                <View style={styles.planInfo}>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planDetails}>{plan.details}</Text>
                                    <Text style={styles.planDate}>Created: {plan.createdDate}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Nutrition Plans Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>Nutrition Plans</Text>
                        <TouchableOpacity onPress={() => navigation.navigate('WorkoutNutritionPlans', { client: clientData })}>
                            <Ionicons name="add-circle" size={24} color={COLORS.accent} />
                        </TouchableOpacity>
                    </View>

                    {nutritionPlans.length === 0 ? (
                        <View style={styles.emptyPlanCard}>
                            <Ionicons name="nutrition-outline" size={32} color={COLORS.muted} />
                            <Text style={styles.emptyPlanText}>No nutrition plans yet</Text>
                        </View>
                    ) : (
                        nutritionPlans.map(plan => (
                            <TouchableOpacity key={plan.id} style={styles.planCard}>
                                <View style={[styles.planIcon, { backgroundColor: COLORS.accent + "20" }]}>
                                    <Ionicons name="nutrition" size={24} color={COLORS.accent} />
                                </View>
                                <View style={styles.planInfo}>
                                    <Text style={styles.planName}>{plan.name}</Text>
                                    <Text style={styles.planDetails}>{plan.details}</Text>
                                    <Text style={styles.planDate}>Created: {plan.createdDate}</Text>
                                </View>
                                <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                            </TouchableOpacity>
                        ))
                    )}
                </View>

                {/* Quick Action Button */}
                {savedPlans.length > 0 && (
                    <TouchableOpacity
                        style={[styles.actionButton, { marginBottom: 24 }]}
                        onPress={() => navigation.navigate('WorkoutNutritionPlans', { client: clientData })}
                    >
                        <Text style={styles.actionButtonText}>Create Another Plan</Text>
                    </TouchableOpacity>
                )}
            </ScrollView>
        );
    };

    const renderCheckins = () => (
        <View style={styles.centerContainer}>
            <Ionicons name="checkmark-circle-outline" size={64} color={COLORS.muted} />
            <Text style={styles.placeholderTitle}>Client Check-ins</Text>
            <Text style={styles.placeholderDesc}>
                Weekly progress photos and measurements will appear here
            </Text>
        </View>
    );

    const renderTabContent = () => {
        switch (activeTab) {
            case 0: return renderOverview();
            case 1: return renderProgress();
            case 2: return renderPlans();
            case 3: return renderCheckins();
            default: return renderOverview();
        }
    };

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

                <Text style={styles.headerTitle}>Client Profile</Text>

                <TouchableOpacity style={styles.menuButton}>
                    <Ionicons name="ellipsis-vertical" size={24} color={COLORS.text} />
                </TouchableOpacity>
            </View>

            {/* Client Info Header */}
            <View style={styles.clientHeader}>
                <Image source={{ uri: clientData.avatar }} style={styles.clientAvatar} />
                <View style={styles.clientInfo}>
                    <Text style={styles.clientName}>{clientData.name}</Text>
                    <Text style={styles.clientDetails}>
                        {clientData.age || "28"} years • {clientData.height || "5'11\""} • {clientData.weight}
                    </Text>
                    <View style={styles.statusContainer}>
                        <View style={[styles.statusDot, {
                            backgroundColor: clientData.status === "active" ? COLORS.success :
                                clientData.status === "paused" ? COLORS.danger :
                                    COLORS.warning
                        }]} />
                        <Text style={styles.statusText}>
                            {clientData.status === "active" ? "Active" :
                                clientData.status === "paused" ? "Paused" : "Trial"} since {clientData.joinDate}
                        </Text>
                    </View>
                </View>
                <TouchableOpacity
                    style={styles.messageButton}
                    onPress={() => navigation.navigate('ClientMessaging', { client: clientData })}
                >
                    <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
                </TouchableOpacity>
            </View>

            {/* Tabs */}
            <View style={styles.tabContainer}>
                <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tabScrollContainer}
                >
                    {TABS.map((tab, index) => (
                        <TouchableOpacity
                            key={tab}
                            style={[styles.tab, activeTab === index && styles.activeTab]}
                            onPress={() => setActiveTab(index)}
                        >
                            <Text style={[styles.tabText, activeTab === index && styles.activeTabText]}>
                                {tab}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
            </View>

            {/* Tab Content */}
            <View style={styles.content}>
                {renderTabContent()}
            </View>
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
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
    },
    menuButton: {
        padding: 8,
    },
    clientHeader: {
        flexDirection: "row",
        alignItems: "center",
        padding: 16,
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginBottom: 16,
        borderRadius: 12,
    },
    clientAvatar: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: COLORS.card2,
    },
    clientInfo: {
        flex: 1,
        marginLeft: 16,
    },
    clientName: {
        fontSize: 20,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    clientDetails: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 6,
    },
    statusContainer: {
        flexDirection: "row",
        alignItems: "center",
    },
    statusDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        marginRight: 8,
    },
    statusText: {
        fontSize: 12,
        color: COLORS.muted,
    },
    messageButton: {
        padding: 12,
        backgroundColor: COLORS.primary + "20",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    tabContainer: {
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        borderRadius: 12,
        marginBottom: 16,
    },
    tabScrollContainer: {
        paddingHorizontal: 4,
    },
    tab: {
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 8,
        margin: 4,
    },
    activeTab: {
        backgroundColor: COLORS.primary,
    },
    tabText: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.muted,
    },
    activeTabText: {
        color: "white",
        fontWeight: "600",
    },
    content: {
        flex: 1,
        paddingHorizontal: 16,
    },
    statsGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        gap: 12,
        marginBottom: 24,
    },
    statCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        width: "48%",
        alignItems: "center",
    },
    statValue: {
        fontSize: 24,
        fontWeight: "800",
        color: COLORS.primary,
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: "600",
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 16,
    },
    viewAllLink: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "600",
    },
    goalCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
    },
    goalItem: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    goalLabel: {
        fontSize: 14,
        color: COLORS.muted,
        fontWeight: "500",
    },
    goalValue: {
        fontSize: 14,
        color: COLORS.text,
        fontWeight: "600",
    },
    compositionCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        justifyContent: "space-around",
    },
    compositionItem: {
        alignItems: "center",
        gap: 8,
    },
    compositionValue: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        textAlign: "center",
    },
    compositionLabel: {
        fontSize: 12,
        color: COLORS.muted,
        textAlign: "center",
    },
    sessionItem: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    sessionHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    sessionType: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
    },
    sessionDate: {
        fontSize: 12,
        color: COLORS.muted,
    },
    sessionDuration: {
        fontSize: 14,
        color: COLORS.primary,
        fontWeight: "500",
        marginBottom: 8,
    },
    sessionNotes: {
        fontSize: 13,
        color: COLORS.muted,
        lineHeight: 18,
    },
    progressCard: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
    },
    progressTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 8,
    },
    progressValue: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 4,
    },
    progressChange: {
        fontSize: 14,
        color: COLORS.success,
        fontWeight: "600",
    },
    milestoneItem: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    milestoneTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 4,
    },
    milestoneDesc: {
        fontSize: 13,
        color: COLORS.muted,
    },
    milestoneDate: {
        fontSize: 12,
        color: COLORS.muted,
        fontWeight: "500",
    },
    centerContainer: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    placeholderTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
        textAlign: "center",
        marginTop: 16,
    },
    placeholderDesc: {
        fontSize: 14,
        color: COLORS.muted,
        textAlign: "center",
        marginTop: 8,
        lineHeight: 20,
    },
    actionButton: {
        backgroundColor: COLORS.primary,
        paddingVertical: 12,
        paddingHorizontal: 24,
        borderRadius: 8,
        marginTop: 24,
    },
    actionButtonText: {
        fontSize: 14,
        fontWeight: "600",
        color: "white",
    },
    progressSection: {
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginTop: 12,
    },
    progressSectionTitle: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.text,
        marginBottom: 16,
    },
    progressItem: {
        marginBottom: 16,
    },
    progressItemHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 8,
    },
    progressItemLabel: {
        fontSize: 14,
        fontWeight: "500",
        color: COLORS.muted,
    },
    progressItemValue: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.text,
    },
    progressBarContainer: {
        height: 8,
        backgroundColor: COLORS.border,
        borderRadius: 4,
        overflow: "hidden",
    },
    progressBarFill: {
        height: "100%",
        borderRadius: 4,
    },
    emptyPlanCard: {
        backgroundColor: COLORS.card,
        padding: 24,
        borderRadius: 12,
        alignItems: "center",
        borderWidth: 2,
        borderColor: COLORS.border,
        borderStyle: "dashed",
    },
    emptyPlanText: {
        fontSize: 14,
        color: COLORS.muted,
        marginTop: 8,
    },
    planCard: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    planIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: "center",
        justifyContent: "center",
        marginRight: 12,
    },
    planInfo: {
        flex: 1,
    },
    planName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    planDetails: {
        fontSize: 13,
        color: COLORS.muted,
        marginBottom: 2,
    },
    planDate: {
        fontSize: 11,
        color: COLORS.muted,
    },
});