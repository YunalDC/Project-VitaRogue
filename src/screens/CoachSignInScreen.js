import React, { useEffect, useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, Alert, ScrollView, SafeAreaView, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { signIn } from "../lib/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../lib/firebaseApp";

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

  const onCoachSignIn = async () => {
    if (!email.trim() || !pw.trim()) {
      return Alert.alert("Missing fields", "Please fill all fields.");
    }
    try {
      setLoading(true);
      const user = await signIn(email.trim(), pw);

      // Ensure user doc exists and set role=coach
      const uref = doc(db, "users", user.uid);
      const usnap = await getDoc(uref);
      if (!usnap.exists()) {
        await setDoc(uref, {
          role: "coach",
          onboardingComplete: true,
          createdAt: serverTimestamp(),
          email: user.email,
        });
      } else {
        await setDoc(uref, { role: "coach", email: user.email, lastLoginAt: serverTimestamp() }, { merge: true });
      }

      // Optional: coaches collection
      const cref = doc(db, "coaches", user.uid);
      const csnap = await getDoc(cref);
      if (!csnap.exists()) {
        await setDoc(cref, { email: user.email, createdAt: serverTimestamp(), profileComplete: false });
      } else {
        await setDoc(cref, { lastLoginAt: serverTimestamp() }, { merge: true });
      }

      navigation.reset({ index: 0, routes: [{ name: "CoachDashboard" }] });
    } catch (e) {
      Alert.alert("Coach Sign In Failed", e.message);
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
          <Text style={styles.title}>Coach Sign In</Text>
          <Text style={styles.subtitle}>Access your coaching tools and clients</Text>
        </View>

        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View style={[styles.inputWrapper, emailFocused && styles.inputWrapperFocused]}>
              <Icon name="mail-outline" size={20} color={emailFocused ? ACCENT : "#8e8e93"} style={styles.inputIcon} />
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
              <Icon name="lock-closed-outline" size={20} color={passwordFocused ? ACCENT : "#8e8e93"} style={styles.inputIcon} />
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
              <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeButton} activeOpacity={0.7}>
                <Icon name={showPw ? "eye-outline" : "eye-off-outline"} size={20} color="#8e8e93" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Sign In */}
          <TouchableOpacity onPress={onCoachSignIn} style={[styles.signInButton, loading && styles.buttonDisabled]} disabled={loading} activeOpacity={0.8}>
            <LinearGradient
              colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>{loading ? "Signing In..." : "Sign In as Coach"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* Links */}
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <TouchableOpacity onPress={() => navigation.navigate("CoachSignUp")} activeOpacity={0.8} style={{ marginBottom: 6 }}>
              <Text style={styles.linkText}>New coach? Create an account</Text>
            </TouchableOpacity>
            <Text style={{ color: "#a8a8a8", fontSize: 14 }}>Are you a customer?</Text>
            <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] })} activeOpacity={0.8}>
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
  linkText: { color: ACCENT, fontSize: 14, fontWeight: "bold", textDecorationLine: "underline", marginTop: 6, textAlign: "center" },
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
