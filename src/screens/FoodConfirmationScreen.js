import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  StatusBar as RNStatusBar,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

const BG = '#0B1220';
const CARD = '#111827';
const BORDER = '#1f2937';
const TEXT = '#e5e7eb';
const MUTED = '#94a3b8';
const SUCCESS = '#10B981';

export default function FoodConfirmationScreen({ route, navigation }) {
  const { foodData } = route.params;
  const [foodName, setFoodName] = useState(foodData.name);
  const [grams, setGrams] = useState('100');

  const handleConfirm = () => {
    if (!foodName.trim()) {
      Alert.alert('Error', 'Please enter a food name');
      return;
    }
    
    if (!grams.trim() || isNaN(Number(grams))) {
      Alert.alert('Error', 'Please enter a valid weight in grams');
      return;
    }

    navigation.navigate('FoodDetails', {
      foodData: {
        ...foodData,
        name: foodName.trim(),
        grams: Number(grams),
      }
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={BG} />
      {Platform.OS === 'android' && <RNStatusBar barStyle="light-content" />}
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backBtn} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Confirm Food</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Food Info Card */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <Ionicons name="restaurant-outline" size={24} color={SUCCESS} />
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.cardTitle}>Food Item</Text>
              {foodData.confidence && (
                <Text style={styles.cardSubtitle}>
                  Confidence: {Math.round(foodData.confidence * 100)}%
                </Text>
              )}
            </View>
            <View style={styles.sourceBadge}>
              <Text style={styles.sourceBadgeText}>
                {foodData.source === 'camera' ? 'Scanned' : 'Manual'}
              </Text>
            </View>
          </View>
        </View>

        {/* Editable Fields */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Food Details</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Food Name</Text>
            <TextInput
              style={styles.input}
              value={foodName}
              onChangeText={setFoodName}
              placeholder="Enter food name"
              placeholderTextColor={MUTED}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Weight (grams)</Text>
            <TextInput
              style={styles.input}
              value={grams}
              onChangeText={setGrams}
              placeholder="100"
              keyboardType="numeric"
              placeholderTextColor={MUTED}
            />
          </View>
        </View>

        {/* Quick Portions */}
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Quick Portions</Text>
          <View style={styles.portionsRow}>
            {['50', '100', '150', '200'].map((portion) => (
              <TouchableOpacity
                key={portion}
                style={[
                  styles.portionBtn,
                  grams === portion && styles.portionBtnActive
                ]}
                onPress={() => setGrams(portion)}
              >
                <Text style={[
                  styles.portionText,
                  grams === portion && styles.portionTextActive
                ]}>
                  {portion}g
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Confirm Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
          <Text style={styles.confirmBtnText}>Confirm & Continue</Text>
          <Ionicons name="arrow-forward" size={20} color={BG} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  
  // Header styles
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    backgroundColor: BG,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CARD,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: '700',
  },

  // Content styles
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
  },
  cardSubtitle: {
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  sourceBadge: {
    backgroundColor: SUCCESS + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  sourceBadgeText: {
    color: SUCCESS,
    fontSize: 12,
    fontWeight: '600',
  },
  sectionTitle: {
    color: TEXT,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: BG,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 8,
    padding: 12,
    color: TEXT,
    fontSize: 16,
  },
  portionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  portionBtn: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
  },
  portionBtnActive: {
    backgroundColor: SUCCESS,
    borderColor: SUCCESS,
  },
  portionText: {
    color: TEXT,
    fontSize: 14,
    fontWeight: '600',
  },
  portionTextActive: {
    color: BG,
  },

  // Bottom buttons
  bottomContainer: {
    padding: 16,
    paddingBottom: Platform.OS === 'ios' ? 34 : 16,
  },
  confirmBtn: {
    backgroundColor: SUCCESS,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  confirmBtnText: {
    color: BG,
    fontSize: 16,
    fontWeight: '700',
  },
});