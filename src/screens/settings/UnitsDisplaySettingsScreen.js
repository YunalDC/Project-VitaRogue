import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../../lib/firebaseApp';
import { LinearGradient } from 'expo-linear-gradient';

const UnitsDisplaySettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    metricUnits: true,
    dateFormat: '24h',
    language: 'English',
    darkMode: true,
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) return;
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.display) setSettings(prev => ({ ...prev, ...data.display }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) return;
      await updateDoc(doc(db, 'users', userId), { display: settings });
      Alert.alert('Success', 'Display settings updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const SelectRow = ({ label, value, options, onSelect, icon }) => (
    <View style={styles.selectSection}>
      <View style={styles.selectHeader}>
        <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
        <Text style={styles.selectLabel}>{label}</Text>
      </View>
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option}
            style={[styles.option, value === option && styles.optionSelected]}
            onPress={() => onSelect(option)}
          >
            <Text style={[styles.optionText, value === option && styles.optionTextSelected]}>
              {option}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Units & Display</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="scale-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <Text style={styles.rowLabel}>Metric Units</Text>
              </View>
              <Switch 
                value={settings.metricUnits} 
                onValueChange={(val) => setSettings(prev => ({ ...prev, metricUnits: val }))} 
                trackColor={{ true: '#10B981' }} 
              />
            </View>
            <Text style={styles.hint}>{settings.metricUnits ? 'kg, cm' : 'lb, inches'}</Text>
          </View>

          <View style={styles.section}>
            <SelectRow
              label="Time Format"
              value={settings.dateFormat}
              options={['12h', '24h']}
              onSelect={(val) => setSettings(prev => ({ ...prev, dateFormat: val }))}
              icon="time-outline"
            />
          </View>

          <View style={styles.section}>
            <SelectRow
              label="Language"
              value={settings.language}
              options={['English', 'Spanish', 'French', 'German']}
              onSelect={(val) => setSettings(prev => ({ ...prev, language: val }))}
              icon="language-outline"
            />
          </View>

          <View style={styles.section}>
            <View style={styles.row}>
              <View style={styles.rowLeft}>
                <Ionicons name="moon-outline" size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
                <Text style={styles.rowLabel}>Dark Mode</Text>
              </View>
              <Switch 
                value={settings.darkMode} 
                onValueChange={(val) => setSettings(prev => ({ ...prev, darkMode: val }))} 
                trackColor={{ true: '#10B981' }} 
              />
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
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF' },
  saveButton: { paddingVertical: 6, paddingHorizontal: 12 },
  saveButtonText: { fontSize: 16, fontWeight: '600', color: '#10B981' },
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  hint: { fontSize: 13, color: '#6B7280', marginTop: 4 },
  selectSection: { gap: 12 },
  selectHeader: { flexDirection: 'row', alignItems: 'center' },
  selectLabel: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  optionsContainer: { flexDirection: 'row', gap: 12 },
  option: { flex: 1, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderWidth: 1, borderColor: 'rgba(255, 255, 255, 0.1)', borderRadius: 12, paddingVertical: 12, alignItems: 'center' },
  optionSelected: { backgroundColor: 'rgba(16, 185, 129, 0.1)', borderColor: '#10B981', borderWidth: 2 },
  optionText: { fontSize: 14, fontWeight: '500', color: '#9CA3AF' },
  optionTextSelected: { color: '#10B981', fontWeight: '600' },
  bottomPadding: { height: 40 },
});

export default UnitsDisplaySettingsScreen;