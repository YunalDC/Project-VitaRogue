// src/screens/WorkoutCompletionScreen.js
import React, { useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

// Theme
const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const ACCENT = "#10B981";
const SUCCESS = "#22c55e";
const WARNING = "#f59e0b";

export default function WorkoutCompletionScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { exercise, timeCompleted, setsCompleted } = route.params;
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const statsAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entrance animation
    Animated.sequence([
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(statsAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const calculateCaloriesBurned = () => {
    if (!exercise.duration || !exercise.caloriesBurn) return 0;
    const percentCompleted = timeCompleted / (exercise.duration * 60);
    return Math.round(exercise.caloriesBurn * percentCompleted);
  };

  const getCompletionMessage = () => {
    if (!exercise.duration) return "Great workout! 🌟";
    const percentCompleted = (timeCompleted / (exercise.duration * 60)) * 100;
    
    if (percentCompleted >= 100) return "Outstanding! Perfect workout! 🔥";
    if (percentCompleted >= 80) return "Excellent work! Almost there! 💪";
    if (percentCompleted >= 60) return "Great effort! Keep it up! 👏";
    if (percentCompleted >= 40) return "Good start! You're improving! 💯";
    return "Every step counts! 🌟";
  };

  const handleSaveProgress = () => {
    // TODO: Save workout data to Firestore/analytics
    console.log("Saving workout progress:", {
      exercise: exercise.name || "Unknown Exercise",
      timeCompleted,
      caloriesBurned: calculateCaloriesBurned(),
      setsCompleted,
      date: new Date().toISOString(),
    });
    
    navigation.navigate("Home");
  };

  const caloriesBurned = calculateCaloriesBurned();
  const completionPercent = exercise.duration ? 
    Math.round((timeCompleted / (exercise.duration * 60)) * 100) : 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20 }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        <Animated.View 
          style={[
            styles.content,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          {/* Success Icon */}
          <View style={styles.iconContainer}>
            <LinearGradient
              colors={[SUCCESS, ACCENT]}
              style={styles.iconGradient}
            >
              <Ionicons name="checkmark" size={48} color="#000" />
            </LinearGradient>
          </View>

        {/* Title */}
        <Text style={styles.title}>Workout Complete!</Text>
        <Text style={styles.subtitle}>{getCompletionMessage()}</Text>
        <Text style={styles.exerciseName}>{exercise.name || "Workout"}</Text>

        {/* Stats */}
        <Animated.View 
          style={[
            styles.statsContainer,
            {
              opacity: statsAnim,
              transform: [{
                translateY: statsAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [50, 0],
                })
              }]
            }
          ]}
        >
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(34, 197, 94, 0.1)', 'rgba(16, 185, 129, 0.1)']}
                style={styles.statGradient}
              >
                <Ionicons name="time" size={32} color={SUCCESS} />
                <Text style={styles.statValue}>{formatTime(timeCompleted)}</Text>
                <Text style={styles.statLabel}>Time Active</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(245, 158, 11, 0.1)', 'rgba(217, 119, 6, 0.1)']}
                style={styles.statGradient}
              >
                <Ionicons name="flame" size={32} color={WARNING} />
                <Text style={styles.statValue}>{caloriesBurned}</Text>
                <Text style={styles.statLabel}>Calories Burned</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(16, 185, 129, 0.1)', 'rgba(5, 150, 105, 0.1)']}
                style={styles.statGradient}
              >
                <Ionicons name="fitness" size={32} color={ACCENT} />
                <Text style={styles.statValue}>{setsCompleted}</Text>
                <Text style={styles.statLabel}>Sets Completed</Text>
              </LinearGradient>
            </View>

            <View style={styles.statCard}>
              <LinearGradient
                colors={['rgba(99, 102, 241, 0.1)', 'rgba(79, 70, 229, 0.1)']}
                style={styles.statGradient}
              >
                <Ionicons name="trophy" size={32} color="#6366f1" />
                <Text style={styles.statValue}>{completionPercent}%</Text>
                <Text style={styles.statLabel}>Completion</Text>
              </LinearGradient>
            </View>
          </View>
        </Animated.View>

        {/* Achievement Badge */}
        {completionPercent >= 100 && (
          <Animated.View 
            style={[
              styles.achievementBadge,
              { opacity: statsAnim }
            ]}
          >
            <Ionicons name="medal" size={24} color={WARNING} />
            <Text style={styles.achievementText}>Perfect Workout!</Text>
          </Animated.View>
        )}

        {/* Positive Effects */}
        <Animated.View 
          style={[
            styles.effectsContainer,
            { opacity: statsAnim }
          ]}
        >
          <Text style={styles.effectsTitle}>What You Achieved:</Text>
          <View style={styles.effectsCard}>
            <Ionicons name="trending-up" size={24} color={ACCENT} />
            <Text style={styles.effectsText}>{exercise.positive_effects || "Great job completing this workout! You're building stronger, healthier habits."}</Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <Animated.View 
          style={[
            styles.actionsContainer,
            { opacity: statsAnim }
          ]}
        >
          <TouchableOpacity 
            style={styles.primaryButton} 
            onPress={handleSaveProgress}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[ACCENT, SUCCESS]}
              style={styles.buttonGradient}
            >
              <Ionicons name="checkmark-circle" size={24} color="#000" />
              <Text style={styles.primaryButtonText}>Save Progress</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  content: {
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'flex-start', // Change from center to flex-start
    paddingTop: 20, // Reduced from 40
  },
  iconContainer: {
    marginBottom: 32, // Increase margin for better spacing
    marginTop: 20, // Add top margin to push away from notch
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: ACCENT,
    textAlign: 'center',
    marginBottom: 16,
    fontWeight: '600',
  },
  exerciseName: {
    fontSize: 20,
    color: MUTED,
    textAlign: 'center',
    marginBottom: 32,
    fontWeight: '500',
  },
  statsContainer: {
    width: '100%',
    marginBottom: 20, // Reduced from 24
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'center', // Center the grid items
  },
  statCard: {
    width: (width - 72) / 2, // Account for padding and gap
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 8, // Add bottom margin for better spacing
  },
  statGradient: {
    padding: 16,
    alignItems: 'center',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '800',
    color: TEXT,
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '500',
  },
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    borderWidth: 1,
    borderColor: WARNING,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
    marginBottom: 24,
  },
  achievementText: {
    color: WARNING,
    fontWeight: '700',
    fontSize: 16,
  },
  effectsContainer: {
    width: '100%',
    marginBottom: 20, // Reduced from 32
  },
  effectsTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
    textAlign: 'center',
  },
  effectsCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    gap: 12,
    alignItems: 'flex-start',
  },
  effectsText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    paddingTop: 16, // Add top padding for better spacing
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  primaryButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});
