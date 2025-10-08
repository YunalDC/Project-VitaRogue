// src/screens/WorkoutDetailScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  StatusBar,
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
const DANGER = "#ef4444";

export default function WorkoutDetailScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const { exercise } = route.params;
  const [isFavorite, setIsFavorite] = useState(false);

  const handleStartWorkout = () => {
    navigation.navigate("WorkoutTimerScreen", { exercise });
  };

  const toggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // TODO: Save to user favorites in Firestore
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 10 }]}>
      <StatusBar barStyle="light-content" backgroundColor={BG} />
      
      {/* Header Image with Overlay */}
      <View style={styles.headerContainer}>
        <Image source={{ uri: exercise.image }} style={styles.headerImage} />
        <LinearGradient
          colors={['transparent', 'rgba(11, 18, 32, 0.8)', BG]}
          style={styles.gradient}
        />
        
        {/* Navigation Controls */}
        <View style={styles.navControls}>
          <TouchableOpacity 
            onPress={() => navigation.goBack()} 
            style={styles.navButton}
          >
            <Ionicons name="chevron-back" size={24} color={TEXT} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={toggleFavorite} 
            style={styles.navButton}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={24} 
              color={isFavorite ? DANGER : TEXT} 
            />
          </TouchableOpacity>
        </View>

        {/* Exercise Title Overlay */}
        <View style={styles.titleOverlay}>
          <Text style={styles.exerciseTitle}>{exercise.name}</Text>
          <View style={styles.metaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="flame-outline" size={16} color={ACCENT} />
              <Text style={styles.metaText}>{exercise.caloriesBurn} kcal</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="time-outline" size={16} color={ACCENT} />
              <Text style={styles.metaText}>{exercise.duration} min</Text>
            </View>
            <View style={styles.metaItem}>
              <Ionicons name="fitness-outline" size={16} color={ACCENT} />
              <Text style={styles.metaText}>{exercise.difficulty}</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About This Exercise</Text>
          <Text style={styles.description}>{exercise.description}</Text>
        </View>

        {/* Targeted Muscles */}
        {exercise.targetedMuscles && exercise.targetedMuscles.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Targeted Muscles</Text>
            <View style={styles.muscleGrid}>
              {exercise.targetedMuscles.map((muscle, index) => (
                <View key={index} style={styles.muscleChip}>
                  <Text style={styles.muscleText}>{muscle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Instructions */}
        {exercise.instructions && exercise.instructions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Instructions</Text>
            {exercise.instructions.map((instruction, index) => (
              <View key={index} style={styles.instructionItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepText}>{index + 1}</Text>
                </View>
                <Text style={styles.instructionText}>{instruction}</Text>
              </View>
            ))}
          </View>
        )}

        {/* Expected Results */}
        {exercise.positiveEffects && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Expected Results</Text>
            <View style={styles.resultsCard}>
              <Ionicons name="trending-up" size={24} color={ACCENT} />
              <Text style={styles.resultsText}>{exercise.positiveEffects}</Text>
            </View>
          </View>
        )}

        {/* Safety Tips */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Safety Tips</Text>
          <View style={styles.tipCard}>
            <Ionicons name="shield-checkmark-outline" size={20} color={ACCENT} />
            <View style={styles.tipContent}>
              <Text style={styles.tipText}>• Warm up for 5-10 minutes before starting</Text>
              <Text style={styles.tipText}>• Stop if you feel any pain or discomfort</Text>
              <Text style={styles.tipText}>• Stay hydrated throughout the workout</Text>
              <Text style={styles.tipText}>• Cool down with light stretching after</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Action */}
      <View style={styles.bottomAction}>
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handleStartWorkout}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[ACCENT, '#059669']}
            style={styles.startButtonGradient}
          >
            <Ionicons name="play" size={24} color="#000" />
            <Text style={styles.startButtonText}>Start Workout</Text>
          </LinearGradient>
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
  headerContainer: {
    height: height * 0.4,
    position: 'relative',
  },
  headerImage: {
    width: '100%',
    height: '100%',
    backgroundColor: CARD,
  },
  gradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '60%',
  },
  navControls: {
    position: 'absolute',
    top: 20, // Add more top spacing
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 16,
    right: 16,
  },
  exerciseTitle: {
    fontSize: 28,
    fontWeight: '800',
    color: TEXT,
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 12,
  },
  description: {
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
  },
  muscleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  muscleChip: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  muscleText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '500',
  },
  instructionItem: {
    flexDirection: 'row',
    marginBottom: 12,
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: ACCENT,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepText: {
    color: '#000',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
  },
  resultsCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  resultsText: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: MUTED,
  },
  tipCard: {
    flexDirection: 'row',
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  tipContent: {
    flex: 1,
    gap: 4,
  },
  tipText: {
    fontSize: 14,
    color: MUTED,
    lineHeight: 20,
  },
  bottomAction: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: BG,
  },
  startButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  startButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  startButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '700',
  },
});
