import React, { useState } from "react";
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
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { LinearGradient } from "expo-linear-gradient";
import Icon from "react-native-vector-icons/Ionicons";
import { signUp } from "../lib/auth";

const { width, height } = Dimensions.get("window");

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmFocused, setConfirmFocused] = useState(false);

  const getPasswordStrength = (password) => {
    if (password.length < 6) return { strength: 0, color: "#ff4757", text: "Weak" };
    if (password.length < 8) return { strength: 1, color: "#ffa502", text: "Fair" };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 2, color: "#2ed573", text: "Strong" };
    }
    return { strength: 1, color: "#ffa502", text: "Good" };
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
      Alert.alert(
        "Welcome to the Gym! 💪",
        "Account created successfully. Time to start your fitness journey!",
        [{ text: "Let's Go!", onPress: () => navigation.replace("SignIn") }]
      );
    } catch (e) {
      Alert.alert("Sign Up Failed", e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      <LinearGradient
        colors={["#1a1a2e", "#16213e", "#0f3460"]}
        style={styles.gradient}
      >
        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Header Section */}
            <View style={styles.header}>
              <View style={styles.logoContainer}>
                <LinearGradient
                  colors={["#ff6b6b", "#ee5a24"]}
                  style={styles.logoGradient}
                >
                  <Icon name="fitness" size={32} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Join the Gym</Text>
              <Text style={styles.subtitle}>Start your fitness journey today</Text>
            </View>

            {/* Form Section */}
            <View style={styles.formContainer}>
              {/* Email Input */}
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
                    color={emailFocused ? "#ff6b6b" : "#8e8e93"}
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
                  />
                </View>
              </View>

              {/* Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Create Password</Text>
                  {pw.length > 0 && (
                    <View style={styles.strengthIndicator}>
                      <Text
                        style={[
                          styles.strengthText,
                          { color: passwordStrength.color },
                        ]}
                      >
                        {passwordStrength.text}
                      </Text>
                    </View>
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
                    color={passwordFocused ? "#ff6b6b" : "#8e8e93"}
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

                {/* Password Strength Bar */}
                {pw.length > 0 && (
                  <View style={styles.strengthBarContainer}>
                    <View style={styles.strengthBar}>
                      <View
                        style={[
                          styles.strengthFill,
                          {
                            width: `${((passwordStrength.strength + 1) / 3) * 100}%`,
                            backgroundColor: passwordStrength.color,
                          },
                        ]}
                      />
                    </View>
                  </View>
                )}
              </View>

              {/* Confirm Password Input */}
              <View style={styles.inputContainer}>
                <View style={styles.labelRow}>
                  <Text style={styles.label}>Confirm Password</Text>
                  {confirm.length > 0 && (
                    <Icon
                      name={pw === confirm ? "checkmark-circle" : "close-circle"}
                      size={16}
                      color={pw === confirm ? "#2ed573" : "#ff4757"}
                    />
                  )}
                </View>
                <View
                  style={[
                    styles.inputWrapper,
                    confirmFocused && styles.inputWrapperFocused,
                    confirm.length > 0 &&
                      pw !== confirm &&
                      styles.inputWrapperError,
                  ]}
                >
                  <Icon
                    name="lock-closed-outline"
                    size={20}
                    color={confirmFocused ? "#ff6b6b" : "#8e8e93"}
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
                  />
                </View>
              </View>

              {/* Terms and Conditions */}
              <View style={styles.termsContainer}>
                <Icon name="information-circle-outline" size={16} color="#8e8e93" />
                <Text style={styles.termsText}>
                  By signing up, you agree to our{" "}
                  <Text style={styles.linkText}>Terms of Service</Text> and{" "}
                  <Text style={styles.linkText}>Privacy Policy</Text>
                </Text>
              </View>

              {/* Sign Up Button */}
              <TouchableOpacity
                onPress={onSignUp}
                style={[styles.signUpButton, loading && styles.buttonDisabled]}
                disabled={loading}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={loading ? ["#666", "#666"] : ["#ff6b6b", "#ee5a24"]}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <Text style={styles.buttonText}>Creating Account...</Text>
                    </View>
                  ) : (
                    <View style={styles.buttonContent}>
                      <Text style={styles.buttonText}>Start Training</Text>
                      <Icon name="arrow-forward" size={18} color="white" />
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Already have an account? </Text>
              <TouchableOpacity
                onPress={() => navigation.replace("SignIn")}
                activeOpacity={0.7}
              >
                <Text style={styles.linkText}>Sign in here</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = {
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 20 : 40,
    paddingBottom: 40,
  },
  header: {
    alignItems: "center",
    marginBottom: 32,
    paddingTop: 20,
  },
  logoContainer: {
    marginBottom: 24,
  },
  logoGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "white",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#a8a8a8",
    textAlign: "center",
    fontWeight: "400",
  },
  formContainer: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 20,
  },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginLeft: 4,
  },
  strengthIndicator: {
    marginRight: 4,
  },
  strengthText: {
    fontSize: 12,
    fontWeight: "600",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    height: 56,
  },
  inputWrapperFocused: {
    borderColor: "#ff6b6b",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  inputWrapperError: {
    borderColor: "#ff4757",
    backgroundColor: "rgba(255, 71, 87, 0.1)",
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "white",
    fontWeight: "400",
  },
  eyeButton: {
    padding: 4,
    marginLeft: 8,
  },
  strengthBarContainer: {
    marginTop: 8,
    paddingHorizontal: 4,
  },
  strengthBar: {
    height: 3,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    overflow: "hidden",
  },
  strengthFill: {
    height: "100%",
    borderRadius: 2,
    // (Optional) RN doesn't support 'transition'; left out to avoid warnings.
  },
  termsContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  termsText: {
    flex: 1,
    fontSize: 12,
    color: "#8e8e93",
    lineHeight: 18,
    marginLeft: 8,
  },
  signUpButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 8, // tightened since social options removed
    shadowColor: "#ff6b6b",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  buttonDisabled: {
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonGradient: {
    paddingVertical: 18,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 56,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  buttonContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
    marginRight: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "auto",
    paddingTop: 20,
  },
  footerText: {
    color: "#a8a8a8",
    fontSize: 14,
  },
  linkText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "bold",
  },
  coachFooter: {
    alignItems: "center",
    marginTop: 16,
    paddingBottom: 10,
  },
  coachLinkText: {
    color: "#a8a8a8",
    fontSize: 13,
    fontWeight: "500",
    textDecorationLine: "underline",
  },
};
