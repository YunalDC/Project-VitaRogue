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

  // Mock: calorie status
  const caloriesSurplus = 300; // positive = surplus, negative = deficit
  const isOnTrack = false;

  // Mock categories
  const categories = [
    "All",
    "Cardio",
    "Strength",
    "Flexibility",
    "Disability-Friendly",
    "Yoga",
    "Sports",
  ];

  // Mock exercises
  const exercises = useMemo(
    () => [
      {
        id: 1,
        name: "High-Intensity Interval Training",
        description:
          "Burn calories fast with this intense cardio workout combining bursts of high-intensity exercise with recovery periods.",
        caloriesBurn: 350,
        duration: 30,
        difficulty: "Advanced",
        category: "Cardio",
        isAccessible: false,
        image:
          "https://images.pexels.com/photos/416809/pexels-photo-416809.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      {
        id: 2,
        name: "Strength Circuit Training",
        description:
          "Build muscle and burn calories with this full-body strength training circuit using bodyweight exercises.",
        caloriesBurn: 280,
        duration: 45,
        difficulty: "Intermediate",
        category: "Strength",
        isAccessible: true,
        image:
          "https://images.pexels.com/photos/1552252/pexels-photo-1552252.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      {
        id: 3,
        name: "Gentle Yoga Flow",
        description:
          "Improve flexibility and mindfulness with this accessible yoga sequence suitable for all fitness levels.",
        caloriesBurn: 120,
        duration: 60,
        difficulty: "Beginner",
        category: "Flexibility",
        isAccessible: true,
        image:
          "https://images.pexels.com/photos/3822622/pexels-photo-3822622.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      {
        id: 4,
        name: "Chair-Based Cardio",
        description:
          "Effective cardio workout designed for wheelchair users and those with mobility limitations.",
        caloriesBurn: 200,
        duration: 25,
        difficulty: "Beginner",
        category: "Disability-Friendly",
        isAccessible: true,
        image:
          "https://images.pexels.com/photos/6111616/pexels-photo-6111616.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      {
        id: 5,
        name: "Running Intervals",
        description:
          "Boost your cardiovascular fitness with alternating running and walking intervals.",
        caloriesBurn: 400,
        duration: 35,
        difficulty: "Intermediate",
        category: "Cardio",
        isAccessible: false,
        image:
          "https://images.pexels.com/photos/2402777/pexels-photo-2402777.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
      {
        id: 6,
        name: "Resistance Band Workout",
        description:
          "Full-body strength training using resistance bands, perfect for home workouts.",
        caloriesBurn: 220,
        duration: 40,
        difficulty: "Beginner",
        category: "Strength",
        isAccessible: true,
        image:
          "https://images.pexels.com/photos/4662438/pexels-photo-4662438.jpeg?auto=compress&cs=tinysrgb&w=800",
      },
    ],
    []
  );

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
    if (selectedCategory === "All") return exercises;
    return exercises.filter(
      (e) => e.category.toLowerCase() === selectedCategory.toLowerCase()
    );
  }, [selectedCategory, exercises]);

  function showToast(msg) {
    if (Platform.OS === "android") {
      // simple fallback using Alert to keep deps minimal
      Alert.alert("Info", msg);
    } else {
      Alert.alert("Info", msg);
    }
  }

  async function refreshRecommendations() {
    setIsLoading(true);
    await new Promise((r) => setTimeout(r, 2000));
    setIsLoading(false);
    showToast("Recommendations updated based on your latest activity!");
  }

  function startWorkout(ex) {
    Alert.alert(
      `Start ${ex.name}`,
      `Ready to burn ${ex.caloriesBurn} calories in ${ex.duration} minutes?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Start Now",
          onPress: () =>
            Alert.alert(
              ex.name,
              `Workout timer would start here.\nDuration: ${ex.duration} minutes`
            ),
        },
      ]
    );
  }

  function showExerciseOptions(ex) {
    setSheet({
      title: ex.name,
      options: [
        { icon: "heart-outline", title: "Save to Favorites", onPress: () => {} },
        { icon: "share-outline", title: "Share Exercise", onPress: () => {} },
        { icon: "create-outline", title: "Modify Duration", onPress: () => {} },
        { icon: "information-circle-outline", title: "View Details", onPress: () => {} },
      ],
    });
    setSheetVisible(true);
  }

  function showFilterOptions() {
    setSheet({
      title: "Filter Options",
      options: [
        { icon: "speedometer-outline", title: "Difficulty Level • All levels", onPress: () => {} },
        { icon: "time-outline", title: "Duration • Any duration", onPress: () => {} },
        { icon: "barbell-outline", title: "Equipment • No equipment", onPress: () => {} },
        { icon: "accessibility-outline", title: "Accessibility • Include accessible", onPress: () => {} },
      ],
    });
    setSheetVisible(true);
  }

  function exploreMaintenanceExercises() {
    setSelectedCategory("Flexibility");
  }

  function viewAllGyms() {
    Alert.alert("Nearby Gyms", "Opening map view with all nearby fitness centers…");
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
          <CalorieStatusCard caloriesSurplus={caloriesSurplus} isOnTrack={isOnTrack} />

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

function CalorieStatusCard({ caloriesSurplus = 0, isOnTrack = false }) {
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