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
  Dimensions,
  SafeAreaView,
  Image,
  Keyboard,
  TouchableWithoutFeedback,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import { signUp } from "../lib/auth";
import { setAuthInitialRoute } from "../state/authRoute";

const { width, height } = Dimensions.get("window");

// Light-green accent
const ACCENT = "#34d399";
const ACCENT_DARK = "#10b981";

// Responsive logo size (100–160, ~35% of width)
const LOGO_SIZE = Math.min(160, Math.max(100, Math.round(width * 0.35)));

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  // Track keyboard (for Android center/top toggle)
  const [kbVisible, setKbVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  useEffect(() => {
    setAuthInitialRoute("SignUp");
  }, []);

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 0, color: "#ef4444", text: "Weak" };
    if (password.length < 8) return { strength: 1, color: "#f59e0b", text: "Fair" };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 2, color: ACCENT, text: "Strong" };
    }
    return { strength: 1, color: "#f59e0b", text: "Good" };
  };

  const passwordStrength = getPasswordStrength(pw);

  const onSignUp = async () => {
    if (!email.trim() || !pw.trim() || !confirm.trim()) {
      return Alert.alert("Missing fields", "Please fill all fields.");
    }
    if (pw.length < 6) return Alert.alert("Weak password", "Use at least 6 characters.");
    if (pw !== confirm) return Alert.alert("Password mismatch", "Passwords do not match.");

    try {
      setLoading(true);
      await signUp(email.trim(), pw);
      Alert.alert("Account created 🎉", "You're all set!", [
        { text: "Go to Sign In", onPress: () => navigation.replace("SignIn") },
      ]);
    } catch (e) {
      Alert.alert("Sign Up Failed", e.message);
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
      {/* Center when keyboard hidden; top-align when visible (Android only) */}
      <View
        style={[
          styles.centerWrap,
          Platform.OS === "android" && (kbVisible ? styles.topAligned : styles.centerAligned),
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <Image
            source={require("../../assets/logo.png")}
            style={{ width: LOGO_SIZE, height: LOGO_SIZE, marginBottom: 10 }}
            resizeMode="contain"
          />
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>Start your fitness journey today</Text>
        </View>

        {/* Form */}
        <View style={styles.formContainer}>
          {/* Email */}
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Email Address</Text>
            <View
              style={[
                styles.inputWrapper,
                emailFocused && styles.inputWrapperFocused,
              ]}
            >
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
                placeholder="your.email@example.com"
                placeholderTextColor="#8e8e93"
                style={styles.textInput}
                autoComplete="email"
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Create Password</Text>
              {pw.length > 0 && (
                <Text style={[styles.strengthText, { color: passwordStrength.color }]}>
                  {passwordStrength.text}
                </Text>
              )}
            </View>

            <View
              style={[
                styles.inputWrapper,
                passwordFocused && styles.inputWrapperFocused,
              ]}
            >
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
                placeholder="Create a strong password"
                placeholderTextColor="#8e8e93"
                style={styles.textInput}
                autoComplete="new-password"
                returnKeyType="next"
              />
              <TouchableOpacity
                onPress={() => setShowPw(!showPw)}
                style={styles.eyeButton}
                activeOpacity={0.7}
              >
                <Icon
                  name={showPw ? "eye-outline" : "eye-off-outline"}
                  size={20}
                  color="#8e8e93"
                />
              </TouchableOpacity>
            </View>

            {/* Strength bar */}
            {pw.length > 0 && (
              <View style={styles.strengthBarContainer}>
                <View style={styles.strengthBar}>
                  <View
                    style={{
                      height: "100%",
                      width: `${((passwordStrength.strength + 1) / 3) * 100}%`,
                      backgroundColor: passwordStrength.color,
                      borderRadius: 2,
                    }}
                  />
                </View>
              </View>
            )}
          </View>

          {/* Confirm */}
          <View style={styles.inputContainer}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>Confirm Password</Text>
              {confirm.length > 0 && (
                <Icon
                  name={pw === confirm ? "checkmark-circle" : "close-circle"}
                  size={16}
                  color={pw === confirm ? ACCENT : "#ef4444"}
                />
              )}
            </View>

            <View
              style={[
                styles.inputWrapper,
                confirmFocused && styles.inputWrapperFocused,
                confirm.length > 0 && pw !== confirm && styles.inputWrapperError,
              ]}
            >
              <Icon
                name="lock-closed-outline"
                size={20}
                color={confirmFocused ? ACCENT : "#8e8e93"}
                style={styles.inputIcon}
              />
              <TextInput
                value={confirm}
                onChangeText={setConfirm}
                onFocus={() => setConfirmFocused(true)}
                onBlur={() => setConfirmFocused(false)}
                secureTextEntry={!showPw}
                placeholder="Confirm your password"
                placeholderTextColor="#8e8e93"
                style={styles.textInput}
                autoComplete="new-password"
                returnKeyType="done"
                onSubmitEditing={onSignUp}
              />
            </View>
          </View>

          {/* Terms */}
          <View style={styles.termsContainer}>
            <Icon name="information-circle-outline" size={16} color="#8e8e93" />
            <Text style={styles.termsText}>
              By signing up, you agree to our{" "}
              <Text style={styles.linkText}>Terms of Service</Text> and{" "}
              <Text style={styles.linkText}>Privacy Policy</Text>.
            </Text>
          </View>

          {/* Sign Up */}
          <TouchableOpacity
            onPress={onSignUp}
            style={[styles.signUpButton, loading && styles.buttonDisabled]}
            disabled={loading}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <View style={styles.buttonContent}>
                <Text style={styles.buttonText}>
                  {loading ? "Creating Account..." : "Create Account"}
                </Text>
                {!loading && <Icon name="arrow-forward" size={18} color="white" />}
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Footer (centered links) */}
        <View style={styles.footerBlock}>
          <View style={styles.footerRow}>
            <Text style={styles.footerText}>Already have an account? </Text>
            <TouchableOpacity
              onPress={() => navigation.replace("SignIn")}
              activeOpacity={0.7}
            >
              <Text style={styles.linkText}>Sign in here</Text>
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
        <LinearGradient
          colors={["#1a1a2e", "#16213e", "#0f3460"]}
          style={styles.gradient}
        >
          {Platform.OS === "ios" ? (
            <KeyboardAvoidingView
              style={styles.keyboardView}
              behavior="padding"
              keyboardVerticalOffset={0}
            >
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

  // Center when there’s space; scroll when small
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // Center by default; Android toggles with keyboard visibility
  centerWrap: { flexGrow: 1, alignItems: "stretch" },
  centerAligned: { justifyContent: "center" },
  topAligned: { justifyContent: "flex-start" },

  // Header
  header: { alignItems: "center", marginBottom: 20 },
  title: {
    fontSize: 30,
    fontWeight: "bold",
    color: "white",
    marginBottom: 4,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 15,
    color: "#a8a8a8",
    textAlign: "center",
    fontWeight: "400",
    marginBottom: 12,
  },

  // Form
  formContainer: { width: "100%", alignSelf: "center" },
  inputContainer: { marginBottom: 12 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  label: { fontSize: 13, fontWeight: "600", color: "#ffffff", marginLeft: 4 },
  strengthText: { fontSize: 12, fontWeight: "600" },

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
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.18,
        shadowRadius: 6,
      },
      android: { elevation: 0 }, // avoid relayout during focus
    }),
  },
  inputWrapperError: {
    borderColor: "#ef4444",
    backgroundColor: "rgba(239, 68, 68, 0.10)",
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: "white", fontWeight: "400" },
  eyeButton: { padding: 4, marginLeft: 6 },

  strengthBarContainer: { marginTop: 8, paddingHorizontal: 4 },
  strengthBar: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },

  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 20,
    paddingHorizontal: 4,
  },
  termsText: { flex: 1, fontSize: 12, color: "#8e8e93", lineHeight: 18, marginLeft: 8 },

  // Button
  signUpButton: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    alignSelf: "center",
    width: "100%",
    ...Platform.select({
      ios: {
        shadowColor: ACCENT,
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 12,
      },
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
  buttonContent: { flexDirection: "row", alignItems: "center", gap: 8 },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold", marginRight: 8 },

  // Footer (centered)
  footerBlock: { alignItems: "center", marginTop: 10 },
  footerRow: { flexDirection: "row", alignItems: "center", justifyContent: "center" },
  footerText: { color: "#a8a8a8", fontSize: 14 },
  linkText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
  },
};
