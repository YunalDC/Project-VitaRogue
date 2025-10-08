// src/screens/WorkoutTimerScreen.js
import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  Dimensions,
  Animated,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get("window");

// Theme
const BG = "#0B1220";
const CARD = "#111827";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const ACCENT = "#10B981";
const DANGER = "#ef4444";
const WARNING = "#f59e0b";

export default function WorkoutTimerScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { exercise } = route.params;
  
  // Timer state
  const [timeRemaining, setTimeRemaining] = useState(exercise.duration * 60); // Convert to seconds
  const [isRunning, setIsRunning] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [currentSet, setCurrentSet] = useState(1);
  const [totalSets] = useState(3); // Default sets
  
  // Animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  
  const intervalRef = useRef(null);
  const totalTime = exercise.duration * 60;

  useEffect(() => {
    if (isRunning && !isPaused) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            completeWorkout();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isRunning, isPaused]);

  useEffect(() => {
    // Update progress animation
    const progress = (totalTime - timeRemaining) / totalTime;
    Animated.timing(progressAnim, {
      toValue: progress,
      duration: 1000,
      useNativeDriver: false,
    }).start();
  }, [timeRemaining]);

  useEffect(() => {
    // Pulse animation for timer
    if (isRunning && !isPaused) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(1);
    }
  }, [isRunning, isPaused]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartPause = () => {
    if (!isRunning) {
      setIsRunning(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const handleStop = () => {
    setIsRunning(false);
    setIsPaused(false);
    setTimeRemaining(totalTime);
    navigation.goBack();
  };

  const handleNextSet = () => {
    if (currentSet < totalSets) {
      setCurrentSet(prev => prev + 1);
      setTimeRemaining(totalTime);
      setIsPaused(true);
    } else {
      completeWorkout();
    }
  };

  const completeWorkout = () => {
    setIsRunning(false);
    clearInterval(intervalRef.current);
    navigation.navigate("WorkoutCompletionScreen", { 
      exercise,
      timeCompleted: totalTime - timeRemaining,
      setsCompleted: currentSet
    });
  };

  const getTimerColor = () => {
    const progress = timeRemaining / totalTime;
    if (progress > 0.5) return ACCENT;
    if (progress > 0.2) return WARNING;
    return DANGER;
  };

  const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{exercise.name}</Text>
        <TouchableOpacity onPress={handleStop} style={styles.stopButton}>
          <Ionicons name="stop" size={24} color={DANGER} />
        </TouchableOpacity>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View 
            style={[
              styles.progressFill, 
              { 
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ['0%', '100%'],
                }),
                backgroundColor: getTimerColor()
              }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>{Math.round(progressPercentage)}% Complete</Text>
      </View>

      {/* Main Timer */}
      <View style={styles.timerContainer}>
        <Animated.View 
          style={[
            styles.timerCircle,
            { 
              transform: [{ scale: pulseAnim }],
              borderColor: getTimerColor()
            }
          ]}
        >
          <Text style={[styles.timerText, { color: getTimerColor() }]}>
            {formatTime(timeRemaining)}
          </Text>
          <Text style={styles.timerLabel}>
            {isRunning ? (isPaused ? 'PAUSED' : 'ACTIVE') : 'READY'}
          </Text>
        </Animated.View>
      </View>

      {/* Set Counter */}
      <View style={styles.setContainer}>
        <Text style={styles.setLabel}>Current Set</Text>
        <Text style={styles.setCounter}>{currentSet} / {totalSets}</Text>
        <TouchableOpacity 
          style={[
            styles.nextSetButton,
            { opacity: isRunning && !isPaused ? 1 : 0.5 }
          ]}
          onPress={handleNextSet}
          disabled={!isRunning || isPaused}
        >
          <Text style={styles.nextSetText}>Next Set</Text>
          <Ionicons name="chevron-forward" size={20} color={TEXT} />
        </TouchableOpacity>
      </View>

      {/* Exercise Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoCard}>
          <View style={styles.infoItem}>
            <Ionicons name="flame-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>{exercise.caloriesBurn} kcal</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="fitness-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>{exercise.difficulty}</Text>
          </View>
          <View style={styles.infoItem}>
            <Ionicons name="body-outline" size={20} color={ACCENT} />
            <Text style={styles.infoText}>
              {exercise.targetedMuscles?.slice(0, 2).join(', ') || 'Full Body'}
            </Text>
          </View>
        </View>
      </View>

      {/* Current Instruction */}
      {exercise.instructions && exercise.instructions.length > 0 && (
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionTitle}>Current Step:</Text>
          <Text style={styles.instructionText}>
            {exercise.instructions[Math.min(currentSet - 1, exercise.instructions.length - 1)]}
          </Text>
        </View>
      )}

      {/* Control Buttons */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity 
          style={styles.primaryButton} 
          onPress={handleStartPause}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isRunning && !isPaused ? [WARNING, '#d97706'] : [ACCENT, '#059669']}
            style={styles.buttonGradient}
          >
            <Ionicons 
              name={isRunning ? (isPaused ? 'play' : 'pause') : 'play'} 
              size={24} 
              color="#000" 
            />
            <Text style={styles.buttonText}>
              {isRunning ? (isPaused ? 'Resume' : 'Pause') : 'Start'}
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.secondaryButton} 
          onPress={completeWorkout}
          activeOpacity={0.8}
        >
          <Text style={styles.secondaryButtonText}>Complete Workout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
    flex: 1,
    textAlign: 'center',
    paddingHorizontal: 16,
  },
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: CARD,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressContainer: {
    paddingHorizontal: 16,
    marginBottom: 32,
  },
  progressBar: {
    height: 8,
    backgroundColor: CARD,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressText: {
    textAlign: 'center',
    color: MUTED,
    fontSize: 14,
    fontWeight: '600',
  },
  timerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: CARD,
  },
  timerText: {
    fontSize: 48,
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  timerLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: MUTED,
    marginTop: 8,
  },
  setContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  setLabel: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 4,
  },
  setCounter: {
    fontSize: 32,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 12,
  },
  nextSetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CARD,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 4,
  },
  nextSetText: {
    color: TEXT,
    fontWeight: '600',
  },
  infoContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderRadius: 12,
    padding: 16,
    justifyContent: 'space-around',
  },
  infoItem: {
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    color: TEXT,
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  instructionContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  instructionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 8,
  },
  instructionText: {
    fontSize: 14,
    lineHeight: 20,
    color: MUTED,
    backgroundColor: CARD,
    padding: 12,
    borderRadius: 8,
  },
  controlsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  primaryButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  buttonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
  secondaryButton: {
    backgroundColor: CARD,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '600',
  },
});
