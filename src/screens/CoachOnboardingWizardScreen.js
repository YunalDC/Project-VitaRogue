// src/screens/CoachOnboardingWizardScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  TextInput,
  Platform,
  KeyboardAvoidingView,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { Ionicons } from "@expo/vector-icons";
import { firebaseAuth as auth, db } from "../lib/firebaseApp";
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

/** ==== API CONFIG (server mounted at /accounts on :4000) ==== */
const API_HOST = "http://192.168.8.179:4000";
const API_BASE = `${API_HOST}/accounts`;
const BACKEND_ENDPOINT = `${API_BASE}/api/coach-verification-upload/`;

/** ==== THEME ==== */
const COLORS = {
  bg: "#0B1220",
  card: "#111827",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  primary: "#10B981",
  error: "#ef4444",
};

const MAX_DOC_MB = 15;

const mimeFromName = (name = "") => {
  const n = (name || "").toLowerCase();
  if (n.endsWith(".pdf")) return "application/pdf";
  if (n.endsWith(".png")) return "image/png";
  if (n.endsWith(".jpg") || n.endsWith(".jpeg")) return "image/jpeg";
  return "application/octet-stream";
};

export default function CoachVerificationScreen({ navigation, route }) {
  const { width } = useWindowDimensions();

  // Responsive paddings & max width
  const isTablet = width >= 768;
  const maxWidth = isTablet ? Math.min(720, width - 48) : width - 24;
  const contentPad = isTablet ? 24 : 16;

  const [formData, setFormData] = useState({
    fullName: "",
    nic: "",
    certificationNumber: "",
    issuingAuthority: "",
    yearOfCertification: "",
    gymAffiliation: "",
    experience: "",
    specializations: "",
    educationBackground: "",
    emergencyContact: "",
  province: "",
  district: "",
  languages: "", // comma separated
  nvqLevel: "", // Sri Lankan NVQ level if applicable
  slcptLicense: "", // Sri Lanka Council of Physiotherapy / Training license or similar
  });

  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draftSaving, setDraftSaving] = useState(false);
  const [lastDraftSaved, setLastDraftSaved] = useState(null);

  // If someone hits this screen without a session, shunt them to SignIn.
  useEffect(() => {
    if (!auth?.currentUser) {
      navigation.reset({ index: 0, routes: [{ name: "SignIn" }] });
    }
  }, [navigation]);

  // Load existing draft
  useEffect(() => {
    (async () => {
      const user = auth.currentUser; if (!user) return;
      try {
        const ref = doc(db, 'coachVerificationDrafts', user.uid);
        const snap = await getDoc(ref);
        if (snap.exists()) {
          const d = snap.data();
          if (d.formData) setFormData(prev => ({ ...prev, ...d.formData }));
          if (Array.isArray(d.filesMeta)) {
            // Only keep metadata names; actual file re-selection required for security.
          }
          if (d.updatedAt?.toDate) setLastDraftSaved(d.updatedAt.toDate());
        }
      } catch (e) {
        console.warn('[CoachVerify] load draft failed', e);
      }
    })();
  }, []);

  // Debounced autosave of draft (excluding binary file content)
  useEffect(() => {
    const user = auth.currentUser; if (!user) return;
    const h = setTimeout(async () => {
      try {
        setDraftSaving(true);
        const ref = doc(db, 'coachVerificationDrafts', user.uid);
        const payload = {
          formData,
          filesMeta: files.map(f => ({ name: f.name, size: f.size, mimeType: f.mimeType })),
          updatedAt: serverTimestamp(),
        };
        await setDoc(ref, payload, { merge: true });
        setLastDraftSaved(new Date());
      } catch (e) {
        console.warn('[CoachVerify] draft save failed', e);
      } finally {
        setDraftSaving(false);
      }
    }, 900); // 900ms debounce
    return () => clearTimeout(h);
  }, [formData, files]);

  const pickDocument = async () => {
    try {
      const res = await DocumentPicker.getDocumentAsync({
        multiple: true,
        copyToCacheDirectory: true,
        type: ["image/*", "application/pdf"],
      });
      if (res.canceled) return;

      const picked = (res.assets || []).map((a) => ({
        name: a.name || "document",
        uri: a.uri,
        size: a.size ?? null,
        mimeType: a.mimeType || mimeFromName(a.name),
      }));

      const accepted = picked.filter((a) => (a.size ?? 0) <= MAX_DOC_MB * 1024 * 1024);
      if (accepted.length !== picked.length) {
        Alert.alert("Some files skipped", `Only files up to ${MAX_DOC_MB} MB are allowed.`);
      }

      setFiles((prev) => [...prev, ...accepted]);
    } catch (err) {
      // Older SDKs: DocumentPicker.isCancel(err) exists; newer returns res.canceled above.
      // Don’t hard-crash if it’s not present.
      Alert.alert("Error", "Failed to pick document.");
    }
  };

  const updateField = (field, value) => setFormData((p) => ({ ...p, [field]: value }));

  const validateForm = () => {
  const required = ["fullName", "nic", "certificationNumber", "issuingAuthority", "yearOfCertification", "experience", "province", "district"]; // province & district mandatory for locality
    const missing = required.filter((f) => !String(formData[f]).trim());
    if (missing.length > 0) {
      Alert.alert("Missing Information", "Please fill in all required fields (*).");
      return false;
    }
    if (files.length === 0) {
      Alert.alert("Documents Required", "Please upload at least one document.");
      return false;
    }
    // NIC: older (9 digits + V/X) or new (12 digits). Accept uppercase automatically.
    if (!/^(\d{9}[vVxX]|\d{12})$/.test(formData.nic.trim())) {
      Alert.alert("Invalid NIC", "Please enter a valid NIC (9 digits + V/X or 12 digits).");
      return false;
    }
    // NVQ level optional but if provided must be 1-7 numeric
    if (formData.nvqLevel && !/^([1-7])$/.test(formData.nvqLevel.trim())) {
      Alert.alert("Invalid NVQ Level", "NVQ Level must be a number between 1 and 7.");
      return false;
    }
    // Languages optional: ensure comma separated words
    if (formData.languages && /,,/.test(formData.languages)) {
      Alert.alert("Invalid Languages", "Please separate languages with single commas only.");
      return false;
    }
    if (!/^\d{4}$/.test(String(formData.yearOfCertification).trim())) {
      Alert.alert("Invalid Year", "Year of certification must be YYYY.");
      return false;
    }
    if (
      formData.emergencyContact &&
      !/^\+?\d[\d\s-]{7,}$/.test(formData.emergencyContact.trim())
    ) {
      Alert.alert("Invalid Phone", "Please enter a valid emergency contact number.");
      return false;
    }
    return true;
  };

  const xhrUpload = ({ token, form }) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", BACKEND_ENDPOINT);
      xhr.setRequestHeader("Authorization", `Bearer ${token}`);
      xhr.setRequestHeader("Accept", "application/json");
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new Error(`Backend error ${xhr.status}: ${xhr.responseText || xhr.response || ""}`));
      };
      xhr.onerror = () => reject(new Error("Network/transport error"));
      xhr.send(form);
    });

  const submitVerification = async () => {
    if (submitting) return;
    if (!validateForm()) return;

    try {
      setSubmitting(true);
      setLoading(true);

      const user = auth?.currentUser;
      if (!user) throw new Error("Not signed in");
      const idToken = await user.getIdToken(true);

      const form = new FormData();
      form.append("fullName", (formData.fullName || "").trim());
      form.append("nic", (formData.nic || "").trim());
      form.append("certificationNumber", (formData.certificationNumber || "").trim());
      form.append("issuingAuthority", (formData.issuingAuthority || "").trim());
      form.append("yearOfCertification", String(formData.yearOfCertification || "").trim());
      form.append("gymAffiliation", (formData.gymAffiliation || "").trim());
      form.append("experience", String(formData.experience || "").trim());
      form.append("specializations", (formData.specializations || "").trim());
      form.append("educationBackground", (formData.educationBackground || "").trim());
      form.append("emergencyContact", (formData.emergencyContact || "").trim());
  form.append("province", (formData.province || "").trim());
  form.append("district", (formData.district || "").trim());
  form.append("languages", (formData.languages || "").trim());
  form.append("nvqLevel", (formData.nvqLevel || "").trim());
  form.append("slcptLicense", (formData.slcptLicense || "").trim());
      form.append("submissionDate", new Date().toISOString());
      form.append("platform", Platform.OS);
      form.append("appVersion", "vitarogue-1.0.0");
      if (route?.params?.coachId) form.append("coachId", String(route.params.coachId));

      files.forEach((f, i) => {
        form.append("documents[]", {
          uri: f.uri,
          name: f.name || `file_${i}.dat`,
          type: f.mimeType || mimeFromName(f.name),
        });
      });

      await xhrUpload({ token: idToken, form });

      // Clear draft on successful submit
      try {
        const ref = doc(db, 'coachVerificationDrafts', user.uid);
        await setDoc(ref, { submittedAt: serverTimestamp(), archived: true }, { merge: true });
      } catch (e) {
        console.warn('[CoachVerify] draft archive failed', e);
      }

      // Sign out and go to the standard SignIn screen (not CoachSignIn).
      try {
        await auth.signOut();
      } catch {}

      Alert.alert("Verification Submitted", "We’ll notify you once the review is complete.", [
        {
          text: "OK",
          onPress: () => navigation.reset({ index: 0, routes: [{ name: "SignIn" }] }),
        },
      ]);
    } catch (error) {
      Alert.alert("Error", error?.message || "Failed to submit verification. Please try again.");
    } finally {
      setLoading(false);
      setSubmitting(false);
    }
  };

  const renderInput = (
    label,
    field,
    placeholder,
    required = true,
    keyboardType = "default",
    multiline = false
  ) => (
    <View style={styles.inputContainer}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        value={formData[field]}
        onChangeText={(value) => updateField(field, value)}
        style={[
          styles.input,
          multiline && { height: isTablet ? 96 : 84, textAlignVertical: "top" },
        ]}
        placeholder={placeholder}
        placeholderTextColor={COLORS.muted}
        keyboardType={keyboardType}
        multiline={multiline}
        returnKeyType="next"
      />
    </View>
  );

  const headerIconSize = useMemo(() => (isTablet ? 44 : 40), [isTablet]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.flex1, { backgroundColor: COLORS.bg }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Uploading documents...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.flex1, { backgroundColor: COLORS.bg }]}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 12 : 0}
      >
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingHorizontal: contentPad, paddingBottom: 24, alignItems: "center" },
          ]}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { maxWidth, width: "100%", padding: contentPad }]}>
            <View style={styles.headerContainer}>
              <Ionicons name="shield-checkmark" size={headerIconSize} color={COLORS.primary} />
              <Text style={[styles.header, { fontSize: isTablet ? 26 : 24 }]}>Coach Verification</Text>
              <Text style={styles.description}>
                Please provide your credentials and certifications for verification. All submissions will be reviewed by our team.
              </Text>
              <View style={{ marginTop: 10 }}>
                {draftSaving ? (
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>Saving draft...</Text>
                ) : lastDraftSaved ? (
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>Draft saved {lastDraftSaved.toLocaleTimeString()}</Text>
                ) : (
                  <Text style={{ color: COLORS.muted, fontSize: 12 }}>Draft autosave enabled</Text>
                )}
              </View>
            </View>

            {renderInput("Full Name", "fullName", "Enter your full name as per NIC")}
            {renderInput("NIC Number", "nic", "Enter your NIC number")}
            {renderInput("Certification Number", "certificationNumber", "Enter your certification number")}
            {renderInput("Issuing Authority/Institute", "issuingAuthority", "E.g., SLISM, NASM, ACE, etc.")}

            <View style={styles.rowWrap}>
              <View style={[styles.halfCol, { marginRight: 8 }]}>
                <Text style={styles.inputLabel}>
                  Year of Certification <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={formData.yearOfCertification}
                  onChangeText={(v) => updateField("yearOfCertification", v.replace(/[^\d]/g, ""))}
                  style={styles.input}
                  placeholder="YYYY"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  maxLength={4}
                />
              </View>

              <View style={[styles.halfCol, { marginLeft: 8 }]}>
                <Text style={styles.inputLabel}>
                  Years of Experience <Text style={styles.required}>*</Text>
                </Text>
                <TextInput
                  value={formData.experience}
                  onChangeText={(v) => updateField("experience", v.replace(/[^\d]/g, ""))}
                  style={styles.input}
                  placeholder="No. of years"
                  placeholderTextColor={COLORS.muted}
                  keyboardType="numeric"
                  maxLength={2}
                />
              </View>
            </View>

            {renderInput("Current Gym Affiliation", "gymAffiliation", "Enter gym name if affiliated", false)}
            {renderInput("Province", "province", "e.g., Western", true)}
            {renderInput("District", "district", "e.g., Colombo", true)}
            {renderInput("Languages (comma separated)", "languages", "Sinhala, English, Tamil", false, "default", true)}
            {renderInput("NVQ Level", "nvqLevel", "1-7 if applicable", false, "numeric")}
            {renderInput("SLCPT / License No.", "slcptLicense", "National body license number", false)}
            {renderInput("Specializations", "specializations", "E.g., Strength Training, Weight Loss, etc.", false, "default", true)}
            {renderInput("Educational Background", "educationBackground", "Relevant education and qualifications", false, "default", true)}
            {renderInput("Emergency Contact", "emergencyContact", "Contact number for emergencies", false)}

            <View style={styles.uploadSection}>
              <Text style={styles.uploadHeader}>Required Documents</Text>
              <Text style={styles.uploadDescription}>Please upload clear copies of:</Text>
              <View style={styles.bulletPoints}>
                <Text style={styles.bulletPoint}>• NIC (front and back)</Text>
                <Text style={styles.bulletPoint}>• Certification documents</Text>
                <Text style={styles.bulletPoint}>• Professional insurance (if any)</Text>
                <Text style={styles.bulletPoint}>• Recent passport-size photo</Text>
                <Text style={styles.bulletPoint}>• Any NVQ / Local authority license evidence</Text>
              </View>

              <TouchableOpacity style={styles.uploadButton} onPress={pickDocument} activeOpacity={0.9}>
                <Ionicons name="cloud-upload-outline" size={22} color="#fff" />
                <Text style={styles.buttonText}>Upload Documents</Text>
              </TouchableOpacity>

              {files.length > 0 && (
                <View style={styles.filesContainer}>
                  <Text style={styles.filesHeader}>Selected Documents:</Text>
                  {files.map((file, index) => (
                    <Text key={`${file.name}-${index}`} style={styles.fileName}>
                      <Ionicons name="document-outline" size={16} color={COLORS.primary} />{"  "}
                      {file.name}
                    </Text>
                  ))}
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[styles.submitButton, (submitting || loading) && { opacity: 0.6 }]}
              onPress={submitVerification}
              activeOpacity={0.9}
              disabled={submitting || loading}
            >
              <Text style={styles.submitText}>Submit for Verification</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ───────── Styles ───────── */
const styles = StyleSheet.create({
  flex1: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingTop: 12 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerContainer: { alignItems: "center", marginBottom: 18 },
  header: { fontWeight: "bold", color: COLORS.text, marginTop: 8 },
  description: { color: COLORS.muted, textAlign: "center", lineHeight: 20, marginTop: 8 },
  rowWrap: { flexDirection: "row", marginBottom: 12 },
  halfCol: { flex: 1 },

  inputContainer: { marginBottom: 12 },
  inputLabel: { fontSize: 15, fontWeight: "600", color: COLORS.text, marginBottom: 6 },
  required: { color: COLORS.error },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
    fontSize: 16,
    color: COLORS.text,
    backgroundColor: COLORS.bg, // subtle contrast against card
  },

  uploadSection: { marginTop: 8, marginBottom: 16 },
  uploadHeader: { fontSize: 16, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  uploadDescription: { color: COLORS.muted, marginBottom: 8 },
  bulletPoints: { marginBottom: 12 },
  bulletPoint: { color: COLORS.text, marginBottom: 4, fontSize: 14 },

  uploadButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  submitButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  submitText: { color: "#fff", textAlign: "center", fontWeight: "bold", fontSize: 16 },

  filesContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.bg,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filesHeader: { fontWeight: "bold", marginBottom: 8, color: COLORS.text },
  fileName: { color: COLORS.text, marginBottom: 5 },

  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loadingText: { marginTop: 10, color: COLORS.text },
});
