import React from 'react';
import { View, Text, StyleSheet, ScrollView, Image } from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';

// --- Theme Colors ---
const BG = "#0B1220";
const CARD = "#111827";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10b981"; // Adding success color for muscle tags

export default function ExerciseDetailScreen({ route }) {
  const { exercise } = route.params;

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Image source={{ uri: exercise.image }} style={styles.exerciseImage} />
          
          <View style={styles.detailCard}>
            <Text style={styles.title}>{exercise.name}</Text>
            <Text style={styles.description}>{exercise.description}</Text>
            
            {/* Instructions Section */}
            <Text style={styles.sectionHeader}>Instructions</Text>
            {exercise.instructions.map((step, index) => (
              <View key={index} style={styles.stepContainer}>
                <Text style={styles.stepNumber}>{index + 1}.</Text>
                <Text style={styles.stepText}>{step}</Text>
              </View>
            ))}
            
            {/* Targeted Muscles Section - NEW */}
            <Text style={styles.sectionHeader}>Targeted Muscles</Text>
            <View style={styles.musclesContainer}>
              {exercise.targeted_muscles.map((muscle, index) => (
                <View key={index} style={styles.muscleTag}>
                  <Text style={styles.muscleText}>{muscle}</Text>
                </View>
              ))}
            </View>
            
            {/* Positive Effects Section - NEW */}
            <Text style={styles.sectionHeader}>Positive Effects</Text>
            <View style={styles.effectsBox}>
              <Text style={styles.effectsText}>{exercise.positive_effects}</Text>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  content: {
    paddingBottom: 30,
  },
  exerciseImage: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  detailCard: {
    backgroundColor: CARD,
    borderRadius: 20,
    margin: 16,
    padding: 20,
    marginTop: -50,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: MUTED,
    marginBottom: 20,
    lineHeight: 24,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    color: TEXT,
    marginBottom: 10,
    marginTop: 20,
  },
  stepContainer: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  stepNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: TEXT,
    marginRight: 10,
  },
  stepText: {
    fontSize: 16,
    color: MUTED,
    flex: 1,
  },
  // New styles for Targeted Muscles
  musclesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 10,
  },
  muscleTag: {
    backgroundColor: SUCCESS,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
  },
  muscleText: {
    color: BG,
    fontSize: 14,
    fontWeight: '600',
  },
  // New styles for Positive Effects
  effectsBox: {
    backgroundColor: BG,
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 3,
    borderLeftColor: SUCCESS,
  },
  effectsText: {
    color: TEXT,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
  },
});