import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";

export default function NutritionSettings({ navigation }) {
  const SettingItem = ({ icon, title, subtitle, value, onPress }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={SUCCESS} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        {value && <Text style={styles.valueText}>{value}</Text>}
        <Ionicons name="chevron-forward" size={20} color={MUTED} />
      </View>
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={BG} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Preferences</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <SectionHeader title="DAILY TARGETS" />
          <SettingItem
            icon="flame-outline"
            title="Calorie Goal"
            subtitle="Daily calorie target"
            value="2400 kcal"
            onPress={() => Alert.alert("Coming Soon", "Edit calorie goal feature coming soon")}
          />
          <SettingItem
            icon="nutrition-outline"
            title="Macro Ratios"
            subtitle="Protein, Carbs, Fat distribution"
            value="30/40/30"
            onPress={() => Alert.alert("Coming Soon", "Edit macros feature coming soon")}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="DIETARY PREFERENCES" />
          <SettingItem
            icon="leaf-outline"
            title="Diet Type"
            subtitle="Your dietary approach"
            value="Balanced"
            onPress={() => Alert.alert("Coming Soon", "Diet type selection coming soon")}
          />
          <SettingItem
            icon="alert-circle-outline"
            title="Allergies"
            subtitle="Food allergies and intolerances"
            value="None"
            onPress={() => Alert.alert("Coming Soon", "Allergy settings coming soon")}
          />
          <SettingItem
            icon="ban-outline"
            title="Food Restrictions"
            subtitle="Foods to avoid"
            value="None"
            onPress={() => Alert.alert("Coming Soon", "Restrictions coming soon")}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="MEAL PLANNING" />
          <SettingItem
            icon="time-outline"
            title="Meals Per Day"
            subtitle="Number of meals you eat daily"
            value="3 meals"
            onPress={() => Alert.alert("Coming Soon", "Meal planning coming soon")}
          />
          <SettingItem
            icon="calendar-outline"
            title="Meal Timing"
            subtitle="Preferred eating schedule"
            onPress={() => Alert.alert("Coming Soon", "Meal timing coming soon")}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: { color: TEXT, fontSize: 20, fontWeight: "800" },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16 },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sectionHeader: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 12,
    marginLeft: 4,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  settingLeft: { flexDirection: "row", alignItems: "center", flex: 1, marginRight: 12 },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SUCCESS + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },
  settingSubtitle: { color: MUTED, fontSize: 13, marginTop: 2 },
  valueText: { color: MUTED, fontSize: 14, fontWeight: "600" },
});