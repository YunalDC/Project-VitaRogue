import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
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
};

const DEFAULT_CLIENT = {
  name: "Client",
  goal: "",
  progress: 0,
};

export default function UpdateCoachClientProfile({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const clientData = useMemo(() => route?.params?.client ?? DEFAULT_CLIENT, [route?.params?.client]);

  const initialPlans = useMemo(() => {
    const plans = route?.params?.existingPlans;
    if (!plans) {
      return { workout: [], nutrition: [] };
    }
    return {
      workout: Array.isArray(plans.workout) ? plans.workout : [],
      nutrition: Array.isArray(plans.nutrition) ? plans.nutrition : [],
    };
  }, [route?.params?.existingPlans]);

  const [clientPlans, setClientPlans] = useState(initialPlans);

  useEffect(() => {
    if (route?.params?.newPlan) {
      const { planType, planData } = route.params.newPlan;
      if (!planType || !planData) return;
      setClientPlans((prev) => ({
        ...prev,
        [planType]: [...(prev[planType] || []), planData],
      }));
    }
  }, [route?.params?.newPlan]);

  const renderPlanCard = (plan, index, iconName, tintColor, iconBackground) => (
    <TouchableOpacity key={`${plan.name}-${index}`} style={styles.planCard} activeOpacity={0.8}>
      <View style={[styles.planIcon, iconBackground && { backgroundColor: iconBackground }]}>
        <Ionicons name={iconName} size={24} color={tintColor} />
      </View>
      <View style={styles.planInfo}>
        <Text style={styles.planName}>{plan.name}</Text>
        {plan.description ? <Text style={styles.planDetails}>{plan.description}</Text> : null}
        {plan.createdDate ? <Text style={styles.planDate}>Created {plan.createdDate}</Text> : null}
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.muted} />
    </TouchableOpacity>
  );

  const renderPlans = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Workout Plans</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("WorkoutNutritionPlans", { client: clientData })}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {clientPlans.workout.length === 0 ? (
          <View style={styles.emptyPlanCard}>
            <Ionicons name="barbell-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyPlanText}>No workout plans yet</Text>
          </View>
        ) : (
          clientPlans.workout.map((plan, index) =>
            renderPlanCard(
              {
                ...plan,
                description:
                  plan.schedule
                    ? `${Object.values(plan.schedule).reduce((sum, day) => sum + day.length, 0)} exercises � ${
                        Object.values(plan.schedule).filter((day) => day.length > 0).length
                      } days/week`
                    : plan.description,
              },
              index,
              "barbell",
              COLORS.primary,
              COLORS.primary + "20"
            )
          )
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Nutrition Plans</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("WorkoutNutritionPlans", { client: clientData })}
            activeOpacity={0.8}
          >
            <Ionicons name="add-circle" size={24} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {clientPlans.nutrition.length === 0 ? (
          <View style={styles.emptyPlanCard}>
            <Ionicons name="nutrition-outline" size={40} color={COLORS.muted} />
            <Text style={styles.emptyPlanText}>No nutrition plans yet</Text>
          </View>
        ) : (
          clientPlans.nutrition.map((plan, index) =>
            renderPlanCard(
              {
                ...plan,
                description:
                  plan.calorieTarget && plan.proteinTarget
                    ? `${plan.calorieTarget} cal � P:${plan.proteinTarget}g � C:${plan.carbsTarget}g � F:${plan.fatsTarget}g`
                    : plan.description,
              },
              index,
              "nutrition",
              COLORS.accent,
              COLORS.accent + "20"
            )
          )
        )}
      </View>

      <TouchableOpacity
        style={styles.actionButton}
        onPress={() => navigation.navigate("WorkoutNutritionPlans", { client: clientData })}
        activeOpacity={0.85}
      >
        <Text style={styles.actionButtonText}>Create New Plan</Text>
      </TouchableOpacity>
    </ScrollView>
  );

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 16) }]}> 
      <StatusBar style="light" />
      <LinearGradient pointerEvents="none" colors={["#0f172a", "#0b1220"]} style={StyleSheet.absoluteFill} />

      <View style={[styles.header, { paddingTop: Platform.OS === "android" ? RNStatusBar.currentHeight || 8 : 0 }]}> 
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton} activeOpacity={0.8}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle}>{clientData.name}</Text>
          {clientData.goal ? <Text style={styles.headerSubtitle}>{clientData.goal}</Text> : null}
        </View>
        <View style={{ width: 32 }} />
      </View>

      <View style={styles.content}>{renderPlans()}</View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: "700",
  },
  headerSubtitle: {
    color: COLORS.muted,
    marginTop: 4,
    fontSize: 14,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingBottom: 24,
  },
  section: {
    marginBottom: 28,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  sectionTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: "700",
  },
  emptyPlanCard: {
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyPlanText: {
    color: COLORS.muted,
    marginTop: 12,
    fontSize: 14,
  },
  planCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
  },
  planIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.card2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  planInfo: {
    flex: 1,
  },
  planName: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  planDetails: {
    color: COLORS.muted,
    fontSize: 13,
    marginBottom: 4,
  },
  planDate: {
    color: COLORS.muted,
    fontSize: 12,
  },
  actionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  actionButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
});
