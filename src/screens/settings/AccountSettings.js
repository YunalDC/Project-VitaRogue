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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, signOut } from "firebase/auth";

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";
const DANGER = "#ef4444";

export default function AccountSettings({ navigation, route }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const category = route?.params?.category;

  const handleSignOut = () => {
    Alert.alert(
      "Sign Out",
      "Are you sure you want to sign out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: async () => {
            try {
              await signOut(auth);
            } catch (error) {
              Alert.alert("Error", "Failed to sign out. Please try again.");
            }
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Delete Account",
      "Are you sure you want to permanently delete your account? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Coming Soon", "This feature will be implemented soon.");
          },
        },
      ]
    );
  };

  const SettingItem = ({ icon, title, subtitle, onPress, showArrow = true, danger = false }) => (
    <TouchableOpacity
      style={styles.settingItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.settingLeft}>
        <View style={[styles.iconContainer, danger && { backgroundColor: DANGER + '20' }]}>
          <Ionicons name={icon} size={20} color={danger ? DANGER : SUCCESS} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.settingTitle, danger && { color: DANGER }]}>{title}</Text>
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

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Profile Section */}
        <View style={styles.card}>
          <SectionHeader title="PROFILE" />
          <SettingItem
            icon="person-outline"
            title="Name"
            subtitle={user?.displayName || "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit name feature coming soon")}
          />
          <SettingItem
            icon="mail-outline"
            title="Email"
            subtitle={user?.email || "Not set"}
            onPress={() => Alert.alert("Coming Soon", "Edit email feature coming soon")}
          />
          <SettingItem
            icon="camera-outline"
            title="Profile Photo"
            subtitle="Change your avatar"
            onPress={() => Alert.alert("Coming Soon", "Photo upload feature coming soon")}
          />
        </View>

        {/* Security Section */}
        <View style={styles.card}>
          <SectionHeader title="SECURITY" />
          <SettingItem
            icon="lock-closed-outline"
            title="Change Password"
            subtitle="Update your password"
            onPress={() => Alert.alert("Coming Soon", "Password change feature coming soon")}
          />
          <SettingItem
            icon="finger-print-outline"
            title="Two-Factor Authentication"
            subtitle="Add extra security"
            onPress={() => Alert.alert("Coming Soon", "2FA feature coming soon")}
          />
        </View>

        {/* Connected Accounts */}
        <View style={styles.card}>
          <SectionHeader title="CONNECTED ACCOUNTS" />
          <SettingItem
            icon="logo-google"
            title="Google"
            subtitle="Not connected"
            onPress={() => Alert.alert("Coming Soon", "Google connection coming soon")}
          />
          <SettingItem
            icon="logo-apple"
            title="Apple"
            subtitle="Not connected"
            onPress={() => Alert.alert("Coming Soon", "Apple connection coming soon")}
          />
          <SettingItem
            icon="logo-facebook"
            title="Facebook"
            subtitle="Not connected"
            onPress={() => Alert.alert("Coming Soon", "Facebook connection coming soon")}
          />
        </View>

        {/* Danger Zone */}
        <View style={styles.card}>
          <SectionHeader title="ACCOUNT ACTIONS" />
          <SettingItem
            icon="log-out-outline"
            title="Sign Out"
            subtitle="Log out of your account"
            onPress={handleSignOut}
            showArrow={false}
            danger
          />
          <SettingItem
            icon="trash-outline"
            title="Delete Account"
            subtitle="Permanently delete your account"
            onPress={handleDeleteAccount}
            showArrow={false}
            danger
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
});