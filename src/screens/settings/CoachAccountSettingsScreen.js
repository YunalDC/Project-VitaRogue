// CoachAccountSettingsScreen.js for the Coaches and this code connects with the database and should be able to allow the coach to update their account settings.

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
  StatusBar as RNStatusBar,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { Ionicons } from "@expo/vector-icons";
import { firebaseAuth, db } from "../../lib/firebaseApp";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";

const COLORS = {
  bg: "#0B1220",
  card: "#111827",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  primary: "#10B981",
  danger: "#ef4444",
};

export default function CoachAccountSettingsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  
  // Form state
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gymAffiliation, setGymAffiliation] = useState("");
  const [nic, setNic] = useState("");
  const [specializations, setSpecializations] = useState("");
  const [experience, setExperience] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Load coach data from Firebase
  useEffect(() => {
    const loadCoachData = async () => {
      try {
        const user = firebaseAuth.currentUser;
        if (!user) {
          Alert.alert("Error", "No authenticated user found");
          navigation.goBack();
          return;
        }

        setEmail(user.email || "");

        // Read from /coaches/{uid}
        const coachRef = doc(db, "coaches", user.uid);
        const coachSnap = await getDoc(coachRef);

        if (coachSnap.exists()) {
          const data = coachSnap.data();
          console.log("📊 Coach data loaded:", data);
          
          setFullName(data.fullName || "");
          setUsername(data.username || "");
          setEmergencyContact(data.emergencyContact || "");
          setGymAffiliation(data.gymAffiliation || "");
          setNic(data.nic || "");
          setSpecializations(data.specializations || "");
          setExperience(data.experience || "");
        } else {
          console.log("⚠️ No coach document found");
        }
      } catch (error) {
        console.error("❌ Error loading coach data:", error);
        Alert.alert("Error", "Failed to load your profile data");
      } finally {
        setLoading(false);
      }
    };

    loadCoachData();
  }, []);

  // Track changes
  useEffect(() => {
    setHasChanges(true);
  }, [fullName, username, emergencyContact, gymAffiliation, nic, specializations, experience]);

  // Save changes to Firebase
  const handleSave = async () => {
    // Validation
    if (!fullName.trim()) {
      Alert.alert("Validation Error", "Full name is required");
      return;
    }

    if (!username.trim()) {
      Alert.alert("Validation Error", "Username is required");
      return;
    }

    if (emergencyContact && !/^\d{10}$/.test(emergencyContact.replace(/\s/g, ""))) {
      Alert.alert("Validation Error", "Emergency contact must be a valid 10-digit phone number");
      return;
    }

    if (nic && !/^\d{9}[vVxX]|\d{12}$/.test(nic.replace(/\s/g, ""))) {
      Alert.alert("Validation Error", "NIC must be in format: 123456789V or 123456789012");
      return;
    }

    if (experience && isNaN(experience)) {
      Alert.alert("Validation Error", "Experience must be a number");
      return;
    }

    try {
      setSaving(true);
      const user = firebaseAuth.currentUser;
      if (!user) throw new Error("No authenticated user");

      const coachRef = doc(db, "coaches", user.uid);
      
      // Update coach document
      await setDoc(
        coachRef,
        {
          fullName: fullName.trim(),
          username: username.trim(),
          emergencyContact: emergencyContact.trim(),
          gymAffiliation: gymAffiliation.trim(),
          nic: nic.trim(),
          specializations: specializations.trim(),
          experience: experience.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      // Also update username in /users/{uid} for consistency
      const userRef = doc(db, "users", user.uid);
      await setDoc(
        userRef,
        {
          username: username.trim(),
          updatedAt: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Coach profile updated successfully");
      Alert.alert("Success", "Your profile has been updated", [
        {
          text: "OK",
          onPress: () => {
            setHasChanges(false);
            navigation.goBack();
          },
        },
      ]);
    } catch (error) {
      console.error("❌ Error saving coach data:", error);
      Alert.alert("Error", "Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const InputField = ({ label, value, onChangeText, placeholder, keyboardType = "default", maxLength, multiline = false }) => (
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, multiline && styles.inputMultiline]}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType={keyboardType}
        maxLength={maxLength}
        multiline={multiline}
        numberOfLines={multiline ? 3 : 1}
      />
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <StatusBar style="light" backgroundColor={COLORS.bg} />
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={[styles.loadingText, { marginTop: 12 }]}>Loading your profile...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.title}>Coach Account Settings</Text>
        <View style={{ width: 32 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Personal Information */}
        <View style={styles.card}>
          <Text style={styles.section}>Personal Information</Text>

          <InputField
            label="Full Name *"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Enter your full name"
            maxLength={100}
          />

          <InputField
            label="Username *"
            value={username}
            onChangeText={setUsername}
            placeholder="Enter your username"
            maxLength={50}
          />

          <InputField
            label="Email (Read-only)"
            value={email}
            onChangeText={() => {}}
            placeholder="Email address"
            editable={false}
          />
          <Text style={styles.helperText}>
            Email cannot be changed here. Contact support to update.
          </Text>

          <InputField
            label="NIC Number"
            value={nic}
            onChangeText={setNic}
            placeholder="123456789V or 123456789012"
            keyboardType="default"
            maxLength={12}
          />
        </View>

        {/* Contact & Emergency */}
        <View style={styles.card}>
          <Text style={styles.section}>Contact & Emergency</Text>

          <InputField
            label="Emergency Contact"
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="0771234567"
            keyboardType="phone-pad"
            maxLength={10}
          />
          <Text style={styles.helperText}>
            10-digit phone number for emergencies
          </Text>
        </View>

        {/* Professional Details */}
        <View style={styles.card}>
          <Text style={styles.section}>Professional Details</Text>

          <InputField
            label="Gym Affiliation"
            value={gymAffiliation}
            onChangeText={setGymAffiliation}
            placeholder="Enter gym or fitness center name"
            maxLength={100}
          />

          <InputField
            label="Specializations"
            value={specializations}
            onChangeText={setSpecializations}
            placeholder="e.g., Strength Training, HIIT, Yoga"
            maxLength={200}
            multiline
          />

          <InputField
            label="Years of Experience"
            value={experience}
            onChangeText={setExperience}
            placeholder="Enter number of years"
            keyboardType="numeric"
            maxLength={2}
          />
        </View>

        {/* Save Button */}
        <TouchableOpacity
          style={[
            styles.saveBtn,
            (!hasChanges || saving) && styles.saveBtnDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || saving}
        >
          {saving ? (
            <ActivityIndicator color="white" size="small" />
          ) : (
            <>
              <Ionicons name="checkmark-circle-outline" size={18} color="white" />
              <Text style={styles.saveBtnText}>Save Changes</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: COLORS.bg,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { color: COLORS.text, fontWeight: "800", fontSize: 18 },
  card: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  section: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 16,
  },
  inputContainer: { marginBottom: 16 },
  label: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 14,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 12,
    color: COLORS.text,
    fontSize: 14,
  },
  inputMultiline: {
    height: 80,
    textAlignVertical: "top",
  },
  helperText: {
    color: COLORS.muted,
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
  },
  saveBtnDisabled: {
    backgroundColor: COLORS.muted,
    opacity: 0.5,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
  loadingText: {
    color: COLORS.muted,
    fontSize: 14,
  },
});