// screens/WorkoutsScreen.js
import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  FlatList, 
  Image,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { WORKOUT_DATA } from '../data/workoutData';
import { COLORS } from '../constants/colors';

const { width } = Dimensions.get('window');
const CARD_SIZE = (width - 48) / 2; // 2 columns with padding

export default function WorkoutsScreen({ navigation }) {
  const [selectedCategory, setSelectedCategory] = useState("Weight Loss");
  const [imageErrors, setImageErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Memoized data
  const categories = useMemo(() => Object.keys(WORKOUT_DATA), []);
  const exercises = useMemo(() => 
    WORKOUT_DATA[selectedCategory] || [], 
    [selectedCategory]
  );

  // Callbacks
  const handleExercisePress = useCallback((exercise) => {
    navigation.navigate('ExerciseDetails', { exercise });
  }, [navigation]);

  const handleImageError = useCallback((exerciseId) => {
    setImageErrors(prev => ({ ...prev, [exerciseId]: true }));
  }, []);

  const handleCategoryChange = useCallback((category) => {
    if (category === selectedCategory) return;
    
    setIsLoading(true);
    setSelectedCategory(category);
    // Use requestAnimationFrame for smoother transition
    requestAnimationFrame(() => {
      setTimeout(() => setIsLoading(false), 300);
    });
  }, [selectedCategory]);

  // Render functions
  const renderCategoryPill = useCallback(({ item }) => (
    <TouchableOpacity
      style={[
        styles.categoryPill, 
        item === selectedCategory && styles.categoryPillActive
      ]}
      onPress={() => handleCategoryChange(item)}
      accessible={true}
      accessibilityLabel={`${item} category`}
      accessibilityRole="button"
      accessibilityState={{ selected: item === selectedCategory }}
    >
      <Text style={[
        styles.categoryText, 
        item === selectedCategory && styles.categoryTextActive
      ]}>
        {item}
      </Text>
    </TouchableOpacity>
  ), [selectedCategory, handleCategoryChange]);

  const renderExerciseCard = useCallback(({ item, index }) => (
    <TouchableOpacity
      style={styles.exerciseCard}
      onPress={() => handleExercisePress(item)}
      activeOpacity={0.8}
      accessible={true}
      accessibilityLabel={`${item.name} exercise`}
      accessibilityHint="Double tap to view exercise details"
      accessibilityRole="button"
    >
      <Image 
        source={{ 
          uri: imageErrors[item.id] 
            ? 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&w=500&q=80'
            : item.image 
        }}
        style={styles.exerciseImage}
        onError={() => handleImageError(item.id)}
        resizeMode="cover"
      />
      <View style={styles.cardOverlay}>
        <Text style={styles.exerciseTitle} numberOfLines={2}>
          {item.name}
        </Text>
        <Text style={styles.muscleText} numberOfLines={1}>
          {item.targeted_muscles.slice(0, 2).join(' • ')}
        </Text>
      </View>
    </TouchableOpacity>
  ), [handleExercisePress, handleImageError, imageErrors]);

  // Separate key extractors for categories and exercises
  const categoryKeyExtractor = useCallback((item) => item, []);
  const exerciseKeyExtractor = useCallback((item) => item.id, []);

  const getItemLayout = useCallback((data, index) => ({
    length: CARD_SIZE + 16,
    offset: (CARD_SIZE + 16) * Math.floor(index / 2),
    index,
  }), []);

  // Loading state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.SUCCESS} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Workouts</Text>
          <Text style={styles.headerSubtitle}>
            {exercises.length} exercises in {selectedCategory}
          </Text>
        </View>

        {/* Category Selector - Wrapped in fixed height container */}
        <View style={styles.categoryWrapper}>
          <FlatList
            data={categories}
            renderItem={renderCategoryPill}
            keyExtractor={categoryKeyExtractor}
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.categoryList}
            contentContainerStyle={styles.categoryContent}
            removeClippedSubviews={true}
            extraData={selectedCategory}
          />
        </View>

        {/* Exercises Grid */}
        <FlatList
          data={exercises}
          renderItem={renderExerciseCard}
          keyExtractor={exerciseKeyExtractor}
          contentContainerStyle={styles.exerciseList}
          showsVerticalScrollIndicator={false}
          numColumns={2}
          columnWrapperStyle={styles.row}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          initialNumToRender={6}
          windowSize={10}
          getItemLayout={getItemLayout}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No exercises found</Text>
            </View>
          }
        />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.BG,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.BG,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.TEXT,
  },
  headerSubtitle: {
    fontSize: 14,
    color: COLORS.MUTED,
    marginTop: 4,
  },
  // Fixed height wrapper for category section
  categoryWrapper: {
    height: 60,  // Fixed height to prevent border from moving
    borderBottomWidth: 1,
    borderBottomColor: COLORS.BORDER,
    justifyContent: 'center',  // Center the content vertically
  },
  categoryList: {
    flex: 1,
  },
  categoryContent: {
    paddingHorizontal: 16,
    alignItems: 'center',  // Center items vertically
  },
  categoryPill: {
    backgroundColor: COLORS.CARD,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginRight: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  categoryPillActive: {
    backgroundColor: COLORS.SUCCESS,
    elevation: 4,
  },
  categoryText: {
    color: COLORS.MUTED,
    fontWeight: '600',
    fontSize: 14,
  },
  categoryTextActive: {
    color: COLORS.BG,
  },
  exerciseList: {
    padding: 8,
    paddingBottom: 20,
  },
  row: {
    justifyContent: 'space-between',
  },
  exerciseCard: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    margin: 8,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: COLORS.CARD,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  exerciseImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  cardOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
    padding: 12,
  },
  exerciseTitle: {
    color: COLORS.TEXT,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  muscleText: {
    color: COLORS.MUTED,
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    color: COLORS.MUTED,
    fontSize: 16,
  },
});