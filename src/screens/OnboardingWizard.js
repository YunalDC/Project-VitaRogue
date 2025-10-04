// /src/screens/OnboardingWizard.jsx
// Enhanced one-question-per-page onboarding flow with stable, label-above inputs
// Requires: expo-linear-gradient, @react-navigation/native, @react-navigation/stack, @expo/vector-icons/Ionicons

import React, { useMemo, useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Animated,
  Dimensions,
  StatusBar,
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseAuth } from "../lib/firebaseApp";

const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

/*****************************************
 * THEME
 *****************************************/
const COLORS = {
  bg: "#0b1220",
  bg2: "#0f1b31",
  bgGradient: ["#0f1b31", "#0b1220", "#061018"],
  card: "#111827",
  cardElevated: "#1a2332",
  text: "#e5e7eb",
  textMuted: "#9ca3af",
  textDimmed: "#6b7280",
  border: "#1f2937",
  borderLight: "#374151",
  inputBg: "#0e1626",
  inputFocused: "#1e293b",
  primary: "#10b981",
  primaryAlt: "#34d399",
  primaryLight: "#6ee7b7",
  accent: "#60a5fa",
  stepIdle: "#203052",
  success: "#22c55e",
  warning: "#f59e0b",
  error: "#ef4444",
};

/*****************************************
 * BASIC INPUT (Label above field)
 *****************************************/
const InputField = ({
  label,
  value,
  onChangeText,
  placeholder,
  keyboardType = "default",
  multiline = false,
  icon,
  onFocus,
  onBlur,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.inputFieldContainer}>
      {!!label && <Text style={styles.inputLabel}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          { borderColor: focused ? COLORS.primary : COLORS.border },
          { backgroundColor: focused ? COLORS.inputFocused : COLORS.inputBg },
        ]}
      >
        {!!icon && (
          <Icon
            name={icon}
            size={20}
            color={focused ? COLORS.primary : COLORS.textMuted}
            style={{ marginRight: 8 }}
          />
        )}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textMuted}
          keyboardType={keyboardType}
          multiline={multiline}
          style={[styles.input, multiline && styles.inputMultiline]}
          onFocus={(e) => {
            setFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setFocused(false);
            onBlur?.(e);
          }}
          returnKeyType="done"
          blurOnSubmit={!multiline}
        />
      </View>
    </View>
  );
};

/*****************************************
 * BUTTON
 *****************************************/
const AnimatedButton = ({
  title,
  onPress,
  disabled,
  icon,
  variant = "primary",
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const handlePressIn = () => {
    Animated.spring(scaleAnim, { toValue: 0.96, useNativeDriver: true }).start();
  };
  const handlePressOut = () => {
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
  };
  const isPrimary = variant === "primary";
  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }] }, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        style={[
          isPrimary ? styles.primaryBtn : styles.secondaryBtn,
          disabled && { opacity: 0.5 },
        ]}
      >
        {!isPrimary && icon && (
          <Icon name={icon} size={18} color={COLORS.text} />
        )}
        <Text style={isPrimary ? styles.primaryBtnText : styles.secondaryBtnText}>
          {title}
        </Text>
        {isPrimary && icon && <Icon name={icon} size={18} color="#0b1220" />}
      </TouchableOpacity>
    </Animated.View>
  );
};

/*****************************************
 * OPTION CHIP
 *****************************************/
const EnhancedOptionChip = ({ label, selected, onPress, icon }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(selected ? 1 : 0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: selected ? 1.02 : 1,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: selected ? 1 : 0.9,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
  }, [selected]);

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }}>
      <TouchableOpacity
        onPress={onPress}
        activeOpacity={0.9}
        style={[
          styles.enhancedChip,
          selected ? styles.chipSelected : styles.chipIdle,
        ]}
      >
        {icon && (
          <Icon
            name={icon}
            size={16}
            color={selected ? "#0b1220" : COLORS.text}
            style={{ marginRight: 6 }}
          />
        )}
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {label}
        </Text>
        {selected && (
          <Icon
            name="checkmark-circle"
            size={16}
            color="#0b1220"
            style={{ marginLeft: 6 }}
          />
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/*****************************************
 * STEP CARD (animated in)
 *****************************************/
const StepCard = ({ children, step }) => {
  const slide = useRef(new Animated.Value(40)).current;
  const fade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    slide.setValue(40);
    fade.setValue(0);
    Animated.parallel([
      Animated.spring(slide, {
        toValue: 0,
        friction: 10,
        tension: 120,
        useNativeDriver: true,
      }),
      Animated.timing(fade, {
        toValue: 1,
        duration: 280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [step]);

  return (
    <Animated.View
      style={[
        styles.enhancedCard,
        { transform: [{ translateY: slide }], opacity: fade },
      ]}
    >
      <LinearGradient colors={[COLORS.cardElevated, COLORS.card]} style={styles.cardGradient}>
        {children}
      </LinearGradient>
    </Animated.View>
  );
};

/*****************************************
 * SUMMARY ROW
 *****************************************/
const EnhancedSummaryRow = ({ label, value, icon, onPress }) => (
  <TouchableOpacity
    onPress={onPress}
    activeOpacity={0.8}
    style={styles.enhancedSummaryRow}
  >
    <View style={styles.summaryIcon}>
      <Icon name={icon} size={18} color={COLORS.primary} />
    </View>
    <View style={styles.summaryContent}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
    <Icon name="chevron-forward" size={16} color={COLORS.textMuted} />
  </TouchableOpacity>
);

/*****************************************
 * MAIN WIZARD
 *****************************************/
export default function OnboardingWizard({ navigation }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({
    firstName: "",
    age: "",
    gender: "",
    heightCm: "",
    weightKg: "",
    conditions: "",
    weightGoal: "",
    diet: "",
    fitnessLevel: "",
    exerciseNotes: "",
    lifestyle: { sleepHours: "", stress: "" },
    wantsCoach: "",
  });

  const scrollRef = useRef(null);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: step,
      duration: 350,
      useNativeDriver: false,
    }).start();
  }, [step]);

  const totalSteps = 10; // 0..10 (11 screens including review)

  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  const STEPS = useMemo(
    () => [
      // 0
      {
        key: "firstName",
        title: "Welcome! What's your name?",
        subtitle: "Let's start by getting to know you better.",
        render: () => (
          <InputField
            label="First Name"
            value={answers.firstName}
            onChangeText={(t) => setAnswers((a) => ({ ...a, firstName: t }))}
            placeholder="Enter your name"
            icon="person-outline"
          />
        ),
        validate: () =>
          answers.firstName?.trim().length ? null : "Please enter your first name",
      },
      // 1
      {
        key: "age",
        title: "How old are you?",
        subtitle: "This helps us customize your experience.",
        render: () => (
          <InputField
            label="Age"
            value={String(answers.age)}
            onChangeText={(t) =>
              setAnswers((a) => ({ ...a, age: t.replace(/[^0-9]/g, "") }))
            }
            placeholder="Your age"
            keyboardType="number-pad"
            icon="calendar-outline"
          />
        ),
        validate: () => {
          const n = Number(answers.age);
          if (!n) return "Please enter your age";
          if (n < 13 || n > 120) return "Please enter a valid age (13-120)";
          return null;
        },
      },
      // 2
      {
        key: "gender",
        title: "Gender identity",
        subtitle: "Choose what feels right for you.",
        render: () => (
          <View style={styles.optionsGrid}>
            {[
              { label: "Male", icon: "male" },
              { label: "Female", icon: "female" },
              { label: "Non-binary", icon: "male-female" },
              { label: "Prefer not to say", icon: "help-circle-outline" },
            ].map(({ label, icon }) => (
              <EnhancedOptionChip
                key={label}
                label={label}
                icon={icon}
                selected={answers.gender === label}
                onPress={() => setAnswers((a) => ({ ...a, gender: label }))}
              />
            ))}
          </View>
        ),
        validate: () => (answers.gender ? null : "Please select an option"),
      },
      // 3
      {
        key: "measurements",
        title: "Body measurements",
        subtitle: "We'll use this to calculate your health metrics.",
        render: () => (
          <View style={styles.measurementRow}>
            <View style={{ flex: 1, marginRight: 8 }}>
              <InputField
                label="Height (cm)"
                value={String(answers.heightCm)}
                onChangeText={(t) =>
                  setAnswers((a) => ({
                    ...a,
                    heightCm: t.replace(/[^0-9.]/g, ""),
                  }))
                }
                placeholder="170"
                keyboardType="decimal-pad"
                icon="resize-outline"
              />
            </View>
            <View style={{ flex: 1, marginLeft: 8 }}>
              <InputField
                label="Weight (kg)"
                value={String(answers.weightKg)}
                onChangeText={(t) =>
                  setAnswers((a) => ({
                    ...a,
                    weightKg: t.replace(/[^0-9.]/g, ""),
                  }))
                }
                placeholder="70"
                keyboardType="decimal-pad"
                icon="fitness-outline"
              />
            </View>
          </View>
        ),
        validate: () => {
          if (!Number(answers.heightCm)) return "Please enter your height";
          if (!Number(answers.weightKg)) return "Please enter your weight";
          return null;
        },
      },
      // 4
      {
        key: "health",
        title: "Health considerations",
        subtitle: "Any conditions or allergies we should know about?",
        render: () => (
          <InputField
            label="Medical conditions, allergies, or medications"
            value={answers.conditions}
            onChangeText={(t) => setAnswers((a) => ({ ...a, conditions: t }))}
            placeholder="e.g., diabetes, lactose intolerance, blood pressure medication"
            multiline
            icon="medical-outline"
          />
        ),
        validate: () => null,
      },
      // 5
      {
        key: "goals",
        title: "What's your main goal?",
        subtitle: "This will help us tailor your recommendations.",
        render: () => (
          <View style={styles.optionsGrid}>
            {[
              { label: "Lose weight", icon: "trending-down" },
              { label: "Maintain weight", icon: "remove-outline" },
              { label: "Build muscle", icon: "barbell-outline" },
              { label: "General health", icon: "heart-outline" },
            ].map(({ label, icon }) => (
              <EnhancedOptionChip
                key={label}
                label={label}
                icon={icon}
                selected={answers.weightGoal === label}
                onPress={() => setAnswers((a) => ({ ...a, weightGoal: label }))}
              />
            ))}
          </View>
        ),
        validate: () => (answers.weightGoal ? null : "Please select your main goal"),
      },
      // 6
      {
        key: "nutrition",
        title: "Dietary preferences",
        subtitle: "What eating style works best for you?",
        render: () => (
          <View style={styles.optionsGrid}>
            {[
              { label: "No restrictions", icon: "restaurant-outline" },
              { label: "Vegetarian", icon: "leaf-outline" },
              { label: "Vegan", icon: "flower-outline" },
              { label: "Pescatarian", icon: "fish-outline" },
              { label: "Keto/Low-carb", icon: "nutrition-outline" },
              { label: "Mediterranean", icon: "pizza-outline" },
              { label: "Halal", icon: "moon-outline" },
              { label: "Other", icon: "ellipsis-horizontal" },
            ].map(({ label, icon }) => (
              <EnhancedOptionChip
                key={label}
                label={label}
                icon={icon}
                selected={answers.diet === label}
                onPress={() => setAnswers((a) => ({ ...a, diet: label }))}
              />
            ))}
          </View>
        ),
        validate: () => (answers.diet ? null : "Please select a dietary preference"),
      },
      // 7
      {
        key: "activity",
        title: "Current activity level",
        subtitle: "How would you describe your typical week?",
        render: () => (
          <View>
            <View style={styles.optionsColumn}>
              {[
                { label: "Sedentary", icon: "bed-outline", desc: "Desk job, minimal exercise" },
                { label: "Light activity", icon: "walk-outline", desc: "Some walking, light exercise" },
                { label: "Moderate", icon: "bicycle-outline", desc: "Regular workouts 3-4x/week" },
                { label: "Very active", icon: "barbell-outline", desc: "Daily exercise, athletic" },
              ].map(({ label, icon, desc }) => (
                <View key={label} style={styles.activityOption}>
                  <EnhancedOptionChip
                    label={label}
                    icon={icon}
                    selected={answers.fitnessLevel === label}
                    onPress={() => setAnswers((a) => ({ ...a, fitnessLevel: label }))}
                  />
                  <Text style={styles.activityDesc}>{desc}</Text>
                </View>
              ))}
            </View>

            <View style={{ marginTop: 20 }}>
              <InputField
                label="Exercise notes (optional)"
                value={answers.exerciseNotes}
                onChangeText={(t) => setAnswers((a) => ({ ...a, exerciseNotes: t }))}
                placeholder="Any injuries, preferred activities, current routine?"
                multiline
                icon="clipboard-outline"
              />
            </View>
          </View>
        ),
        validate: () => (answers.fitnessLevel ? null : "Please select your activity level"),
      },
      // 8
      {
        key: "lifestyle",
        title: "Lifestyle factors",
        subtitle: "These details help us give better recommendations.",
        render: () => (
          <View>
            <InputField
              label="Average sleep per night (hours)"
              value={String(answers.lifestyle.sleepHours)}
              onChangeText={(t) =>
                setAnswers((a) => ({
                  ...a,
                  lifestyle: { ...a.lifestyle, sleepHours: t.replace(/[^0-9.]/g, "") },
                }))
              }
              placeholder="7.5"
              keyboardType="decimal-pad"
              icon="moon-outline"
            />

            <View style={{ marginTop: 20 }}>
              <Text style={styles.subLabel}>Daily stress level</Text>
              <View style={styles.stressScale}>
                {[
                  { num: 1, label: "Very low", emoji: "😌" },
                  { num: 2, label: "Low", emoji: "🙂" },
                  { num: 3, label: "Moderate", emoji: "😐" },
                  { num: 4, label: "High", emoji: "😰" },
                  { num: 5, label: "Very high", emoji: "🤯" },
                ].map(({ num, label, emoji }) => {
                  const selected = String(answers.lifestyle.stress) === String(num);
                  return (
                    <TouchableOpacity
                      key={num}
                      onPress={() =>
                        setAnswers((a) => ({
                          ...a,
                          lifestyle: { ...a.lifestyle, stress: num },
                        }))
                      }
                      style={[styles.stressOption, selected && styles.stressSelected]}
                      activeOpacity={0.9}
                    >
                      <Text style={styles.stressEmoji}>{emoji}</Text>
                      <Text style={[styles.stressNum, selected && styles.stressNumSelected]}>{num}</Text>
                      <Text style={[styles.stressLabel, selected && styles.stressLabelSelected]} numberOfLines={1}>
                        {label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          </View>
        ),
        validate: () => {
          if (!answers.lifestyle.sleepHours) return "Please enter your average sleep hours";
          if (!answers.lifestyle.stress) return "Please select your stress level";
          return null;
        },
      },
      // 9
      {
        key: "coaching",
        title: "Personal coaching ",
        subtitle: "Would you like to work with a personal health coach?",
        render: () => (
          <View style={styles.optionsGrid}>
            {[
              { label: "Yes, connect me", icon: "people-outline" },
              { label: "Not right now", icon: "close-circle-outline" },
              { label: "Tell me more", icon: "information-circle-outline" },
            ].map(({ label, icon }) => (
              <EnhancedOptionChip
                key={label}
                label={label}
                icon={icon}
                selected={answers.wantsCoach === label}
                onPress={() => setAnswers((a) => ({ ...a, wantsCoach: label }))}
              />
            ))}
          </View>
        ),
        validate: () => (answers.wantsCoach ? null : "Please select an option"),
      },
      // 10
      {
        key: "review",
        title: "Review your profile",
        subtitle: "Everything look good? Tap any item to edit.",
        isSummary: true,
        render: () => (
          <View style={styles.summaryContainer}>
            {[
              { label: "Name", value: answers.firstName, step: 0, icon: "person" },
              { label: "Age", value: `${answers.age} years`, step: 1, icon: "calendar" },
              { label: "Gender", value: answers.gender, step: 2, icon: "body" },
              { label: "Height", value: `${answers.heightCm} cm`, step: 3, icon: "resize" },
              { label: "Weight", value: `${answers.weightKg} kg`, step: 3, icon: "fitness" },
              { label: "Health notes", value: answers.conditions || "None specified", step: 4, icon: "medical" },
              { label: "Goal", value: answers.weightGoal, step: 5, icon: "barbell" },
              { label: "Diet", value: answers.diet, step: 6, icon: "restaurant" },
              { label: "Activity", value: answers.fitnessLevel, step: 7, icon: "bicycle" },
              { label: "Sleep", value: `${answers.lifestyle.sleepHours} hours`, step: 8, icon: "moon" },
              { label: "Stress", value: `Level ${answers.lifestyle.stress}/5`, step: 8, icon: "pulse" },
              { label: "Coaching", value: answers.wantsCoach, step: 9, icon: "people" },
            ].map(({ label, value, step: editStep, icon }, idx) => (
              <EnhancedSummaryRow key={idx} label={label} value={value} icon={icon} onPress={() => setStep(editStep)} />
            ))}
          </View>
        ),
        validate: () => null,
      },
    ],
    [answers]
  );

  const handleNext = () => {
    const err = STEPS[step].validate?.();
    if (err) return Alert.alert("Incomplete", err);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const handleBack = () => setStep((s) => Math.max(0, s - 1));

  const onFinish = async () => {
    try {
      const uid = firebaseAuth.currentUser?.uid;
      if (uid) {
        // Merge profile answers and mark onboarding complete
        await setDoc(
          doc(db, "users", uid),
          {
            onboardingComplete: true,
            onboardingCompletedAt: serverTimestamp(),
            profile: answers,
          },
          { merge: true }
        );
      }
      // ✅ No cross-tree navigation here.
      // App.js listens to the user doc and will switch to MainStack automatically.
      Alert.alert("All set!", "Your profile is saved. Loading your dashboard…");
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Error saving profile. Please try again.");
    }
  };

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      <LinearGradient colors={COLORS.bgGradient} style={{ flex: 1 }}>
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView
            behavior={Platform.OS === "ios" ? "padding" : "height"}
            style={{ flex: 1 }}
            keyboardVerticalOffset={Platform.select({ ios: 10, android: 0 })}
          >
            <ScrollView
              ref={scrollRef}
              contentContainerStyle={styles.container}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {/* Progress */}
              <View style={styles.progressContainer}>
                <View style={styles.progressBackground}>
                  <Animated.View
                    style={[
                      styles.progressFill,
                      {
                        width: progressAnim.interpolate({
                          inputRange: [0, totalSteps],
                          outputRange: ["0%", "100%"],
                          extrapolate: "clamp",
                        }),
                      },
                    ]}
                  />
                </View>
                <Text style={styles.progressText}>
                  {step + 1} of {totalSteps + 1}
                </Text>
              </View>

              {/* Titles */}
              <View style={styles.titleSection}>
                <Text style={styles.title}>{STEPS[step].title}</Text>
                {!!STEPS[step].subtitle && (
                  <Text style={styles.subtitle}>{STEPS[step].subtitle}</Text>
                )}
              </View>

              {/* Card */}
              <StepCard step={step}>{STEPS[step].render()}</StepCard>

              {/* Nav Buttons */}
              <View style={styles.navigationContainer}>
                {step > 0 ? (
                  <AnimatedButton
                    title="Back"
                    onPress={handleBack}
                    variant="secondary"
                    icon="chevron-back"
                    style={{ flex: 0.42 }}
                  />
                ) : (
                  <View style={{ flex: 0.42 }} />
                )}

                {step === STEPS.length - 1 ? (
                  <AnimatedButton
                    title="Complete Setup"
                    onPress={onFinish}
                    icon="checkmark-circle"
                    style={{ flex: 0.58, marginLeft: 12 }}
                  />
                ) : (
                  <AnimatedButton
                    title="Continue"
                    onPress={handleNext}
                    icon="arrow-forward"
                    style={{ flex: 0.58, marginLeft: 12 }}
                  />
                )}
              </View>

              {/* Bottom spacer */}
              <View style={{ height: 16 }} />
            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </LinearGradient>
    </>
  );
}

/*****************************************
 * STYLES
 *****************************************/
const H_PADDING = Math.max(16, Math.min(24, Math.round(screenWidth * 0.05)));

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: H_PADDING,
    paddingTop: 12,
    paddingBottom: 24,
    minHeight: screenHeight * 0.9,
  },
  progressContainer: {
    marginTop: Platform.select({ ios: 24, android: 20 }),
    marginBottom: 22,
  },
  progressBackground: {
    height: 8,
    backgroundColor: COLORS.stepIdle,
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 4,
  },
  progressText: {
    color: COLORS.textMuted,
    fontSize: 12,
    textAlign: "center",
    marginTop: 8,
    fontWeight: "600",
  },

  // Title
  titleSection: {
    marginBottom: 18,
    paddingHorizontal: 2,
  },
  title: {
    fontSize: Platform.OS === "ios" ? 28 : 26,
    fontWeight: "800",
    color: COLORS.text,
    lineHeight: 32,
  },
  subtitle: {
    color: COLORS.textMuted,
    fontSize: 15,
    marginTop: 8,
    lineHeight: 21,
  },

  // Card
  enhancedCard: {
    borderRadius: 20,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  cardGradient: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
  },

  // Input field
  inputFieldContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.text,
    fontSize: 14,
    fontWeight: "700",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    backgroundColor: COLORS.inputBg,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: Platform.OS === "ios" ? 6 : 4,
  },
  inputMultiline: {
    minHeight: 96,
    textAlignVertical: "top",
    paddingTop: Platform.OS === "ios" ? 6 : 0,
    paddingBottom: 6,
  },

  // Chips
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -6,
  },
  optionsColumn: {
    width: "100%",
  },
  enhancedChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 22,
    borderWidth: 2,
    minWidth: 110,
    justifyContent: "center",
    marginHorizontal: 6,
    marginBottom: 12,
  },
  chipIdle: {
    backgroundColor: COLORS.inputBg,
    borderColor: COLORS.border,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  chipText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
  },
  chipTextSelected: {
    color: "#0b1220",
    fontWeight: "700",
  },

  // Activity
  activityOption: {
    width: "100%",
    marginBottom: 10,
    alignItems: "center",
  },
  activityDesc: {
    color: COLORS.textDimmed,
    fontSize: 12,
    textAlign: "center",
    marginTop: 6,
    paddingHorizontal: 6,
  },

  // Measurements row
  measurementRow: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  // Lifestyle
  subLabel: {
    color: COLORS.text,
    fontWeight: "700",
    marginBottom: 12,
    fontSize: 15,
  },
  stressScale: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  stressOption: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    backgroundColor: COLORS.inputBg,
    borderWidth: 2,
    borderColor: COLORS.border,
    marginHorizontal: 4,
  },
  stressSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primaryLight,
  },
  stressEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  stressNum: {
    color: COLORS.text,
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 2,
  },
  stressNumSelected: {
    color: "#0b1220",
  },
  stressLabel: {
    color: COLORS.textMuted,
    fontSize: 11,
    textAlign: "center",
    fontWeight: "700",
  },
  stressLabelSelected: {
    color: "#0b1220",
  },

  // Buttons
  navigationContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtnText: {
    color: "#0b1220",
    fontWeight: "800",
    fontSize: 16,
  },
  secondaryBtn: {
    backgroundColor: COLORS.card,
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 28,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
  },

  // Summary
  summaryContainer: {
    gap: 12,
  },
  enhancedSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  summaryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  summaryContent: {
    flex: 1,
  },
  summaryLabel: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: "700",
    marginBottom: 2,
  },
  summaryValue: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "800",
  },
});
