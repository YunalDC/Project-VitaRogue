import React, { useState } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar as RNStatusBar,
    Platform,
    Modal,
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

const PLAN_TYPES = [
    {
        id: "workout",
        title: "Workout Plan",
        description: "Create custom workout routines with exercises, sets, and reps",
        icon: "barbell-outline",
        color: COLORS.primary,
    },
    {
        id: "nutrition",
        title: "Nutrition Plan",
        description: "Design meal plans with macros and recipes",
        icon: "nutrition-outline",
        color: COLORS.accent,
    },
];

const WORKOUT_TEMPLATES = [
    { id: 1, name: "Push Pull Legs", days: 6, type: "Strength" },
    { id: 2, name: "Full Body 3x/week", days: 3, type: "Strength" },
    { id: 3, name: "HIIT Cardio", days: 4, type: "Cardio" },
    { id: 4, name: "Upper/Lower Split", days: 4, type: "Strength" },
    { id: 5, name: "Beginner Program", days: 3, type: "Beginner" },
];

const NUTRITION_TEMPLATES = [
    { id: 1, name: "Weight Loss 1800 Cal", calories: 1800, protein: 150, carbs: 150, fats: 60 },
    { id: 2, name: "Muscle Gain 2500 Cal", calories: 2500, protein: 200, carbs: 300, fats: 70 },
    { id: 3, name: "Maintenance 2200 Cal", calories: 2200, protein: 165, carbs: 250, fats: 70 },
    { id: 4, name: "Keto 2000 Cal", calories: 2000, protein: 150, carbs: 50, fats: 155 },
];

export default function WorkoutNutritionPlansScreen({ navigation, route }) {
    const insets = useSafeAreaInsets();
    const [showPlanModal, setShowPlanModal] = useState(false);
    const [selectedPlanType, setSelectedPlanType] = useState(null);

    const client = route?.params?.client || { name: "Client" };
    const existingPlans = route?.params?.existingPlans || [];

    const openPlanBuilder = (planType) => {
        setSelectedPlanType(planType);
        setShowPlanModal(true);
    };

    const createWorkoutPlan = () => {
        setShowPlanModal(false);
        navigation.navigate('WorkoutPlanBuilder', {
            client: client,
            existingPlans: existingPlans,
            templateName: "New Workout Plan"
        });
    };

    const createNutritionPlan = () => {
        setShowPlanModal(false);
        navigation.navigate('NutritionPlanBuilder', {
            client: client,
            existingPlans: existingPlans,
            templateName: "New Nutrition Plan"
        });
    };

    const renderPlanTypeCard = (planType) => (
        <TouchableOpacity
            key={planType.id}
            style={styles.planTypeCard}
            onPress={() => openPlanBuilder(planType.id)}
            activeOpacity={0.7}
        >
            <View style={[styles.planIconContainer, { backgroundColor: planType.color + "20" }]}>
                <Ionicons name={planType.icon} size={32} color={planType.color} />
            </View>
            <Text style={styles.planTypeTitle}>{planType.title}</Text>
            <Text style={styles.planTypeDesc}>{planType.description}</Text>
            <View style={styles.createButton}>
                <Text style={[styles.createButtonText, { color: planType.color }]}>Create Plan</Text>
                <Ionicons name="arrow-forward" size={18} color={planType.color} />
            </View>
        </TouchableOpacity>
    );

    const renderTemplateModal = () => (
        <Modal
            visible={showPlanModal}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setShowPlanModal(false)}
        >
            <View style={styles.modalOverlay}>
                <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
                    <View style={styles.modalHeader}>
                        <Text style={styles.modalTitle}>
                            {selectedPlanType === "workout" ? "Choose Workout Template" : "Choose Nutrition Template"}
                        </Text>
                        <TouchableOpacity onPress={() => setShowPlanModal(false)}>
                            <Ionicons name="close" size={24} color={COLORS.text} />
                        </TouchableOpacity>
                    </View>

                    <ScrollView style={styles.templateList} showsVerticalScrollIndicator={false}>
                        {selectedPlanType === "workout"
                            ? WORKOUT_TEMPLATES.map((template) => (
                                <TouchableOpacity
                                    key={template.id}
                                    style={styles.templateCard}
                                    onPress={createWorkoutPlan}
                                >
                                    <View style={styles.templateInfo}>
                                        <Text style={styles.templateName}>{template.name}</Text>
                                        <Text style={styles.templateDetails}>
                                            {template.days} days/week • {template.type}
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                                </TouchableOpacity>
                            ))
                            : NUTRITION_TEMPLATES.map((template) => (
                                <TouchableOpacity
                                    key={template.id}
                                    style={styles.templateCard}
                                    onPress={createNutritionPlan}
                                >
                                    <View style={styles.templateInfo}>
                                        <Text style={styles.templateName}>{template.name}</Text>
                                        <Text style={styles.templateDetails}>
                                            P: {template.protein}g • C: {template.carbs}g • F: {template.fats}g
                                        </Text>
                                    </View>
                                    <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
                                </TouchableOpacity>
                            ))}

                        <TouchableOpacity
                            style={styles.customTemplateButton}
                            onPress={selectedPlanType === "workout" ? createWorkoutPlan : createNutritionPlan}
                        >
                            <Ionicons name="add-circle-outline" size={24} color={COLORS.primary} />
                            <Text style={styles.customTemplateText}>Start from Scratch</Text>
                        </TouchableOpacity>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Plans for {client.name}</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
                    <View style={styles.infoText}>
                        <Text style={styles.infoTitle}>Create Custom Plans</Text>
                        <Text style={styles.infoDesc}>
                            Build personalized workout routines and nutrition plans tailored to your client's goals
                        </Text>
                    </View>
                </View>

                <View style={styles.planTypesGrid}>
                    {PLAN_TYPES.map((planType) => renderPlanTypeCard(planType))}
                </View>

                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Workout Plan Features</Text>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.featureText}>Choose from pre-built templates</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.featureText}>Drag and drop exercises by day</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.featureText}>Set reps, sets, rest periods, and notes</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.success} />
                        <Text style={styles.featureText}>Save custom templates for reuse</Text>
                    </View>
                </View>

                <View style={styles.featuresSection}>
                    <Text style={styles.sectionTitle}>Nutrition Plan Features</Text>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                        <Text style={styles.featureText}>Daily meal planning by day</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                        <Text style={styles.featureText}>Set macro targets (protein, carbs, fats)</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                        <Text style={styles.featureText}>Access recipes library</Text>
                    </View>
                    <View style={styles.featureItem}>
                        <Ionicons name="checkmark-circle" size={20} color={COLORS.accent} />
                        <Text style={styles.featureText}>Swap meal alternatives easily</Text>
                    </View>
                </View>
            </ScrollView>

            {renderTemplateModal()}
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
        flex: 1,
        textAlign: "center",
    },
    content: {
        flex: 1,
        padding: 16,
    },
    infoCard: {
        flexDirection: "row",
        backgroundColor: COLORS.primary + "20",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginBottom: 24,
    },
    infoText: {
        flex: 1,
        marginLeft: 12,
    },
    infoTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    infoDesc: {
        fontSize: 14,
        color: COLORS.muted,
        lineHeight: 20,
    },
    planTypesGrid: {
        gap: 16,
        marginBottom: 32,
    },
    planTypeCard: {
        backgroundColor: COLORS.card,
        padding: 20,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    planIconContainer: {
        width: 64,
        height: 64,
        borderRadius: 32,
        alignItems: "center",
        justifyContent: "center",
        marginBottom: 16,
    },
    planTypeTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
        marginBottom: 8,
    },
    planTypeDesc: {
        fontSize: 14,
        color: COLORS.muted,
        lineHeight: 20,
        marginBottom: 16,
    },
    createButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingTop: 16,
        borderTopWidth: 1,
        borderTopColor: COLORS.border,
    },
    createButtonText: {
        fontSize: 16,
        fontWeight: "600",
    },
    featuresSection: {
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 16,
    },
    featureItem: {
        flexDirection: "row",
        alignItems: "center",
        marginBottom: 12,
    },
    featureText: {
        fontSize: 14,
        color: COLORS.muted,
        marginLeft: 12,
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.7)",
        justifyContent: "flex-end",
    },
    modalContent: {
        backgroundColor: COLORS.card,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: "80%",
        paddingTop: 20,
    },
    modalHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingHorizontal: 20,
        marginBottom: 20,
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
    },
    templateList: {
        paddingHorizontal: 20,
    },
    templateCard: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        backgroundColor: COLORS.card2,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    templateInfo: {
        flex: 1,
    },
    templateName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        marginBottom: 4,
    },
    templateDetails: {
        fontSize: 13,
        color: COLORS.muted,
    },
    customTemplateButton: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: COLORS.primary + "20",
        padding: 16,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
        marginTop: 8,
        marginBottom: 20,
    },
    customTemplateText: {
        fontSize: 16,
        fontWeight: "600",
        color: COLORS.primary,
        marginLeft: 8,
    },
});