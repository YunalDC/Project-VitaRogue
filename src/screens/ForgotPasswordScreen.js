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
  Image,
  StyleSheet,
  Keyboard,
  TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons as Icon } from "@expo/vector-icons";
import { resetPassword } from "../lib/auth";

const { width } = Dimensions.get("window");

const ACCENT = "#34d399";
const ACCENT_DARK = "#10b981";

// Same logo sizing as other screens
const LOGO_SIZE = Math.min(160, Math.max(100, Math.round(width * 0.35)));

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [focused, setFocused] = useState(false);
  const [loading, setLoading] = useState(false);

  // Track keyboard (Android: center when hidden, top-align when visible)
  const [kbVisible, setKbVisible] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener("keyboardDidShow", () => setKbVisible(true));
    const hide = Keyboard.addListener("keyboardDidHide", () => setKbVisible(false));
    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  const onSubmit = async () => {
    const trimmed = email.trim();
    if (!trimmed) {
      return Alert.alert("Missing email", "Please enter your account email.");
    }
    try {
      setLoading(true);
      await resetPassword(trimmed);
      Alert.alert("Check your inbox", "We sent a password reset link to your email.", [
        { text: "Back to Sign In", onPress: () => navigation.replace("SignIn") },
      ]);
    } catch (e) {
      Alert.alert("Reset failed", e.message ?? "Something went wrong.");
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
          styles.contentWrap,
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
          <Text style={styles.title}>Forgot Password</Text>
          <Text style={styles.subtitle}>
            Enter your email and we’ll send you a reset link.
          </Text>
        </View>

        {/* Email input */}
        <View style={styles.inputBlock}>
          <Text style={styles.label}>Email Address</Text>
          <View style={[styles.inputWrapper, focused && styles.inputWrapperFocused]}>
            <Icon
              name="mail-outline"
              size={20}
              color={focused ? ACCENT : "#8e8e93"}
              style={styles.inputIcon}
            />
            <TextInput
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="your.email@example.com"
              placeholderTextColor="#8e8e93"
              style={styles.textInput}
              autoComplete="email"
              returnKeyType="send"
              onSubmitEditing={onSubmit}
            />
          </View>
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={onSubmit}
          disabled={loading}
          activeOpacity={0.85}
          style={[styles.ctaButton, loading && styles.buttonDisabled]}
        >
          <LinearGradient
            colors={loading ? ["#666", "#666"] : [ACCENT, ACCENT_DARK]}
            style={styles.buttonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Text style={styles.buttonText}>{loading ? "Sending..." : "Send reset link"}</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Link */}
        <TouchableOpacity onPress={() => navigation.replace("SignIn")} activeOpacity={0.7}>
          <Text style={styles.linkText}>Back to Sign In</Text>
        </TouchableOpacity>
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

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { flex: 1 },
  keyboardView: { flex: 1 },

  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 20,
  },

  // Center by default; Android toggles with keyboard visibility
  contentWrap: {
    flexGrow: 1,
    width: "100%",
    maxWidth: 480,
    alignSelf: "center",
    alignItems: "center",
  },
  centerAligned: { justifyContent: "center" },
  topAligned: { justifyContent: "flex-start" },

  header: { alignItems: "center", marginBottom: 20 },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "white",
    textAlign: "center",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: "#a8a8a8",
    textAlign: "center",
    marginBottom: 12,
  },

  inputBlock: { width: "100%", marginBottom: 16 },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 6,
    marginLeft: 4,
  },
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
      android: { elevation: 0 }, // avoid re-layout on Android while focused
    }),
  },
  inputIcon: { marginRight: 10 },
  textInput: { flex: 1, fontSize: 16, color: "white" },

  ctaButton: {
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "stretch",
    marginTop: 8,
    marginBottom: 16,
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
    alignItems: "center",
    justifyContent: "center",
    minHeight: 52,
  },
  buttonText: { color: "white", fontSize: 16, fontWeight: "bold" },

  linkText: {
    color: ACCENT,
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
    textAlign: "center",
  },
});
