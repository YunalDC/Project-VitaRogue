import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const BG = '#0B1220';
const CARD = '#111827';
const BORDER = '#1f2937';
const TEXT = '#e5e7eb';
const MUTED = '#94a3b8';
const SUCCESS = '#10B981';

// Helper component for nutrient rows
const NutrientRow = ({ icon, name, value }) => (
  <View style={styles.nutrientRow}>
    <View style={styles.nutrientLeft}>
      <Ionicons name={icon} size={18} color={MUTED} />
      <Text style={styles.nutrientName}>{name}</Text>
    </View>
    <Text style={styles.nutrientValue}>{value}</Text>
  </View>
);

export default function FoodDetailsScreen({ route, navigation }) {
  const { foodData } = route.params;
  
  // Mock nutritional data - replace with actual API call
  const nutritionData = {
    calories: Math.round((foodData.grams / 100) * 52), // Apple: ~52 cal/100g
    protein: Math.round((foodData.grams / 100) * 0.3 * 10) / 10,
    fat: Math.round((foodData.grams / 100) * 0.2 * 10) / 10,
    carbs: Math.round((foodData.grams / 100) * 14 * 10) / 10,
    fiber: Math.round((foodData.grams / 100) * 2.4 * 10) / 10,
    sugar: Math.round((foodData.grams / 100) * 10.4 * 10) / 10,
    sodium: Math.round((foodData.grams / 100) * 1),
  };

  const handleSaveToLog = () => {
    // Here you would save to your nutrition log / Firebase
    Alert.alert(
      'Added to Log',
      `${foodData.name} (${foodData.grams}g) has been added to your nutrition log.`,
      [
        {
          text: 'OK',
          onPress: () => navigation.navigate('Home'),
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={BG} />
      {Platform.OS === 'android' && <RNStatusBar barStyle="light-content" />}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nutrition Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Summary Card */}
        <View style={styles.card}>
          <View style={styles.foodSummary}>
            <View style={styles.foodIcon}>
              <Ionicons name="nutrition-outline" size={32} color={SUCCESS} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.foodName}>{foodData.name}</Text>
              <Text style={styles.foodWeight}>{foodData.grams}g portion</Text>
            </View>
            <View style={styles.caloriesBadge}>
              <Text style={styles.caloriesText}>{nutritionData.calories}</Text>
              <Text style={styles.caloriesLabel}>cal</Text>
            </View>
          </View>
        </View>

        {/* Macronutrients */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Macronutrients</Text>
          <View style={styles.macroGrid}>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: '#fb923c20' }]}>
                <Ionicons name="fitness-outline" size={20} color="#fb923c" />
              </View>
              <Text style={styles.macroValue}>{nutritionData.protein}g</Text>
              <Text style={styles.macroLabel}>Protein</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: '#22d3ee20' }]}>
                <Ionicons name="water-outline" size={20} color="#22d3ee" />
              </View>
              <Text style={styles.macroValue}>{nutritionData.carbs}g</Text>
              <Text style={styles.macroLabel}>Carbs</Text>
            </View>
            <View style={styles.macroItem}>
              <View style={[styles.macroIcon, { backgroundColor: '#a78bfa20' }]}>
                <Ionicons name="flame-outline" size={20} color="#a78bfa" />
              </View>
              <Text style={styles.macroValue}>{nutritionData.fat}g</Text>
              <Text style={styles.macroLabel}>Fat</Text>
            </View>
          </View>
        </View>

        {/* Additional Nutrients */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Additional Nutrients</Text>
          <View style={styles.nutrientsList}>
            <NutrientRow icon="leaf-outline" name="Fiber" value={`${nutritionData.fiber}g`} />
            <NutrientRow icon="cube-outline" name="Sugar" value={`${nutritionData.sugar}g`} />
            <NutrientRow icon="water-outline" name="Sodium" value={`${nutritionData.sodium}mg`} />
          </View>
        </View>

        {/* Health Benefits */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Health Benefits</Text>
          <View style={styles.benefitsList}>
            <View style={styles.benefitItem}>
              <Ionicons name="heart-outline" size={16} color={SUCCESS} />
              <Text style={styles.benefitText}>Rich in antioxidants</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="shield-outline" size={16} color={SUCCESS} />
              <Text style={styles.benefitText}>Supports immune system</Text>
            </View>
            <View style={styles.benefitItem}>
              <Ionicons name="fitness-outline" size={16} color={SUCCESS} />
              <Text style={styles.benefitText}>Good source of fiber</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Save Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.saveBtn} onPress={handleSaveToLog}>
          <Ionicons name="checkmark-circle-outline" size={24} color={BG} />
          <Text style={styles.saveBtnText}>Add to Nutrition Log</Text>
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
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },

  // Food Details styles
  foodSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  foodIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SUCCESS + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodName: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },
  foodWeight: {
    color: MUTED,
    fontSize: 14,
    marginTop: 2,
  },
  caloriesBadge: {
    alignItems: 'center',
  },
  caloriesText: {
    color: SUCCESS,
    fontSize: 24,
    fontWeight: '900',
  },
  caloriesLabel: {
    color: SUCCESS,
    fontSize: 12,
    fontWeight: '600',
  },
  macroGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
  },
  macroIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  macroValue: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
  macroLabel: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  nutrientsList: {
    gap: 12,
  },
  nutrientRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nutrientLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  nutrientName: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  nutrientValue: {
    color: MUTED,
    fontSize: 14,
  },
  benefitsList: {
    gap: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  benefitText: {
    color: TEXT,
    fontSize: 14,
  },

  // Bottom buttons
  bottomContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  saveBtn: {
    backgroundColor: SUCCESS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveBtnText: {
    color: BG,
    fontSize: 16,
    fontWeight: '700',
  },
});