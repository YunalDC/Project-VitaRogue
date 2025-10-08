import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../../lib/firebaseApp';
import { LinearGradient } from 'expo-linear-gradient';

const NotificationSettingsScreen = ({ navigation }) => {
  const [settings, setSettings] = useState({
    pushEnabled: true,
    mealReminders: true,
    goalAlerts: true,
    coachMessages: true,
    weeklyProgress: true,
    quietHoursEnabled: false,
    quietStart: '22:00',
    quietEnd: '08:00',
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
        if (data.notifications) setSettings(prev => ({ ...prev, ...data.notifications }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const handleSave = async () => {
    try {
      const userId = firebaseAuth.currentUser?.uid;
      if (!userId) return;
      await updateDoc(doc(db, 'users', userId), { notifications: settings });
      Alert.alert('Success', 'Notification settings updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to update settings');
    }
  };

  const toggle = (key) => setSettings(prev => ({ ...prev, [key]: !prev[key] }));

  const Row = ({ label, value, onToggle, icon }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Switch value={value} onValueChange={onToggle} trackColor={{ true: '#10B981' }} />
    </View>
  );

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <TouchableOpacity onPress={handleSave} style={styles.saveButton}>
            <Text style={styles.saveButtonText}>Save</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notification Types</Text>
            <Row label="Push Notifications" value={settings.pushEnabled} onToggle={() => toggle('pushEnabled')} icon="notifications-outline" />
            <Row label="Meal Reminders" value={settings.mealReminders} onToggle={() => toggle('mealReminders')} icon="restaurant-outline" />
            <Row label="Goal Milestones" value={settings.goalAlerts} onToggle={() => toggle('goalAlerts')} icon="trophy-outline" />
            <Row label="Coach Messages" value={settings.coachMessages} onToggle={() => toggle('coachMessages')} icon="chatbubble-outline" />
            <Row label="Weekly Progress" value={settings.weeklyProgress} onToggle={() => toggle('weeklyProgress')} icon="bar-chart-outline" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quiet Hours</Text>
            <Row label="Enable Quiet Hours" value={settings.quietHoursEnabled} onToggle={() => toggle('quietHoursEnabled')} icon="moon-outline" />
            {settings.quietHoursEnabled && (
              <View style={styles.timeInfo}>
                <Text style={styles.timeLabel}>Active: {settings.quietStart} - {settings.quietEnd}</Text>
              </View>
            )}
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
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  timeInfo: { marginTop: 12, padding: 12, backgroundColor: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 },
  timeLabel: { fontSize: 14, color: '#10B981' },
  bottomPadding: { height: 40 },
});

export default NotificationSettingsScreen;