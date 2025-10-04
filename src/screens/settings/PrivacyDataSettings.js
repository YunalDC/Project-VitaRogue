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

export default function PrivacyDataSettings({ navigation }) {
  const [dataSync, setDataSync] = useState(true);
  const [analytics, setAnalytics] = useState(true);
  const [healthAppSync, setHealthAppSync] = useState(false);

  const SettingItem = ({ icon, title, subtitle, onPress }) => (
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
      <Ionicons name="chevron-forward" size={20} color={MUTED} />
    </TouchableOpacity>
  );

  const ToggleItem = ({ icon, title, subtitle, value, onValueChange }) => (
    <View style={styles.settingItem}>
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
      />
    </View>
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
        <Text style={styles.headerTitle}>Privacy & Data</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <SectionHeader title="DATA SYNC" />
          <ToggleItem
            icon="cloud-outline"
            title="Cloud Backup"
            subtitle="Sync your data across devices"
            value={dataSync}
            onValueChange={setDataSync}
          />
          <ToggleItem
            icon="fitness-outline"
            title="Health App Integration"
            subtitle="Sync with Apple Health / Google Fit"
            value={healthAppSync}
            onValueChange={setHealthAppSync}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="DATA MANAGEMENT" />
          <SettingItem
            icon="download-outline"
            title="Export Data"
            subtitle="Download your data as CSV"
            onPress={() => Alert.alert("Coming Soon", "Export feature coming soon")}
          />
          <SettingItem
            icon="trash-outline"
            title="Clear Cache"
            subtitle="Free up storage space"
            onPress={() => {
              Alert.alert(
                "Clear Cache",
                "Are you sure you want to clear cached data?",
                [
                  { text: "Cancel", style: "cancel" },
                  { text: "Clear", onPress: () => Alert.alert("Success", "Cache cleared") }
                ]
              );
            }}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="PRIVACY" />
          <ToggleItem
            icon="analytics-outline"
            title="Usage Analytics"
            subtitle="Help improve the app with anonymous data"
            value={analytics}
            onValueChange={setAnalytics}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="Read our privacy policy"
            onPress={() => Alert.alert("Privacy Policy", "Privacy policy page coming soon")}
          />
          <SettingItem
            icon="document-text-outline"
            title="Terms of Service"
            subtitle="Read our terms"
            onPress={() => Alert.alert("Terms", "Terms of service page coming soon")}
          />
        </View>

        <View style={styles.infoCard}>
          <Ionicons name="information-circle" size={24} color={SUCCESS} />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.infoTitle}>Your Data is Safe</Text>
            <Text style={styles.infoText}>
              We use industry-standard encryption to protect your personal information. 
              Your data is never shared with third parties without your consent.
            </Text>
          </View>
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
  infoCard: {
    backgroundColor: SUCCESS + '10',
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: SUCCESS + '30',
  },
  infoTitle: { color: TEXT, fontSize: 16, fontWeight: "700", marginBottom: 6 },
  infoText: { color: MUTED, fontSize: 13, lineHeight: 18 },
});