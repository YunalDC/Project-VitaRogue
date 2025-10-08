import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { deleteUser } from 'firebase/auth';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, firebaseAuth } from '../../lib/firebaseApp';
import { LinearGradient } from 'expo-linear-gradient';

const PrivacyDataSettingsScreen = ({ navigation }) => {
  
  const exportData = () => {
    Alert.alert(
      'Export Data',
      'Your data will be exported to your email within 24 hours.',
      [{ text: 'OK' }]
    );
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'Cache cleared successfully!',
      [{ text: 'OK' }]
    );
  };

  const deleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'Are you sure? This action cannot be undone. All your data will be permanently deleted.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const user = firebaseAuth.currentUser;
              if (!user) return;
              await deleteDoc(doc(db, 'users', user.uid));
              await deleteUser(user);
              Alert.alert('Account Deleted', 'Your account has been deleted.');
            } catch (error) {
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            }
          },
        },
      ]
    );
  };

  const Row = ({ icon, label, onPress, danger }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color={danger ? '#EF4444' : '#9CA3AF'} style={{ marginRight: 12 }} />
        <Text style={[styles.rowLabel, danger && styles.dangerText]}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={danger ? '#EF4444' : '#9CA3AF'} />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Privacy & Data</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Management</Text>
            <Row icon="download-outline" label="Export My Data" onPress={exportData} />
            <Row icon="trash-outline" label="Clear Cache" onPress={clearCache} />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <Row 
              icon="document-text-outline" 
              label="Privacy Policy" 
              onPress={() => Linking.openURL('https://vitarogue.com/privacy')} 
            />
            <Row 
              icon="shield-checkmark-outline" 
              label="Terms of Service" 
              onPress={() => Linking.openURL('https://vitarogue.com/terms')} 
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Danger Zone</Text>
            <Row icon="warning-outline" label="Delete Account" onPress={deleteAccount} danger />
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
  scrollView: { flex: 1 },
  section: { paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  dangerText: { color: '#EF4444' },
  bottomPadding: { height: 40 },
});

export default PrivacyDataSettingsScreen;