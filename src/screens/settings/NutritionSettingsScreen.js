import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../../lib/firebaseApp';
import { LinearGradient } from 'expo-linear-gradient';

const NutritionSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    dietaryRestrictions: [],
    allergies: '',
    preferredCuisines: [],
    mealFrequency: '3',
  });

  const dietOptions = [
    'Vegetarian', 'Vegan', 'Pescatarian', 'Keto/Low-carb',
    'Gluten-free', 'Dairy-free', 'Halal', 'Kosher'
  ];

  const cuisineOptions = [
    'Mediterranean', 'Asian', 'Mexican', 'Italian',
    'Indian', 'American', 'Middle Eastern', 'Latin'
  ];

  const mealFrequencyOptions = ['2', '3', '4', '5', '6'];

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const userId = firebaseAuth.currentUser?.uid;
      
      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        navigation.goBack();
        return;
      }

      const userDocRef = doc(db, 'users', userId);
      const userDoc = await getDoc(userDocRef);

      if (userDoc.exists()) {
        const userData = userDoc.data();
        const nutrition = userData.nutrition || {};
        
        setFormData({
          dietaryRestrictions: nutrition.dietaryRestrictions || [],
          allergies: nutrition.allergies || '',
          preferredCuisines: nutrition.preferredCuisines || [],
          mealFrequency: nutrition.mealFrequency?.toString() || '3',
        });
      }
    } catch (error) {
      console.error('Error fetching nutrition data:', error);
      Alert.alert('Error', 'Failed to load nutrition preferences');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const userId = firebaseAuth.currentUser?.uid;

      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const userDocRef = doc(db, 'users', userId);

      const updateData = {
        'nutrition.dietaryRestrictions': formData.dietaryRestrictions,
        'nutrition.allergies': formData.allergies.trim(),
        'nutrition.preferredCuisines': formData.preferredCuisines,
        'nutrition.mealFrequency': parseInt(formData.mealFrequency),
      };

      await updateDoc(userDocRef, updateData);

      Alert.alert(
        'Success',
        'Nutrition preferences updated!',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating nutrition:', error);
      Alert.alert('Error', 'Failed to update nutrition preferences');
    } finally {
      setSaving(false);
    }
  };

  const toggleDiet = (diet) => {
    setFormData(prev => ({
      ...prev,
      dietaryRestrictions: prev.dietaryRestrictions.includes(diet)
        ? prev.dietaryRestrictions.filter(d => d !== diet)
        : [...prev.dietaryRestrictions, diet]
    }));
  };

  const toggleCuisine = (cuisine) => {
    setFormData(prev => ({
      ...prev,
      preferredCuisines: prev.preferredCuisines.includes(cuisine)
        ? prev.preferredCuisines.filter(c => c !== cuisine)
        : [...prev.preferredCuisines, cuisine]
    }));
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading preferences...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nutrition Preferences</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton} disabled={saving}>
            {saving ? (
              <ActivityIndicator size="small" color="#10B981" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Dietary Restrictions</Text>
            <Text style={styles.subtitle}>Select all that apply</Text>
            <View style={styles.chipsContainer}>
              {dietOptions.map((diet) => (
                <TouchableOpacity
                  key={diet}
                  style={[
                    styles.chip,
                    formData.dietaryRestrictions.includes(diet) && styles.chipSelected
                  ]}
                  onPress={() => toggleDiet(diet)}
                >
                  <Text style={[
                    styles.chipLabel,
                    formData.dietaryRestrictions.includes(diet) && styles.chipLabelSelected
                  ]}>
                    {diet}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Allergies & Intolerances</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={formData.allergies}
              onChangeText={(value) => setFormData(prev => ({ ...prev, allergies: value }))}
              placeholder="E.g., peanuts, shellfish, lactose..."
              multiline
              numberOfLines={3}
              placeholderTextColor="#6B7280"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preferred Cuisines</Text>
            <Text style={styles.subtitle}>Select your favorites</Text>
            <View style={styles.chipsContainer}>
              {cuisineOptions.map((cuisine) => (
                <TouchableOpacity
                  key={cuisine}
                  style={[
                    styles.chip,
                    formData.preferredCuisines.includes(cuisine) && styles.chipSelected
                  ]}
                  onPress={() => toggleCuisine(cuisine)}
                >
                  <Text style={[
                    styles.chipLabel,
                    formData.preferredCuisines.includes(cuisine) && styles.chipLabelSelected
                  ]}>
                    {cuisine}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Meal Frequency</Text>
            <Text style={styles.subtitle}>Meals per day</Text>
            <View style={styles.frequencyContainer}>
              {mealFrequencyOptions.map((freq) => (
                <TouchableOpacity
                  key={freq}
                  style={[
                    styles.frequencyOption,
                    formData.mealFrequency === freq && styles.frequencyOptionSelected
                  ]}
                  onPress={() => setFormData(prev => ({ ...prev, mealFrequency: freq }))}
                >
                  <Text style={[
                    styles.frequencyLabel,
                    formData.mealFrequency === freq && styles.frequencyLabelSelected
                  ]}>
                    {freq}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#E5E7EB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 16,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  chipSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    borderColor: '#10B981',
  },
  chipLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  chipLabelSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  frequencyContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  frequencyOption: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  frequencyOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  frequencyLabel: {
    fontSize: 20,
    fontWeight: '600',
    color: '#9CA3AF',
  },
  frequencyLabelSelected: {
    color: '#10B981',
  },
  bottomPadding: {
    height: 40,
  },
});

export default NutritionSettingsScreen;