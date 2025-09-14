import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar as RNStatusBar,
  Platform,
  Animated,
  Alert,
  SafeAreaView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../lib/firebaseApp";
import { doc, onSnapshot } from "firebase/firestore";

/** Theme */
const BG = "#0B1220";
const CARD = "#111827";
const CARD2 = "#0f172a";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";

/** ------------------ Helpers: nutrition math ------------------ */
function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function mapActivityFactor(level) {
  switch ((level || "").toLowerCase()) {
    case "sedentary": return 1.2;
    case "light activity":
    case "light": return 1.375;
    case "moderate": return 1.55;
    case "very active": return 1.725;
    default: return 1.375;
  }
}

function inferSexOffset(gender) {
  const g = (gender || "").toLowerCase();
  if (g === "male") return +5;
  if (g === "female") return -161;
  return Math.round((5 + -161) / 2); // ≈ -78
}

// Mifflin–St Jeor
function calcBMR({ kg, cm, age, gender }) {
  if (!kg || !cm || !age) return null;
  const offset = inferSexOffset(gender);
  return 10 * kg + 6.25 * cm - 5 * age + offset;
}

function calcTargets(profile) {
  const kg = Number(profile?.weightKg);
  const cm = Number(profile?.heightCm);
  const age = Number(profile?.age);
  const gender = profile?.gender;
  const activity = mapActivityFactor(profile?.fitnessLevel);
  const bmr = calcBMR({ kg, cm, age, gender });
  if (!bmr) return null;

  const tdee = bmr * activity;
  const goal = (profile?.weightGoal || "").toLowerCase();

  let daily = tdee;
  if (goal.includes("lose")) daily = tdee - 500;
  else if (goal.includes("build")) daily = tdee + 300;
  daily = clamp(Math.round(daily), 1200, 4500);

  const proteinG = kg ? Math.round((goal.includes("build") ? 2.0 : 1.6) * kg) : 0;
  const proteinCals = proteinG * 4;

  const fatMinG = kg ? 0.8 * kg : 0;
  const fatFromPctG = (0.25 * daily) / 9;
  const fatG = Math.round(Math.max(fatMinG, fatFromPctG));
  const fatCals = fatG * 9;

  const carbCals = Math.max(0, daily - proteinCals - fatCals);
  const carbG = Math.round(carbCals / 4);

  return {
    bmr: Math.round(bmr),
    tdee: Math.round(tdee),
    caloriesTarget: daily,
    macros: { proteinG, fatG, carbG },
  };
}

/** ------------------ Component ------------------ */
export default function HomeScreen({ route, navigation }) {
  const { width, height } = Dimensions.get("window");
  const isSmall = height < 700 || width < 360;

  // responsive sizes so nothing gets cut off
  const HERO_H = Math.round(clamp(height * 0.28, 170, 240));
  const DONUT = isSmall ? 96 : 120;
  const BOTTOM_BAR_H = 72;
  const bottomPad = BOTTOM_BAR_H + (Platform.OS === "ios" ? 24 : 16);

  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // subscribe to auth and user doc; clean up properly on unmount/auth change
  useEffect(() => {
    const auth = getAuth();
    let unsubDoc = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
      setProfile(null);
      setLoading(true);

      if (unsubDoc) {
        unsubDoc();
        unsubDoc = null;
      }
      if (!u) {
        setLoading(false);
        return;
      }
      const ref = doc(db, "users", u.uid);
      unsubDoc = onSnapshot(
        ref,
        (snap) => {
          setProfile(snap.exists() ? snap.data()?.profile || null : null);
          setLoading(false);
        },
        () => setLoading(false)
      );
    });

    return () => {
      unsubAuth();
      if (unsubDoc) unsubDoc();
    };
  }, []);

  // Fallback email (route param) only if no auth
  const routeEmail = route?.params?.email || "user@example.com";
  const email = authUser?.email || routeEmail;
  const userName =
    (profile?.firstName ||
      (email.split("@")[0] || "User").replace(/[^a-zA-Z0-9]/g, " ").trim()) || "User";

  // Derived targets
  const targets = useMemo(() => calcTargets(profile), [profile]);

  // Until diary/exercise wired, treat consumed/burned as 0
  const consumedKcal = 0;
  const exerciseKcal = 0;

  const baseGoal = targets?.caloriesTarget || 2400;
  const remaining = Math.max(0, baseGoal - consumedKcal + exerciseKcal);

  const proteinTarget = targets?.macros?.proteinG || 120;
  const fatTarget = targets?.macros?.fatG || 70;
  const carbTarget = targets?.macros?.carbG || 300;

  const sodiumCapMg = 2300;
  const cholesterolCapMg = 300;
  const fatCapG = fatTarget;

  const [page, setPage] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  const pages = useMemo(
    () => [
      { key: "calories", title: "Calories" },
      { key: "macros", title: "Macros" },
      { key: "heart", title: "Heart Healthy" },
    ],
    []
  );

  const ProgressBar = ({ progress = 0, tint = "#22c55e" }) => (
    <View style={styles.pbBg}>
      <View style={[styles.pbFill, { width: `${clamp(progress, 0, 100)}%`, backgroundColor: tint }]} />
    </View>
  );

  const SmallStatRow = ({ icon, label, value, sub, tint = "#94a3b8" }) => (
    <View style={styles.smallRow}>
      <Ionicons name={icon} size={16} color={tint} style={{ marginRight: 8 }} />
      <View style={{ flex: 1 }}>
        <Text style={styles.smallRowLabel}>{label}</Text>
        <Text style={styles.smallRowValue}>
          {value} <Text style={styles.smallRowSub}>{sub}</Text>
        </Text>
      </View>
    </View>
  );

  const NavButton = ({ icon, label, active, onPress }) => (
    <TouchableOpacity style={styles.navItem} onPress={onPress}>
      <Ionicons name={icon} size={24} color={active ? "#10B981" : "#64748B"} />
      <Text style={[styles.navText, active && { color: "#10B981" }]}>{label}</Text>
    </TouchableOpacity>
  );

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(idx);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar style="light" backgroundColor={BG} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.avatar}>
              <Text style={styles.avatarInitial}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.brand} numberOfLines={1}>VitaRogue</Text>
              <Text style={{ color: MUTED, fontSize: 11, fontWeight: "700", marginTop: 2 }} numberOfLines={1}>
                Hi, {userName}
              </Text>
            </View>
          </View>

          <View style={styles.headerRight}>
            <TouchableOpacity style={styles.iconBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Ionicons name="notifications-outline" size={20} color="#cbd5e1" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconBtn}
              onPress={() => navigation.navigate("Onboarding")}
            >
              <Ionicons name="settings-outline" size={20} color="#cbd5e1" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Today row */}
        <View style={styles.todayRow}>
          <Text style={styles.todayText}>Today</Text>

          {/* Quick access to Gym Discovery */}
          <TouchableOpacity
            style={[styles.editBtn, { flexDirection: "row", alignItems: "center", gap: 6 }]}
            onPress={() => navigation.navigate("GymDiscovery")}
          >
            <Ionicons name="map-outline" size={14} color={TEXT} />
            <Text style={styles.editText}>Find gyms</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingBottom: bottomPad }}
          showsVerticalScrollIndicator={false}
          contentInsetAdjustmentBehavior="automatic"
        >
          {/* Hero carousel */}
          <Animated.ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              { useNativeDriver: false }
            )}
            onMomentumScrollEnd={onMomentumScrollEnd}
            scrollEventThrottle={16}
            decelerationRate={Platform.OS === "ios" ? "fast" : 0.98}
          >
            {/* Page 1: Calories */}
            <View style={[styles.heroCard, { width, height: HERO_H }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Calories</Text>
                {targets && (
                  <Text style={{ color: MUTED, fontSize: 11 }}>
                    BMR {targets.bmr} • TDEE {targets.tdee}
                  </Text>
                )}
              </View>

              <View style={styles.calGrid}>
                {/* Donut (visual) */}
                <View style={[
                  styles.donut,
                  { width: DONUT, height: DONUT, borderRadius: DONUT / 2 }
                ]}>
                  <View style={styles.donutInner}>
                    <Text style={styles.donutBig}>{remaining.toLocaleString()}</Text>
                    <Text style={styles.donutSub}>Remaining</Text>
                  </View>
                  <View
                    style={[
                      styles.donutArc,
                      {
                        width: DONUT, height: DONUT, borderRadius: DONUT / 2,
                        transform: [{ rotate: `${Math.min(300, (consumedKcal / baseGoal) * 300)}deg` }],
                      },
                    ]}
                  />
                </View>

                <View style={{ flex: 1 }}>
                  <SmallStatRow icon="flag-outline" label="Base Goal" value={baseGoal.toLocaleString()} sub="kcal" />
                  <SmallStatRow icon="restaurant-outline" label="Food" value={consumedKcal} sub="kcal" />
                  <SmallStatRow icon="flame-outline" label="Exercise" value={exerciseKcal} sub="kcal" />
                </View>
              </View>
            </View>

            {/* Page 2: Macros */}
            <View style={[styles.heroCard, { width, height: HERO_H }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Macros</Text>
                <Text style={{ color: MUTED, fontSize: 11 }}>
                  Target • P {proteinTarget}g • F {fatTarget}g • C {carbTarget}g
                </Text>
              </View>

              <View style={styles.macrosRow}>
                <View style={styles.ringBlock}>
                  <View style={[styles.ring, { borderColor: "#22d3ee" }]} />
                  <Text style={styles.ringValue}>{0}</Text>
                  <Text style={styles.ringLabel}>Carbohydrates</Text>
                  <Text style={styles.ringSub}>{carbTarget}g left</Text>
                </View>
                <View style={styles.ringBlock}>
                  <View style={[styles.ring, { borderColor: "#a78bfa" }]} />
                  <Text style={styles.ringValue}>{0}</Text>
                  <Text style={styles.ringLabel}>Fat</Text>
                  <Text style={styles.ringSub}>{fatTarget}g left</Text>
                </View>
                <View style={styles.ringBlock}>
                  <View style={[styles.ring, { borderColor: "#fb923c" }]} />
                  <Text style={styles.ringValue}>{0}</Text>
                  <Text style={styles.ringLabel}>Protein</Text>
                  <Text style={styles.ringSub}>{proteinTarget}g left</Text>
                </View>
              </View>
            </View>

            {/* Page 3: Heart Healthy */}
            <View style={[styles.heroCard, { width, height: HERO_H }]}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Heart Healthy</Text>
                <Text style={{ color: MUTED, fontSize: 11 }}>Daily caps</Text>
              </View>

              <View style={{ gap: 14 }}>
                <View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Fat (target)</Text>
                    <Text style={styles.metricValue}>{fatCapG}g</Text>
                  </View>
                  <ProgressBar progress={0} tint="#22c55e" />
                </View>

                <View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Sodium</Text>
                    <Text style={styles.metricValue}>0/{sodiumCapMg}mg</Text>
                  </View>
                  <ProgressBar progress={0} tint="#22c55e" />
                </View>

                <View>
                  <View style={styles.metricRow}>
                    <Text style={styles.metricLabel}>Cholesterol</Text>
                    <Text style={styles.metricValue}>0/{cholesterolCapMg}mg</Text>
                  </View>
                  <ProgressBar progress={0} tint="#22c55e" />
                </View>
              </View>
            </View>
          </Animated.ScrollView>

          {/* Dots */}
          <View style={styles.dotsRow}>
            {pages.map((_, i) => (
              <View key={i} style={[styles.dot, i === page && styles.dotActive]} />
            ))}
          </View>

          {/* Promo card */}
          <View style={styles.promoCard}>
            <View style={{ flex: 1 }}>
              <Text style={styles.promoTitle}>
                {profile?.weightGoal ? `Goal: ${profile.weightGoal}` : "Choose your next habit"}
              </Text>
              <Text style={styles.promoSub}>
                {profile?.fitnessLevel ? `Current activity: ${profile.fitnessLevel}` : "Big goals start with small habits."}
              </Text>

              <View style={{ flexDirection: "row", gap: 10 }}>
                <TouchableOpacity style={styles.promoBtn} onPress={() => navigation.navigate("Onboarding")}>
                  <Text style={styles.promoBtnText}>{profile ? "Edit profile" : "Start a habit"}</Text>
                </TouchableOpacity>

                {/* NEW: gym discovery CTA */}
                <TouchableOpacity
                  style={[styles.promoBtn, { borderColor: "#2b3a5c" }]}
                  onPress={() => navigation.navigate("GymDiscovery")}
                >
                  <Text style={styles.promoBtnText}>Find gyms near you</Text>
                </TouchableOpacity>
              </View>
            </View>
            <Ionicons name="sparkles-outline" size={44} color="#64748B" />
          </View>

          {/* Tiles (BMI & Calories Target) */}
          <View style={[styles.tilesRow, isSmall && { paddingTop: 8 }]}>
            <View style={styles.tile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileTitle}>BMI</Text>
                <Ionicons name="information-circle-outline" size={18} color="#cbd5e1" />
              </View>
              {profile?.heightCm && profile?.weightKg ? (
                <>
                  <Text style={styles.tileBig}>
                    {(() => {
                      const h = Number(profile.heightCm) / 100;
                      const w = Number(profile.weightKg);
                      const bmi = w && h ? (w / (h * h)) : 0;
                      return bmi ? bmi.toFixed(1) : "--";
                    })()}
                  </Text>
                  <Text style={styles.tileSub}>
                    {(() => {
                      const h = Number(profile.heightCm) / 100;
                      const w = Number(profile.weightKg);
                      const bmi = w && h ? (w / (h * h)) : 0;
                      if (!bmi) return "Add height & weight";
                      if (bmi < 18.5) return "Underweight";
                      if (bmi < 25) return "Normal";
                      if (bmi < 30) return "Overweight";
                      return "Obese";
                    })()}
                  </Text>
                </>
              ) : (
                <>
                  <Text style={styles.tileBig}>--</Text>
                  <Text style={styles.tileSub}>Add height & weight</Text>
                </>
              )}
            </View>

            <View style={styles.tile}>
              <View style={styles.tileHeader}>
                <Text style={styles.tileTitle}>Calories Target</Text>
                <Ionicons name="flame-outline" size={18} color="#cbd5e1" />
              </View>
              <Text style={styles.tileBig}>{baseGoal.toLocaleString()}</Text>
              <Text style={styles.tileSub}>kcal/day</Text>
            </View>
          </View>

          {/* Gyms tile (extra entry point, small-screen friendly) */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Gyms near you</Text>
              <TouchableOpacity onPress={() => navigation.navigate("GymDiscovery")}>
                <Ionicons name="map-outline" size={18} color="#cbd5e1" />
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionHint}>Discover gyms, filter amenities, and get directions</Text>
          </View>

          {/* Weight section stub */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Weight</Text>
              <Ionicons name="add" size={18} color="#cbd5e1" />
            </View>
            <Text style={styles.sectionHint}>
              {profile?.weightKg ? `Current: ${profile.weightKg} kg` : "Log your weight to see trends"}
            </Text>
          </View>
        </ScrollView>

        {/* Bottom nav with center FAB */}
        <View style={styles.bottomBar}>
          <NavButton icon="home" label="Dashboard" active onPress={() => {}} />
          <NavButton icon="book-outline" label="Diary" onPress={() => {}} />

          <TouchableOpacity
            onPress={() => {
              Alert.alert("Coming soon", "Hook this to your add-log flow (food, weight, workout).");
            }}
            activeOpacity={0.9}
            style={styles.fab}
          >
            <Ionicons name="add" size={26} color="#0b1220" />
          </TouchableOpacity>

          <NavButton icon="stats-chart-outline" label="Progress" onPress={() => {}} />
          <NavButton icon="ellipsis-horizontal" label="More" onPress={() => {}} />
        </View>

        {/* Loading overlay */}
        {loading && (
          <View
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              backgroundColor: BG,
              opacity: 0.6,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Text style={{ color: MUTED }}>Loading your data…</Text>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

/** ------------------ Styles ------------------ */
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },
  container: { flex: 1, backgroundColor: BG },

  header: {
    paddingTop: Platform.OS === "ios" ? 8 : 4,
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: BG,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12, flex: 1 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  iconBtn: { padding: 8, marginLeft: 6 },

  avatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: "#334155", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: TEXT, fontWeight: "700" },

  brand: { color: TEXT, fontSize: 18, fontWeight: "800", letterSpacing: 0.2 },

  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  todayText: { color: TEXT, fontSize: 20, fontWeight: "800" },
  editBtn: {
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  editText: { color: TEXT, fontSize: 12, fontWeight: "600" },

  heroCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    borderRadius: 14,
    padding: 16,
  },
  cardHeader: { marginBottom: 6, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { color: TEXT, fontSize: 16, fontWeight: "700" },

  calGrid: { flexDirection: "row", gap: 16, alignItems: "center", flex: 1 },
  donut: {
    backgroundColor: CARD2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderWidth: 8,
    borderColor: "#0e1626",
  },
  donutInner: { alignItems: "center", justifyContent: "center" },
  donutBig: { color: TEXT, fontSize: 20, fontWeight: "800" },
  donutSub: { color: MUTED, fontSize: 12, marginTop: 2 },
  donutArc: {
    position: "absolute",
    borderTopWidth: 8,
    borderRightWidth: 8,
    borderColor: "#60a5fa",
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },

  smallRow: { flexDirection: "row", alignItems: "center", marginBottom: 10 },
  smallRowLabel: { color: MUTED, fontSize: 12 },
  smallRowValue: { color: TEXT, fontSize: 14, fontWeight: "700" },
  smallRowSub: { color: MUTED, fontWeight: "600" },

  macrosRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    paddingTop: 8,
  },
  ringBlock: {
    width: (Dimensions.get("window").width - 16 * 2 - 24) / 3,
    alignItems: "center",
  },
  ring: {
    width: 68, height: 68, borderRadius: 34,
    borderWidth: 6, borderColor: "#22c55e", opacity: 0.6, marginBottom: 8,
  },
  ringValue: { color: TEXT, fontSize: 16, fontWeight: "800" },
  ringLabel: { color: "#a3e635", fontSize: 12, fontWeight: "700", marginTop: 2 },
  ringSub: { color: MUTED, fontSize: 12, marginTop: 2 },

  metricRow: {
    flexDirection: "row", justifyContent: "space-between", marginBottom: 6,
  },
  metricLabel: { color: TEXT, fontSize: 14, fontWeight: "700" },
  metricValue: { color: MUTED, fontSize: 12 },

  pbBg: {
    height: 10, backgroundColor: "#1f2937", borderRadius: 6, overflow: "hidden",
  },
  pbFill: { height: "100%", borderRadius: 6 },

  dotsRow: {
    flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10,
  },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#334155" },
  dotActive: { backgroundColor: "#cbd5e1", width: 8, height: 8, borderRadius: 4 },

  promoCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 6,
    borderRadius: 14,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  promoTitle: { color: TEXT, fontSize: 16, fontWeight: "800" },
  promoSub: { color: MUTED, fontSize: 12, marginTop: 2, marginBottom: 12 },
  promoBtn: {
    alignSelf: "flex-start",
    backgroundColor: "#1f2a44",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#22314f",
  },
  promoBtnText: { color: TEXT, fontSize: 13, fontWeight: "700" },

  tilesRow: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  tile: {
    flex: 1,
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 14,
  },
  tileHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
  },
  tileTitle: { color: TEXT, fontSize: 14, fontWeight: "800" },
  tileBig: { color: TEXT, fontSize: 22, fontWeight: "900", marginTop: 2 },
  tileSub: { color: MUTED, fontSize: 12, marginTop: 2 },

  sectionCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 16,
  },
  sectionHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8,
  },
  sectionTitle: { color: TEXT, fontSize: 16, fontWeight: "800" },
  sectionHint: { color: MUTED, fontSize: 12 },

  bottomBar: {
    position: "absolute",
    left: 0, right: 0, bottom: 0,
    height: 72,
    backgroundColor: "#0e1626",
    borderTopWidth: 1,
    borderTopColor: BORDER,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  navItem: { alignItems: "center", justifyContent: "center", width: 72 },
  navText: { color: "#64748B", fontSize: 11, marginTop: 4 },

  fab: {
    position: "absolute",
    bottom: 20, alignSelf: "center",
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: "#10B981",
    alignItems: "center", justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
  },
});
