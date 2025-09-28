import React, { useEffect, useState, useCallback } from "react";
import {
  View, Text, TextInput, TouchableOpacity, SafeAreaView, KeyboardAvoidingView,
  Platform, ScrollView, Dimensions, Alert, Keyboard, TouchableWithoutFeedback
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import Icon from "react-native-vector-icons/Ionicons";
import { getAuth, sendEmailVerification, reload } from "firebase/auth";
import { db } from "../lib/firebaseApp";
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";

const { width } = Dimensions.get("window");
const ACCENT = "#34d399";
const ACCENT_DARK = "#10b981";
const RESEND_COOLDOWN = 60;

export default function CoachEmailVerification({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState(user?.email || "");
  const [cooldownLeft, setCooldownLeft] = useState(0);
  const [emailFocused, setEmailFocused] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        if (!user) return;
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);
        if (!snap.exists()) {
          await setDoc(ref, { onboardingComplete: false, createdAt: serverTimestamp() });
        }
      } catch (e) {
        console.warn(e);
      }
    })();
  }, [user]);

  useEffect(() => {
    if (!cooldownLeft) return;
    const id = setInterval(() => setCooldownLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [cooldownLeft]);

  const onSend = useCallback(async () => {
    if (!user) return Alert.alert("Not signed in");
    if (!email || !email.includes("@")) return Alert.alert("Invalid email", "Enter a valid email address.");
    try {
      setLoading(true);
      await sendEmailVerification(user);
      setCooldownLeft(RESEND_COOLDOWN);
      Alert.alert("Verification sent", `We sent a link to ${user.email}. Check your inbox (and spam).`);
    } catch (e) {
      console.warn(e);
      Alert.alert("Error sending email", e?.message || "Try again later.");
    } finally {
      setLoading(false);
    }
  }, [user, email]);

  const onIHaveVerified = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      await reload(user);
      const fresh = auth.currentUser;
      if (fresh?.emailVerified) {
        const ref = doc(db, "users", fresh.uid);
        await updateDoc(ref, {
          coachEmailVerified: true,
          role: "coach",
          email: fresh.email,
          emailVerifiedAt: serverTimestamp(),
        });
        Alert.alert("Success", "Your email is verified.", [
          { text: "Continue", onPress: () => navigation.reset({ index: 0, routes: [{ name: "CoachDashboard" }] }) },
        ]);
      } else {
        Alert.alert("Not verified yet", "Please tap the link in the email we sent, then try again.");
      }
    } catch (e) {
      console.warn(e);
      Alert.alert("Error", e?.message || "Could not confirm verification.");
    } finally {
      setLoading(false);
    }
  }, [auth, navigation, user]);

  const Content = (
    <ScrollView
      contentContainerStyle={styles.scrollContent}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
      bounces={false}
    >
      <View style={[styles.centerWrap, { justifyContent: "center" }]}>
        <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 8 }}>
          <TouchableOpacity
            onPress={() => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] })}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.8}
            style={{ flexDirection: "row", alignItems: "center" }}
          >
            <Icon name="chevron-back" size={24} color="#ffffff" />
            <Text style={{ color: "white", fontWeight: "800", fontSize: 16, marginLeft: 6 }}>
              Back
            </Text>
          </TouchableOpacity>
        </View>

        <View style={{ alignItems: "center", marginBottom: 20 }}>
          <Text style={styles.title}>Coach Email Verification</Text>
          <Text style={styles.subtitle}>
            We’ll send a verification link to your email. Open it, then return here and tap “I verified”.
          </Text>
        </View>

        <View style={styles.formContainer}>
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
                placeholder="your.email@example.com"
                placeholderTextColor="#8e8e93"
                style={styles.textInput}
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={onSend}
              />
            </View>
          </View>

          <TouchableOpacity
            onPress={onSend}
            style={[styles.signInButton, (loading || cooldownLeft > 0) && styles.buttonDisabled]}
            disabled={loading || cooldownLeft > 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading || cooldownLeft > 0 ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>
                {cooldownLeft > 0 ? `Resend in ${cooldownLeft}s` : loading ? "Sending..." : "Send Verification Email"}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.dividerContainer}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>then</Text>
            <View style={styles.divider} />
          </View>

          <TouchableOpacity
            onPress={onIHaveVerified}
            style={[styles.signInButton, loading && styles.buttonDisabled]}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>{loading ? "Checking..." : "I clicked the link — Continue"}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Text style={{ color: "#a8a8a8", fontSize: 13, textAlign: "center" }}>
              Tip: check spam/promotions. Add our from address to contacts for better deliverability.
            </Text>
          </View>
        </View>

        <View style={styles.footerBlock}>
          <TouchableOpacity onPress={() => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] })} activeOpacity={0.7}>
            <Text style={styles.linkText}>Back</Text>
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
  dividerContainer: { flexDirection: "row", alignItems: "center", marginVertical: 14 },
  divider: { flex: 1, height: 1, backgroundColor: "rgba(255, 255, 255, 0.2)" },
  dividerText: { color: "#8e8e93", fontSize: 14, marginHorizontal: 12, fontWeight: "500" },
  footerBlock: { alignItems: "center", marginTop: 10, marginBottom: 6 },
  linkText: { color: ACCENT, fontSize: 14, fontWeight: "bold", textDecorationLine: "underline", textAlign: "center" },
};
