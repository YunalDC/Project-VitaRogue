// src/screens/ProgressScreen.js
import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import {
  getFoodEntriesForDate,
  getDateRange,
  getTodayDate,
  calculateMealTotals,
  calculateDailyTotals,
  deleteFoodEntry,
} from '../utils/foodStorage';

// Theme
const BG = '#0B1220';
const CARD = '#111827';
const BORDER = '#1f2937';
const TEXT = '#e5e7eb';
const MUTED = '#94a3b8';
const SUCCESS = '#10B981';
const INFO = '#0ea5e9';
const WARNING = '#f59e0b';
const PURPLE = '#8b5cf6';

export default function ProgressScreen({ navigation }) {
  const [selectedDate, setSelectedDate] = useState(getTodayDate());
  const [dateRange, setDateRange] = useState(getDateRange(7));
  const [foodEntries, setFoodEntries] = useState({
    Breakfast: [],
    Lunch: [],
    Dinner: [],
    Snack: [],
  });
  const [refreshing, setRefreshing] = useState(false);
  const [dailyTotals, setDailyTotals] = useState({
    calories: 0,
    protein: 0,
    fat: 0,
    carbs: 0,
  });

  // Load food entries for selected date
  const loadFoodEntries = async () => {
    try {
      const entries = await getFoodEntriesForDate(selectedDate);
      setFoodEntries(entries);
      
      // Calculate daily totals
      const totals = calculateDailyTotals(entries);
      setDailyTotals(totals);
    } catch (error) {
      console.error('Error loading food entries:', error);
    }
  };

  // Reload when screen is focused
  useFocusEffect(
    useCallback(() => {
      loadFoodEntries();
    }, [selectedDate])
  );

  // Load on mount and when date changes
  useEffect(() => {
    loadFoodEntries();
  }, [selectedDate]);

  // Refresh handler
  const onRefresh = async () => {
    setRefreshing(true);
    await loadFoodEntries();
    setRefreshing(false);
  };

  // Delete food entry
  const handleDeleteEntry = (mealType, entryId, foodName) => {
    Alert.alert(
      'Delete Food Entry',
      `Remove ${foodName} from ${mealType}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await deleteFoodEntry(selectedDate, mealType, entryId);
            if (success) {
              await loadFoodEntries();
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Progress</Text>
            <Text style={styles.headerSubtitle}>Track your nutrition journey</Text>
          </View>
          <TouchableOpacity
            style={styles.todayBtn}
            onPress={() => setSelectedDate(getTodayDate())}
          >
            <Ionicons name="today-outline" size={20} color={SUCCESS} />
            <Text style={styles.todayBtnText}>Today</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={SUCCESS} />
        }
      >
        {/* Date Selector */}
        <View style={styles.dateSection}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScroll}>
            {dateRange.map((dateItem) => (
              <TouchableOpacity
                key={dateItem.formatted}
                style={[
                  styles.dateCard,
                  selectedDate === dateItem.formatted && styles.dateCardActive,
                  dateItem.isToday && styles.dateCardToday,
                ]}
                onPress={() => setSelectedDate(dateItem.formatted)}
              >
                <Text
                  style={[
                    styles.dateDayName,
                    selectedDate === dateItem.formatted && styles.dateTextActive,
                  ]}
                >
                  {dateItem.dayName}
                </Text>
                <Text
                  style={[
                    styles.dateDayNumber,
                    selectedDate === dateItem.formatted && styles.dateTextActive,
                  ]}
                >
                  {dateItem.dayNumber}
                </Text>
                <Text
                  style={[
                    styles.dateMonth,
                    selectedDate === dateItem.formatted && styles.dateTextActive,
                  ]}
                >
                  {dateItem.month}
                </Text>
                {dateItem.isToday && (
                  <View style={styles.todayDot} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Daily Summary */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Ionicons name="flame" size={20} color={WARNING} />
            <Text style={styles.summaryTitle}>Daily Summary</Text>
          </View>
          <View style={styles.summaryGrid}>
            <SummaryItem label="Calories" value={Math.round(dailyTotals.calories)} unit="kcal" color={WARNING} />
            <SummaryItem label="Protein" value={dailyTotals.protein.toFixed(1)} unit="g" color={SUCCESS} />
            <SummaryItem label="Carbs" value={dailyTotals.carbs.toFixed(1)} unit="g" color={INFO} />
            <SummaryItem label="Fat" value={dailyTotals.fat.toFixed(1)} unit="g" color={PURPLE} />
          </View>
        </View>

        {/* Meals */}
        <MealSection
          title="Breakfast"
          icon="sunny-outline"
          color="#f59e0b"
          entries={foodEntries.Breakfast}
          onDelete={(entryId, foodName) => handleDeleteEntry('Breakfast', entryId, foodName)}
        />

        <MealSection
          title="Lunch"
          icon="restaurant-outline"
          color="#10B981"
          entries={foodEntries.Lunch}
          onDelete={(entryId, foodName) => handleDeleteEntry('Lunch', entryId, foodName)}
        />

        <MealSection
          title="Dinner"
          icon="moon-outline"
          color="#8b5cf6"
          entries={foodEntries.Dinner}
          onDelete={(entryId, foodName) => handleDeleteEntry('Dinner', entryId, foodName)}
        />

        <MealSection
          title="Snack"
          icon="fast-food-outline"
          color="#0ea5e9"
          entries={foodEntries.Snack}
          onDelete={(entryId, foodName) => handleDeleteEntry('Snack', entryId, foodName)}
        />

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

// Summary Item Component
function SummaryItem({ label, value, unit, color }) {
  return (
    <View style={styles.summaryItem}>
      <Text style={styles.summaryValue}>
        {value}
        <Text style={styles.summaryUnit}> {unit}</Text>
      </Text>
      <Text style={[styles.summaryLabel, { color }]}>{label}</Text>
    </View>
  );
}

// Meal Section Component
function MealSection({ title, icon, color, entries, onDelete }) {
  const totals = calculateMealTotals(entries);
  const hasEntries = entries && entries.length > 0;

  return (
    <View style={styles.mealSection}>
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <View style={[styles.mealIcon, { backgroundColor: color + '20' }]}>
            <Ionicons name={icon} size={20} color={color} />
          </View>
          <View>
            <Text style={styles.mealTitle}>{title}</Text>
            <Text style={styles.mealSubtitle}>
              {hasEntries ? `${entries.length} item${entries.length > 1 ? 's' : ''}` : 'No items yet'}
            </Text>
          </View>
        </View>
        {hasEntries && (
          <View style={styles.mealCalories}>
            <Text style={[styles.mealCaloriesText, { color }]}>
              {Math.round(totals.calories)}
            </Text>
            <Text style={styles.mealCaloriesLabel}>kcal</Text>
          </View>
        )}
      </View>

      {hasEntries ? (
        <View style={styles.foodList}>
          {entries.map((entry) => (
            <FoodEntryItem key={entry.id} entry={entry} onDelete={onDelete} mealColor={color} />
          ))}
        </View>
      ) : (
        <View style={styles.emptyMeal}>
          <Ionicons name="add-circle-outline" size={32} color={MUTED} />
          <Text style={styles.emptyMealText}>No food logged for {title.toLowerCase()}</Text>
        </View>
      )}
    </View>
  );
}

// Food Entry Item Component
function FoodEntryItem({ entry, onDelete, mealColor }) {
  const multiplier = entry.servingSize || 1;
  const nutrition = entry.nutrition || {};

  return (
    <View style={styles.foodEntry}>
      <View style={styles.foodEntryMain}>
        <View style={styles.foodEntryLeft}>
          <Text style={styles.foodEntryName}>{entry.foodName}</Text>
          <Text style={styles.foodEntryPortion}>
            {multiplier.toFixed(1)} × {entry.servingSize || '1 serving'}
          </Text>
          <View style={styles.foodEntryMacros}>
            <MacroBadge label="P" value={(nutrition.protein * multiplier).toFixed(0)} color={SUCCESS} />
            <MacroBadge label="C" value={(nutrition.carbs * multiplier).toFixed(0)} color={INFO} />
            <MacroBadge label="F" value={(nutrition.fat * multiplier).toFixed(0)} color={PURPLE} />
          </View>
        </View>
        <View style={styles.foodEntryRight}>
          <Text style={[styles.foodEntryCalories, { color: mealColor }]}>
            {Math.round(nutrition.calories * multiplier)}
          </Text>
          <Text style={styles.foodEntryCaloriesLabel}>kcal</Text>
        </View>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => onDelete(entry.id, entry.foodName)}
      >
        <Ionicons name="trash-outline" size={18} color="#ef4444" />
      </TouchableOpacity>
    </View>
  );
}

// Macro Badge Component
function MacroBadge({ label, value, color }) {
  return (
    <View style={[styles.macroBadge, { backgroundColor: color + '20' }]}>
      <Text style={[styles.macroBadgeText, { color }]}>
        {label} {value}g
      </Text>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '900',
    color: TEXT,
  },
  headerSubtitle: {
    fontSize: 14,
    color: MUTED,
    marginTop: 2,
  },
  todayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: SUCCESS + '40',
  },
  todayBtnText: {
    color: SUCCESS,
    fontSize: 14,
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  dateSection: {
    paddingVertical: 16,
  },
  dateScroll: {
    paddingHorizontal: 12,
  },
  dateCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 16,
    backgroundColor: CARD,
    borderWidth: 2,
    borderColor: BORDER,
    minWidth: 70,
  },
  dateCardActive: {
    backgroundColor: SUCCESS,
    borderColor: SUCCESS,
  },
  dateCardToday: {
    borderColor: SUCCESS + '60',
  },
  dateDayName: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
    marginBottom: 4,
  },
  dateDayNumber: {
    fontSize: 24,
    fontWeight: '900',
    color: TEXT,
  },
  dateMonth: {
    fontSize: 11,
    color: MUTED,
    marginTop: 2,
  },
  dateTextActive: {
    color: '#fff',
  },
  todayDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: SUCCESS,
    position: 'absolute',
    top: 8,
    right: 8,
  },
  summaryCard: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '900',
    color: TEXT,
  },
  summaryUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: MUTED,
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  mealSection: {
    backgroundColor: CARD,
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  mealIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mealTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: TEXT,
  },
  mealSubtitle: {
    fontSize: 12,
    color: MUTED,
    marginTop: 2,
  },
  mealCalories: {
    alignItems: 'flex-end',
  },
  mealCaloriesText: {
    fontSize: 24,
    fontWeight: '900',
  },
  mealCaloriesLabel: {
    fontSize: 12,
    color: MUTED,
    fontWeight: '600',
  },
  foodList: {
    gap: 8,
  },
  emptyMeal: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  emptyMealText: {
    fontSize: 14,
    color: MUTED,
    marginTop: 8,
  },
  foodEntry: {
    backgroundColor: BG,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  foodEntryMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  foodEntryLeft: {
    flex: 1,
  },
  foodEntryName: {
    fontSize: 16,
    fontWeight: '700',
    color: TEXT,
    marginBottom: 4,
  },
  foodEntryPortion: {
    fontSize: 12,
    color: MUTED,
    marginBottom: 8,
  },
  foodEntryMacros: {
    flexDirection: 'row',
    gap: 6,
  },
  foodEntryRight: {
    alignItems: 'flex-end',
  },
  foodEntryCalories: {
    fontSize: 20,
    fontWeight: '900',
  },
  foodEntryCaloriesLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: '600',
  },
  macroBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  macroBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  deleteBtn: {
    alignSelf: 'flex-end',
    padding: 8,
  },
});