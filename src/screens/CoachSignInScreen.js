// src/screens/CoachSignInScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import { signIn } from "../lib/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db, firebaseAuth } from "../lib/firebaseApp";
import { signOut } from "firebase/auth";
import { setAuthInitialRoute } from "../state/authRoute";

const ACCENT = "#34d399";
const ACCENT_DARK = "#10b981";

export default function CoachSignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [kbVisible, setKbVisible] = useState(false);

  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbVisible(false));
    return () => { show.remove(); hide.remove(); };
  }, []);

  useEffect(() => {
    setAuthInitialRoute("CoachSignIn");
  }, []);

  // Helper: case-insensitive "approved"
  const isApprovedString = (val) =>
    typeof val === "string" && val.trim().toLowerCase() === "approved";

  // Helper: decide approval using multiple fallbacks
  const checkCoachApproved = async (user, uid) => {
    let claimApproved = false;
    let coachDocApproved = false;
    let coachDocPublic = false;
    let coachDocBool = false;
    let userDocBool = false;
    let rolesSubApproved = false;

    // 1) Try custom claims
    try {
      const tokenRes = await user.getIdTokenResult(true);
      claimApproved = !!tokenRes?.claims?.coachApproved;
      console.log("[CoachSignIn] token claims:", tokenRes?.claims || {});
    } catch (e) {
      console.log("[CoachSignIn] getIdTokenResult failed:", e?.message);
    }

    // 2) Read coaches/{uid}
    const coachRef = doc(db, "coaches", uid);
    const coachSnap = await getDoc(coachRef);
    if (coachSnap.exists()) {
      const c = coachSnap.data() || {};
      coachDocApproved = isApprovedString(c.status);
      coachDocPublic = !!c.public;
      coachDocBool = !!c.coachApproved;
      console.log("[CoachSignIn] coach doc:", {
        status: c.status,
        coachApproved: c.coachApproved,
        public: c.public,
      });
    } else {
      console.log("[CoachSignIn] coach doc does not exist (will create/merge).");
    }

    // 3) Read users/{uid}
    const userRef = doc(db, "users", uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const u = userSnap.data() || {};
      userDocBool = !!u.coachApproved;
      console.log("[CoachSignIn] user doc:", {
        role: u.role,
        coachApproved: u.coachApproved,
        coachOnboardingComplete: u.coachOnboardingComplete,
        phoneVerified: u.phoneVerified,
        coachEmailVerified: u.coachEmailVerified,
      });
    }

    // 4) Optional: users/{uid}/roles/coach
    // (Not required for routing here, but useful for debugging)
    try {
      const rolesCoachRef = doc(db, "users", uid, "roles", "coach");
      const rolesCoachSnap = await getDoc(rolesCoachRef);
      if (rolesCoachSnap.exists()) {
        const r = rolesCoachSnap.data() || {};
        rolesSubApproved =
          isApprovedString(r.verificationStatus) || !!r.coachApproved;
        console.log("[CoachSignIn] users/roles/coach:", {
          verificationStatus: r.verificationStatus,
          coachApproved: r.coachApproved,
        });
      }
    } catch {
      // ignore
    }

    const approved =
      claimApproved ||
      coachDocApproved ||
      coachDocBool ||
      userDocBool ||
      rolesSubApproved ||
      coachDocPublic;

    console.log("[CoachSignIn] approval decision:", {
      claimApproved,
      coachDocApproved,
      coachDocBool,
      coachDocPublic,
      userDocBool,
      rolesSubApproved,
      approved,
    });

    return { approved, coachSnapExists: coachSnap.exists() };
  };


  const onCoachSignIn = async () => {
    if (!email.trim() || !pw.trim()) {
      return Alert.alert("Missing fields", "Please fill all fields.");
    }
    try {
      setLoading(true);

      // 1) Email/password sign-in
      const user = await signIn(email.trim(), pw);
      const uid = user.uid;

      // 2) Ensure presence in /coaches
      const coachRef = doc(db, "coaches", uid);
      const coachSnap = await getDoc(coachRef);
      if (!coachSnap.exists()) {
        await setDoc(
          coachRef,
          {
            email: user.email || null,
            status: "pending", // until admin approves
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        console.log("[CoachSignIn] created coaches doc (pending).");
      }

      // 3) Promote /users/{uid} to role:'coach' (so router sees correct role)
            const userRef = doc(db, "users", uid);
            await setDoc(
              userRef,
              {
                role: "coach",
                lastSeen: serverTimestamp(),
                // DO NOT force wizard flags here; let approval gate decide below.
              },
              { merge: true }
            );
      
            // 4) Decide approval using claims + docs (w/ logs)
            const { approved } = await checkCoachApproved(user, uid);
      
            if (!approved) {
              // Not approved → show popup and sign out. NO nav to CoachVerify here.
              Alert.alert(
                "Approval required",
                "Your coach account is not approved yet. Please wait for an admin to approve it.",
                [
                  {
                    text: "OK",
                    onPress: async () => {
                      try { await signOut(firebaseAuth); } catch {}
                      navigation.replace("SignIn");
                    },
                  },
                ]
              );
              return;
            }

      // 5) Approved → go straight to CoachRoot (no verification screen)
            setAuthInitialRoute("CoachDashboard");
            navigation.getParent()?.reset({ index: 0, routes: [{ name: "CoachRoot" }] });
          } catch (e) {
            console.log("[CoachSignIn] error:", e);
            Alert.alert("Coach Sign In Failed", e?.message || "Please try again.");
          } finally {
            setLoading(false);
          }
        };

  const Content = (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View
        style={[
          styles.centerWrap,
          Platform.OS === "android" && (kbVisible ? styles.topAligned : styles.centerAligned),
        ]}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Coach Sign In</Text>
          <Text style={styles.subtitle}>Access your coaching tools and clients</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Icon
                name="mail-outline"
                size={20}
                color={emailFocused ? ACCENT : "#8e8e93"}
                style={styles.inputIcon}
              />
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="coach@email.com"
                placeholderTextColor="#8e8e93"
                style={styles.textInput}
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Password</Text>
            <View style={[styles.inputWrapper, passwordFocused && styles.inputWrapperFocused]}>
              <Icon
                name="lock-closed-outline"
                size={20}
                color={passwordFocused ? ACCENT : "#8e8e93"}
                style={styles.inputIcon}
              />
              <TextInput
                value={pw}
                onChangeText={setPw}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPw}
                placeholder="Enter your password"
                placeholderTextColor="#8e8e93"
                style={styles.textInput}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={onCoachSignIn}
              />
              <TouchableOpacity
                onPress={() => setShowPw(!showPw)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Icon name={showPw ? "eye-outline" : "eye-off-outline"} size={20} color="#8e8e93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In */}
          <TouchableOpacity
            onPress={onCoachSignIn}
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {loading ? "Please wait..." : "Sign In as Coach"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Links */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <TouchableOpacity
              onPress={() => navigation.navigate("CoachVerify")}
              activeOpacity={0.8}
              style={{ marginBottom: 6 }}
            >
              <Text style={styles.linkText}>New coach? Create an account</Text>
            </TouchableOpacity>
            <Text style={{ color: "#a8a8a8", fontSize: 14 }}>Are you a customer?</Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignIn")} activeOpacity={0.8}>
              <Text style={styles.linkText}>Go to User Sign In</Text>
            </TouchableOpacity>
          </View>
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.18)",
    paddingHorizontal: 14,
    height: 52,
  },
  inputWrapperFocused: {
    borderColor: ACCENT,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    ...Platform.select({
      ios: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.18, shadowRadius: 6 },
      android: { elevation: 0 },
    }),
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: "white", fontWeight: "400" },
  eyeButton: { padding: 4, marginLeft: 6 },
  linkText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
    marginTop: 6,
    textAlign: "center",
  },
  signInButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 14,
    alignSelf: "center",
    width: "100%",
    ...Platform.select({
      ios: { shadowColor: ACCENT, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.22, shadowRadius: 12 },
      android: { elevation: 0 },
    }),
  },
  buttonDisabled: { shadowOpacity: 0, elevation: 0 },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },
};
