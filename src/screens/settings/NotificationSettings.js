import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
  Switch,
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

export default function NotificationSettings({ navigation }) {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [mealReminders, setMealReminders] = useState(true);
  const [breakfastTime, setBreakfastTime] = useState("08:00");
  const [lunchTime, setLunchTime] = useState("12:30");
  const [dinnerTime, setDinnerTime] = useState("19:00");
  const [waterReminders, setWaterReminders] = useState(false);
  const [exerciseReminders, setExerciseReminders] = useState(true);
  const [weeklyProgress, setWeeklyProgress] = useState(true);
  const [achievements, setAchievements] = useState(true);

  const ToggleItem = ({ icon, title, subtitle, value, onValueChange, disabled = false }) => (
    <View style={[styles.settingItem, disabled && { opacity: 0.5 }]}>
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={SUCCESS} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>{title}</Text>
          {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
        </View>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: "#374151", true: SUCCESS + '80' }}
        thumbColor={value ? SUCCESS : "#9ca3af"}
        ios_backgroundColor="#374151"
        disabled={disabled}
      />
    </View>
  );

  const TimeSettingItem = ({ icon, title, time, onPress, disabled = false }) => (
    <TouchableOpacity
      style={[styles.settingItem, disabled && { opacity: 0.5 }]}
      onPress={disabled ? null : onPress}
      activeOpacity={0.7}
      disabled={disabled}
    >
      <View style={styles.settingLeft}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={SUCCESS} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.settingTitle}>{title}</Text>
        </View>
      </View>
      <View style={styles.timeContainer}>
        <Text style={styles.timeText}>{time}</Text>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Master Toggle */}
        <View style={styles.card}>
          <SectionHeader title="GENERAL" />
          <ToggleItem
            icon="notifications-outline"
            title="Push Notifications"
            subtitle="Enable all push notifications"
            value={pushNotifications}
            onValueChange={setPushNotifications}
          />
        </View>

        {/* Meal Reminders */}
        <View style={styles.card}>
          <SectionHeader title="MEAL REMINDERS" />
          <ToggleItem
            icon="restaurant-outline"
            title="Meal Reminders"
            subtitle="Get reminded to log your meals"
            value={mealReminders}
            onValueChange={setMealReminders}
            disabled={!pushNotifications}
          />
          <TimeSettingItem
            icon="sunny-outline"
            title="Breakfast"
            time={breakfastTime}
            onPress={() => {}}
            disabled={!pushNotifications || !mealReminders}
          />
          <TimeSettingItem
            icon="partly-sunny-outline"
            title="Lunch"
            time={lunchTime}
            onPress={() => {}}
            disabled={!pushNotifications || !mealReminders}
          />
          <TimeSettingItem
            icon="moon-outline"
            title="Dinner"
            time={dinnerTime}
            onPress={() => {}}
            disabled={!pushNotifications || !mealReminders}
          />
        </View>

        {/* Activity Reminders */}
        <View style={styles.card}>
          <SectionHeader title="ACTIVITY" />
          <ToggleItem
            icon="water-outline"
            title="Water Reminders"
            subtitle="Stay hydrated throughout the day"
            value={waterReminders}
            onValueChange={setWaterReminders}
            disabled={!pushNotifications}
          />
          <ToggleItem
            icon="fitness-outline"
            title="Exercise Reminders"
            subtitle="Get reminded to work out"
            value={exerciseReminders}
            onValueChange={setExerciseReminders}
            disabled={!pushNotifications}
          />
        </View>

        {/* Progress & Achievements */}
        <View style={styles.card}>
          <SectionHeader title="UPDATES" />
          <ToggleItem
            icon="stats-chart-outline"
            title="Weekly Progress"
            subtitle="Receive weekly summary reports"
            value={weeklyProgress}
            onValueChange={setWeeklyProgress}
            disabled={!pushNotifications}
          />
          <ToggleItem
            icon="trophy-outline"
            title="Achievement Badges"
            subtitle="Get notified when you hit milestones"
            value={achievements}
            onValueChange={setAchievements}
            disabled={!pushNotifications}
          />
        </View>

        {/* Do Not Disturb */}
        <View style={styles.card}>
          <SectionHeader title="QUIET HOURS" />
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={MUTED} />
            <Text style={styles.infoText}>
              Set quiet hours to pause notifications during specific times
            </Text>
          </View>
          <TimeSettingItem
            icon="moon-outline"
            title="Start Time"
            time="22:00"
            onPress={() => {}}
            disabled={!pushNotifications}
          />
          <TimeSettingItem
            icon="sunny-outline"
            title="End Time"
            time="07:00"
            onPress={() => {}}
            disabled={!pushNotifications}
          />
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  headerTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "800",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
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
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SUCCESS + '20',
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  settingTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
  },
  settingSubtitle: {
    color: MUTED,
    fontSize: 13,
    marginTop: 2,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  timeText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "600",
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: BORDER,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    gap: 10,
  },
  infoText: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
  },
});