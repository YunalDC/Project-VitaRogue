import React, { useState, useEffect } from "react";
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
import { getAuth } from "firebase/auth";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { db } from "../../lib/firebaseApp";

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";

export default function ProfileGoalsSettings({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    if (!user) return;
    try {
      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setProfile(docSnap.data()?.profile || {});
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    }
  };

  const SettingItem = ({ icon, title, value, onPress, showArrow = true }) => (
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
          {value && <Text style={styles.settingValue}>{value}</Text>}
        </View>
      </View>
      {showArrow && <Ionicons name="chevron-forward" size={20} color={MUTED} />}
    </TouchableOpacity>
  );

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const getGenderDisplay = () => {
    if (!profile?.gender) return "Not set";
    return profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1);
  };

  const getActivityDisplay = () => {
    if (!profile?.fitnessLevel) return "Not set";
    return profile.fitnessLevel;
  };

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
        <Text style={styles.headerTitle}>Profile & Goals</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate("Onboarding")}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.editButton}>Edit All</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <View style={styles.card}>
          <SectionHeader title="PERSONAL INFORMATION" />
          <SettingItem
            icon="person-outline"
            title="First Name"
            value={profile?.firstName || "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit name feature coming soon")}
          />
          <SettingItem
            icon="calendar-outline"
            title="Age"
            value={profile?.age ? `${profile.age} years` : "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit age feature coming soon")}
          />
          <SettingItem
            icon="male-female-outline"
            title="Gender"
            value={getGenderDisplay()}
            onPress={() => Alert.alert("Coming Soon", "Edit gender feature coming soon")}
          />
          <SettingItem
            icon="resize-outline"
            title="Height"
            value={profile?.heightCm ? `${profile.heightCm} cm` : "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit height feature coming soon")}
          />
          <SettingItem
            icon="barbell-outline"
            title="Current Weight"
            value={profile?.weightKg ? `${profile.weightKg} kg` : "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit weight feature coming soon")}
          />
        </View>

        {/* Fitness Goals */}
        <View style={styles.card}>
          <SectionHeader title="FITNESS GOALS" />
          <SettingItem
            icon="trophy-outline"
            title="Weight Goal"
            value={profile?.weightGoal || "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit weight goal feature coming soon")}
          />
          <SettingItem
            icon="flag-outline"
            title="Target Weight"
            value={profile?.targetWeight ? `${profile.targetWeight} kg` : "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit target weight feature coming soon")}
          />
          <SettingItem
            icon="trending-down-outline"
            title="Weekly Goal"
            value="Lose 0.5 kg/week"
            onPress={() => Alert.alert("Coming Soon", "Edit weekly goal feature coming soon")}
          />
        </View>

        {/* Activity Level */}
        <View style={styles.card}>
          <SectionHeader title="ACTIVITY LEVEL" />
          <SettingItem
            icon="walk-outline"
            title="Current Activity Level"
            value={getActivityDisplay()}
            onPress={() => Alert.alert("Coming Soon", "Edit activity level feature coming soon")}
          />
          
          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={MUTED} />
            <View style={{ flex: 1 }}>
              <Text style={styles.infoTitle}>Activity Level Guide:</Text>
              <Text style={styles.infoText}>• Sedentary: Little to no exercise</Text>
              <Text style={styles.infoText}>• Light: Exercise 1-3 days/week</Text>
              <Text style={styles.infoText}>• Moderate: Exercise 3-5 days/week</Text>
              <Text style={styles.infoText}>• Very Active: Exercise 6-7 days/week</Text>
            </View>
          </View>
        </View>

        {/* Dietary Preferences */}
        <View style={styles.card}>
          <SectionHeader title="DIETARY PREFERENCES" />
          <SettingItem
            icon="restaurant-outline"
            title="Diet Type"
            value="Not set"
            onPress={() => Alert.alert("Coming Soon", "Diet preferences coming soon")}
          />
          <SettingItem
            icon="nutrition-outline"
            title="Food Allergies"
            value="None specified"
            onPress={() => Alert.alert("Coming Soon", "Allergy settings coming soon")}
          />
          <SettingItem
            icon="leaf-outline"
            title="Food Restrictions"
            value="None specified"
            onPress={() => Alert.alert("Coming Soon", "Restriction settings coming soon")}
          />
        </View>

        {/* Quick Stats */}
        <View style={styles.statsCard}>
          <SectionHeader title="CALCULATED METRICS" />
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.heightCm && profile?.weightKg
                  ? ((profile.weightKg / Math.pow(profile.heightCm / 100, 2))).toFixed(1)
                  : "--"}
              </Text>
              <Text style={styles.statLabel}>BMI</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>
                {profile?.age && profile?.weightKg && profile?.heightCm && profile?.gender
                  ? Math.round(
                      (10 * profile.weightKg + 6.25 * profile.heightCm - 5 * profile.age +
                        (profile.gender === "male" ? 5 : -161)) *
                        (profile.fitnessLevel === "Sedentary" ? 1.2 : 1.55)
                    )
                  : "--"}
              </Text>
              <Text style={styles.statLabel}>Daily Calories</Text>
            </View>
          </View>
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
  editButton: {
    color: SUCCESS,
    fontSize: 16,
    fontWeight: "600",
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
  statsCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: SUCCESS + '30',
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
  settingValue: {
    color: MUTED,
    fontSize: 14,
    marginTop: 2,
  },
  infoBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: BORDER,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
    gap: 10,
  },
  infoTitle: {
    color: TEXT,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  infoText: {
    color: MUTED,
    fontSize: 12,
    lineHeight: 18,
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
  },
  statItem: {
    flex: 1,
    backgroundColor: BG,
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    color: SUCCESS,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  statLabel: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
});