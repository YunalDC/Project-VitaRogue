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
import { signIn } from "../lib/auth";

const { width, height } = Dimensions.get("window");

export default function SignInScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  const onSignIn = async () => {
    if (!email.trim() || !pw.trim()) {
      return Alert.alert("Missing fields", "Please fill all fields.");
    }
    try {
      setLoading(true);
      const user = await signIn(email.trim(), pw);
      navigation.reset({
        index: 0,
        routes: [{ name: "Home", params: { email: user.email } }],
      });
    } catch (e) {
      Alert.alert("Sign In Failed", e.message);
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
                  <Icon name="barbell" size={32} color="white" />
                </LinearGradient>
              </View>
              <Text style={styles.title}>Welcome Back</Text>
              <Text style={styles.subtitle}>Ready to crush your goals?</Text>
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
                <Text style={styles.label}>Password</Text>
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
                    placeholder="Enter your password"
                    placeholderTextColor="#8e8e93"
                    style={styles.textInput}
                    autoComplete="password"
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
              </View>

              {/* Forgot Password */}
              <TouchableOpacity style={styles.forgotPassword} activeOpacity={0.7}>
                <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
              </TouchableOpacity>

              {/* Sign In Button */}
              <TouchableOpacity
                onPress={onSignIn}
                style={[styles.signInButton, loading && styles.buttonDisabled]}
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
                      <Text style={styles.buttonText}>Signing In...</Text>
                    </View>
                  ) : (
                    <Text style={styles.buttonText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>

              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              {/* Social Login Options */}
              <View style={styles.socialContainer}>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                  <Icon name="logo-google" size={20} color="#db4437" />
                  <Text style={styles.socialButtonText}>Google</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.socialButton} activeOpacity={0.7}>
                  <Icon name="logo-apple" size={20} color="#000" />
                  <Text style={styles.socialButtonText}>Apple</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Footer */}
            <View style={styles.footerSection}>
              <View style={styles.footer}>
                <Text style={styles.footerText}>Don't have an account? </Text>

                {/* Highlighted "Join the gym" chip */}
                <TouchableOpacity
                  onPress={() => navigation.navigate("SignUp")}
                  activeOpacity={0.9}
                  style={styles.joinChip}
                >
                  <LinearGradient
                    colors={["#ff6b6b", "#ee5a24"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.joinChipBg}
                  >
                    <Text style={styles.joinChipText}>Join the gym</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>

              {/* "Join as a coach" link directly below */}
              <View style={styles.coachFooter}>
                <TouchableOpacity
                  onPress={() => navigation.navigate("CoachSignUp")} // adjust to your route name
                  activeOpacity={0.7}
                >
                  <Text style={styles.coachLinkText}>Join as a coach</Text>
                </TouchableOpacity>
              </View>
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
    marginBottom: 40,
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
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 8,
    marginLeft: 4,
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
  forgotPassword: {
    alignSelf: "flex-end",
    marginBottom: 32,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "500",
  },
  signInButton: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 24,
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
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  dividerText: {
    color: "#8e8e93",
    fontSize: 14,
    marginHorizontal: 16,
    fontWeight: "500",
  },
  socialContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 32,
  },
  socialButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: 6,
  },
  socialButtonText: {
    color: "#1a1a1a",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },

  /* Footer block */
  footerSection: {
    marginTop: 16,
    paddingTop: 8,
    // This bottom padding keeps links off the absolute bottom.
    paddingBottom: 12,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    // Lift it a bit higher from the bottom
    marginBottom: 6,
  },
  footerText: {
    color: "#a8a8a8",
    fontSize: 14,
    marginRight: 8,
  },

  /* Highlighted "Join the gym" chip */
  joinChip: {
    borderRadius: 999,
    overflow: "hidden",
  },
  joinChipBg: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
  },
  joinChipText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "bold",
  },

  /* Coach link under the gym link */
  coachFooter: {
    alignItems: "center",
    marginTop: 10,
  },
  coachLinkText: {
    color: "#ff6b6b",
    fontSize: 14,
    fontWeight: "bold",
    textDecorationLine: "underline",
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
};
