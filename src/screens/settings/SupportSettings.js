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

export default function SupportSettings({ navigation }) {
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

  const SectionHeader = ({ title }) => (
    <Text style={styles.sectionHeader}>{title}</Text>
  );

  const handleEmailSupport = () => {
    Linking.openURL('mailto:support@vitarogue.com?subject=Support Request');
  };

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
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <SectionHeader title="GET HELP" />
          <SettingItem
            icon="book-outline"
            title="Help Center"
            subtitle="Browse help articles and FAQs"
            onPress={() => Alert.alert("Coming Soon", "Help center coming soon")}
          />
          <SettingItem
            icon="play-circle-outline"
            title="Tutorial"
            subtitle="Learn how to use the app"
            onPress={() => Alert.alert("Coming Soon", "Tutorial coming soon")}
          />
          <SettingItem
            icon="chatbubbles-outline"
            title="Live Chat"
            subtitle="Chat with our support team"
            onPress={() => Alert.alert("Coming Soon", "Live chat coming soon")}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="CONTACT US" />
          <SettingItem
            icon="mail-outline"
            title="Email Support"
            subtitle="support@vitarogue.com"
            onPress={handleEmailSupport}
          />
          <SettingItem
            icon="call-outline"
            title="Phone Support"
            subtitle="+1 (555) 123-4567"
            onPress={() => Linking.openURL('tel:+15551234567')}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="FEEDBACK" />
          <SettingItem
            icon="bug-outline"
            title="Report a Bug"
            subtitle="Help us fix issues"
            onPress={() => Alert.alert("Coming Soon", "Bug report form coming soon")}
          />
          <SettingItem
            icon="bulb-outline"
            title="Feature Request"
            subtitle="Suggest new features"
            onPress={() => Alert.alert("Coming Soon", "Feature request form coming soon")}
          />
          <SettingItem
            icon="star-outline"
            title="Rate the App"
            subtitle="Leave a review on the App Store"
            onPress={() => Alert.alert("Coming Soon", "Rate app feature coming soon")}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="COMMUNITY" />
          <SettingItem
            icon="logo-twitter"
            title="Follow us on Twitter"
            subtitle="@VitaRogue"
            onPress={() => Linking.openURL('https://twitter.com/vitarogue')}
          />
          <SettingItem
            icon="logo-instagram"
            title="Follow us on Instagram"
            subtitle="@vitarogue"
            onPress={() => Linking.openURL('https://instagram.com/vitarogue')}
          />
          <SettingItem
            icon="logo-facebook"
            title="Like us on Facebook"
            subtitle="VitaRogue"
            onPress={() => Linking.openURL('https://facebook.com/vitarogue')}
          />
        </View>

        {/* Quick Access Card */}
        <View style={styles.quickAccessCard}>
          <Ionicons name="headset-outline" size={32} color={SUCCESS} />
          <View style={{ flex: 1, marginLeft: 16 }}>
            <Text style={styles.quickAccessTitle}>Need Immediate Help?</Text>
            <Text style={styles.quickAccessText}>
              Our support team is available 24/7 to assist you with any questions or concerns.
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
  quickAccessCard: {
    backgroundColor: SUCCESS + '10',
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: SUCCESS + '30',
  },
  quickAccessTitle: { color: TEXT, fontSize: 18, fontWeight: "700", marginBottom: 6 },
  quickAccessText: { color: MUTED, fontSize: 14, lineHeight: 20 },
});