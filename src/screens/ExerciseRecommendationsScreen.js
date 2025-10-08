// src/screens/ExerciseRecommendationsScreen.js
import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  RefreshControl,
  Modal,
  Animated,
  Easing,
  Platform,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { WORKOUT_DATA } from "../data/workoutData";
import { useUserDoc } from "../hooks/useUserDoc";

const { width } = Dimensions.get("window");

// Theme (aligned with your Home screen)
const BG = "#0B1220";
const CARD = "#111827";
const CARD2 = "#0f172a";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const ACCENT = "#10B981";
const INFO = "#0ea5e9";
const WARN = "#f59e0b";

export default function ExerciseRecommendationsScreen({ navigation }) {
  // ----- State
  const insets = useSafeAreaInsets();
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(false);
  const { userDoc } = useUserDoc();

  // Get user's calorie data and goals
  const userGoal = userDoc?.weightGoal || userDoc?.goal || "Weight Loss";
  const dailyCalorieGoal = userDoc?.calorieGoal || userDoc?.dailyCalories || 2000;
  const todayCalories = userDoc?.todayCalories || 0; // This would come from daily tracking
  
  // Calculate calorie status
  const caloriesSurplus = todayCalories - dailyCalorieGoal;
  const isOnTrack = Math.abs(caloriesSurplus) <= 100; // Within 100 calories is "on track"

  // Map user goals to workout categories
  const goalToCategory = {
    "Weight Loss": "Weight Loss",
    "Weight Gain": "Weight Gain", 
    "Muscle Building": "Weight Gain",
    "Stamina": "Stamina",
    "Good Body Shape": "Good Body Shape",
    "Flexibility": "Streach & Strengthen",
    "Cardio": "Full Body Cardio"
  };

  // Categories based on available workout data
  const categories = [
    "All",
    "Weight Loss", 
    "Weight Gain",
    "Stamina",
    "Good Body Shape", 
    "Streach & Strengthen",
    "Full Body Cardio",
    "Dumbbell Workouts",
    "Recovery Stretches",
    "Morning Stretches",
    "Hard Cardio Blast Workouts",
    "Kettlebell Workouts"
  ];

  // Get exercises based on user's goal and selected category
  const exercises = useMemo(() => {
    let targetCategory = selectedCategory;
    
    // If "All" is selected, prioritize user's goal category
    if (selectedCategory === "All") {
      targetCategory = goalToCategory[userGoal] || "Weight Loss";
    }
    
    const workoutCategory = WORKOUT_DATA[targetCategory] || WORKOUT_DATA["Weight Loss"];
    
    // Transform workout data to match expected format
    return workoutCategory.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      caloriesBurn: getCalorieBurnEstimate(exercise, userDoc),
      duration: getDurationEstimate(exercise),
      difficulty: getDifficultyLevel(exercise),
      category: targetCategory,
      isAccessible: checkAccessibility(exercise),
      image: exercise.image,
      instructions: exercise.instructions,
      targetedMuscles: exercise.targeted_muscles,
      positiveEffects: exercise.positive_effects
    }));
  }, [selectedCategory, userGoal, userDoc]);

  // Helper functions
  function getCalorieBurnEstimate(exercise, userDoc) {
    const baseCalories = {
      "Weight Loss": 300,
      "Weight Gain": 250,
      "Stamina": 350,
      "Good Body Shape": 280,
      "Streach & Strengthen": 150,
      "Full Body Cardio": 400,
      "Dumbbell Workouts": 320,
      "Recovery Stretches": 80,
      "Morning Stretches": 100,
      "Hard Cardio Blast Workouts": 500,
      "Kettlebell Workouts": 380
    };
    
    const userWeight = userDoc?.weight || 70;
    const weightMultiplier = userWeight / 70; // Base weight 70kg
    
    return Math.round((baseCalories[exercise.category] || 250) * weightMultiplier);
  }

  function getDurationEstimate(exercise) {
    const durationMap = {
      "Weight Loss": 25,
      "Weight Gain": 45,
      "Stamina": 35,
      "Good Body Shape": 40,
      "Streach & Strengthen": 20,
      "Full Body Cardio": 30,
      "Dumbbell Workouts": 50,
      "Recovery Stretches": 15,
      "Morning Stretches": 12,
      "Hard Cardio Blast Workouts": 20,
      "Kettlebell Workouts": 35
    };
    
    return durationMap[exercise.category] || 30;
  }

  function getDifficultyLevel(exercise) {
    const hardCategories = ["Hard Cardio Blast Workouts", "Kettlebell Workouts", "Weight Gain"];
    const easyCategories = ["Recovery Stretches", "Morning Stretches", "Streach & Strengthen"];
    
    if (hardCategories.includes(exercise.category)) return "Advanced";
    if (easyCategories.includes(exercise.category)) return "Beginner";
    return "Intermediate";
  }

  function checkAccessibility(exercise) {
    const accessibleCategories = [
      "Recovery Stretches", 
      "Morning Stretches", 
      "Streach & Strengthen"
    ];
    return accessibleCategories.includes(exercise.category);
  }

  // Mock nearby gyms
  const nearbyGyms = useMemo(
    () => [
      {
        id: 1,
        name: "FitZone Gym",
        image:
          "https://images.pexels.com/photos/1954524/pexels-photo-1954524.jpeg?auto=compress&cs=tinysrgb&w=800",
        distance: 1.2,
        rating: 4.5,
        type: "Full Service",
        address: "123 Fitness Street, Colombo",
      },
      {
        id: 2,
        name: "PowerHouse Fitness",
        image:
          "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800",
        distance: 2.1,
        rating: 4.2,
        type: "Strength",
        address: "456 Muscle Avenue, Colombo",
      },
      {
        id: 3,
        name: "Wellness Center",
        image:
          "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=800",
        distance: 0.8,
        rating: 4.8,
        type: "Wellness",
        address: "789 Health Boulevard, Colombo",
      },
    ],
    []
  );

  // ----- Helpers
  const filteredExercises = useMemo(() => {
    if (selectedCategory === "All") {
      // Show recommended exercises based on user goal
      const recommendedCategory = goalToCategory[userGoal] || "Weight Loss";
      return WORKOUT_DATA[recommendedCategory]?.slice(0, 8).map(exercise => ({
        id: exercise.id,
        name: exercise.name,
        description: exercise.description,
        caloriesBurn: getCalorieBurnEstimate({ category: recommendedCategory }, userDoc),
        duration: getDurationEstimate({ category: recommendedCategory }),
        difficulty: getDifficultyLevel({ category: recommendedCategory }),
        category: recommendedCategory,
        isAccessible: checkAccessibility({ category: recommendedCategory }),
        image: exercise.image,
        instructions: exercise.instructions,
        targetedMuscles: exercise.targeted_muscles,
        positiveEffects: exercise.positive_effects
      })) || [];
    }
    
    return WORKOUT_DATA[selectedCategory]?.map(exercise => ({
      id: exercise.id,
      name: exercise.name,
      description: exercise.description,
      caloriesBurn: getCalorieBurnEstimate({ category: selectedCategory }, userDoc),
      duration: getDurationEstimate({ category: selectedCategory }),
      difficulty: getDifficultyLevel({ category: selectedCategory }),
      category: selectedCategory,
      isAccessible: checkAccessibility({ category: selectedCategory }),
      image: exercise.image,
      instructions: exercise.instructions,
      targetedMuscles: exercise.targeted_muscles,
      positiveEffects: exercise.positive_effects
    })) || [];
  }, [selectedCategory, userGoal, userDoc]);

  function showToast(msg) {
    Alert.alert("Info", msg);
  }

  async function refreshRecommendations() {
    setIsLoading(true);
    // Simulate API call to refresh user data
    await new Promise((r) => setTimeout(r, 1500));
    setIsLoading(false);
    showToast("Recommendations updated based on your latest activity!");
  }

  function startWorkout(ex) {
    // Navigate to workout detail screen instead of showing alert
    navigation.navigate("WorkoutDetailScreen", { exercise: ex });
  }

  function startWorkoutTimer(ex) {
    // Navigate directly to timer if user wants to skip details
    navigation.navigate("WorkoutTimerScreen", { exercise: ex });
  }

  function completeWorkout(ex) {
    // This would be called from timer screen, but keeping for reference
    navigation.navigate("WorkoutCompletionScreen", { 
      exercise: ex,
      timeCompleted: ex.duration * 60,
      setsCompleted: 3
    });
  }

  function showExerciseDetails(ex) {
    // Navigate to detail screen
    navigation.navigate("WorkoutDetailScreen", { exercise: ex });
  }

  function showExerciseOptions(ex) {
    setSheet({
      title: ex.name,
      options: [
        { 
          icon: "heart-outline", 
          title: "Save to Favorites", 
          onPress: () => {
            // Save to user favorites
            showToast("Added to favorites!");
          }
        },
        { 
          icon: "share-outline", 
          title: "Share Exercise", 
          onPress: () => {
            showToast("Exercise shared!");
          }
        },
        { 
          icon: "create-outline", 
          title: "Modify Duration", 
          onPress: () => {
            Alert.alert("Modify Duration", "Feature coming soon!");
          }
        },
        { 
          icon: "information-circle-outline", 
          title: "View Details", 
          onPress: () => showExerciseDetails(ex)
        },
      ],
    });
    setSheetVisible(true);
  }

  function showFilterOptions() {
    setSheet({
      title: "Filter Options",
      options: [
        { 
          icon: "speedometer-outline", 
          title: `Difficulty Level • ${getDifficultyFilter()}`, 
          onPress: () => showToast("Difficulty filter coming soon!")
        },
        { 
          icon: "time-outline", 
          title: "Duration • Any duration", 
          onPress: () => showToast("Duration filter coming soon!")
        },
        { 
          icon: "barbell-outline", 
          title: "Equipment • No equipment", 
          onPress: () => showToast("Equipment filter coming soon!")
        },
        { 
          icon: "accessibility-outline", 
          title: "Accessibility • Include accessible", 
          onPress: () => {
            setSelectedCategory("Recovery Stretches");
            setSheetVisible(false);
          }
        },
      ],
    });
    setSheetVisible(true);
  }

  function getDifficultyFilter() {
    const userLevel = userDoc?.fitnessLevel || "Beginner";
    return userLevel;
  }

  function exploreMaintenanceExercises() {
    setSelectedCategory("Recovery Stretches");
  }

  function viewAllGyms() {
    navigation.navigate("GymDiscovery");
  }

  // ----- BottomSheet (for options/filters)
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheet, setSheet] = useState({ title: "", options: [] });
  const translateY = useRef(new Animated.Value(400)).current;
  useEffect(() => {
    Animated.timing(translateY, {
      toValue: sheetVisible ? 0 : 400,
      duration: 240,
      useNativeDriver: true,
      easing: sheetVisible ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
    }).start();
  }, [sheetVisible]);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* App Bar */}
      <View style={styles.appBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="chevron-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.appBarTitle}>Exercise Recommendations</Text>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <TouchableOpacity onPress={refreshRecommendations} style={styles.iconBtn}>
            <Ionicons name="refresh" size={20} color={TEXT} />
          </TouchableOpacity>
          <TouchableOpacity onPress={showFilterOptions} style={styles.iconBtn}>
            <Ionicons name="options-outline" size={20} color={TEXT} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={styles.loadingWrap}>
          <View style={styles.loaderDot} />
          <Text style={{ color: MUTED, marginTop: 12 }}>
            Generating personalized recommendations…
          </Text>
        </View>
      ) : (
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: 24 }}
          refreshControl={
            <RefreshControl
              refreshing={isLoading}
              onRefresh={refreshRecommendations}
              tintColor={ACCENT}
              colors={[ACCENT]}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          {/* Calorie status card */}
          <CalorieStatusCard caloriesSurplus={caloriesSurplus} isOnTrack={isOnTrack} userGoal={userGoal} />

          {/* Conditional content */}
          {caloriesSurplus <= 0 && isOnTrack ? (
            <EmptyState onExploreExercises={exploreMaintenanceExercises} />
          ) : (
            <>
              {/* Category chips */}
              <ExerciseCategoryChips
                categories={categories}
                selected={selectedCategory}
                onSelect={setSelectedCategory}
              />

              {/* Exercises list */}
              {filteredExercises.length === 0 ? (
                <NoExercises />
              ) : (
                <View style={{ paddingHorizontal: 16, gap: 12 }}>
                  {filteredExercises.map((ex) => (
                    <ExerciseCard
                      key={ex.id}
                      exercise={ex}
                      onStart={() => startWorkout(ex)}
                      onLongPress={() => showExerciseOptions(ex)}
                    />
                  ))}
                </View>
              )}

              {/* Nearby gyms */}
              <NearbyGymsSection gyms={nearbyGyms} onViewAll={viewAllGyms} />
            </>
          )}
        </ScrollView>
      )}

      {/* Bottom Sheet */}
      <Modal transparent visible={sheetVisible} onRequestClose={() => setSheetVisible(false)}>
        <View style={styles.sheetOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSheetVisible(false)}
          />
          <Animated.View style={[styles.sheet, { transform: [{ translateY }] }]}>
            <View style={styles.sheetHandle} />
            {!!sheet.title && (
              <Text style={styles.sheetTitle}>{sheet.title}</Text>
            )}
            {sheet.options.map((opt, i) => (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setSheetVisible(false);
                  setTimeout(opt.onPress, 200);
                }}
                style={styles.sheetRow}
              >
                <Ionicons name={opt.icon} size={20} color={MUTED} style={{ marginRight: 10 }} />
                <Text style={{ color: TEXT }}>{opt.title}</Text>
              </TouchableOpacity>
            ))}
            <View style={{ height: 8 }} />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

/* --------------------------- Subcomponents --------------------------- */

function CalorieStatusCard({ caloriesSurplus = 0, isOnTrack = false, userGoal = "Weight Loss" }) {
  const isSurplus = caloriesSurplus > 0;
  const bg = isSurplus ? "#052e1b" : "#111827";
  const tint = isSurplus ? ACCENT : INFO;

  return (
    <View style={[styles.card, { margin: 16, backgroundColor: CARD }]}>
      <View style={[styles.statusPill, { backgroundColor: bg, borderColor: tint }]}>
        <Ionicons name={isSurplus ? "trending-up" : "trending-down"} size={16} color={tint} />
        <Text style={{ color: TEXT, marginLeft: 6, fontWeight: "700" }}>
          {isSurplus ? "Calorie surplus" : "Calorie deficit"}
        </Text>
      </View>

      <Text style={styles.cardTitle}>
        {isSurplus
          ? `You’re about ${caloriesSurplus} kcal over today`
          : `You’re about ${Math.abs(caloriesSurplus)} kcal under today`}
      </Text>

      <Text style={styles.cardSub}>
        {isOnTrack
          ? "Nice! You’re on track with today’s goal."
          : "We’ve prepared some workouts to help balance your day."}
      </Text>
    </View>
  );
}

function EmptyState({ onExploreExercises }) {
  return (
    <View style={[styles.card, { marginHorizontal: 16, marginTop: 8, alignItems: "center" }]}>
      <Ionicons name="search-outline" size={48} color={MUTED} />
      <Text style={[styles.cardTitle, { textAlign: "center", marginTop: 8 }]}>
        You’re on track — keep it up!
      </Text>
      <Text style={[styles.cardSub, { textAlign: "center" }]}>
        Explore flexibility or mobility sessions for active recovery.
      </Text>
      <TouchableOpacity style={styles.btnGhost} onPress={onExploreExercises}>
        <Text style={styles.btnGhostText}>Explore exercises</Text>
      </TouchableOpacity>
    </View>
  );
}

function ExerciseCategoryChips({ categories, selected, onSelect }) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      style={{ paddingVertical: 8 }}
      contentContainerStyle={{ paddingHorizontal: 12, gap: 8 }}
    >
      {categories.map((c) => {
        const active = c === selected;
        return (
          <TouchableOpacity
            key={c}
            onPress={() => onSelect(c)}
            style={[
              styles.chip,
              active && { backgroundColor: ACCENT, borderColor: "transparent" },
            ]}
          >
            <Text style={{ color: active ? "#0b1220" : TEXT, fontWeight: "700" }}>{c}</Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

function ExerciseCard({ exercise, onStart, onLongPress }) {
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onLongPress={onLongPress}
      style={[styles.card, { padding: 12 }]}
    >
      <View style={{ flexDirection: "row", gap: 12 }}>
        <Image
          source={{ uri: exercise.image }}
          style={{ width: 96, height: 96, borderRadius: 12, backgroundColor: CARD2 }}
        />
        <View style={{ flex: 1 }}>
          <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800" }}>
            {exercise.name}
          </Text>
          <Text style={{ color: MUTED, marginTop: 4 }} numberOfLines={2}>
            {exercise.description}
          </Text>

          <View style={{ flexDirection: "row", gap: 10, marginTop: 8, alignItems: "center" }}>
            <RowIcon text={`${exercise.caloriesBurn} kcal`} icon="flame-outline" />
            <RowIcon text={`${exercise.duration} min`} icon="time-outline" />
            <RowIcon text={exercise.difficulty} icon="fitness-outline" />
            {exercise.isAccessible && (
              <View style={styles.badge}>
                <Ionicons name="accessibility-outline" size={12} color="#0b1220" />
                <Text style={styles.badgeText}>Accessible</Text>
              </View>
            )}
          </View>

          <TouchableOpacity style={styles.btnPrimary} onPress={onStart}>
            <Ionicons name="play" size={16} color="#0b1220" />
            <Text style={styles.btnPrimaryText}>Start Workout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

function RowIcon({ icon, text }) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      <Ionicons name={icon} size={14} color={MUTED} />
      <Text style={{ color: MUTED, marginLeft: 4, fontSize: 12 }}>{text}</Text>
    </View>
  );
}

function NearbyGymsSection({ gyms, onViewAll }) {
  return (
    <View style={{ marginTop: 16 }}>
      <View style={{ paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ color: TEXT, fontSize: 16, fontWeight: "800" }}>Nearby Gyms</Text>
        <TouchableOpacity onPress={onViewAll}>
          <Text style={{ color: MUTED, fontWeight: "700" }}>View all</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 12, gap: 12 }}
      >
        {gyms.map((g) => (
          <View key={g.id} style={styles.gymCard}>
            <Image source={{ uri: g.image }} style={styles.gymImage} />
            <View style={{ padding: 10 }}>
              <Text style={{ color: TEXT, fontWeight: "800" }} numberOfLines={1}>
                {g.name}
              </Text>
              <Text style={{ color: MUTED, marginTop: 2 }} numberOfLines={1}>
                {g.type} • {g.distance} km
              </Text>
              <View style={{ flexDirection: "row", alignItems: "center", marginTop: 6 }}>
                <Ionicons name="star" size={12} color="#eab308" />
                <Text style={{ color: MUTED, marginLeft: 4 }}>{g.rating}</Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

/* ------------------------------- Styles ------------------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  appBar: {
    height: 56,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    paddingHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appBarTitle: { color: TEXT, fontSize: 16, fontWeight: "800" },
  iconBtn: { padding: 10 },

  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  loaderDot: {
    width: 24, height: 24, borderRadius: 12, backgroundColor: ACCENT, opacity: 0.8,
  },

  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: "800", marginTop: 8 },
  cardSub: { color: MUTED, marginTop: 6 },

  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
  },

  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
  },

  btnPrimary: {
    marginTop: 10,
    alignSelf: "flex-start",
    backgroundColor: ACCENT,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  btnPrimaryText: { color: "#0b1220", fontWeight: "800" },

  btnGhost: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  btnGhostText: { color: TEXT, fontWeight: "700" },

  badge: {
    marginLeft: 6,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  badgeText: { color: "#0b1220", fontSize: 10, fontWeight: "800", marginLeft: 4 },

  gymCard: {
    width: Math.min(220, width * 0.6),
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    overflow: "hidden",
  },
  gymImage: { width: "100%", height: 120, backgroundColor: CARD2 },

  // Bottom sheet
  sheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: CARD,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: BORDER,
  },
  sheetHandle: {
    alignSelf: "center",
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#334155",
    marginBottom: 8,
  },
  sheetTitle: { color: TEXT, fontWeight: "800", fontSize: 16, margin: 8 },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 10,
  },
});