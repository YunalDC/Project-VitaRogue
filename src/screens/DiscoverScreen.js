import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView, SafeAreaProvider } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const BG = "#0B1220";
const CARD = "#111827";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";

export default function DiscoverScreen({ navigation }) {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.contentContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header Card */}
          <View style={styles.headerCard}>
            <View style={styles.iconContainer}>
              <Ionicons name="compass" size={32} color={SUCCESS} />
            </View>
            <Text style={styles.title}>Discover</Text>
            <Text style={styles.subtitle}>
              Explore new features, tips, and recommendations to enhance your health journey
            </Text>
          </View>

          {/* Coming Soon Card */}
          <View style={styles.comingSoonCard}>
            <View style={styles.comingSoonContent}>
              <Ionicons name="sparkles-outline" size={48} color={MUTED} />
              <Text style={styles.comingSoonTitle}>Coming Soon</Text>
              <Text style={styles.comingSoonText}>
                We're working on exciting new features to help you discover personalized health insights, recommendations, and content tailored just for you.
              </Text>
            </View>
          </View>

          {/* Feature List */}
          <View style={styles.featureCard}>
            <Text style={styles.featureTitle}>What's Coming:</Text>
            
            <View style={styles.featureItem}>
              <Ionicons name="trending-up-outline" size={20} color={SUCCESS} />
              <View style={styles.featureText}>
                <Text style={styles.featureItemTitle}>Personalized Insights</Text>
                <Text style={styles.featureItemDesc}>AI-powered health recommendations</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="library-outline" size={20} color={SUCCESS} />
              <View style={styles.featureText}>
                <Text style={styles.featureItemTitle}>Health Library</Text>
                <Text style={styles.featureItemDesc}>Curated articles and guides</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="people-outline" size={20} color={SUCCESS} />
              <View style={styles.featureText}>
                <Text style={styles.featureItemTitle}>Community Features</Text>
                <Text style={styles.featureItemDesc}>Connect with like-minded users</Text>
              </View>
            </View>

            <View style={styles.featureItem}>
              <Ionicons name="trophy-outline" size={20} color={SUCCESS} />
              <View style={styles.featureText}>
                <Text style={styles.featureItemTitle}>Challenges</Text>
                <Text style={styles.featureItemDesc}>Fun health and fitness challenges</Text>
              </View>
            </View>
          </View>

          {/* Add Content Button */}
          <View style={styles.actionCard}>
            <TouchableOpacity style={styles.addButton}>
              <Ionicons name="add" size={24} color={TEXT} />
            </TouchableOpacity>
            <Text style={styles.addButtonText}>Add Content</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: SUCCESS + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    color: TEXT,
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  comingSoonCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
  },
  comingSoonContent: {
    alignItems: 'center',
  },
  comingSoonTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 12,
  },
  comingSoonText: {
    color: MUTED,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  featureCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  featureTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  featureText: {
    marginLeft: 12,
    flex: 1,
  },
  featureItemTitle: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureItemDesc: {
    color: MUTED,
    fontSize: 12,
  },
  actionCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: SUCCESS + '20',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: SUCCESS + '40',
    borderStyle: 'dashed',
  },
  addButtonText: {
    color: MUTED,
    fontSize: 14,
    fontWeight: '500',
  },
});