import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";

export default function HomeScreen({ route, navigation }) {
  const email = route.params?.email || "shenal@example.com";
  const userName = email.split("@")[0] || "Shenal";

  const ProgressBar = ({ progress, color = "#10B981" }) => (
    <View style={styles.progressBarContainer}>
      <View style={[styles.progressBar, { width: `${progress}%`, backgroundColor: color }]} />
    </View>
  );

  const MacroItem = ({ label, current, total, unit }) => (
    <View style={styles.macroItem}>
      <Text style={styles.macroLabel}>{label}</Text>
      <Text style={styles.macroValue}>
        {current}{unit} / {total}{unit}
      </Text>
    </View>
  );

  const MealItem = ({ meal, description, calories }) => (
    <View style={styles.mealItem}>
      <View style={styles.mealInfo}>
        <Text style={styles.mealName}>{meal}</Text>
        <Text style={styles.mealDescription}>{description}</Text>
      </View>
      <Text style={styles.mealCalories}>{calories} kcal</Text>
    </View>
  );

  const AlertItem = ({ icon, message, type = "warning" }) => (
    <View style={styles.alertItem}>
      <Text style={styles.alertIcon}>{icon}</Text>
      <Text style={[styles.alertText, type === "info" && styles.alertTextInfo]}>
        {message}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor="#1E293B" />
      
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.profileSection}>
          <View style={styles.profilePic}>
            <Text style={styles.profileInitial}>{userName.charAt(0).toUpperCase()}</Text>
          </View>
          <View style={styles.greeting}>
            <Text style={styles.greetingText}>Hi, {userName} 👋</Text>
            <Text style={styles.goalText}>Goal: 1200 kcal left</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Daily Progress */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>📊</Text>
            <Text style={styles.cardTitle}>Daily Progress</Text>
          </View>
          
          <View style={styles.caloriesSection}>
            <Text style={styles.caloriesText}>Calories: 850 / 2000 kcal</Text>
            <ProgressBar progress={42.5} />
          </View>
          
          <View style={styles.macrosRow}>
            <MacroItem label="Carbs" current={120} total={250} unit="g" />
            <MacroItem label="Protein" current={60} total={150} unit="g" />
            <MacroItem label="Fats" current={40} total={65} unit="g" />
          </View>
          
          <View style={styles.stepsSection}>
            <Text style={styles.stepsText}>Steps: 6,200 / 10,000</Text>
            <ProgressBar progress={62} color="#3B82F6" />
          </View>
        </View>

        {/* Goals Tracking */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🎯</Text>
            <Text style={styles.cardTitle}>Goals Tracking</Text>
          </View>
          
          <View style={styles.weightSection}>
            <View style={styles.weightRow}>
              <Text style={styles.weightLabel}>Current Weight:</Text>
              <Text style={styles.weightValue}>72kg</Text>
            </View>
            <View style={styles.weightRow}>
              <Text style={styles.weightLabel}>Target:</Text>
              <Text style={styles.weightValue}>68kg</Text>
            </View>
            <View style={styles.progressSection}>
              <Text style={styles.progressLabel}>Progress: 70%</Text>
              <ProgressBar progress={70} color="#10B981" />
            </View>
          </View>
        </View>

        {/* Today's Plan */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🍴</Text>
            <Text style={styles.cardTitle}>Today's Plan</Text>
          </View>
          
          <MealItem 
            meal="Breakfast" 
            description="Oats + Banana" 
            calories="350" 
          />
          <MealItem 
            meal="Lunch" 
            description="Grilled Chicken + Rice" 
            calories="550" 
          />
          <MealItem 
            meal="Dinner" 
            description="Veggie Soup" 
            calories="300" 
          />
          
          <TouchableOpacity style={styles.addFoodBtn}>
            <Ionicons name="add-circle-outline" size={20} color="#10B981" />
            <Text style={styles.addFoodText}>Add / Scan Food</Text>
          </TouchableOpacity>
        </View>

        {/* Coach Section */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>👨‍🏫</Text>
            <Text style={styles.cardTitle}>Coach Section</Text>
          </View>
          
          <View style={styles.coachInfo}>
            <Text style={styles.coachName}>Coach: John D.</Text>
            <View style={styles.coachActions}>
              <TouchableOpacity style={styles.coachBtn}>
                <Text style={styles.coachBtnIcon}>📩</Text>
                <Text style={styles.coachBtnText}>Message</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.coachBtn}>
                <Text style={styles.coachBtnIcon}>📌</Text>
                <Text style={styles.coachBtnText}>Notes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Health Alerts */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Text style={styles.cardIcon}>🔔</Text>
            <Text style={styles.cardTitle}>Health Alerts</Text>
          </View>
          
          <AlertItem 
            icon="⚠️" 
            message="Sugar intake exceeded (45g / 35g)" 
            type="warning" 
          />
          <AlertItem 
            icon="💧" 
            message="Drink 2 more glasses of water today" 
            type="info" 
          />
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="home" size={24} color="#10B981" />
          <Text style={[styles.navText, styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="scan-outline" size={24} color="#64748B" />
          <Text style={styles.navText}>Scan Food</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="bar-chart-outline" size={24} color="#64748B" />
          <Text style={styles.navText}>Progress</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={24} color="#64748B" />
          <Text style={styles.navText}>Coach</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.navItem}
          onPress={() => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] })}
        >
          <Ionicons name="settings-outline" size={24} color="#64748B" />
          <Text style={styles.navText}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  header: {
    backgroundColor: "#1E293B",
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 24,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },
  profilePic: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#10B981",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  profileInitial: {
    color: "#FFFFFF",
    fontSize: 20,
    fontWeight: "bold",
  },
  greeting: {
    flex: 1,
  },
  greetingText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  goalText: {
    color: "#64748B",
    fontSize: 14,
    marginTop: 2,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  card: {
    backgroundColor: "#1E293B",
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  cardIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  cardTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
  caloriesSection: {
    marginBottom: 16,
  },
  caloriesText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: "#334155",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBar: {
    height: "100%",
    borderRadius: 4,
  },
  macrosRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  macroItem: {
    alignItems: "center",
  },
  macroLabel: {
    color: "#64748B",
    fontSize: 12,
    marginBottom: 4,
  },
  macroValue: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  stepsSection: {
    marginTop: 8,
  },
  stepsText: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  weightSection: {
    gap: 12,
  },
  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weightLabel: {
    color: "#64748B",
    fontSize: 14,
  },
  weightValue: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  progressSection: {
    marginTop: 8,
  },
  progressLabel: {
    color: "#FFFFFF",
    fontSize: 14,
    marginBottom: 8,
  },
  mealItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#334155",
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  mealDescription: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 2,
  },
  mealCalories: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
  },
  addFoodBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingVertical: 12,
    backgroundColor: "#0F172A",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10B981",
  },
  addFoodText: {
    color: "#10B981",
    fontSize: 14,
    fontWeight: "500",
    marginLeft: 8,
  },
  coachInfo: {
    gap: 16,
  },
  coachName: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "500",
  },
  coachActions: {
    flexDirection: "row",
    gap: 12,
  },
  coachBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#0F172A",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    flex: 1,
    justifyContent: "center",
  },
  coachBtnIcon: {
    fontSize: 16,
    marginRight: 6,
  },
  coachBtnText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "500",
  },
  alertItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  alertIcon: {
    fontSize: 16,
    marginRight: 12,
  },
  alertText: {
    color: "#EF4444",
    fontSize: 14,
    flex: 1,
  },
  alertTextInfo: {
    color: "#3B82F6",
  },
  bottomNav: {
    flexDirection: "row",
    backgroundColor: "#1E293B",
    paddingTop: 12,
    paddingBottom: 28,
    paddingHorizontal: 12,
    borderTopWidth: 1,
    borderTopColor: "#334155",
  },
  navItem: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 8,
  },
  navText: {
    color: "#64748B",
    fontSize: 12,
    marginTop: 4,
  },
  navTextActive: {
    color: "#10B981",
  },
});