// src/screens/SignInScreen.js
import React, { useEffect, useState } from "react";
import {
  View, Text, Image, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, ScrollView, Dimensions, SafeAreaView, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";

import { signIn } from "../lib/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebaseApp";

const { width, height } = Dimensions.get("window");
const IS_SMALL = height < 700;

const ACCENT = "#34d399";
const ACCENT_DARK = "#10b981";
const MUTED = "#8e8e93";

/** Bigger logo */
const LOGO_SIZE = Math.min(180, Math.max(110, Math.round(width * 0.34)));
const CONTENT_MAX_W = Math.min(440, width - 32);

/** Smaller buttons (uniform across CTAs) */
const BTN_H = IS_SMALL ? 44 : 46;          // ↓ reduced height
const BTN_TEXT = IS_SMALL ? 14.5 : 15;     // slightly smaller label

export default function SignInScreen({ navigation }) {
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

  const makeUsername = (mail) => (mail || "").split("@")[0] || "user";

  const onSignIn = async () => {
    if (!email.trim() || !pw.trim()) {
      return Alert.alert("Missing fields", "Please fill all fields.");
    }
    try {
      setLoading(true);
      console.log("[SIGNIN] Starting sign-in flow for", email.trim());
      const user = await signIn(email.trim(), pw);
      const uid = user.uid;
      console.log("[SIGNIN] Auth success uid=", uid);

      // Step 1: fetch user doc
      let profileRef = doc(db, "users", uid);
      let profileSnap;
      try {
        profileSnap = await getDoc(profileRef);
        console.log("[SIGNIN] users doc exists?", profileSnap.exists());
      } catch (e) {
        console.warn("[SIGNIN][ERR] getDoc users", e.code, e.message);
        throw e; // rethrow to outer catch
      }

      // Step 2: if not found, check coaches
      if (!profileSnap.exists()) {
        try {
          const coachRef = doc(db, "coaches", uid);
          const coachSnap = await getDoc(coachRef);
            console.log("[SIGNIN] coach doc exists?", coachSnap.exists());
          if (coachSnap.exists()) {
            profileRef = coachRef;
            profileSnap = coachSnap;
          }
        } catch (e) {
          console.warn("[SIGNIN][ERR] getDoc coaches", e.code, e.message);
          throw e;
        }
      }

      // Step 3: create / update profile
      try {
        const base = {
          role: 'user',
          public: true,
          online: true,
          lastSeen: serverTimestamp(),
        };
        if (!profileSnap.exists()) {
          console.log("[SIGNIN] Creating base users doc.");
          await setDoc(profileRef, {
            ...base,
            username: makeUsername(user.email),
            onboardingComplete: false,
            createdAt: serverTimestamp(),
            email: user.email || null,
          }, { merge: true });
        } else {
          console.log("[SIGNIN] Updating lastSeen + presence.");
          await setDoc(profileRef, {
            ...base,
            username: profileSnap.data()?.username || makeUsername(user.email),
          }, { merge: true });
        }
      } catch (e) {
        console.warn("[SIGNIN][ERR] setDoc profile", e.code, e.message);
        throw e;
      }

      // Step 4: re-fetch
      let onboardingComplete = false;
      try {
        const fresh = await getDoc(profileRef);
        onboardingComplete = !!(fresh.data() || {}).onboardingComplete;
        console.log("[SIGNIN] onboardingComplete=", onboardingComplete);
      } catch (e) {
        console.warn("[SIGNIN][ERR] final getDoc", e.code, e.message);
        throw e;
      }

      // Step 5: navigation
      // NOTE: App.js owns root routing via AuthRoot / OnboardingRoot / MainRoot.
      // Here we simply navigate within the auth stack; root reset is handled by listener.
  // Root navigation will re-route automatically based on user doc listener in App.js (route state logic).
  // No manual navigation needed here.
    } catch (e) {
      let msg = e?.message || String(e);
      if (e?.code === 'permission-denied') {
        msg = 'Permission denied accessing Firestore profile document. Ensure rules deployed & that your user doc exists.';
      }
      Alert.alert("Sign In Failed", msg);
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
      <View style={[styles.centerWrap, Platform.OS === "android" && (kbVisible ? styles.topAligned : styles.centerAligned)]}>
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={[styles.logoImage, { width: LOGO_SIZE, height: LOGO_SIZE }]}
            resizeMode="contain"
          />
          <Text style={styles.title}>Welcome Back</Text>
          <Text style={styles.subtitle}>Ready to crush your goals?</Text>
        </View>

        <View style={styles.formCard}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Icon name="mail-outline" size={20} color={emailFocused ? ACCENT : MUTED} style={styles.inputIcon}/>
              <TextInput
                value={email}
                onChangeText={setEmail}
                onFocus={() => setEmailFocused(true)}
                onBlur={() => setEmailFocused(false)}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholder="your.email@example.com"
                placeholderTextColor={MUTED}
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
              <Icon name="lock-closed-outline" size={20} color={passwordFocused ? ACCENT : MUTED} style={styles.inputIcon}/>
              <TextInput
                value={pw}
                onChangeText={setPw}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                secureTextEntry={!showPw}
                placeholder="Enter your password"
                placeholderTextColor={MUTED}
                style={styles.textInput}
                autoComplete="password"
                returnKeyType="go"
                onSubmitEditing={onSignIn}
              />
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeButton} activeOpacity={0.7}>
                <Icon name={showPw ? "eye-outline" : "eye-off-outline"} size={20} color={MUTED}/>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={[styles.linkText, { textAlign: "center", marginVertical: 8 }]}
                onPress={() => navigation.navigate("ForgotPassword")}>
            Forgot Password?
          </Text>

          {/* Smaller, uniform buttons */}
          <TouchableOpacity onPress={onSignIn} style={[styles.fullButton, loading && styles.buttonDisabled]} disabled={loading} activeOpacity={0.85}>
            <LinearGradient
              colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
              style={[styles.buttonGradient, { height: BTN_H }]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.buttonText, { fontSize: BTN_TEXT }]}>{loading ? "Signing In..." : "Sign In"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} /><Text style={styles.dividerText}>or</Text><View style={styles.divider} />
          </View>

          <TouchableOpacity style={[styles.altButton, { height: BTN_H }]} activeOpacity={0.85}>
            <Icon name="logo-google" size={16} color="#db4437" />
            <Text style={[styles.altButtonText, { fontSize: BTN_TEXT }]}>Continue with Google</Text>
          </TouchableOpacity>

         <TouchableOpacity
         onPress={() => navigation.navigate("CoachSignIn")}
         style={[styles.outlineButton, { height: BTN_H }]}
         activeOpacity={0.85}
         >
          
          <Icon name="person-outline" size={16} color={ACCENT} style={{ marginRight: 8 }} />
          <Text style={[styles.outlineButtonText, { fontSize: BTN_TEXT }]}>
            Login as Coach
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <View style={styles.footerBlock}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("SignUp")} activeOpacity={0.7}>
              <Text style={styles.linkText}>Create one</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => navigation.navigate("VerifyPhone")}>
            <Text style={{ color: "#10B981", fontWeight: "600" }}>Join as a coach</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <StatusBar style="light" />
      <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
        <LinearGradient colors={["#1a1a2e", "#16213e", "#0f3460"]} style={{ flex: 1 }}>
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView style={{ flex: 1 }} behavior="padding">
              {Content}
            </KeyboardAvoidingView>
          ) : (
            <View style={{ flex: 1 }}>{Content}</View>
          )}
        </LinearGradient>
      </TouchableWithoutFeedback>
    </SafeAreaView>
  );
}

const styles = {
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: IS_SMALL ? 10 : 20,
    paddingBottom: IS_SMALL ? 10 : 20,
  },
  centerWrap: { flexGrow: 1, alignItems: "center" },
  centerAligned: { justifyContent: "center" },
  topAligned: { justifyContent: "flex-start" },

  header: { alignItems: "center", marginBottom: IS_SMALL ? 14 : 20, width: "100%" },
  logoImage: { marginBottom: IS_SMALL ? 8 : 10 },
  title: { fontSize: IS_SMALL ? 26 : 30, fontWeight: "bold", color: "white", marginBottom: 4, textAlign: "center" },
  subtitle: { fontSize: IS_SMALL ? 14 : 15, color: "#a8a8a8", textAlign: "center", fontWeight: "400", marginBottom: IS_SMALL ? 10 : 12 },

  formCard: {
    width: "100%",
    maxWidth: CONTENT_MAX_W,
    alignSelf: "center",
  },

  inputContainer: { marginBottom: IS_SMALL ? 10 : 12 },
  label: { fontSize: 13, fontWeight: "600", color: "#fff", marginBottom: 6, marginLeft: 4 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    paddingHorizontal: 14,
    height: IS_SMALL ? 46 : 48, // slightly reduced input height to match smaller CTAs
  },
  inputWrapperFocused: { borderColor: ACCENT, backgroundColor: "rgba(255,255,255,0.14)" },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: "#fff", fontWeight: "400" },
  eyeButton: { padding: 4, marginLeft: 6 },

  linkText: { color: ACCENT, fontSize: 14, fontWeight: "bold", textDecorationLine: "underline" },

  // Full-width CTAs (smaller)
  fullButton: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 2,
    marginBottom: 12,
  },
  buttonDisabled: { opacity: 0.7 },
  buttonGradient: {
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
  },
  buttonText: { color: "white", fontWeight: "700" },

  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: IS_SMALL ? 10 : 12 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.2)" },
  dividerText: { color: MUTED, fontSize: 13.5, marginHorizontal: 12, fontWeight: "500" },

  // Google (solid light)
  altButton: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.92)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: IS_SMALL ? 8 : 10,
    paddingHorizontal: 12,
  },
  altButtonText: { color: "#1a1a1a", fontWeight: "700", marginLeft: 8 },

  // Coach (outline accent)
  outlineButton: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(52,211,153,0.35)",
    backgroundColor: "rgba(52,211,153,0.10)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: IS_SMALL ? 10 : 12,
    paddingHorizontal: 12,
  },
  outlineButtonText: { color: ACCENT, fontWeight: "800" },

  footerBlock: { alignItems: "center", marginTop: IS_SMALL ? 8 : 10, marginBottom: 6, width: "100%" },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  footerText: { color: "#a8a8a8", fontSize: 14 },
};
