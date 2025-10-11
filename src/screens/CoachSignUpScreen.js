// src/screens/CoachSignUpScreen.js
import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform,
  Alert, ScrollView, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseAuth } from "../lib/firebaseApp";
import { createUserWithEmailAndPassword, updateProfile, sendEmailVerification } from "firebase/auth";

const ACCENT = "#34d399";
const ACCENT_DARK = "#10b981";

// Django host (adjust for prod)
const API_HOST = "http://188.166.251.247:8006";
const API_BASE = `${API_HOST}/accounts`;
const CLAIM_PHONE_URL = `${API_BASE}/api/claim-phone/`;

async function claimVerifiedPhone(verifiedPhone) {
  const user = firebaseAuth.currentUser;
  if (!user || !verifiedPhone) return { ok: true };
  const idToken = await user.getIdToken(true);
  const res = await fetch(CLAIM_PHONE_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ phone: verifiedPhone }),
  });
  if (res.status === 409) return { ok: false, conflict: true };
  if (!res.ok) {
    let msg = ""; try { msg = await res.text(); } catch {}
    throw new Error(msg || "Phone claim failed");
  }
  return { ok: true };
}

export default function CoachSignUpScreen({ navigation, route }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [cpw, setCpw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showCpw, setShowCpw] = useState(false);
  const [loading, setLoading] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [nameFocused, setNameFocused] = useState(false);
  const [cpwFocused, setCpwFocused] = useState(false);
  const [kbVisible, setKbVisible] = useState(false);

  const verifiedPhone = route?.params?.verifiedPhone || null;

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  const onCoachSignUp = async () => {
    if (!name.trim() || !email.trim() || !pw.trim() || !cpw.trim()) {
      return Alert.alert("Missing fields", "Please fill all fields.");
    }
    if (pw !== cpw) return Alert.alert("Passwords do not match", "Please confirm your password.");

    setLoading(true);

    try {
      // 1) Firebase account creation - THIS IS CRITICAL
      const cred = await createUserWithEmailAndPassword(firebaseAuth, email.trim(), pw);
      const user = cred.user;
      const uid = user.uid;

      try { await updateProfile(user, { displayName: name.trim() }); } catch (e) {
        console.warn("Update profile failed:", e);
      }

      // 2) IMMEDIATELY create both docs in parallel to prevent race condition
      await Promise.all([
        // Create /users/{uid} with role: 'coach' - CRITICAL for routing
        setDoc(
          doc(db, "users", uid),
          {
            role: "coach",
            email: user.email || null,
            username: name.trim(),
            coachOnboardingComplete: false,
            phoneVerified: verifiedPhone ? true : false,
            coachEmailVerified: false,
            public: false,
            online: true,
            createdAt: serverTimestamp(),
            lastSeen: serverTimestamp(),
          },
          { merge: true }
        ),
        
        // Create /coaches/{uid} with coach-specific fields
        setDoc(
          doc(db, "coaches", uid),
          {
            email: user.email || null,
            name: name.trim(),
            public: false,
            online: false,
            verified: false,
            coachOnboardingComplete: false,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        )
      ]);

      console.log("✅ Account created successfully!");

      // 3) Claim pre-verified phone (NON-BLOCKING - don't fail signup if this fails)
      if (verifiedPhone) {
        try {
          const r = await claimVerifiedPhone(verifiedPhone);
          if (!r.ok && r.conflict) {
            // Phone already claimed - this is the only critical phone error
            try { await firebaseAuth.signOut(); } catch {}
            Alert.alert(
              "Phone already used",
              "This phone number is already linked to another account.",
              [{ text: "OK", onPress: () => navigation.replace("SignIn") }]
            );
            setLoading(false);
            return;
          }
          console.log("✅ Phone claimed successfully");
        } catch (phoneError) {
          // Log but don't fail signup - account is already created
          console.warn("⚠️ Phone claim failed (non-critical):", phoneError.message);
          // Optionally show a non-blocking warning
          // Alert.alert("Note", "Phone verification will be completed during onboarding.");
        }
      }

      // 4) Optional email verification (NON-BLOCKING)
      try { 
        await sendEmailVerification(user);
        console.log("✅ Verification email sent");
      } catch (emailError) {
        console.warn("⚠️ Email verification send failed:", emailError.message);
      }

      // 5) Success! Auth listener will handle navigation to CoachVerify
      console.log("✅ Signup complete - auth listener will navigate to CoachVerify");
      
    } catch (e) {
      // Only show error if the CRITICAL operations (Firebase account/docs) failed
      console.error("❌ Critical signup error:", e);
      Alert.alert("Coach Sign Up Failed", e?.message || "Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const Content = (
    <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled" keyboardDismissMode="on-drag" showsVerticalScrollIndicator={false} bounces={false}>
      <View style={[styles.centerWrap, Platform.OS === "android" && (kbVisible ? styles.topAligned : styles.centerAligned)]}>
        <View style={styles.header}>
          <Text style={styles.title}>Create Coach Account</Text>
          <Text style={styles.subtitle}>Manage clients, sessions and analytics</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Name */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Full Name</Text>
            <View style={[styles.inputWrapper, nameFocused && styles.inputWrapperFocused]}>
              <Icon name="person-outline" size={20} color={nameFocused ? ACCENT : "#8e8e93"} style={styles.inputIcon} />
              <TextInput value={name} onChangeText={setName} onFocus={() => setNameFocused(true)} onBlur={() => setNameFocused(false)} placeholder="Jane Doe" placeholderTextColor="#8e8e93" style={styles.textInput} autoCapitalize="words" autoCorrect={false} autoComplete="off" textContentType="none" importantForAutofill="no" returnKeyType="next" />
            </View>
          </View>

          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Icon name="mail-outline" size={20} color={emailFocused ? ACCENT : "#8e8e93"} style={styles.inputIcon} />
              <TextInput value={email} onChangeText={setEmail} onFocus={() => setEmailFocused(true)} onBlur={() => setEmailFocused(false)} autoCapitalize="none" keyboardType="email-address" placeholder="coach@email.com" placeholderTextColor="#8e8e93" style={styles.textInput} autoCorrect={false} autoComplete="off" textContentType="none" importantForAutofill="no" returnKeyType="next" />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Icon name="lock-closed-outline" size={20} color={passwordFocused ? ACCENT : "#8e8e93"} style={styles.inputIcon} />
              <TextInput value={pw} onChangeText={setPw} onFocus={() => setPasswordFocused(true)} onBlur={() => setPasswordFocused(false)} secureTextEntry={!showPw} placeholder="Create a password" placeholderTextColor="#8e8e93" style={styles.textInput} returnKeyType="next" autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="oneTimeCode" importantForAutofill="no" passwordRules="" />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeButton} activeOpacity={0.7}>
                <Icon name={showPw ? "eye-outline" : "eye-off-outline"} size={20} color="#8e8e93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm Password</Text>
            <View style={[styles.inputWrapper, cpwFocused && styles.inputWrapperFocused]}>
              <Icon name="lock-closed-outline" size={20} color={cpwFocused ? ACCENT : "#8e8e93"} style={styles.inputIcon} />
              <TextInput value={cpw} onChangeText={setCpw} onFocus={() => setCpwFocused(true)} onBlur={() => setCpwFocused(false)} secureTextEntry={!showCpw} placeholder="Re-enter your password" placeholderTextColor="#8e8e93" style={styles.textInput} returnKeyType="go" onSubmitEditing={onCoachSignUp} autoCapitalize="none" autoCorrect={false} autoComplete="off" textContentType="oneTimeCode" importantForAutofill="no" passwordRules="" />
              <TouchableOpacity onPress={() => setShowCpw(!showCpw)} style={styles.eyeButton} activeOpacity={0.7}>
                <Icon name={showCpw ? "eye-outline" : "eye-off-outline"} size={20} color="#8e8e93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Create Account */}
          <TouchableOpacity onPress={onCoachSignUp} style={[styles.signInButton, loading && styles.buttonDisabled]} disabled={loading} activeOpacity={0.8}>
            <LinearGradient colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]} style={styles.buttonGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Text style={styles.buttonText}>{loading ? "Creating..." : "Create Coach Account"}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={styles.gradient}>
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView style={styles.keyboardView} behavior="padding">
              {Content}
            </KeyboardAvoidingView>
          ) : (
            <View style={styles.keyboardView}>{Content}</View>
          )}
        </LinearGradient>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = {
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingVertical: 20 },
  centerWrap: { flexGrow: 1, alignItems: "stretch" },
  centerAligned: { justifyContent: "center" },
  topAligned: { justifyContent: "flex-start" },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 30, fontWeight: "bold", color: "white", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: 15, color: "#a8a8a8", textAlign: "center", fontWeight: "400", marginBottom: 12 },
  formContainer: { width: "100%", alignSelf: "center" },
  inputContainer: { marginBottom: 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#ffffff", marginBottom: 6, marginLeft: 4 },
  inputWrapper: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.10)", borderRadius: 14,
    borderWidth: 1, borderColor: "rgba(255, 255, 255, 0.18)", paddingHorizontal: 14, height: 52,
  },
  inputWrapperFocused: {
    borderColor: ACCENT, backgroundColor: "rgba(255, 255, 255, 0.14)",
    ...Platform.select({
      ios: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
      android: { elevation: 0 },
    }),
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: "white", fontWeight: "400" },
  eyeButton: { padding: 4, marginLeft: 6 },
  signInButton: {
    borderRadius: 14, overflow: "hidden", marginBottom: 14, alignSelf: "center", width: "100%",
    ...Platform.select({
      ios: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12 },
      android: { elevation: 0 },
    }),
  },
  buttonDisabled: { shadowOpacity: 0, elevation: 0 },
  buttonGradient: { paddingVertical: 14, paddingHorizontal: 20, alignItems: "center", justifyContent: "center", minHeight: 52 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
};

