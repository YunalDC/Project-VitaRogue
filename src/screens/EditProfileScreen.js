import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../lib/firebaseApp';
import { LinearGradient } from 'expo-linear-gradient';

const EditProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    heightCm: '',
    weightKg: '',
    conditions: '',
    weightGoal: '',
    diet: '',
    fitnessLevel: '',
    lifestyle: {
      sleepHours: '',
      stress: ''
    }
  });

  const [errors, setErrors] = useState({});

  // Options data
  const weightGoalOptions = [
    { label: "Lose weight", icon: "trending-down" },
    { label: "Maintain weight", icon: "remove-outline" },
    { label: "Build muscle", icon: "barbell-outline" },
    { label: "General health", icon: "heart-outline" },
  ];

  const fitnessLevelOptions = [
    { label: "Sedentary", icon: "bed-outline", desc: "Desk job, minimal exercise" },
    { label: "Light activity", icon: "walk-outline", desc: "Some walking, light exercise" },
    { label: "Moderate", icon: "bicycle-outline", desc: "Regular workouts 3-4x/week" },
    { label: "Very active", icon: "barbell-outline", desc: "Daily exercise, athletic" },
  ];

  const dietOptions = [
    { label: "No restrictions", icon: "restaurant-outline" },
    { label: "Vegetarian", icon: "leaf-outline" },
    { label: "Vegan", icon: "flower-outline" },
    { label: "Pescatarian", icon: "fish-outline" },
    { label: "Keto/Low-carb", icon: "nutrition-outline" },
    { label: "Mediterranean", icon: "pizza-outline" },
    { label: "Halal", icon: "moon-outline" },
    { label: "Other", icon: "ellipsis-horizontal" },
  ];

  const stressOptions = [
    { num: 1, label: "Very low", emoji: "😌" },
    { num: 2, label: "Low", emoji: "🙂" },
    { num: 3, label: "Moderate", emoji: "😐" },
    { num: 4, label: "High", emoji: "😰" },
    { num: 5, label: "Very high", emoji: "🤯" },
  ];

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
        const profile = userData.profile || {};
        
        let stressValue = '';
        if (profile.lifestyle?.stress !== undefined && profile.lifestyle?.stress !== null) {
          const stress = profile.lifestyle.stress;
          stressValue = typeof stress === 'number' ? stress.toString() : stress;
        }
        
        setFormData({
          heightCm: profile.heightCm?.toString() || '',
          weightKg: profile.weightKg?.toString() || '',
          conditions: profile.conditions || '',
          weightGoal: profile.weightGoal || '',
          diet: profile.diet || '',
          fitnessLevel: profile.fitnessLevel || '',
          lifestyle: {
            sleepHours: profile.lifestyle?.sleepHours?.toString() || '',
            stress: stressValue
          }
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (formData.heightCm && (isNaN(formData.heightCm) || parseFloat(formData.heightCm) <= 0 || parseFloat(formData.heightCm) > 300)) {
      newErrors.heightCm = 'Please enter a valid height (1-300 cm)';
    }

    if (formData.weightKg && (isNaN(formData.weightKg) || parseFloat(formData.weightKg) <= 0 || parseFloat(formData.weightKg) > 500)) {
      newErrors.weightKg = 'Please enter a valid weight (1-500 kg)';
    }

    if (formData.lifestyle.sleepHours && (isNaN(formData.lifestyle.sleepHours) || parseFloat(formData.lifestyle.sleepHours) < 0 || parseFloat(formData.lifestyle.sleepHours) > 24)) {
      newErrors.sleepHours = 'Please enter valid sleep hours (0-24)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please correct the errors before saving');
      return;
    }

    try {
      setSaving(true);
      const userId = firebaseAuth.currentUser?.uid;

      if (!userId) {
        Alert.alert('Error', 'User not authenticated');
        return;
      }

      const userDocRef = doc(db, 'users', userId);

      let finalStressValue = '';
      if (formData.lifestyle.stress && formData.lifestyle.stress.trim()) {
        const stressTrimmed = formData.lifestyle.stress.trim();
        if (!isNaN(stressTrimmed)) {
          finalStressValue = parseFloat(stressTrimmed);
        } else {
          finalStressValue = stressTrimmed;
        }
      }
      
      const updateData = {
        'profile.heightCm': formData.heightCm ? formData.heightCm.trim() : '',
        'profile.weightKg': formData.weightKg ? formData.weightKg.trim() : '',
        'profile.conditions': formData.conditions.trim(),
        'profile.weightGoal': formData.weightGoal.trim(),
        'profile.diet': formData.diet.trim(),
        'profile.fitnessLevel': formData.fitnessLevel.trim(),
        'profile.lifestyle.sleepHours': formData.lifestyle.sleepHours ? formData.lifestyle.sleepHours.trim() : '',
        'profile.lifestyle.stress': finalStressValue
      };

      console.log('=== ATTEMPTING UPDATE ===');
      console.log('User ID:', userId);
      console.log('Update Data:', JSON.stringify(updateData, null, 2));

      await updateDoc(userDocRef, updateData);

      console.log('=== UPDATE SUCCESS ===');

      Alert.alert(
        'Success',
        'Profile updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      console.error('Full error:', error);
      
      let errorMessage = 'Failed to update profile. Please try again.';
      
      if (error.code === 'permission-denied') {
        errorMessage = 'Permission denied. Please check your account permissions.';
      } else if (error.code === 'not-found') {
        errorMessage = 'User profile not found. Please contact support.';
      }
      
      Alert.alert('Error', errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const updateLifestyleField = (field, value) => {
    setFormData(prev => ({
      ...prev,
      lifestyle: {
        ...prev.lifestyle,
        [field]: value
      }
    }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading profile...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Edit Profile</Text>
            <TouchableOpacity 
              onPress={handleSave}
              style={styles.saveButton}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator size="small" color="#10B981" />
              ) : (
                <Text style={styles.saveButtonText}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
          >
            {/* Physical Information Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Physical Information</Text>
              
              <View style={styles.inputRow}>
                <View style={styles.inputHalf}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={[styles.input, errors.heightCm && styles.inputError]}
                    value={formData.heightCm}
                    onChangeText={(value) => updateField('heightCm', value)}
                    placeholder="170"
                    keyboardType="numeric"
                    placeholderTextColor="#6B7280"
                  />
                  {errors.heightCm && (
                    <Text style={styles.errorText}>{errors.heightCm}</Text>
                  )}
                </View>

                <View style={styles.inputHalf}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={[styles.input, errors.weightKg && styles.inputError]}
                    value={formData.weightKg}
                    onChangeText={(value) => updateField('weightKg', value)}
                    placeholder="70"
                    keyboardType="numeric"
                    placeholderTextColor="#6B7280"
                  />
                  {errors.weightKg && (
                    <Text style={styles.errorText}>{errors.weightKg}</Text>
                  )}
                </View>
              </View>
            </View>

            {/* Weight Goal Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Weight Goal</Text>
              <View style={styles.optionsGrid}>
                {weightGoalOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionCard,
                      formData.weightGoal === option.label && styles.optionCardSelected
                    ]}
                    onPress={() => updateField('weightGoal', option.label)}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={28} 
                      color={formData.weightGoal === option.label ? '#10B981' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.optionLabel,
                      formData.weightGoal === option.label && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Fitness Level Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Fitness Level</Text>
              {fitnessLevelOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.optionRow,
                    formData.fitnessLevel === option.label && styles.optionRowSelected
                  ]}
                  onPress={() => updateField('fitnessLevel', option.label)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={24} 
                    color={formData.fitnessLevel === option.label ? '#10B981' : '#9CA3AF'} 
                  />
                  <View style={styles.optionRowText}>
                    <Text style={[
                      styles.optionRowLabel,
                      formData.fitnessLevel === option.label && styles.optionRowLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                    <Text style={styles.optionRowDesc}>{option.desc}</Text>
                  </View>
                  {formData.fitnessLevel === option.label && (
                    <Ionicons name="checkmark-circle" size={24} color="#10B981" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Diet Type Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Diet Type</Text>
              <View style={styles.optionsGrid}>
                {dietOptions.map((option) => (
                  <TouchableOpacity
                    key={option.label}
                    style={[
                      styles.optionCard,
                      formData.diet === option.label && styles.optionCardSelected
                    ]}
                    onPress={() => updateField('diet', option.label)}
                  >
                    <Ionicons 
                      name={option.icon} 
                      size={28} 
                      color={formData.diet === option.label ? '#10B981' : '#9CA3AF'} 
                    />
                    <Text style={[
                      styles.optionLabel,
                      formData.diet === option.label && styles.optionLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lifestyle Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lifestyle</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Sleep Hours (per night)</Text>
                <TextInput
                  style={[styles.input, errors.sleepHours && styles.inputError]}
                  value={formData.lifestyle.sleepHours}
                  onChangeText={(value) => updateLifestyleField('sleepHours', value)}
                  placeholder="7.5"
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
                {errors.sleepHours && (
                  <Text style={styles.errorText}>{errors.sleepHours}</Text>
                )}
              </View>

              <Text style={styles.label}>Stress Level</Text>
              <View style={styles.stressContainer}>
                {stressOptions.map((option) => (
                  <TouchableOpacity
                    key={option.num}
                    style={[
                      styles.stressOption,
                      formData.lifestyle.stress === option.num.toString() && styles.stressOptionSelected
                    ]}
                    onPress={() => updateLifestyleField('stress', option.num.toString())}
                  >
                    <Text style={styles.stressEmoji}>{option.emoji}</Text>
                    <Text style={styles.stressNumber}>{option.num}</Text>
                    <Text style={[
                      styles.stressLabel,
                      formData.lifestyle.stress === option.num.toString() && styles.stressLabelSelected
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Medical Conditions Section */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Medical Conditions</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Any medical conditions or allergies</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={formData.conditions}
                  onChangeText={(value) => updateField('conditions', value)}
                  placeholder="E.g., Diabetes, allergies, injuries..."
                  multiline
                  numberOfLines={3}
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.bottomPadding} />
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
    fontSize: 20,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E5E7EB',
    marginBottom: 8,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputHalf: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
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
  inputError: {
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginTop: 4,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    width: '47%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  optionCardSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  optionLabelSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  optionRowText: {
    flex: 1,
  },
  optionRowLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E5E7EB',
    marginBottom: 2,
  },
  optionRowLabelSelected: {
    color: '#10B981',
  },
  optionRowDesc: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  stressContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
  },
  stressOption: {
    width: '18%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  stressOptionSelected: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: '#10B981',
    borderWidth: 2,
  },
  stressEmoji: {
    fontSize: 24,
  },
  stressNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  stressLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  stressLabelSelected: {
    color: '#10B981',
    fontWeight: '600',
  },
  bottomPadding: {
    height: 40,
  },
});

export default EditProfileScreen