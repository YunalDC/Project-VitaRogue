import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Modal,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth, onAuthStateChanged } from "firebase/auth";
import { db } from "../lib/firebaseApp";
import {
  doc,
  onSnapshot,
  collection,
  query,
  orderBy,
  limit,
} from "firebase/firestore";

/* -------------------- THEME -------------------- */
const COLORS = {
  bg: "#0B1220",
  card: "#111827",
  card2: "#0f172a",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  primary: "#10B981",
  secondary: "#60a5fa",
  accent: "#f59e0b",
  success: "#22c55e",
  warning: "#eab308",
  danger: "#ef4444",
};

/* -------------------- ENHANCED RESPONSIVE -------------------- */
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const vw = width / 100;
  const vh = height / 100;

  // Better breakpoints for different devices
  const isXSmall = width < 350;
  const isSmall = width < 400;
  const isMedium = width >= 400 && width < 600;
  const isLarge = width >= 600 && width < 900;
  const isXLarge = width >= 900;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // Adaptive scaling with better device support
  const ms = useCallback(
    (size) => {
      let scale;
      if (isXSmall) scale = 0.85;
      else if (isSmall) scale = 0.9;
      else if (isMedium) scale = 1.0;
      else if (isLarge) scale = 1.1;
      else scale = 1.2;
      
      return Math.round(size * scale);
    },
    [isXSmall, isSmall, isMedium, isLarge]
  );

  // Adaptive dimensions
  const HERO_H = Math.round(
    isXSmall ? vh * 24 : 
    isSmall ? vh * 26 : 
    isMedium ? vh * 28 : 
    isTablet ? vh * 25 : vh * 30
  );
  
  const DONUT = Math.round(
    isXSmall ? 80 : 
    isSmall ? 92 : 
    isMedium ? 100 : 
    isTablet ? 110 : 120
  );

  // Grid columns based on screen size
  const gridColumns = isXSmall ? 1 : isSmall ? 2 : isTablet ? 3 : isXLarge ? 4 : 2;
  
  return { 
    width, 
    height, 
    vw, 
    vh, 
    isXSmall,
    isSmall, 
    isMedium,
    isLarge,
    isTablet, 
    isLandscape,
    ms, 
    HERO_H, 
    DONUT,
    gridColumns
  };
}

/* -------------------- HELPERS (nutrition math) -------------------- */
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

function mapActivityFactor(level) {
  switch ((level || "").toLowerCase()) {
    case "sedentary":
      return 1.2;
    case "light":
    case "light activity":
      return 1.375;
    case "moderate":
      return 1.55;
    case "very active":
      return 1.725;
    case "extremely active":
      return 1.9;
    default:
      return 1.375;
  }
}

function inferSexOffset(gender) {
  const g = (gender || "").toLowerCase();
  if (g === "male") return +5;
  if (g === "female") return -161;
  return -78;
}

function calcBMR({ kg, cm, age, gender }) {
  if (!kg || !cm || !age) return null;
  return 10 * kg + 6.25 * cm - 5 * age + inferSexOffset(gender);
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
  if (goal.includes("lose") || goal.includes("cut")) daily -= 500;
  else if (goal.includes("build") || goal.includes("gain") || goal.includes("bulk")) daily += 300;
  else if (goal.includes("maintain")) daily = tdee;

  daily = clamp(Math.round(daily), 1200, 4500);

  const proteinMultiplier = goal.includes("build") || goal.includes("bulk") ? 2.2 : 
                           goal.includes("lose") || goal.includes("cut") ? 2.0 : 1.6;
  const proteinG = kg ? Math.round(proteinMultiplier * kg) : 0;
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

// Personalization helpers
function getPersonalizedGreeting(firstName, timeOfDay) {
  const name = firstName || "there";
  const greetings = {
    morning: [`Good morning, ${name}!`, `Rise and shine, ${name}!`, `Morning, ${name}!`],
    afternoon: [`Good afternoon, ${name}!`, `Hey ${name}!`, `Afternoon, ${name}!`],
    evening: [`Good evening, ${name}!`, `Evening, ${name}!`, `Hey ${name}!`]
  };
  
  const options = greetings[timeOfDay] || greetings.morning;
  return options[Math.floor(Math.random() * options.length)];
}

function getMotivationalMessage(profile, progress) {
  const goal = (profile?.weightGoal || "").toLowerCase();
  const progressPct = progress?.calorieProgress || 0;
  
  if (progressPct > 90) {
    return "Amazing! You're crushing your goals today!";
  } else if (progressPct > 70) {
    return "Great progress! Keep it up!";
  } else if (progressPct > 30) {
    return "You're on track, keep going!";
  } else if (goal.includes("build")) {
    return "Time to fuel those gains!";
  } else if (goal.includes("lose")) {
    return "Every step counts towards your goal!";
  } else {
    return "Small steps lead to big changes!";
  }
}

function getHealthInsights(profile, todayDiary) {
  const insights = [];
  const bmi = calculateBMI(profile);
  
  // BMI insights
  if (bmi) {
    if (bmi < 18.5) {
      insights.push({ type: 'info', message: 'Consider increasing your calorie intake for healthy weight gain.' });
    } else if (bmi > 30) {
      insights.push({ type: 'warning', message: 'Focus on portion control and regular exercise.' });
    }
  }
  
  // Hydration reminder based on activity
  if (profile?.fitnessLevel === 'Very active' || profile?.fitnessLevel === 'Extremely active') {
    insights.push({ type: 'info', message: 'Don\'t forget to stay hydrated with your active lifestyle!' });
  }
  
  // Sodium warning
  if (todayDiary?.sodiumMg > 2000) {
    insights.push({ type: 'warning', message: 'Watch your sodium intake today!' });
  }
  
  return insights;
}

function calculateBMI(profile, latestWeight) {
  const h = Number(profile?.heightCm) / 100;
  const w = Number(profile?.weightKg ?? latestWeight?.kg);
  if (!h || !w) return null;
  return w / (h * h);
}

const todayId = () => new Date().toISOString().slice(0, 10);

/* -------------------- BUILDING BLOCKS -------------------- */
function SmallRow({ icon, label, value, sub, ms }) {
  return (
    <View style={{ 
      flexDirection: "row", 
      alignItems: "center", 
      marginBottom: ms(8),
      paddingVertical: ms(4),
    }}>
      <Ionicons 
        name={icon} 
        size={ms(16)} 
        color={COLORS.muted} 
        style={{ marginRight: ms(10) }} 
      />
      <View style={{ flex: 1 }}>
        <Text style={{ 
          color: COLORS.muted, 
          fontSize: ms(11),
          marginBottom: ms(2),
        }}>
          {label}
        </Text>
        <Text style={{ 
          color: COLORS.text, 
          fontSize: ms(13), 
          fontWeight: "700" 
        }}>
          {value}{" "}
          <Text style={{ 
            color: COLORS.muted, 
            fontWeight: "600",
            fontSize: ms(11),
          }}>
            {sub}
          </Text>
        </Text>
      </View>
    </View>
  );
}

function MetricRow({ label, value, ms }) {
  return (
    <View style={{ 
      flexDirection: "row", 
      justifyContent: "space-between", 
      alignItems: "center",
      marginBottom: ms(6) 
    }}>
      <Text style={{ 
        color: COLORS.text, 
        fontSize: ms(13), 
        fontWeight: "600" 
      }}>
        {label}
      </Text>
      <Text style={{ 
        color: COLORS.muted, 
        fontSize: ms(11),
        fontWeight: "500",
      }}>
        {value}
      </Text>
    </View>
  );
}

function Nav({ icon, label, active, onPress, ms = (size) => size }) {
  return (
    <TouchableOpacity 
      style={[
        styles.navItem,
        { paddingVertical: ms(8) }
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <View style={[
        styles.navIconContainer,
        {
          backgroundColor: active ? COLORS.primary + '20' : 'transparent',
          paddingHorizontal: ms(12),
          paddingVertical: ms(4),
          borderRadius: ms(16),
        }
      ]}>
        <Ionicons 
          name={icon} 
          size={ms(20)} 
          color={active ? COLORS.primary : "#64748B"} 
        />
      </View>
      <Text style={[
        styles.navText, 
        { 
          fontSize: ms(10),
          fontWeight: active ? "600" : "500",
        },
        active && { color: COLORS.primary }
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function SheetItem({ icon, text, onPress, ms = (size) => size }) {
  return (
    <TouchableOpacity 
      style={[
        styles.sheetItem,
        { paddingVertical: ms(14) }
      ]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.sheetIconContainer,
        {
          backgroundColor: COLORS.card2,
          padding: ms(8),
          borderRadius: ms(8),
          marginRight: ms(12),
        }
      ]}>
        <Ionicons name={icon} size={ms(20)} color={COLORS.text} />
      </View>
      <Text style={[styles.sheetText, { flex: 1, fontSize: ms(14) }]}>
        {text}
      </Text>
      <Ionicons name="chevron-forward" size={ms(18)} color={COLORS.muted} />
    </TouchableOpacity>
  );
}

/* -------------------- MAIN COMPONENT -------------------- */
export default function HomeScreen({ route, navigation }) {
  const insets = useSafeAreaInsets();
  const { width, isXSmall, isSmall, isTablet, ms, HERO_H, DONUT, gridColumns } = useResponsive();

  // UI state
  const [page, setPage] = useState(0);
  const [moreVisible, setMoreVisible] = useState(false);
  const [timeOfDay, setTimeOfDay] = useState('morning');
  const scrollX = useRef(new Animated.Value(0)).current;

  // Data state
  const [authUser, setAuthUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [todayDiary, setTodayDiary] = useState(null);
  const [todayWorkout, setTodayWorkout] = useState(null);
  const [latestWeight, setLatestWeight] = useState(null);
  const [loading, setLoading] = useState(true);

  /* ------------ Time-based greeting ------------ */
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setTimeOfDay('morning');
    else if (hour < 18) setTimeOfDay('afternoon');
    else setTimeOfDay('evening');
  }, []);

  /* ------------ Firebase subscriptions ------------ */
  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setAuthUser(u || null);
    });
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    if (!authUser) {
      setProfile(null);
      setTodayDiary(null);
      setTodayWorkout(null);
      setLatestWeight(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    const uref = doc(db, "users", authUser.uid);

    const off1 = onSnapshot(
      uref,
      (snap) => setProfile(snap.exists() ? snap.data()?.profile || null : null),
      () => {}
    );

    const dref = doc(db, "users", authUser.uid, "diary", todayId());
    const off2 = onSnapshot(dref, (s) => setTodayDiary(s.exists() ? s.data() : null), () => {});

    const wref = doc(db, "users", authUser.uid, "workouts", todayId());
    const off3 = onSnapshot(wref, (s) => setTodayWorkout(s.exists() ? s.data() : null), () => {});

    const q = query(
      collection(db, "users", authUser.uid, "weights"),
      orderBy("timestamp", "desc"),
      limit(1)
    );
    const off4 = onSnapshot(
      q,
      (snap) => {
        const first = snap.docs?.[0];
        setLatestWeight(first ? first.data() : null);
      },
      () => {}
    );

    const timer = setTimeout(() => setLoading(false), 150);
    return () => {
      off1?.();
      off2?.();
      off3?.();
      off4?.();
      clearTimeout(timer);
    };
  }, [authUser]);

  /* ------------ Derived values with personalization ------------ */
  const routeEmail = route?.params?.email || "user@example.com";
  const email = authUser?.email || routeEmail;
  const userName = useMemo(
    () =>
      profile?.firstName ||
      (email.split("@")[0] || "User").replace(/[^a-zA-Z0-9]/g, " ").trim() ||
      "User",
    [profile?.firstName, email]
  );

  const personalizedGreeting = useMemo(
    () => getPersonalizedGreeting(profile?.firstName, timeOfDay),
    [profile?.firstName, timeOfDay]
  );

  const targets = useMemo(() => calcTargets(profile), [profile]);

  const baseGoal = targets?.caloriesTarget || 2000;
  const consumedKcal = Number(todayDiary?.kcal || 0);
  const exerciseKcal = Number(todayWorkout?.calories || 0);
  const remaining = Math.max(0, baseGoal - consumedKcal + exerciseKcal);

  const progress = useMemo(() => ({
    calorieProgress: baseGoal ? (consumedKcal / baseGoal) * 100 : 0,
    proteinProgress: targets?.macros?.proteinG ? (Number(todayDiary?.proteinG || 0) / targets.macros.proteinG) * 100 : 0,
    fatProgress: targets?.macros?.fatG ? (Number(todayDiary?.fatG || 0) / targets.macros.fatG) * 100 : 0,
    carbProgress: targets?.macros?.carbG ? (Number(todayDiary?.carbG || 0) / targets.macros.carbG) * 100 : 0,
  }), [baseGoal, consumedKcal, todayDiary, targets]);

  const motivationalMessage = useMemo(
    () => getMotivationalMessage(profile, progress),
    [profile, progress]
  );

  const healthInsights = useMemo(
    () => getHealthInsights(profile, todayDiary),
    [profile, todayDiary]
  );

  const proteinTarget = targets?.macros?.proteinG || 100;
  const fatTarget = targets?.macros?.fatG || 70;
  const carbTarget = targets?.macros?.carbG || 250;

  const sodiumCapMg = 2300;
  const cholesterolCapMg = 300;

  const carbsUsed = Number(todayDiary?.carbG || 0);
  const fatUsed = Number(todayDiary?.fatG || 0);
  const proteinUsed = Number(todayDiary?.proteinG || 0);
  const sodiumUsed = Number(todayDiary?.sodiumMg || 0);
  const cholesterolUsed = Number(todayDiary?.cholesterolMg || 0);

  const bmi = useMemo(() => calculateBMI(profile, latestWeight), [profile, latestWeight]);

  const bmiLabel = useMemo(() => {
    if (bmi == null) return "Add height & weight";
    if (bmi < 18.5) return "Underweight";
    if (bmi < 25) return "Normal";
    if (bmi < 30) return "Overweight";
    return "Obese";
  }, [bmi]);

  const bmiColor = useMemo(() => {
    if (bmi == null) return COLORS.muted;
    if (bmi < 18.5) return COLORS.warning;
    if (bmi < 25) return COLORS.success;
    if (bmi < 30) return COLORS.warning;
    return COLORS.danger;
  }, [bmi]);

  /* ------------ Helpers ------------ */
  const safeNav = (name, params) => {
    const names = navigation?.getState?.()?.routeNames || [];
    if (names.includes(name)) navigation.navigate(name, params);
    else Alert.alert("Coming soon", `${name} isn't wired up yet.`);
  };

  const onMomentumScrollEnd = (e) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setPage(idx);
  };

  /* ------------ UI Components ------------ */
  const ProgressBar = ({ progress = 0, tint = COLORS.primary, height = ms(8) }) => (
    <View style={[styles.pbBg, { height, borderRadius: height / 2 }]}>
      <View
        style={[
          styles.pbFill,
          { 
            width: `${clamp(progress, 0, 100)}%`, 
            backgroundColor: tint,
            borderRadius: height / 2
          },
        ]}
      />
    </View>
  );

  const Ring = ({ color, used, target, label, unit = "g" }) => {
    const pct = target ? clamp((used / target) * 100, 0, 100) : 0;
    const isOverTarget = used > target;
    
    return (
      <View style={styles.ringBlock}>
        <View
          style={[
            styles.ring,
            {
              width: ms(isXSmall ? 60 : 68),
              height: ms(isXSmall ? 60 : 68),
              borderRadius: ms(isXSmall ? 30 : 34),
              borderWidth: ms(5),
              borderColor: isOverTarget ? COLORS.warning : color,
              opacity: 0.6,
              marginBottom: ms(8),
            },
          ]}
        >
          <View style={styles.ringProgress}>
            <View
              style={[
                styles.ringFill,
                {
                  width: ms(isXSmall ? 50 : 58),
                  height: ms(isXSmall ? 50 : 58),
                  borderRadius: ms(isXSmall ? 25 : 29),
                  borderWidth: ms(3),
                  borderColor: color,
                  transform: [{ rotate: `${(pct / 100) * 180}deg` }],
                  borderTopColor: 'transparent',
                  borderLeftColor: 'transparent',
                },
              ]}
            />
          </View>
        </View>
        <Text style={[styles.ringValue, { fontSize: ms(isXSmall ? 14 : 16) }]}>
          {Math.round(used)}
        </Text>
        <Text style={[styles.ringLabel, { fontSize: ms(isXSmall ? 10 : 12) }]}>
          {label}
        </Text>
        <Text style={[styles.ringSub, { fontSize: ms(isXSmall ? 10 : 12) }]}>
          {isOverTarget ? 
            `${Math.round(used - target)}${unit} over` :
            `${Math.max(0, Math.round(target - used))}${unit} left`
          }
        </Text>
        <ProgressBar progress={pct} tint={color} height={ms(4)} />
      </View>
    );
  };

  const InsightCard = ({ insight }) => (
    <View style={[
      styles.insightCard, 
      { 
        backgroundColor: insight.type === 'warning' ? COLORS.danger + '20' : COLORS.secondary + '20',
        borderColor: insight.type === 'warning' ? COLORS.danger : COLORS.secondary,
        marginBottom: ms(8),
        padding: ms(12),
        borderRadius: ms(8),
        borderWidth: 1,
      }
    ]}>
      <Text style={[
        styles.insightText, 
        { 
          fontSize: ms(12),
          color: insight.type === 'warning' ? COLORS.danger : COLORS.secondary
        }
      ]}>
        {insight.message}
      </Text>
    </View>
  );

  /* -------------------- RENDER -------------------- */
  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      {/* Header */}
      <View style={[
        styles.header, 
        { 
          paddingTop: insets.top + ms(10), 
          paddingHorizontal: ms(16),
          paddingBottom: ms(8)
        }
      ]}>
        <View style={styles.headerLeft}>
          <View style={[
            styles.avatar, 
            { 
              width: ms(isXSmall ? 32 : 36), 
              height: ms(isXSmall ? 32 : 36), 
              borderRadius: ms(isXSmall ? 16 : 18) 
            }
          ]}>
            <Text style={[styles.avatarInitial, { fontSize: ms(isXSmall ? 14 : 16) }]}>
              {userName.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View>
            <Text style={[styles.brand, { fontSize: ms(isXSmall ? 16 : 18) }]}>VitaRogue</Text>
            <Text style={[
              styles.greeting, 
              { 
                color: COLORS.muted, 
                fontSize: ms(isXSmall ? 10 : 11), 
                fontWeight: "700", 
                marginTop: 2 
              }
            ]}>
              {personalizedGreeting}
            </Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.iconBtn} onPress={() => safeNav("Notifications")}>
            <Ionicons name="notifications-outline" size={ms(18)} color="#cbd5e1" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconBtn} onPress={() => safeNav("CoachMessages")}>
            <Ionicons name="chatbubbles-outline" size={ms(18)} color="#cbd5e1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Today row */}
      <View style={[styles.todayRow, { paddingHorizontal: ms(16), paddingVertical: ms(8) }]}>
        <View>
          <Text style={[styles.todayText, { fontSize: ms(isXSmall ? 18 : 20) }]}>Today</Text>
          <Text style={[styles.motivationText, { fontSize: ms(11), color: COLORS.muted }]}>
            {motivationalMessage}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.editBtn,
            { 
              paddingHorizontal: ms(12), 
              paddingVertical: ms(6), 
              borderRadius: ms(14) 
            },
          ]}
          onPress={() => navigation.navigate("Onboarding")}
        >
          <Text style={[styles.editText, { fontSize: ms(11) }]}>Edit profile</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ 
          paddingBottom: (isXSmall ? 100 : 120) + insets.bottom 
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Health Insights */}
        {healthInsights.length > 0 && (
          <View style={{ paddingHorizontal: ms(16), marginBottom: ms(8) }}>
            {healthInsights.map((insight, index) => (
              <InsightCard key={index} insight={insight} />
            ))}
          </View>
        )}

        {/* HERO: Calories / Macros / Heart */}
        <Animated.ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], {
            useNativeDriver: false,
          })}
          onMomentumScrollEnd={onMomentumScrollEnd}
          scrollEventThrottle={16}
          contentContainerStyle={{ paddingHorizontal: ms(8) }}
        >
          {/* Calories card */}
          <View style={[
            styles.heroCard, 
            { 
              width: width - ms(32), 
              height: HERO_H, 
              marginHorizontal: ms(8), 
              borderRadius: ms(14), 
              padding: ms(16) 
            }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { fontSize: ms(16) }]}>Calories</Text>
              {targets && (
                <Text style={{ color: COLORS.muted, fontSize: ms(10) }}>
                  BMR {targets.bmr} • TDEE {targets.tdee}
                </Text>
              )}
            </View>

            <View style={[
              styles.calGrid, 
              { flexDirection: isXSmall ? 'column' : 'row' }
            ]}>
              {/* Enhanced Donut */}
              <View
                style={[
                  styles.donut,
                  {
                    width: DONUT,
                    height: DONUT,
                    borderRadius: DONUT / 2,
                    borderWidth: ms(6),
                    borderColor: progress.calorieProgress > 100 ? COLORS.warning : "#0e1626",
                    marginBottom: isXSmall ? ms(12) : 0,
                  },
                ]}
              >
                <View style={styles.donutInner}>
                  <Text style={[styles.donutBig, { fontSize: ms(isXSmall ? 16 : 20) }]}>
                    {remaining.toLocaleString()}
                  </Text>
                  <Text style={[styles.donutSub, { fontSize: ms(isXSmall ? 10 : 12) }]}>
                    {remaining > 0 ? 'Remaining' : 'Over'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.donutArc,
                    {
                      width: DONUT,
                      height: DONUT,
                      borderRadius: DONUT / 2,
                      borderTopWidth: ms(6),
                      borderRightWidth: ms(6),
                      borderColor: progress.calorieProgress > 100 ? COLORS.danger : COLORS.secondary,
                      transform: [{ 
                        rotate: `${Math.min(300, (consumedKcal / baseGoal) * 300)}deg` 
                      }],
                    },
                  ]}
                />
              </View>

              <View style={{ flex: 1 }}>
                <SmallRow 
                  icon="flag-outline" 
                  label="Base Goal" 
                  value={baseGoal.toLocaleString()} 
                  sub="kcal" 
                  ms={ms} 
                />
                <SmallRow 
                  icon="restaurant-outline" 
                  label="Food" 
                  value={consumedKcal} 
                  sub="kcal" 
                  ms={ms} 
                />
                <SmallRow 
                  icon="flame-outline" 
                  label="Exercise" 
                  value={exerciseKcal} 
                  sub="kcal" 
                  ms={ms} 
                />
                <View style={{ marginTop: ms(8) }}>
                  <ProgressBar progress={progress.calorieProgress} height={ms(6)} />
                </View>
              </View>
            </View>
          </View>

          {/* Enhanced Macros card */}
          <View style={[
            styles.heroCard, 
            { 
              width: width - ms(32), 
              height: HERO_H, 
              marginHorizontal: ms(8), 
              borderRadius: ms(14), 
              padding: ms(16) 
            }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { fontSize: ms(16) }]}>Macros</Text>
              <Text style={{ color: COLORS.muted, fontSize: ms(10) }}>
                Target • P {proteinTarget}g • F {fatTarget}g • C {carbTarget}g
              </Text>
            </View>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={{ flex: 1 }}
            >
              <View style={[
                styles.macrosRow, 
                { 
                  paddingVertical: ms(8),
                  gap: ms(isXSmall ? 8 : 12)
                }
              ]}>
                <Ring color="#22d3ee" used={carbsUsed} target={carbTarget} label="Carbs" />
                <Ring color="#a78bfa" used={fatUsed} target={fatTarget} label="Fat" />
                <Ring color="#fb923c" used={proteinUsed} target={proteinTarget} label="Protein" />
              </View>
            </ScrollView>
          </View>

          {/* Enhanced Heart Healthy card */}
          <View style={[
            styles.heroCard, 
            { 
              width: width - ms(32), 
              height: HERO_H, 
              marginHorizontal: ms(8), 
              borderRadius: ms(14), 
              padding: ms(16) 
            }
          ]}>
            <View style={styles.cardHeader}>
              <Text style={[styles.cardTitle, { fontSize: ms(16) }]}>Heart Health</Text>
              <Text style={{ color: COLORS.muted, fontSize: ms(10) }}>Daily limits</Text>
            </View>

            <View style={{ gap: ms(12), flex: 1, justifyContent: 'center' }}>
              <View>
                <MetricRow 
                  label="Total Fat" 
                  value={`${fatUsed}/${fatTarget}g`} 
                  ms={ms} 
                />
                <ProgressBar 
                  progress={fatTarget ? (fatUsed / fatTarget) * 100 : 0} 
                  tint={fatUsed > fatTarget ? COLORS.warning : COLORS.success}
                  height={ms(6)}
                />
              </View>

              <View>
                <MetricRow 
                  label="Sodium" 
                  value={`${sodiumUsed}/${sodiumCapMg}mg`} 
                  ms={ms} 
                />
                <ProgressBar 
                  progress={(sodiumUsed / sodiumCapMg) * 100} 
                  tint={sodiumUsed > sodiumCapMg * 0.8 ? COLORS.warning : COLORS.success}
                  height={ms(6)}
                />
              </View>

              <View>
                <MetricRow 
                  label="Cholesterol" 
                  value={`${cholesterolUsed}/${cholesterolCapMg}mg`} 
                  ms={ms} 
                />
                <ProgressBar 
                  progress={(cholesterolUsed / cholesterolCapMg) * 100}
                  tint={cholesterolUsed > cholesterolCapMg * 0.8 ? COLORS.warning : COLORS.success}
                  height={ms(6)}
                />
              </View>
            </View>
          </View>
        </Animated.ScrollView>

        {/* Dots */}
        <View style={[styles.dotsRow, { gap: ms(6), paddingVertical: ms(10) }]}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  width: ms(page === i ? 8 : 6),
                  height: ms(page === i ? 8 : 6),
                  borderRadius: ms(page === i ? 4 : 3),
                  backgroundColor: page === i ? "#cbd5e1" : "#334155",
                },
              ]}
            />
          ))}
        </View>

        {/* Enhanced Goal / Promo with personalization */}
        <View style={[
          styles.promoCard, 
          { 
            marginHorizontal: ms(16), 
            borderRadius: ms(14), 
            padding: ms(16), 
            gap: ms(14) 
          }
        ]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.promoTitle, { fontSize: ms(16) }]}>
              {profile?.weightGoal ? 
                `Goal: ${profile.weightGoal}` : 
                "Set your fitness goals"
              }
            </Text>
            <Text style={[styles.promoSub, { fontSize: ms(12), marginBottom: ms(12) }]}>
              {profile?.fitnessLevel ? 
                `Activity Level: ${profile.fitnessLevel}` : 
                "Personalize your experience for better results"
              }
            </Text>
            
            {/* Personalized action based on user data */}
            {!profile ? (
              <TouchableOpacity
                style={[
                  styles.promoBtn,
                  { paddingHorizontal: ms(12), paddingVertical: ms(8), borderRadius: ms(10) },
                ]}
                onPress={() => navigation.navigate("Onboarding")}
              >
                <Text style={[styles.promoBtnText, { fontSize: ms(13) }]}>
                  Complete Setup
                </Text>
              </TouchableOpacity>
            ) : (
              <View style={{ flexDirection: 'row', gap: ms(8) }}>
                <TouchableOpacity
                  style={[
                    styles.promoBtn,
                    { paddingHorizontal: ms(10), paddingVertical: ms(6), borderRadius: ms(8) },
                  ]}
                  onPress={() => navigation.navigate("Onboarding")}
                >
                  <Text style={[styles.promoBtnText, { fontSize: ms(11) }]}>
                    Edit Profile
                  </Text>
                </TouchableOpacity>
                
                {consumedKcal < baseGoal * 0.5 && (
                  <TouchableOpacity
                    style={[
                      styles.promoBtn,
                      { 
                        paddingHorizontal: ms(10), 
                        paddingVertical: ms(6), 
                        borderRadius: ms(8),
                        backgroundColor: COLORS.primary + '20',
                        borderColor: COLORS.primary,
                      },
                    ]}
                    onPress={() => navigation.navigate("FoodScanning")}
                  >
                    <Text style={[
                      styles.promoBtnText, 
                      { fontSize: ms(11), color: COLORS.primary }
                    ]}>
                      Log Food
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
          <Ionicons 
            name={profile?.weightGoal ? "trophy-outline" : "sparkles-outline"} 
            size={ms(44)} 
            color="#64748B" 
          />
        </View>

        {/* RESPONSIVE GRID TILES */}
        <View style={[
          styles.tilesContainer,
          { 
            paddingHorizontal: ms(16), 
            paddingTop: ms(12),
            gap: ms(12)
          }
        ]}>
          {/* Row 1 */}
          <View style={[
            styles.tilesRow,
            { gap: ms(12) }
          ]}>
            {/* Enhanced BMI with color coding */}
            <View style={[
              styles.tile, 
              { 
                flex: 1,
                padding: ms(14), 
                borderRadius: ms(14),
                borderWidth: 1,
                borderColor: bmi ? (bmiColor + '40') : COLORS.border,
              }
            ]}>
              <View style={[styles.tileHeader, { marginBottom: ms(8) }]}>
                <Text style={[styles.tileTitle, { fontSize: ms(14) }]}>BMI</Text>
                <View style={[
                  styles.bmiIndicator,
                  {
                    width: ms(8),
                    height: ms(8),
                    borderRadius: ms(4),
                    backgroundColor: bmiColor,
                  }
                ]} />
              </View>
              <Text style={[
                styles.tileBig, 
                { 
                  fontSize: ms(isXSmall ? 20 : 22), 
                  marginTop: 2,
                  color: bmiColor,
                }
              ]}>
                {bmi != null ? bmi.toFixed(1) : "--"}
              </Text>
              <Text style={[
                styles.tileSub, 
                { 
                  fontSize: ms(11), 
                  marginTop: 2,
                  color: bmiColor,
                }
              ]}>
                {bmiLabel}
              </Text>
            </View>

            {/* Enhanced Calories Target with progress */}
            <View style={[
              styles.tile, 
              { 
                flex: 1,
                padding: ms(14), 
                borderRadius: ms(14) 
              }
            ]}>
              <View style={[styles.tileHeader, { marginBottom: ms(8) }]}>
                <Text style={[styles.tileTitle, { fontSize: ms(14) }]}>Daily Goal</Text>
                <Ionicons name="flame-outline" size={ms(18)} color="#cbd5e1" />
              </View>
              <Text style={[
                styles.tileBig, 
                { fontSize: ms(isXSmall ? 20 : 22), marginTop: 2 }
              ]}>
                {baseGoal.toLocaleString()}
              </Text>
              <Text style={[styles.tileSub, { fontSize: ms(11), marginTop: 2 }]}>
                kcal target
              </Text>
              <View style={{ marginTop: ms(6) }}>
                <ProgressBar 
                  progress={progress.calorieProgress} 
                  height={ms(4)}
                  tint={progress.calorieProgress > 100 ? COLORS.warning : COLORS.primary}
                />
              </View>
            </View>
          </View>

          {/* Row 2 */}
          <View style={[
            styles.tilesRow,
            { gap: ms(12) }
          ]}>
            {/* Enhanced Weight with trend */}
            <View style={[
              styles.tile, 
              { 
                flex: 1,
                padding: ms(14), 
                borderRadius: ms(14) 
              }
            ]}>
              <View style={[styles.tileHeader, { marginBottom: ms(8) }]}>
                <Text style={[styles.tileTitle, { fontSize: ms(14) }]}>Weight</Text>
                <TouchableOpacity onPress={() => safeNav("WeightTracking")}>
                  <Ionicons name="add-circle-outline" size={ms(18)} color="#cbd5e1" />
                </TouchableOpacity>
              </View>
              <Text style={[
                styles.tileBig, 
                { fontSize: ms(isXSmall ? 20 : 22), marginTop: 2 }
              ]}>
                {latestWeight?.kg || profile?.weightKg || "--"}
                <Text style={[styles.tileSub, { fontSize: ms(14) }]}>
                  {(latestWeight?.kg || profile?.weightKg) ? " kg" : ""}
                </Text>
              </Text>
              <Text style={[styles.tileSub, { fontSize: ms(11), marginTop: 2 }]}>
                {latestWeight?.kg ? 
                  `Updated ${new Date(latestWeight.timestamp?.toDate?.() || Date.now()).toLocaleDateString()}` :
                  profile?.weightKg ? "From profile" : "Log your weight"
                }
              </Text>
            </View>

            {/* Water intake (if available) or Sleep */}
            <View style={[
              styles.tile, 
              { 
                flex: 1,
                padding: ms(14), 
                borderRadius: ms(14) 
              }
            ]}>
              <View style={[styles.tileHeader, { marginBottom: ms(8) }]}>
                <Text style={[styles.tileTitle, { fontSize: ms(14) }]}>
                  {profile?.lifestyle?.sleepHours ? 'Sleep' : 'Hydration'}
                </Text>
                <Ionicons 
                  name={profile?.lifestyle?.sleepHours ? "moon-outline" : "water-outline"} 
                  size={ms(18)} 
                  color="#cbd5e1" 
                />
              </View>
              <Text style={[
                styles.tileBig, 
                { fontSize: ms(isXSmall ? 20 : 22), marginTop: 2 }
              ]}>
                {profile?.lifestyle?.sleepHours ? 
                  `${profile.lifestyle.sleepHours}h` : 
                  "2.5L"
                }
              </Text>
              <Text style={[styles.tileSub, { fontSize: ms(11), marginTop: 2 }]}>
                {profile?.lifestyle?.sleepHours ? 
                  "Average sleep" : 
                  "Daily goal"
                }
              </Text>
            </View>
          </View>

          {/* Row 3 - Full width tiles for additional info */}
          {profile?.wantsCoach && (
            <View style={[
              styles.tile, 
              { 
                width: '100%',
                padding: ms(14), 
                borderRadius: ms(14),
                backgroundColor: COLORS.primary + '10',
                borderColor: COLORS.primary + '40',
                borderWidth: 1,
              }
            ]}>
              <View style={[styles.tileHeader, { marginBottom: ms(8) }]}>
                <Text style={[styles.tileTitle, { fontSize: ms(14), color: COLORS.primary }]}>
                  Coach Recommendations
                </Text>
                <Ionicons name="person-outline" size={ms(18)} color={COLORS.primary} />
              </View>
              <Text style={[styles.tileSub, { fontSize: ms(12), color: COLORS.text }]}>
                Based on your goals and progress, we recommend focusing on{' '}
                {progress.proteinProgress < 70 ? 'protein intake' : 
                 progress.calorieProgress < 50 ? 'meeting your calorie goals' :
                 'maintaining your great progress!'}
              </Text>
              <TouchableOpacity
                style={[
                  styles.coachBtn,
                  { 
                    marginTop: ms(8),
                    paddingHorizontal: ms(10), 
                    paddingVertical: ms(6), 
                    borderRadius: ms(8),
                    backgroundColor: COLORS.primary + '20',
                    borderColor: COLORS.primary,
                    borderWidth: 1,
                    alignSelf: 'flex-start',
                  },
                ]}
                onPress={() => navigation.navigate("CoachMarket")}
              >
                <Text style={[
                  styles.coachBtnText, 
                  { fontSize: ms(11), color: COLORS.primary }
                ]}>
                  View Coaches
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Actions based on user needs */}
        <View style={[
          styles.quickActions,
          { 
            paddingHorizontal: ms(16), 
            paddingTop: ms(16),
            gap: ms(8)
          }
        ]}>
          <Text style={[styles.sectionTitle, { fontSize: ms(16), marginBottom: ms(8) }]}>
            Quick Actions
          </Text>
          
          <View style={{ flexDirection: 'row', gap: ms(8) }}>
            {consumedKcal < baseGoal * 0.3 && (
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  { 
                    flex: 1,
                    paddingVertical: ms(12), 
                    paddingHorizontal: ms(16), 
                    borderRadius: ms(10),
                    backgroundColor: COLORS.primary + '20',
                    borderColor: COLORS.primary,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => navigation.navigate("FoodScanning")}
              >
                <Ionicons name="camera" size={ms(20)} color={COLORS.primary} />
                <Text style={[
                  styles.quickActionText, 
                  { fontSize: ms(12), color: COLORS.primary, marginTop: ms(4) }
                ]}>
                  Log Meal
                </Text>
              </TouchableOpacity>
            )}

            {!todayWorkout && profile?.fitnessLevel !== 'Sedentary' && (
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  { 
                    flex: 1,
                    paddingVertical: ms(12), 
                    paddingHorizontal: ms(16), 
                    borderRadius: ms(10),
                    backgroundColor: COLORS.secondary + '20',
                    borderColor: COLORS.secondary,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => navigation.navigate("ExerciseRecommendations")}
              >
                <Ionicons name="fitness" size={ms(20)} color={COLORS.secondary} />
                <Text style={[
                  styles.quickActionText, 
                  { fontSize: ms(12), color: COLORS.secondary, marginTop: ms(4) }
                ]}>
                  Start Workout
                </Text>
              </TouchableOpacity>
            )}

            {!latestWeight && (
              <TouchableOpacity
                style={[
                  styles.quickActionBtn,
                  { 
                    flex: 1,
                    paddingVertical: ms(12), 
                    paddingHorizontal: ms(16), 
                    borderRadius: ms(10),
                    backgroundColor: COLORS.accent + '20',
                    borderColor: COLORS.accent,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => safeNav("WeightTracking")}
              >
                <Ionicons name="scale" size={ms(20)} color={COLORS.accent} />
                <Text style={[
                  styles.quickActionText, 
                  { fontSize: ms(12), color: COLORS.accent, marginTop: ms(4) }
                ]}>
                  Log Weight
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Enhanced Bottom bar */}
      <View style={[
        styles.bottomBar, 
        { 
          paddingBottom: Math.max(insets.bottom, ms(8)),
          height: ms(88) + Math.max(insets.bottom, ms(8)),
        }
      ]}>
        <Nav icon="home" label="Dashboard" active onPress={() => {}} ms={ms} />
        <Nav icon="book-outline" label="Routine" onPress={() => navigation.navigate("ExerciseRecommendations")} ms={ms} />
        <Nav icon="stats-chart-outline" label="Progress" onPress={() => safeNav("Progress")} ms={ms} />
        <Nav icon="people-outline" label="Coaches" onPress={() => navigation.navigate("CoachMarket")} ms={ms} />
        <Nav icon="ellipsis-horizontal" label="More" onPress={() => setMoreVisible(true)} ms={ms} />
      </View>

      {/* Enhanced Camera FAB with better positioning */}
      <TouchableOpacity
        onPress={() => navigation.navigate("FoodScanning")}
        activeOpacity={0.92}
        style={[
          styles.fab,
          {
            width: ms(52),
            height: ms(52),
            borderRadius: ms(26),
            bottom: Math.max(insets.bottom, ms(8)) + ms(88) - ms(26),
            right: ms(16),
            shadowOpacity: 0.3,
            shadowOffset: { width: 0, height: 4 },
            shadowRadius: 8,
            elevation: 8,
          },
        ]}
      >
        <Ionicons name="camera" size={ms(24)} color="#0b1220" />
      </TouchableOpacity>

      {/* Enhanced More Sheet */}
      <Modal 
        visible={moreVisible} 
        transparent 
        animationType="slide" 
        onRequestClose={() => setMoreVisible(false)}
      >
        <TouchableOpacity 
          activeOpacity={1} 
          style={styles.sheetBackdrop} 
          onPress={() => setMoreVisible(false)} 
        />
        <View style={[
          styles.sheet, 
          { 
            paddingBottom: insets.bottom + ms(12),
            borderRadius: ms(16),
          }
        ]}>
          <View style={[
            styles.sheetHandle,
            { 
              width: ms(36), 
              height: ms(4), 
              borderRadius: ms(2),
              marginBottom: ms(12)
            }
          ]} />
          <Text style={[styles.sheetTitle, { fontSize: ms(18) }]}>More Options</Text>

          <SheetItem 
            icon="settings-outline" 
            text="Settings" 
            onPress={() => {
              setMoreVisible(false);
              navigation.navigate("Settings"); // <-- DIRECT TO SETTINGS
            }}
            ms={ms}
          />

          <SheetItem 
            icon="location-outline" 
            text="Find Gyms" 
            onPress={() => { 
              setMoreVisible(false); 
              navigation.navigate("GymDiscovery"); 
            }}
            ms={ms}
          />

          <SheetItem 
            icon="bar-chart-outline" 
            text="Analytics" 
            onPress={() => { 
              setMoreVisible(false); 
              safeNav("Analytics"); 
            }}
            ms={ms}
          />

          <SheetItem 
            icon="heart-outline" 
            text="Health Data" 
            onPress={() => { 
              setMoreVisible(false); 
              safeNav("HealthData"); 
            }}
            ms={ms}
          />

          <SheetItem 
            icon="clipboard-outline" 
            text="Feedback" 
            onPress={() => { 
              setMoreVisible(false); 
              safeNav("Feedback"); 
            }}
            ms={ms}
          />

          <SheetItem 
            icon="help-circle-outline" 
            text="Help & Support" 
            onPress={() => { 
              setMoreVisible(false); 
              safeNav("Support"); 
            }}
            ms={ms}
          />
        </View>
      </Modal>

      {/* Enhanced Loading state */}
      {loading && (
        <View style={styles.loadingMask}>
          <View style={styles.loadingContent}>
            <View style={styles.loadingSpinner} />
            <Text style={[
              styles.loadingText, 
              { color: COLORS.muted, fontSize: ms(14), marginTop: ms(12) }
            ]}>
              Loading your personalized dashboard...
            </Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  // Main container
  container: { 
    flex: 1, 
    backgroundColor: "#0B1220" 
  },

  // Header styles
  header: {
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#0B1220",
  },
  headerLeft: { 
    flexDirection: "row", 
    alignItems: "center", 
    gap: 12 
  },
  headerRight: { 
    flexDirection: "row", 
    alignItems: "center" 
  },
  iconBtn: { 
    padding: 8, 
    marginLeft: 6 
  },
  avatar: { 
    backgroundColor: "#334155", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  avatarInitial: { 
    color: "#e5e7eb", 
    fontWeight: "700" 
  },
  brand: { 
    color: "#e5e7eb", 
    fontWeight: "800", 
    letterSpacing: 0.2 
  },
  greeting: {
    color: "#94a3b8",
    fontWeight: "700"
  },

  // Today section
  todayRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  todayText: {
    color: "#e5e7eb",
    fontWeight: "800"
  },
  motivationText: {
    color: "#94a3b8",
    fontWeight: "500"
  },
  editBtn: {
    backgroundColor: "#1f2a44",
    borderWidth: 1,
    borderColor: "#22314f"
  },
  editText: {
    color: "#e5e7eb",
    fontWeight: "700"
  },

  // Hero cards
  heroCard: { 
    backgroundColor: "#111827" 
  },
  cardHeader: { 
    marginBottom: 6, 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  cardTitle: { 
    color: "#e5e7eb", 
    fontWeight: "700" 
  },

  // Calories grid
  calGrid: { 
    flexDirection: "row", 
    gap: 16, 
    alignItems: "center", 
    flex: 1 
  },

  // Donut chart
  donut: {
    backgroundColor: "#0f172a",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    borderColor: "#0e1626",
  },
  donutInner: { 
    alignItems: "center", 
    justifyContent: "center" 
  },
  donutBig: { 
    color: "#e5e7eb", 
    fontWeight: "800" 
  },
  donutSub: { 
    color: "#94a3b8", 
    marginTop: 2 
  },
  donutArc: {
    position: "absolute",
    borderColor: "#60a5fa",
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    top: 0,
    left: 0,
  },

  // Macros
  macrosRow: { 
    flexDirection: "row", 
    alignItems: "flex-start", 
    justifyContent: "space-between", 
    paddingTop: 8 
  },
  ringBlock: { 
    alignItems: "center", 
    width: "32%" 
  },
  ring: {
    backgroundColor: "transparent"
  },
  ringProgress: {
    position: "absolute",
    top: 0,
    left: 0,
    alignItems: "center",
    justifyContent: "center"
  },
  ringFill: {
    backgroundColor: "transparent"
  },
  ringValue: { 
    color: "#e5e7eb", 
    fontWeight: "800" 
  },
  ringLabel: { 
    color: "#a3e635", 
    fontWeight: "700", 
    marginTop: 2, 
    textAlign: "center" 
  },
  ringSub: { 
    color: "#94a3b8", 
    marginTop: 2, 
    textAlign: "center" 
  },

  // Progress bars
  pbBg: { 
    backgroundColor: "#1f2937", 
    borderRadius: 6, 
    overflow: "hidden", 
    width: "100%" 
  },
  pbFill: { 
    height: "100%", 
    borderRadius: 6 
  },

  // Dots indicator
  dotsRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    justifyContent: "center" 
  },
  dot: { 
    backgroundColor: "#334155" 
  },

  // Promo/Goal card
  promoCard: { 
    backgroundColor: "#111827", 
    flexDirection: "row", 
    alignItems: "center" 
  },
  promoTitle: { 
    color: "#e5e7eb", 
    fontWeight: "800" 
  },
  promoSub: { 
    color: "#94a3b8" 
  },
  promoBtn: { 
    alignSelf: "flex-start", 
    backgroundColor: "#1f2a44", 
    borderWidth: 1, 
    borderColor: "#22314f" 
  },
  promoBtnText: { 
    color: "#e5e7eb", 
    fontWeight: "700" 
  },

  // Health insights
  insightCard: {
    backgroundColor: "#60a5fa" + "20",
    borderColor: "#60a5fa",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8
  },
  insightText: {
    color: "#60a5fa",
    fontWeight: "500"
  },

  // Tiles container and layout
  tilesContainer: {
    paddingHorizontal: 16
  },
  tilesRow: {
    flexDirection: "row"
  },
  tile: { 
    backgroundColor: "#111827" 
  },
  tileHeader: { 
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center" 
  },
  tileTitle: { 
    color: "#e5e7eb", 
    fontWeight: "800" 
  },
  tileBig: { 
    color: "#e5e7eb", 
    fontWeight: "900" 
  },
  tileSub: { 
    color: "#94a3b8" 
  },
  bmiIndicator: {
    backgroundColor: "#10B981"
  },

  // Quick actions
  quickActions: {
    paddingHorizontal: 16
  },
  sectionTitle: {
    color: "#e5e7eb",
    fontWeight: "800"
  },
  quickActionBtn: {
    alignItems: "center",
    justifyContent: "center"
  },
  quickActionText: {
    fontWeight: "600"
  },

  // Coach section
  coachBtn: {
    alignSelf: "flex-start"
  },
  coachBtnText: {
    fontWeight: "700"
  },

  // Bottom navigation
  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "#0e1626",
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "#1f2937",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingTop: 10,
  },
  navItem: { 
    flex: 1, 
    alignItems: "center", 
    justifyContent: "center" 
  },
  navIconContainer: {
    alignItems: "center",
    justifyContent: "center"
  },
  navText: { 
    color: "#64748B", 
    fontSize: 11, 
    marginTop: 4, 
    textAlign: "center" 
  },

  // Floating Action Button
  fab: {
    position: "absolute",
    backgroundColor: "#10B981",
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
    zIndex: 50,
  },

  // Modal sheet
  sheetBackdrop: { 
    flex: 1, 
    backgroundColor: "rgba(0,0,0,0.45)" 
  },
  sheet: {
    position: "absolute",
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: "#111827",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  sheetHandle: { 
    alignSelf: "center", 
    width: 36, 
    height: 4, 
    borderRadius: 2, 
    backgroundColor: "#334155", 
    marginBottom: 8 
  },
  sheetTitle: { 
    color: "#e5e7eb", 
    fontWeight: "800", 
    marginBottom: 8 
  },
  sheetItem: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingVertical: 14, 
    borderBottomWidth: 1, 
    borderBottomColor: "#1f2937" 
  },
  sheetIconContainer: {
    backgroundColor: "#0f172a",
    padding: 8,
    borderRadius: 8,
    marginRight: 12
  },
  sheetText: { 
    color: "#e5e7eb", 
    fontWeight: "600", 
    marginLeft: 12, 
    flex: 1 
  },

  // Loading state
  loadingMask: {
    position: "absolute", 
    top: 0, 
    left: 0, 
    right: 0, 
    bottom: 0,
    backgroundColor: "#0B1220", 
    opacity: 0.95, 
    alignItems: "center", 
    justifyContent: "center",
  },
  loadingContent: {
    alignItems: "center",
    justifyContent: "center"
  },
  loadingSpinner: {
    width: 32,
    height: 32,
    borderWidth: 3,
    borderColor: "#1f2937",
    borderTopColor: "#10B981",
    borderRadius: 16
  },
  loadingText: {
    color: "#94a3b8",
    fontWeight: "500"
  }
});
