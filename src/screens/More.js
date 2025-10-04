import React from "react";
import { ScrollView, View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const MENU_ITEMS = [
  { title: "Account", description: "Manage personal information", route: "AccountSettings" },
  { title: "Notifications", description: "Update alert preferences", route: "NotificationSettings" },
  { title: "Goals", description: "Review fitness goals", route: "ProfileGoalsSettings" },
  { title: "Nutrition", description: "Adjust nutrition targets", route: "NutritionSettings" },
  { title: "Units & Display", description: "Change measurement units", route: "UnitsDisplaySettings" },
  { title: "Privacy & Data", description: "Control data usage", route: "PrivacyDataSettings" },
  { title: "Support", description: "Get help or contact support", route: "SupportSettings" },
  { title: "About", description: "Learn more about VitaRogue", route: "AboutSettings" },
];

function MenuButton({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.menuButton} onPress={() => onPress(item.route)}>
      <View>
        <Text style={styles.menuTitle}>{item.title}</Text>
        <Text style={styles.menuDescription}>{item.description}</Text>
      </View>
      <Text style={styles.arrow}>{">"}</Text>
    </TouchableOpacity>
  );
}

export default function MoreScreen({ navigation }) {
  return (
    <SafeAreaView style={styles.safeArea} edges={["top", "left", "right"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.header}>More Options</Text>
        {MENU_ITEMS.map((item) => (
          <MenuButton key={item.route} item={item} onPress={(route) => navigation.navigate(route)} />
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#0b1220",
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  header: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f9fafb",
    marginBottom: 20,
  },
  menuButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#111827",
    borderRadius: 16,
    paddingHorizontal: 18,
    paddingVertical: 16,
    marginBottom: 14,
  },
  menuTitle: {
    color: "#f9fafb",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
  },
  menuDescription: {
    color: "#9ca3af",
    fontSize: 14,
  },
  arrow: {
    color: "#34d399",
    fontSize: 20,
    fontWeight: "600",
    marginLeft: 12,
  },
});
