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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../../lib/firebaseApp';
import { LinearGradient } from 'expo-linear-gradient';

const ProfileGoalsSettingsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [autoCalories, setAutoCalories] = useState(null);
  const [isManualMode, setIsManualMode] = useState(false);
  const [formData, setFormData] = useState({
    targetWeight: '',
    targetCalories: '',
    proteinTarget: '',
    carbsTarget: '',
    fatsTarget: '',
    weightGoal: '',
  });

  const weightGoalOptions = [
    { label: 'Lose weight', icon: 'trending-down', color: '#EF4444' },
    { label: 'Maintain weight', icon: 'remove-outline', color: '#10B981' },
    { label: 'Build muscle', icon: 'barbell-outline', color: '#3B82F6' },
    { label: 'General health', icon: 'heart-outline', color: '#8B5CF6' },
  ];

  const calculateAutoCalories = (profile, weightGoal) => {
    const weight = parseFloat(profile.weightKg) || 70;
    const height = parseFloat(profile.heightCm) || 170;
    const age = parseInt(profile.age) || 25;
    const gender = profile.gender || 'Male';

    let bmr;
    if (gender.toLowerCase() === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }

    const activityMultipliers = {
      'Sedentary': 1.2,
      'Light activity': 1.375,
      'Moderate': 1.55,
      'Very active': 1.725,
    };

    const fitnessLevel = profile.fitnessLevel || 'Light activity';
    const multiplier = activityMultipliers[fitnessLevel] || 1.375;
    let tdee = bmr * multiplier;

    if (weightGoal === 'Lose weight') {
      tdee = tdee - 500;
    } else if (weightGoal === 'Build muscle') {
      tdee = tdee + 300;
    }

    return Math.round(tdee);
  };

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
        const goals = userData.goals || {};
        
        const calculatedCalories = calculateAutoCalories(profile, profile.weightGoal);
        setAutoCalories(calculatedCalories);

        const hasManualCalories = goals.targetCalories !== null && goals.targetCalories !== undefined;
        setIsManualMode(hasManualCalories);
        
        setFormData({
          targetWeight: goals.targetWeight?.toString() || '',
          targetCalories: hasManualCalories ? goals.targetCalories.toString() : '',
          proteinTarget: goals.proteinTarget?.toString() || '',
          carbsTarget: goals.carbsTarget?.toString() || '',
          fatsTarget: goals.fatsTarget?.toString() || '',
          weightGoal: profile.weightGoal || '',
        });
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
      Alert.alert('Error', 'Failed to load goals');
    } finally {
      setLoading(false);
    }
  };

  const handleResetToDefault = () => {
    Alert.alert(
      'Reset to Default',
      `This will reset your calorie target to ${autoCalories} kcal (auto-calculated from your profile).`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          onPress: () => {
            setFormData(prev => ({ ...prev, targetCalories: '' }));
            setIsManualMode(false);
          },
        },
      ]
    );
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

      const targetCaloriesValue = formData.targetCalories 
        ? parseInt(formData.targetCalories) 
        : null;

      const updateData = {
        'goals.targetWeight': formData.targetWeight ? parseFloat(formData.targetWeight) : null,
        'goals.targetCalories': targetCaloriesValue,
        'goals.proteinTarget': formData.proteinTarget ? parseInt(formData.proteinTarget) : null,
        'goals.carbsTarget': formData.carbsTarget ? parseInt(formData.carbsTarget) : null,
        'goals.fatsTarget': formData.fatsTarget ? parseInt(formData.fatsTarget) : null,
        'profile.weightGoal': formData.weightGoal,
      };

      await updateDoc(userDocRef, updateData);

      Alert.alert(
        'Success',
        targetCaloriesValue 
          ? `Custom calorie goal (${targetCaloriesValue} kcal) saved!` 
          : `Reset to auto-calculated calories (${autoCalories} kcal)!`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (error) {
      console.error('Error updating goals:', error);
      Alert.alert('Error', 'Failed to update goals');
    } finally {
      setSaving(false);
    }
  };

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field === 'targetCalories' && value) {
      setIsManualMode(true);
    }
  };

  if (loading) {
    return (
      <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
        <SafeAreaView style={styles.container}>
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#10B981" />
            <Text style={styles.loadingText}>Loading goals...</Text>
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
          <Text style={styles.headerTitle}>Goals & Profile</Text>
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
            <Text style={styles.sectionTitle}>Weight Goal</Text>
            <View style={styles.optionsGrid}>
              {weightGoalOptions.map((option) => (
                <TouchableOpacity
                  key={option.label}
                  style={[
                    styles.goalCard,
                    formData.weightGoal === option.label && styles.goalCardSelected
                  ]}
                  onPress={() => updateField('weightGoal', option.label)}
                >
                  <Ionicons 
                    name={option.icon} 
                    size={32} 
                    color={formData.weightGoal === option.label ? option.color : '#9CA3AF'} 
                  />
                  <Text style={[
                    styles.goalLabel,
                    formData.weightGoal === option.label && styles.goalLabelSelected
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Target Weight</Text>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Target Weight (kg)</Text>
              <TextInput
                style={styles.input}
                value={formData.targetWeight}
                onChangeText={(value) => updateField('targetWeight', value)}
                placeholder="Enter target weight"
                keyboardType="numeric"
                placeholderTextColor="#6B7280"
              />
            </View>
          </View>

          <View style={styles.section}>
            <View style={styles.calorieTitleRow}>
              <Text style={styles.sectionTitle}>Daily Calorie Target</Text>
              {isManualMode && (
                <View style={styles.manualBadge}>
                  <Text style={styles.manualBadgeText}>MANUAL</Text>
                </View>
              )}
            </View>

            <View style={styles.autoCaloriesBox}>
              <View style={styles.autoCaloriesRow}>
                <Ionicons name="calculator-outline" size={20} color="#3B82F6" />
                <Text style={styles.autoCaloriesLabel}>Auto-calculated:</Text>
                <Text style={styles.autoCaloriesValue}>{autoCalories} kcal</Text>
              </View>
              <Text style={styles.autoCaloriesHint}>
                Based on your profile and {formData.weightGoal || 'weight goal'}
              </Text>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Custom Calorie Target (optional)</Text>
              <View style={styles.calorieInputRow}>
                <TextInput
                  style={[styles.input, styles.calorieInput]}
                  value={formData.targetCalories}
                  onChangeText={(value) => updateField('targetCalories', value)}
                  placeholder={`Default: ${autoCalories}`}
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
                {formData.targetCalories && (
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={handleResetToDefault}
                  >
                    <Ionicons name="refresh" size={20} color="#FFFFFF" />
                    <Text style={styles.resetButtonText}>Reset</Text>
                  </TouchableOpacity>
                )}
              </View>
              <Text style={styles.helpText}>
                {isManualMode 
                  ? '✓ Using custom value. HomeScreen will show this.' 
                  : '○ Using auto-calculated value. Leave empty for automatic.'}
              </Text>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Macro Targets (grams)</Text>
            
            <View style={styles.macroRow}>
              <View style={styles.macroInput}>
                <Text style={styles.label}>Protein (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.proteinTarget}
                  onChangeText={(value) => updateField('proteinTarget', value)}
                  placeholder="150"
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.label}>Carbs (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.carbsTarget}
                  onChangeText={(value) => updateField('carbsTarget', value)}
                  placeholder="200"
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>

              <View style={styles.macroInput}>
                <Text style={styles.label}>Fats (g)</Text>
                <TextInput
                  style={styles.input}
                  value={formData.fatsTarget}
                  onChangeText={(value) => updateField('fatsTarget', value)}
                  placeholder="60"
                  keyboardType="numeric"
                  placeholderTextColor="#6B7280"
                />
              </View>
            </View>

            <View style={styles.infoBox}>
              <Ionicons name="information-circle" size={20} color="#3B82F6" />
              <Text style={styles.infoText}>
                Macro targets will override auto-calculated values
              </Text>
            </View>
          </View>

          <View style={styles.bottomPadding} />
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 16, color: '#E5E7EB' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  saveButton: { paddingVertical: 6, paddingHorizontal: 12 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#10B981' },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  calorieTitleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 12 },
  manualBadge: { backgroundColor: 'rgba(59, 130, 246, 0.2)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  manualBadgeText: { fontSize: 11, fontWeight: '700', color: '#3B82F6' },
  autoCaloriesBox: { backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(59, 130, 246, 0.3)' },
  autoCaloriesRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 6 },
  autoCaloriesLabel: { fontSize: 14, color: '#93C5FD', fontWeight: '500' },
  autoCaloriesValue: { fontSize: 18, fontWeight: '700', color: '#3B82F6', marginLeft: 'auto' },
  autoCaloriesHint: { fontSize: 12, color: '#93C5FD', marginLeft: 28 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#E5E7EB', marginBottom: 8 },
  input: { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#FFFFFF' },
  calorieInputRow: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  calorieInput: { flex: 1 },
  resetButton: { backgroundColor: '#EF4444', flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12 },
  resetButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '600' },
  helpText: { fontSize: 12, color: '#9CA3AF', marginTop: 6 },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  goalCard: { width: '47%', backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, padding: 20, alignItems: 'center', gap: 12 },
  goalCardSelected: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981', borderWidth: 2 },
  goalLabel: { fontSize: 14, fontWeight: '500', color: '#9CA3AF', textAlign: 'center' },
  goalLabelSelected: { color: '#10B981', fontWeight: '600' },
  macroRow: { flexDirection: 'row', gap: 12 },
  macroInput: { flex: 1 },
  infoBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(59, 130, 246, 0.1)', borderRadius: 12, padding: 12, gap: 8, marginTop: 12 },
  infoText: { flex: 1, fontSize: 13, color: '#93C5FD' },
  bottomPadding: { height: 40 },
});

export default ProfileGoalsSettingsScreen;