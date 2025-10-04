// screens/HealthyHabitsScreen.js
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  RefreshControl,
  InteractionManager
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');

// Default habits with categories
const DEFAULT_HABITS = [
  {
    id: 'water',
    name: 'Stay Hydrated',
    icon: '💧',
    category: 'nutrition',
    unit: 'glasses',
    target: 8,
    current: 0,
    color: '#3B82F6',
    streak: 0,
    points: 10
  },
  {
    id: 'steps',
    name: 'Daily Steps',
    icon: '🚶',
    category: 'movement',
    unit: 'steps',
    target: 10000,
    current: 0,
    color: '#10B981',
    streak: 0,
    points: 15
  },
  {
    id: 'meditation',
    name: 'Meditate',
    icon: '🧘',
    category: 'mindfulness',
    unit: 'minutes',
    target: 10,
    current: 0,
    color: '#8B5CF6',
    streak: 0,
    points: 20
  },
  {
    id: 'vegetables',
    name: 'Eat Vegetables',
    icon: '🥗',
    category: 'nutrition',
    unit: 'servings',
    target: 5,
    current: 0,
    color: '#F59E0B',
    streak: 0,
    points: 10
  },
  {
    id: 'reading',
    name: 'Read',
    icon: '📚',
    category: 'personal',
    unit: 'pages',
    target: 20,
    current: 0,
    color: '#EC4899',
    streak: 0,
    points: 15
  },
  {
    id: 'screenbreak',
    name: 'Screen Break',
    icon: '📱',
    category: 'wellness',
    unit: 'hours offline',
    target: 2,
    current: 0,
    color: '#EF4444',
    streak: 0,
    points: 25
  }
];

// Memoized Habit Card Component
const HabitCard = React.memo(({ item, onUpdate, onComplete, onDelete }) => {
  const progress = useMemo(() => (item.current / item.target) * 100, [item.current, item.target]);
  const isCompleted = item.current >= item.target;

  return (
    <View
      style={[
        styles.habitCard,
        {
          borderLeftColor: item.color,
          backgroundColor: isCompleted ? `${item.color}15` : COLORS.CARD
        }
      ]}
    >
      <TouchableOpacity
        onLongPress={() => onDelete(item.id)}
        activeOpacity={0.7}
      >
        <View style={styles.habitHeader}>
          <View style={styles.habitInfo}>
            <Text style={styles.habitIcon}>{item.icon}</Text>
            <View>
              <Text style={styles.habitName}>{item.name}</Text>
              <Text style={styles.habitProgress}>
                {item.current}/{item.target} {item.unit}
              </Text>
            </View>
          </View>
        </View>
        
        {/* Progress bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(progress, 100)}%`,
                  backgroundColor: item.color
                }
              ]}
            />
          </View>
          <Text style={styles.progressPercent}>{Math.round(progress)}%</Text>
        </View>
        
        {/* Quick actions */}
        <View style={styles.quickActions}>
          {!isCompleted ? (
            <>
              <TouchableOpacity
                onPress={() => onUpdate(item.id, false)}
                style={styles.actionButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionText}>−</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => onUpdate(item.id, true)}
                style={[styles.actionButton, styles.primaryAction]}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Text style={styles.actionText}>+</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                onPress={() => onComplete(item.id)}
                style={styles.completeButton}
              >
                <Text style={styles.completeText}>Complete</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.completedBadge}>
              <Text style={styles.completedText}>✓ Completed</Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
}, (prevProps, nextProps) => {
  return prevProps.item.current === nextProps.item.current &&
         prevProps.item.target === nextProps.item.target;
});

// Category Pills Component
const CategoryPills = React.memo(({ categories, selectedCategory, onSelectCategory }) => {
  return (
    <FlatList
      data={categories}
      horizontal
      showsHorizontalScrollIndicator={false}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <TouchableOpacity
          onPress={() => onSelectCategory(item.id)}
          style={[
            styles.categoryPill,
            selectedCategory === item.id && styles.categoryPillActive
          ]}
        >
          <Text style={styles.categoryIcon}>{item.icon}</Text>
          <Text
            style={[
              styles.categoryText,
              selectedCategory === item.id && styles.categoryTextActive
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      )}
      style={styles.categoryContainer}
      removeClippedSubviews={true}
      initialNumToRender={7}
      maxToRenderPerBatch={7}
    />
  );
});

export default function HealthyHabitsScreen({ navigation }) {
  const [habits, setHabits] = useState(DEFAULT_HABITS);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Categories for filtering
  const categories = useMemo(() => [
    { id: 'all', name: 'All', icon: '📋' },
    { id: 'nutrition', name: 'Nutrition', icon: '🍎' },
    { id: 'movement', name: 'Movement', icon: '🏃' },
    { id: 'mindfulness', name: 'Mindfulness', icon: '🧠' },
    { id: 'wellness', name: 'Wellness', icon: '💚' },
    { id: 'personal', name: 'Personal', icon: '⭐' }
  ], []);

  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      loadHabits();
      setIsReady(true);
    });
  }, []);

  // Debounced save function
  const saveTimeoutRef = useRef(null);
  const debouncedSave = useCallback((habitsToSave) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }
    saveTimeoutRef.current = setTimeout(() => {
      AsyncStorage.setItem('healthyHabits', JSON.stringify(habitsToSave));
    }, 500);
  }, []);

  // Load saved habits from storage
  const loadHabits = useCallback(async () => {
    try {
      const saved = await AsyncStorage.getItem('healthyHabits');
      if (saved) {
        const parsedHabits = JSON.parse(saved);
        const today = new Date().toDateString();
        const lastSaved = await AsyncStorage.getItem('lastHabitDate');
        
        if (lastSaved !== today) {
          const resetHabits = parsedHabits.map(h => ({ ...h, current: 0 }));
          setHabits(resetHabits);
          await AsyncStorage.setItem('lastHabitDate', today);
        } else {
          setHabits(parsedHabits);
        }
      }
    } catch (error) {
      console.error('Error loading habits:', error);
    }
  }, []);

  // Manual refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadHabits();
    setRefreshing(false);
  }, [loadHabits]);

  // Update habit progress
  const updateHabit = useCallback((habitId, increment = true) => {
    setHabits(prevHabits => {
      const newHabits = prevHabits.map(habit => {
        if (habit.id === habitId) {
          const newCurrent = increment 
            ? Math.min(habit.current + 1, habit.target)
            : Math.max(habit.current - 1, 0);
          return { ...habit, current: newCurrent };
        }
        return habit;
      });
      debouncedSave(newHabits);
      return newHabits;
    });
  }, [debouncedSave]);

  // Quick complete habit
  const quickComplete = useCallback((habitId) => {
    setHabits(prevHabits => {
      const newHabits = prevHabits.map(habit => {
        if (habit.id === habitId) {
          return { ...habit, current: habit.target };
        }
        return habit;
      });
      debouncedSave(newHabits);
      return newHabits;
    });
  }, [debouncedSave]);

  // Add custom habit
  const addCustomHabit = useCallback((customHabit) => {
    const newHabit = {
      ...customHabit,
      id: `custom_${Date.now()}`,
      current: 0,
      streak: 0,
      points: 10
    };
    setHabits(prev => {
      const newHabits = [...prev, newHabit];
      debouncedSave(newHabits);
      return newHabits;
    });
    setShowCustomModal(false);
  }, [debouncedSave]);

  // Delete habit
  const deleteHabit = useCallback((habitId) => {
    Alert.alert(
      'Delete Habit',
      'Are you sure you want to delete this habit?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setHabits(prev => {
              const newHabits = prev.filter(h => h.id !== habitId);
              debouncedSave(newHabits);
              return newHabits;
            });
          }
        }
      ]
    );
  }, [debouncedSave]);

  // Filter habits by category - Memoized
  const filteredHabits = useMemo(() => {
    return habits.filter(habit =>
      selectedCategory === 'all' || habit.category === selectedCategory
    );
  }, [habits, selectedCategory]);

  // Calculate stats - Memoized
  const stats = useMemo(() => {
    const completed = habits.filter(h => h.current >= h.target).length;
    const total = habits.length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    const points = habits.reduce((sum, habit) => {
      const completion = (habit.current / habit.target);
      return sum + Math.floor(habit.points * completion);
    }, 0);
    
    return { completed, total, percentage, points };
  }, [habits]);

  // Render habit card
  const renderHabitCard = useCallback(({ item }) => (
    <HabitCard
      item={item}
      onUpdate={updateHabit}
      onComplete={quickComplete}
      onDelete={deleteHabit}
    />
  ), [updateHabit, quickComplete, deleteHabit]);

  const keyExtractor = useCallback((item) => item.id, []);

  const ListHeaderComponent = useMemo(() => (
    <>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Healthy Habits</Text>
          <Text style={styles.subtitle}>
            {stats.percentage}% completed today
          </Text>
        </View>
      </View>
      
      {/* Stats Overview */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.completed}/{stats.total}
          </Text>
          <Text style={styles.statLabel}>Completed</Text>
        </View>
        
        <View style={styles.statDivider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.points}</Text>
          <Text style={styles.statLabel}>Points Today</Text>
        </View>
      </View>
      
      {/* Category Filter */}
      <CategoryPills
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
      />
    </>
  ), [stats, categories, selectedCategory]);

  const ListFooterComponent = useMemo(() => (
    <TouchableOpacity
      onPress={() => setShowCustomModal(true)}
      style={styles.addButton}
    >
      <Text style={styles.addButtonText}>➕ Add Custom Habit</Text>
    </TouchableOpacity>
  ), []);

  if (!isReady) {
    return (
      <SafeAreaProvider>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading habits...</Text>
          </View>
        </SafeAreaView>
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <FlatList
          data={filteredHabits}
          renderItem={renderHabitCard}
          keyExtractor={keyExtractor}
          ListHeaderComponent={ListHeaderComponent}
          ListFooterComponent={ListFooterComponent}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={COLORS.SUCCESS}
            />
          }
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          maxToRenderPerBatch={5}
          updateCellsBatchingPeriod={100}
          initialNumToRender={6}
          windowSize={10}
        />
        
        {/* Custom Habit Modal */}
        <Modal
          visible={showCustomModal}
          animationType="slide"
          transparent={true}
        >
          <CustomHabitModal
            onClose={() => setShowCustomModal(false)}
            onSave={addCustomHabit}
          />
        </Modal>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

// Custom Habit Modal Component - Unchanged but moved outside for better performance
const CustomHabitModal = React.memo(({ onClose, onSave }) => {
  const [habitName, setHabitName] = useState('');
  const [habitIcon, setHabitIcon] = useState('⭐');
  const [habitTarget, setHabitTarget] = useState('');
  const [habitUnit, setHabitUnit] = useState('');
  const [habitCategory, setHabitCategory] = useState('personal');
  const [habitColor, setHabitColor] = useState('#10B981');
  
  const icons = ['⭐', '💪', '🎯', '✍️', '🎨', '🎵', '🏋️', '🤸', '🚴', '🏊'];
  const colors = ['#3B82F6', '#10B981', '#8B5CF6', '#F59E0B', '#EC4899', '#EF4444'];
  
  const handleSave = () => {
    if (habitName && habitTarget && habitUnit) {
      onSave({
        name: habitName,
        icon: habitIcon,
        target: parseInt(habitTarget),
        unit: habitUnit,
        category: habitCategory,
        color: habitColor
      });
    }
  };
  
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>Create Custom Habit</Text>
        
        <TextInput
          style={styles.input}
          placeholder="Habit name"
          placeholderTextColor={COLORS.MUTED}
          value={habitName}
          onChangeText={setHabitName}
        />
        
        <View style={styles.iconSelector}>
          <Text style={styles.inputLabel}>Choose icon:</Text>
          <FlatList
            horizontal
            data={icons}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setHabitIcon(item)}
                style={[
                  styles.iconOption,
                  habitIcon === item && styles.iconOptionActive
                ]}
              >
                <Text style={styles.iconText}>{item}</Text>
              </TouchableOpacity>
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        
        <View style={styles.row}>
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Target"
            placeholderTextColor={COLORS.MUTED}
            value={habitTarget}
            onChangeText={setHabitTarget}
            keyboardType="numeric"
          />
          
          <TextInput
            style={[styles.input, styles.halfInput]}
            placeholder="Unit (e.g., minutes)"
            placeholderTextColor={COLORS.MUTED}
            value={habitUnit}
            onChangeText={setHabitUnit}
          />
        </View>
        
        <View style={styles.colorSelector}>
          <Text style={styles.inputLabel}>Choose color:</Text>
          <FlatList
            horizontal
            data={colors}
            keyExtractor={(item) => item}
            renderItem={({ item }) => (
              <TouchableOpacity
                onPress={() => setHabitColor(item)}
                style={[
                  styles.colorOption,
                  { backgroundColor: item },
                  habitColor === item && styles.colorOptionActive
                ]}
              />
            )}
            showsHorizontalScrollIndicator={false}
          />
        </View>
        
        <View style={styles.modalButtons}>
          <TouchableOpacity onPress={onClose} style={styles.cancelButton}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: COLORS.MUTED,
    fontSize: 16,
  },
  listContainer: {
    paddingBottom: 20,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.MUTED,
    marginTop: 4,
  },
  statsCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.CARD,
    margin: 16,
    padding: 20,
    borderRadius: 16,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.MUTED,
    marginTop: 4,
  },
  statDivider: {
    width: 1,
    backgroundColor: COLORS.BORDER,
  },
  categoryContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
    maxHeight: 50,
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 8,
  },
  categoryPillActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  categoryIcon: {
    fontSize: 16,
    marginRight: 4,
  },
  categoryText: {
    color: COLORS.MUTED,
    fontSize: 14,
    fontWeight: '600',
  },
  categoryTextActive: {
    color: COLORS.BG,
  },
  habitCard: {
    backgroundColor: COLORS.CARD,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    marginHorizontal: 16,
    borderLeftWidth: 4,
  },
  habitHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  habitInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  habitName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.TEXT,
  },
  habitProgress: {
    fontSize: 12,
    color: COLORS.MUTED,
    marginTop: 2,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: COLORS.BG,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressPercent: {
    fontSize: 12,
    color: COLORS.MUTED,
    minWidth: 35,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: COLORS.BG,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  primaryAction: {
    backgroundColor: COLORS.SUCCESS,
  },
  actionText: {
    color: COLORS.TEXT,
    fontSize: 20,
    fontWeight: '600',
  },
  completeButton: {
    backgroundColor: COLORS.SUCCESS,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  completeText: {
    color: COLORS.BG,
    fontSize: 12,
    fontWeight: '600',
  },
  completedBadge: {
    backgroundColor: `${COLORS.SUCCESS}20`,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
    alignSelf: 'center',
  },
  completedText: {
    color: COLORS.SUCCESS,
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: COLORS.SUCCESS,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 24,
  },
  addButtonText: {
    color: COLORS.BG,
    fontSize: 16,
    fontWeight: '600',
  },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: COLORS.CARD,
    width: width - 32,
    borderRadius: 20,
    padding: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.TEXT,
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    backgroundColor: COLORS.BG,
    borderRadius: 12,
    padding: 12,
    color: COLORS.TEXT,
    marginBottom: 16,
    fontSize: 16,
  },
  halfInput: {
    flex: 1,
    marginHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  inputLabel: {
    color: COLORS.MUTED,
    fontSize: 14,
    marginBottom: 8,
  },
  iconSelector: {
    marginBottom: 16,
  },
  iconOption: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.BG,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  iconOptionActive: {
    backgroundColor: COLORS.SUCCESS,
  },
  iconText: {
    fontSize: 24,
  },
  colorSelector: {
    marginBottom: 20,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionActive: {
    borderColor: COLORS.TEXT,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    marginRight: 8,
    borderRadius: 12,
    backgroundColor: COLORS.BG,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: COLORS.MUTED,
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    marginLeft: 8,
    borderRadius: 12,
    backgroundColor: COLORS.SUCCESS,
    alignItems: 'center',
  },
  saveButtonText: {
    color: COLORS.BG,
    fontSize: 16,
    fontWeight: '600',
  },
});