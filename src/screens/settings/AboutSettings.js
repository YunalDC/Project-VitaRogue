import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  Linking,
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

export default function AboutSettings({ navigation }) {
  const APP_VERSION = "1.0.0";
  const BUILD_NUMBER = "100";

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true }) => (
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
      {showArrow && <Ionicons name="chevron-forward" size={20} color={MUTED} />}
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
        <Text style={styles.headerTitle}>About</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* App Info Card */}
        <View style={styles.appInfoCard}>
          <View style={styles.appIcon}>
            <Ionicons name="fitness" size={48} color={SUCCESS} />
          </View>
          <Text style={styles.appName}>VitaRogue</Text>
          <Text style={styles.appTagline}>Your Personal Fitness Companion</Text>
          <View style={styles.versionContainer}>
            <Text style={styles.versionText}>Version {APP_VERSION}</Text>
            <View style={styles.versionDot} />
            <Text style={styles.versionText}>Build {BUILD_NUMBER}</Text>
          </View>
        </View>

        {/* App Info */}
        <View style={styles.card}>
          <SectionHeader title="APP INFORMATION" />
          <SettingItem
            icon="document-text-outline"
            title="What's New"
            subtitle="See the latest updates and features"
            onPress={() => Alert.alert("Coming Soon", "Changelog coming soon")}
          />
          <SettingItem
            icon="shield-checkmark-outline"
            title="Privacy Policy"
            subtitle="How we protect your data"
            onPress={() => Alert.alert("Coming Soon", "Privacy policy page coming soon")}
          />
          <SettingItem
            icon="newspaper-outline"
            title="Terms of Service"
            subtitle="Terms and conditions"
            onPress={() => Alert.alert("Coming Soon", "Terms page coming soon")}
          />
          <SettingItem
            icon="code-slash-outline"
            title="Open Source Licenses"
            subtitle="Third-party libraries we use"
            onPress={() => Alert.alert("Coming Soon", "Licenses page coming soon")}
          />
        </View>

        {/* Social & Web */}
        <View style={styles.card}>
          <SectionHeader title="CONNECT WITH US" />
          <SettingItem
            icon="globe-outline"
            title="Website"
            subtitle="www.vitarogue.com"
            onPress={() => Linking.openURL('https://vitarogue.com')}
          />
          <SettingItem
            icon="logo-twitter"
            title="Twitter"
            subtitle="@VitaRogue"
            onPress={() => Linking.openURL('https://twitter.com/vitarogue')}
          />
          <SettingItem
            icon="logo-instagram"
            title="Instagram"
            subtitle="@vitarogue"
            onPress={() => Linking.openURL('https://instagram.com/vitarogue')}
          />
          <SettingItem
            icon="logo-youtube"
            title="YouTube"
            subtitle="VitaRogue Official"
            onPress={() => Linking.openURL('https://youtube.com/@vitarogue')}
          />
        </View>

        {/* Credits */}
        <View style={styles.card}>
          <SectionHeader title="CREDITS" />
          <SettingItem
            icon="people-outline"
            title="Development Team"
            subtitle="Meet the creators"
            onPress={() => Alert.alert("Team", "Built with ❤️ by the VitaRogue team")}
            showArrow={false}
          />
          <SettingItem
            icon="heart-outline"
            title="Acknowledgments"
            subtitle="Special thanks to our contributors"
            onPress={() => Alert.alert("Thanks", "Thank you to all our beta testers and contributors!")}
            showArrow={false}
          />
        </View>

        {/* Legal */}
        <View style={styles.legalCard}>
          <Text style={styles.legalText}>
            © 2024 VitaRogue. All rights reserved.
          </Text>
          <Text style={styles.legalSubtext}>
            Made with passion for health and fitness
          </Text>
        </View>

        {/* Debug Info (only in development) */}
        {__DEV__ && (
          <View style={styles.debugCard}>
            <Text style={styles.debugTitle}>Debug Info</Text>
            <Text style={styles.debugText}>Platform: {Platform.OS}</Text>
            <Text style={styles.debugText}>Version: {Platform.Version}</Text>
            <Text style={styles.debugText}>Environment: Development</Text>
          </View>
        )}

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
  appInfoCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 32,
    marginBottom: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: SUCCESS + '20',
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  appName: {
    color: TEXT,
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 4,
  },
  appTagline: {
    color: MUTED,
    fontSize: 14,
    marginBottom: 16,
    textAlign: "center",
  },
  versionContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  versionText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  versionDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: MUTED,
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
  legalCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 16,
  },
  legalText: {
    color: MUTED,
    fontSize: 12,
    textAlign: "center",
    marginBottom: 4,
  },
  legalSubtext: {
    color: MUTED,
    fontSize: 11,
    textAlign: "center",
  },
  debugCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#334155",
  },
  debugTitle: {
    color: "#f59e0b",
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  debugText: {
    color: MUTED,
    fontSize: 12,
    marginBottom: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
});