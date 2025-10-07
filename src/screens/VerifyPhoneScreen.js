import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
} from "react-native";

/** ==== API (no idToken here) ==== */
const API_HOST = "http://192.168.8.179:4000";
const API_BASE = `${API_HOST}/accounts`;
const ENDPOINTS = {
  checkPhone: `${API_BASE}/api/check-phone/`,
  sendOtp: `${API_BASE}/api/send-otp/`,
  verifyOtp: `${API_BASE}/api/verify-otp/`,
};

async function checkPhoneAvailability(phone) {
  const res = await fetch(ENDPOINTS.checkPhone, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

async function sendOtp(phone) {
  const res = await fetch(ENDPOINTS.sendOtp, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone }),
  });
  return res.json();
}

async function verifyOtpApi({ phone, code }) {
  const res = await fetch(ENDPOINTS.verifyOtp, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ phone, code }),
  });
  return res.json();
}

/** ==== THEME ==== */
const COLORS = {
  bg: "#0f172a",
  bgGradientTop: "#1e293b",
  card: "#1e293b",
  inputBg: "#334155",
  border: "#475569",
  text: "#f8fafc",
  textSecondary: "#cbd5e1",
  muted: "#94a3b8",
  primary: "#10b981",
  primaryDark: "#059669",
  error: "#ef4444",
};

export default function VerifyPhoneScreen({ navigation }) {
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const [cooldown, setCooldown] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!cooldown) return;
    const t = setInterval(() => setCooldown((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const validPhone = /^0\d{9}$|^94\d{9}$/.test(phone);

  async function onSend() {
    if (!validPhone) {
      Alert.alert("Enter a valid number", "Use 07XXXXXXXX or 94XXXXXXXXX");
      return;
    }
    
    setBusy(true);
    try {
      // First, check if phone is already registered
      const checkRes = await checkPhoneAvailability(phone);
      
      if (checkRes?.registered) {
        Alert.alert(
          "Phone Already Registered",
          "This phone number is already linked to an account. Please sign in instead.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Go to Sign In", 
              onPress: () => navigation.navigate("CoachSignIn")
            }
          ]
        );
        return;
      }

      // If available, proceed to send OTP
      const res = await sendOtp(phone);
      if (res?.success) {
        setOtpSent(true);
        setCooldown(30);
        Alert.alert("Code sent", "Check your SMS.");
      } else {
        Alert.alert("Error", res?.error || "Failed to send code");
      }
    } catch (e) {
      Alert.alert("Network error", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  async function onVerify() {
    if (!code.trim()) {
      Alert.alert("Enter the code");
      return;
    }
    setBusy(true);
    try {
      const res = await verifyOtpApi({ phone, code });
      if (res?.verified) {
        navigation.replace("CoachSignUp", { verifiedPhone: phone });
      } else {
        Alert.alert("Verification failed", res?.error || "Invalid code");
      }
    } catch (e) {
      Alert.alert("Network error", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  }

  function onEditNumber() {
    setOtpSent(false);
    setCooldown(0);
    setCode("");
  }

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.bg} />
      
      <KeyboardAvoidingView
        behavior={Platform.select({ ios: "padding", android: undefined })}
        style={{ flex: 1 }}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ flexGrow: 1 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Content Container with centered layout */}
          <View style={styles.container}>
            {/* Header Section */}
            <View style={styles.header}>
              <Text style={styles.title}>Verify your phone</Text>
              <Text style={styles.subtitle}>
                Enter your mobile number, we'll send a 6-digit code via SMS.
              </Text>
            </View>

            {/* Form Section */}
            <View style={styles.formSection}>
              {/* Phone Input */}
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Mobile Number</Text>
                <View style={styles.inputWrapper}>
                  <View style={styles.phoneIconContainer}>
                    <Text style={styles.phoneIcon}>📱</Text>
                  </View>
                  <TextInput
                    value={phone}
                    onChangeText={(v) => setPhone(v.replace(/[^\d]/g, ""))}
                    keyboardType="phone-pad"
                    placeholder="071 234 5678"
                    placeholderTextColor={COLORS.muted}
                    editable={!otpSent && !busy}
                    style={[
                      styles.input,
                      otpSent && { opacity: 0.6 },
                    ]}
                  />
                </View>
              </View>

              {/* Send / Resend Button */}
              {!otpSent ? (
                <TouchableOpacity
                  onPress={onSend}
                  activeOpacity={0.85}
                  disabled={busy || !validPhone}
                  style={[
                    styles.primaryBtn,
                    (busy || !validPhone) && { opacity: 0.5 },
                  ]}
                >
                  <Text style={styles.primaryBtnText}>
                    {busy ? "Checking..." : "Send Code"}
                  </Text>
                </TouchableOpacity>
              ) : (
                <View>
                  <TouchableOpacity
                    onPress={cooldown === 0 && !busy ? onSend : undefined}
                    activeOpacity={0.85}
                    disabled={busy || cooldown > 0}
                    style={[
                      styles.secondaryBtn,
                      (busy || cooldown > 0) && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.secondaryBtnText}>
                      {cooldown > 0
                        ? `Resend in ${cooldown}s`
                        : busy
                        ? "Sending..."
                        : "Resend Code"}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={onEditNumber}
                    activeOpacity={0.7}
                    style={styles.changeNumberBtn}
                  >
                    <Text style={styles.changeNumberText}>Change number</Text>
                  </TouchableOpacity>
                </View>
              )}

              {/* OTP Input (appears after sending) */}
              {otpSent && (
                <View style={styles.otpSection}>
                  <View style={styles.inputContainer}>
                    <Text style={styles.label}>6-digit code</Text>
                    <TextInput
                      value={code}
                      onChangeText={(v) => setCode(v.replace(/[^\d]/g, ""))}
                      keyboardType="number-pad"
                      placeholder="123456"
                      placeholderTextColor={COLORS.muted}
                      maxLength={6}
                      style={styles.input}
                    />
                  </View>

                  <TouchableOpacity
                    onPress={onVerify}
                    activeOpacity={0.85}
                    disabled={busy || code.length < 4}
                    style={[
                      styles.primaryBtn,
                      (busy || code.length < 4) && { opacity: 0.5 },
                    ]}
                  >
                    <Text style={styles.primaryBtnText}>
                      {busy ? "Verifying..." : "Verify"}
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          </View>

          {/* Back Button at Bottom */}
          <View style={styles.footer}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              activeOpacity={0.7}
              style={styles.backButton}
            >
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = {
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  header: {
    marginBottom: 48,
    alignItems: "center",
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    paddingHorizontal: 8,
  },
  formSection: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 10,
    letterSpacing: 0.3,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  phoneIconContainer: {
    paddingLeft: 16,
    paddingRight: 8,
  },
  phoneIcon: {
    fontSize: 20,
  },
  input: {
    flex: 1,
    color: COLORS.text,
    fontSize: 16,
    paddingVertical: 16,
    paddingRight: 16,
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryBtnText: {
    color: COLORS.bg,
    fontWeight: "700",
    fontSize: 17,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    backgroundColor: COLORS.card,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  secondaryBtnText: {
    color: COLORS.text,
    fontWeight: "600",
    fontSize: 16,
  },
  changeNumberBtn: {
    alignSelf: "center",
    paddingVertical: 8,
  },
  changeNumberText: {
    color: COLORS.muted,
    fontSize: 14,
    textDecorationLine: "underline",
  },
  otpSection: {
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 24,
    alignItems: "center",
  },
  backButton: {
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    backgroundColor: "transparent",
  },
  backButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: "600",
  },
};