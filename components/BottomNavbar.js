import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/** Theme Colors */
const COLORS = {
  bg: "#0B1220",
  card: "#111827",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  primary: "#10B981",
  inactive: "#64748B",
};

const BottomNavbar = ({ 
  activeTab = "home", 
  onTabPress = () => {},
  onCameraPress = () => {},
  style 
}) => {
  const insets = useSafeAreaInsets();
  
  // Dynamic bottom padding based on device
  const bottomPadding = Math.max(insets.bottom, Platform.OS === "ios" ? 16 : 12);
  
  const NavButton = ({ icon, label, tabKey, active }) => (
    <TouchableOpacity
      style={styles.navItem}
      onPress={() => onTabPress(tabKey)}
      activeOpacity={0.7}
      accessible={true}
      accessibilityLabel={`${label} tab`}
      accessibilityRole="button"
    >
      <Ionicons 
        name={icon} 
        size={Platform.OS === "ios" ? 24 : 22} 
        color={active ? COLORS.primary : COLORS.inactive} 
      />
      <Text style={[
        styles.navText, 
        active && { color: COLORS.primary },
        Platform.OS === "android" && { fontSize: 10 }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  const handleCameraPress = () => {
    if (onCameraPress) {
      onCameraPress();
    } else {
      Alert.alert(
        "Camera Feature", 
        "Take a photo to log your food or scan nutrition labels!",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Open Camera", onPress: () => console.log("Camera opened") }
        ]
      );
    }
  };

  return (
    <View style={[
      styles.bottomBar,
      { 
        paddingBottom: bottomPadding,
        height: 72 + bottomPadding
      },
      style
    ]}>
      {/* Navigation Items */}
      <NavButton 
        icon="home" 
        label="Dashboard" 
        tabKey="home"
        active={activeTab === "home"} 
      />
      
      <NavButton 
        icon="book-outline" 
        label="Diary" 
        tabKey="diary"
        active={activeTab === "diary"} 
      />

      {/* Center Camera FAB */}
      <TouchableOpacity
        onPress={handleCameraPress}
        activeOpacity={0.8}
        style={[
          styles.fab,
          Platform.OS === "android" && styles.fabAndroid
        ]}
        accessible={true}
        accessibilityLabel="Take photo"
        accessibilityRole="button"
      >
        <Ionicons 
          name="camera" 
          size={Platform.OS === "ios" ? 26 : 24} 
          color={COLORS.bg} 
        />
      </TouchableOpacity>

      <NavButton 
        icon="stats-chart-outline" 
        label="Progress" 
        tabKey="progress"
        active={activeTab === "progress"} 
      />
      
      <NavButton 
        icon="ellipsis-horizontal" 
        label="More" 
        tabKey="more"
        active={activeTab === "more"} 
      />
    </View>
  );
};

const styles = StyleSheet.create({
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0e1626",
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-around",
    paddingHorizontal: 8,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    paddingVertical: 4,
    minHeight: 48,
  },
  
  navText: {
    color: COLORS.inactive,
    fontSize: 11,
    marginTop: 4,
    fontWeight: Platform.OS === "ios" ? "500" : "400",
    textAlign: "center",
  },

  fab: {
    position: "absolute",
    top: -28,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.25,
        shadowOffset: { width: 0, height: 4 },
        shadowRadius: 12,
      },
      android: {
        elevation: 6,
      },
    }),
  },
  
  fabAndroid: {
    // Additional Android-specific FAB styling if needed
    borderWidth: 0.5,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
});

export default BottomNavbar;