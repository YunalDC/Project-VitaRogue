import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Platform,
  StatusBar as RNStatusBar,
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

export default function UnitsDisplaySettings({ navigation }) {
  const [weightUnit, setWeightUnit] = useState("kg");
  const [heightUnit, setHeightUnit] = useState("cm");
  const [liquidUnit, setLiquidUnit] = useState("ml");
  const [energyUnit, setEnergyUnit] = useState("kcal");
  const [theme, setTheme] = useState("dark");

  const OptionSelector = ({ icon, title, options, selected, onSelect }) => (
    <View style={styles.optionBlock}>
      <View style={styles.optionHeader}>
        <View style={styles.iconContainer}>
          <Ionicons name={icon} size={20} color={SUCCESS} />
        </View>
        <Text style={styles.optionTitle}>{title}</Text>
      </View>
      <View style={styles.optionsRow}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.optionButton,
              selected === option.value && styles.optionButtonActive,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.optionText,
                selected === option.value && styles.optionTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
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
        <Text style={styles.headerTitle}>Units & Display</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.card}>
          <SectionHeader title="MEASUREMENT UNITS" />
          <OptionSelector
            icon="barbell-outline"
            title="Weight"
            options={[
              { label: "Kilograms", value: "kg" },
              { label: "Pounds", value: "lbs" },
            ]}
            selected={weightUnit}
            onSelect={setWeightUnit}
          />
          <OptionSelector
            icon="resize-outline"
            title="Height"
            options={[
              { label: "Centimeters", value: "cm" },
              { label: "Feet & Inches", value: "ft" },
            ]}
            selected={heightUnit}
            onSelect={setHeightUnit}
          />
          <OptionSelector
            icon="water-outline"
            title="Liquid"
            options={[
              { label: "Milliliters", value: "ml" },
              { label: "Fluid Oz", value: "floz" },
              { label: "Cups", value: "cups" },
            ]}
            selected={liquidUnit}
            onSelect={setLiquidUnit}
          />
          <OptionSelector
            icon="flame-outline"
            title="Energy"
            options={[
              { label: "Calories", value: "kcal" },
              { label: "Kilojoules", value: "kj" },
            ]}
            selected={energyUnit}
            onSelect={setEnergyUnit}
          />
        </View>

        <View style={styles.card}>
          <SectionHeader title="APPEARANCE" />
          <OptionSelector
            icon="color-palette-outline"
            title="Theme"
            options={[
              { label: "Dark", value: "dark" },
              { label: "Light", value: "light" },
              { label: "Auto", value: "auto" },
            ]}
            selected={theme}
            onSelect={setTheme}
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
  optionBlock: { marginBottom: 16 },
  optionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
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
  optionTitle: { color: TEXT, fontSize: 16, fontWeight: "600" },
  optionsRow: { flexDirection: "row", gap: 8, flexWrap: "wrap" },
  optionButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: BORDER,
    borderWidth: 1,
    borderColor: BORDER,
  },
  optionButtonActive: {
    backgroundColor: SUCCESS + '20',
    borderColor: SUCCESS,
  },
  optionText: { color: MUTED, fontSize: 14, fontWeight: "600" },
  optionTextActive: { color: SUCCESS },
});