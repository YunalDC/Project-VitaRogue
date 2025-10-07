// src/utils/foodStorage.js
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebaseApp';

const FOOD_LOG_KEY = '@vitarogue_food_log';

// Helper to format date as YYYY-MM-DD
export const formatDate = (date) => {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Get current date formatted
export const getTodayDate = () => formatDate(new Date());

// Calculate daily totals from all meals
const calculateDailyTotalsFromEntries = (dayEntries) => {
  const allEntries = [
    ...(dayEntries.Breakfast || []),
    ...(dayEntries.Lunch || []),
    ...(dayEntries.Dinner || []),
    ...(dayEntries.Snack || []),
  ];

  const totals = allEntries.reduce((acc, entry) => {
    const multiplier = entry.servingSize || 1;
    const nutrition = entry.nutrition || {};

    return {
      kcal: acc.kcal + (nutrition.calories || 0) * multiplier,
      proteinG: acc.proteinG + (nutrition.protein || 0) * multiplier,
      fatG: acc.fatG + (nutrition.fat || 0) * multiplier,
      carbG: acc.carbG + (nutrition.carbs || 0) * multiplier,
      fiberG: acc.fiberG + (nutrition.fiber || 0) * multiplier,
      sugarG: acc.sugarG + (nutrition.sugar || 0) * multiplier,
      sodiumMg: acc.sodiumMg + (nutrition.sodium || 0) * multiplier,
      cholesterolMg: acc.cholesterolMg + (nutrition.cholesterol || 0) * multiplier,
    };
  }, {
    kcal: 0,
    proteinG: 0,
    fatG: 0,
    carbG: 0,
    fiberG: 0,
    sugarG: 0,
    sodiumMg: 0,
    cholesterolMg: 0,
  });

  return totals;
};

// Sync daily totals to Firebase
const syncToFirebase = async (date) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user) {
      console.log('No authenticated user, skipping Firebase sync');
      return false;
    }

    // Get today's entries from AsyncStorage
    const log = await getFoodLog();
    const dayEntries = log[date] || {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
    };

    // Calculate totals
    const totals = calculateDailyTotalsFromEntries(dayEntries);

    // Reference to Firebase diary document
    const diaryRef = doc(db, 'users', user.uid, 'diary', date);

    // Check if document exists
    const diarySnap = await getDoc(diaryRef);

    if (diarySnap.exists()) {
      // Update existing document
      await updateDoc(diaryRef, {
        ...totals,
        lastUpdated: new Date().toISOString(),
      });
      console.log('✅ Firebase diary updated:', totals);
    } else {
      // Create new document
      await setDoc(diaryRef, {
        ...totals,
        date: date,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
      });
      console.log('✅ Firebase diary created:', totals);
    }

    return true;
  } catch (error) {
    console.error('❌ Firebase sync error:', error);
    return false;
  }
};

// Save food entry (AsyncStorage + Firebase)
export const saveFoodEntry = async (foodData, mealType, date = getTodayDate()) => {
  try {
    console.log('💾 Saving food entry:', { foodData, mealType, date });

    // 1. Get existing log from AsyncStorage
    const existingLog = await getFoodLog();
    
    // 2. Initialize date if doesn't exist
    if (!existingLog[date]) {
      existingLog[date] = {
        Breakfast: [],
        Lunch: [],
        Dinner: [],
        Snack: [],
      };
    }
    
    // 3. Create new entry with timestamp
    const entry = {
      ...foodData,
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      mealType,
      servingSize: foodData.servingSize || 1,
    };
    
    // 4. Add to AsyncStorage
    existingLog[date][mealType].push(entry);
    await AsyncStorage.setItem(FOOD_LOG_KEY, JSON.stringify(existingLog));
    console.log('✅ AsyncStorage saved');
    
    // 5. Sync aggregated totals to Firebase
    const synced = await syncToFirebase(date);
    
    if (synced) {
      console.log('✅ Food entry saved successfully to both storages');
    } else {
      console.log('⚠️ Saved to AsyncStorage but Firebase sync failed');
    }

    return true;
  } catch (error) {
    console.error('❌ Error saving food entry:', error);
    return false;
  }
};

// Get all food logs (AsyncStorage only - for Progress screen)
export const getFoodLog = async () => {
  try {
    const log = await AsyncStorage.getItem(FOOD_LOG_KEY);
    return log ? JSON.parse(log) : {};
  } catch (error) {
    console.error('Error getting food log:', error);
    return {};
  }
};

// Get food entries for a specific date (AsyncStorage only - for Progress screen)
export const getFoodEntriesForDate = async (date = getTodayDate()) => {
  try {
    const log = await getFoodLog();
    return log[date] || {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
    };
  } catch (error) {
    console.error('Error getting entries for date:', error);
    return {
      Breakfast: [],
      Lunch: [],
      Dinner: [],
      Snack: [],
    };
  }
};

// Delete a food entry (AsyncStorage + resync Firebase)
export const deleteFoodEntry = async (date, mealType, entryId) => {
  try {
    console.log('🗑️ Deleting food entry:', { date, mealType, entryId });

    // 1. Remove from AsyncStorage
    const log = await getFoodLog();
    
    if (log[date] && log[date][mealType]) {
      log[date][mealType] = log[date][mealType].filter(
        (entry) => entry.id !== entryId
      );
      
      await AsyncStorage.setItem(FOOD_LOG_KEY, JSON.stringify(log));
      console.log('✅ Removed from AsyncStorage');
      
      // 2. Re-sync totals to Firebase
      await syncToFirebase(date);
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Error deleting food entry:', error);
    return false;
  }
};

// Calculate totals for a specific meal
export const calculateMealTotals = (entries) => {
  if (!entries || entries.length === 0) {
    return {
      calories: 0,
      protein: 0,
      fat: 0,
      carbs: 0,
    };
  }
  
  return entries.reduce((totals, entry) => {
    const multiplier = entry.servingSize || 1;
    const nutrition = entry.nutrition || {};
    
    return {
      calories: totals.calories + (nutrition.calories || 0) * multiplier,
      protein: totals.protein + (nutrition.protein || 0) * multiplier,
      fat: totals.fat + (nutrition.fat || 0) * multiplier,
      carbs: totals.carbs + (nutrition.carbs || 0) * multiplier,
    };
  }, { calories: 0, protein: 0, fat: 0, carbs: 0 });
};

// Calculate daily totals (for Progress screen display)
export const calculateDailyTotals = (dayEntries) => {
  const allEntries = [
    ...(dayEntries.Breakfast || []),
    ...(dayEntries.Lunch || []),
    ...(dayEntries.Dinner || []),
    ...(dayEntries.Snack || []),
  ];
  
  return calculateMealTotals(allEntries);
};

// Get date range (last N days including today)
export const getDateRange = (days = 7) => {
  const dates = [];
  const today = new Date();
  
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push({
      formatted: formatDate(date),
      date: date,
      dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      dayNumber: date.getDate(),
      month: date.toLocaleDateString('en-US', { month: 'short' }),
      isToday: formatDate(date) === getTodayDate(),
    });
  }
  
  return dates;
};

// Manual sync function (call this if needed to force sync)
export const forceSyncToFirebase = async (date = getTodayDate()) => {
  console.log('🔄 Force syncing to Firebase...');
  return await syncToFirebase(date);
};

// Clear all food logs (useful for testing/debugging)
export const clearAllFoodLogs = async () => {
  try {
    await AsyncStorage.removeItem(FOOD_LOG_KEY);
    console.log('✅ All food logs cleared');
    return true;
  } catch (error) {
    console.error('❌ Error clearing logs:', error);
    return false;
  }
};