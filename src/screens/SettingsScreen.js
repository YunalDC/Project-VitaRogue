import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Switch,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { signOut } from "firebase/auth";
import { firebaseAuth } from "../lib/firebaseApp";

const COLORS = {
  bg: "#0B1220",
  card: "#111827",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  primary: "#10B981",
  danger: "#ef4444",
};

export default function SettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(true);
  const [metricUnits, setMetricUnits] = useState(true);
  const [coachTips, setCoachTips] = useState(true);

  const onLogout = async () => {
    try {
      await signOut(firebaseAuth);
      // Auth state listener will reroute to the auth stack once signOut completes.
    } catch {
      // no-op; your auth gate will still handle state
    }
  };

  const Row = ({ icon, label, right }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {right}
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()} accessibilityLabel="Go back">
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Preferences */}
        <View style={styles.card}>
          <Text style={styles.section}>Preferences</Text>

          <Row
            icon="notifications-outline"
            label="Push notifications"
            right={<Switch value={notifications} onValueChange={setNotifications} />}
          />

          <Row
            icon="swap-vertical-outline"
            label={`Units: ${metricUnits ? "Metric (kg, cm)" : "Imperial (lb, in)"}`}
            right={<Switch value={metricUnits} onValueChange={setMetricUnits} />}
          />

          <Row
            icon="bulb-outline"
            label="Coach tips & nudges"
            right={<Switch value={coachTips} onValueChange={setCoachTips} />}
          />
        </View>

        {/* Account */}
        <View style={styles.card}>
          <Text style={styles.section}>Account</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("Onboarding")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-circle-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Edit profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("CoachMarket")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="people-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Find a coach</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* App sections */}
        <View style={styles.card}>
          <Text style={styles.section}>App settings</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("AccountSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="person-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Account settings</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("ProfileGoalsSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="trophy-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Goals & profile</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("NutritionSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="restaurant-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Nutrition preferences</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("NotificationSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="notifications-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Notifications</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("UnitsDisplaySettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="speedometer-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Units & display</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("PrivacyDataSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="shield-checkmark-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Privacy & data</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("SupportSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="help-circle-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>Support & help</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => navigation.navigate("AboutSettings")}
          >
            <View style={styles.rowLeft}>
              <Ionicons name="information-circle-outline" size={18} color={COLORS.muted} style={{ marginRight: 10 }} />
              <Text style={styles.rowLabel}>About VitaRogue</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={COLORS.muted} />
          </TouchableOpacity>
        </View>

        {/* Danger / Auth */}
        <View style={styles.card}>
          <Text style={styles.section}>Authentication</Text>
          <TouchableOpacity style={styles.logoutBtn} onPress={onLogout} accessibilityLabel="Log out">
            <Ionicons name="log-out-outline" size={18} color="white" />
            <Text style={styles.logoutText}>Log out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: COLORS.text, fontWeight: "800", fontSize: 18 },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 12,
    marginBottom: 16,
  },
  section: { color: COLORS.muted, fontWeight: "700", fontSize: 12, marginBottom: 8 },
  row: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  linkRow: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLeft: { flexDirection: "row", alignItems: "center" },
  rowLabel: { color: COLORS.text, fontWeight: "600", fontSize: 14 },
  logoutBtn: {
    marginTop: 8,
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
  },
  logoutText: { color: "white", fontWeight: "800", fontSize: 14 },
});
