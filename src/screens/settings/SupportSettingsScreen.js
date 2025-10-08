import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const SupportSettingsScreen = ({ navigation }) => {
  
  const faqItems = [
    { q: 'How do I track my meals?', a: 'Use the food scanning feature or manual entry.' },
    { q: 'Can I connect with a coach?', a: 'Yes! Go to Settings → Find a coach.' },
    { q: 'How do I set my goals?', a: 'Navigate to Settings → Goals & Profile.' },
  ];

  const contactSupport = () => {
    Linking.openURL('mailto:support@vitarogue.com');
  };

  const viewTutorial = () => {
    Alert.alert('Tutorial', 'Tutorial feature coming soon!');
  };

  const rateApp = () => {
    Alert.alert('Rate App', 'Thank you for your feedback!');
  };

  const Row = ({ icon, label, onPress }) => (
    <TouchableOpacity style={styles.row} onPress={onPress}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={20} color="#9CA3AF" style={{ marginRight: 12 }} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color="#9CA3AF" />
    </TouchableOpacity>
  );

  return (
    <LinearGradient colors={['#0B1220', '#1a2740']} style={styles.container}>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support & Help</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
            {faqItems.map((item, index) => (
              <View key={index} style={styles.faqItem}>
                <Text style={styles.faqQuestion}>{item.q}</Text>
                <Text style={styles.faqAnswer}>{item.a}</Text>
              </View>
            ))}
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Get Help</Text>
            <Row icon="mail-outline" label="Contact Support" onPress={contactSupport} />
            <Row icon="book-outline" label="View Tutorial" onPress={viewTutorial} />
            <Row icon="star-outline" label="Rate VitaRogue" onPress={rateApp} />
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
  faqItem: { marginBottom: 16, padding: 16, backgroundColor: 'rgba(255, 255, 255, 0.05)', borderRadius: 12 },
  faqQuestion: { fontSize: 15, fontWeight: '600', color: '#10B981', marginBottom: 6 },
  faqAnswer: { fontSize: 14, color: '#9CA3AF', lineHeight: 20 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12, borderTopWidth: 1, borderTopColor: 'rgba(255, 255, 255, 0.05)' },
  rowLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  rowLabel: { fontSize: 16, color: '#E5E7EB', fontWeight: '500' },
  bottomPadding: { height: 40 },
});

export default SupportSettingsScreen;