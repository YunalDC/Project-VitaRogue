import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const AboutSettingsScreen = ({ navigation }) => {
  
  const Row = ({ icon, label, value, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress} disabled={!onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      {value && <Text style={styles.rowValue}>{value}</Text>}
      {onPress && <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />}
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>About VitaRogue</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.logoSection}>
            <View style={styles.logoCircle}>
              <Ionicons name="barbell" size={48} color="#10B981" />
            </View>
            <Text style={styles.appName}>VitaRogue</Text>
            <Text style={styles.tagline}>Your Fitness & Nutrition Companion</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>App Information</Text>
            <Row icon="code-outline" label="Version" value="1.0.0" />
            <Row icon="calendar-outline" label="Build" value="2025.01.10" />
            <Row icon="cube-outline" label="Platform" value="React Native" />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Legal</Text>
            <Row 
              icon="document-text-outline" 
              label="Terms of Service" 
              onPress={() => Linking.openURL('https://vitarogue.com/terms')} 
            />
            <Row 
              icon="shield-checkmark-outline" 
              label="Privacy Policy" 
              onPress={() => Linking.openURL('https://vitarogue.com/privacy')} 
            />
            <Row 
              icon="ribbon-outline" 
              label="Licenses" 
              onPress={() => Linking.openURL('https://vitarogue.com/licenses')} 
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Connect</Text>
            <Row 
              icon="globe-outline" 
              label="Website" 
              onPress={() => Linking.openURL('https://vitarogue.com')} 
            />
            <Row 
              icon="mail-outline" 
              label="Email" 
              onPress={() => Linking.openURL('mailto:hello@vitarogue.com')} 
            />
            <Row 
              icon="logo-instagram" 
              label="Instagram" 
              onPress={() => Linking.openURL('https://instagram.com/vitarogue')} 
            />
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Made with ❤️ for a healthier you</Text>
            <Text style={styles.copyright}>© 2025 VitaRogue. All rights reserved.</Text>
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
  logoSection: { alignItems: 'center', paddingVertical: 40 },
  logoCircle: { width: 100, height: 100, borderRadius: 50, backgroundColor: 'rgba(16, 185, 129, 0.1)', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  appName: { fontSize: 28, fontWeight: '800', color: '#FFFFFF', marginBottom: 8 },
  tagline: { fontSize: 14, color: '#9CA3AF' },
  section: { paddingHorizontal: 20, paddingVertical: 24, borderBottomWidth: 1, borderBottomColor: 'rgba(255, 255, 255, 0.1)' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#FFFFFF', marginBottom: 16 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  rowValue: { fontSize: 14, color: '#9CA3AF', marginRight: 8 },
  footer: { alignItems: 'center', paddingVertical: 32, paddingHorizontal: 20 },
  footerText: { fontSize: 14, color: '#9CA3AF', marginBottom: 8 },
  copyright: { fontSize: 12, color: '#6B7280' },
  bottomPadding: { height: 40 },
});

export default AboutSettingsScreen;