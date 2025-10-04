// src/screens/FoodScanningScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  Platform,
  Modal,
  Animated,
  Easing,
  Alert,
  Image
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { Camera } from "expo-camera"; // ✅ use Camera.Constants.* instead of CameraType/FlashMode
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";

/**
 * Required deps:
 *   expo install expo-camera expo-image-picker expo-linear-gradient
 *   npm i @react-native-picker/picker
 */

const { width, height } = Dimensions.get("window");

// Theme
const BG = "#0B1220";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";
const INFO = "#0ea5e9";
const WARNING = "#f59e0b";

export default function FoodScanningScreen({ navigation }) {
  // Camera
  const cameraRef = useRef(null);
  const [hasPermission, setHasPermission] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Flow
  const [isScanning, setIsScanning] = useState(false);
  const [capturedUri, setCapturedUri] = useState("");

  // Bottom sheet & result
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resultFood, setResultFood] = useState(null);

  // Toast
  const [toast, setToast] = useState(null); // {type: 'success'|'info'|'error', msg}

  // Permissions
  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === "granted");
      if (status !== "granted") {
        Alert.alert(
          "Camera Permission Required",
          "To scan food items, we need access to your camera. Open Settings and grant permission.",
          [{ text: "OK" }]
        );
      }
    })();
  }, []);

  // Mock food DB
  const mockFoodDatabase = useMemo(
    () => [
      {
        id: 1,
        name: "Grilled Chicken Breast",
        confidence: 92,
        nutrition: { calories: 165.0, fat: 3.6, carbs: 0.0, protein: 31.0 },
        servingSize: "100g",
      },
      {
        id: 2,
        name: "Caesar Salad",
        confidence: 88,
        nutrition: { calories: 190.0, fat: 16.0, carbs: 8.0, protein: 6.0 },
        servingSize: "1 cup",
      },
      {
        id: 3,
        name: "Banana",
        confidence: 95,
        nutrition: { calories: 105.0, fat: 0.4, carbs: 27.0, protein: 1.3 },
        servingSize: "1 medium",
      },
      {
        id: 4,
        name: "Avocado Toast",
        confidence: 85,
        nutrition: { calories: 234.0, fat: 15.0, carbs: 20.0, protein: 6.0 },
        servingSize: "1 slice",
      },
      {
        id: 5,
        name: "Greek Yogurt",
        confidence: 90,
        nutrition: { calories: 100.0, fat: 0.4, carbs: 6.0, protein: 17.0 },
        servingSize: "150g",
      },
    ],
    []
  );

  // Actions
  const toggleFlash = useCallback(() => setFlashOn((v) => !v), []);

  const capturePhoto = useCallback(async () => {
    try {
      if (!cameraRef.current) return;
      setIsScanning(true);
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.85,
        skipProcessing: true,
      });
      setCapturedUri(photo?.uri || "");
      await wait(1200);
      const food = pickRandom(mockFoodDatabase);
      setResultFood(food);
      setSheetOpen(true);
    } catch (e) {
      setToast({ type: "error", msg: "Failed to capture photo. Please try again." });
    } finally {
      setIsScanning(false);
    }
  }, [mockFoodDatabase]);

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setToast({ type: "info", msg: "Allow photo library access to pick an image." });
        return;
      }
      setIsScanning(true);
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      if (!res.canceled && res.assets?.length) {
        setCapturedUri(res.assets[0].uri);
        await wait(1200);
        const food = pickRandom(mockFoodDatabase);
        setResultFood(food);
        setSheetOpen(true);
      }
    } catch (e) {
      setToast({ type: "error", msg: "Failed to pick image from gallery." });
    } finally {
      setIsScanning(false);
    }
  }, [mockFoodDatabase]);

  const onAddToMeal = useCallback(() => {
    setSheetOpen(false);
    setToast({ type: "success", msg: "Food added to meal successfully!" });
  }, []);

  const onManualEntry = useCallback(() => {
    setSheetOpen(false);
    Alert.alert(
      "Manual Food Entry",
      "This feature allows you to manually search and add foods from our comprehensive database.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Search Foods",
          onPress: () => setToast({ type: "info", msg: "Manual entry feature coming soon!" }),
        },
      ]
    );
  }, []);

  // Renders
  if (hasPermission === null) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: BG }]}>
        <ActivityIndicator color="#38bdf8" />
        <Text style={{ color: TEXT, marginTop: 10 }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: BG }]}>
        <Text style={{ color: TEXT, paddingHorizontal: 24, textAlign: "center" }}>
          Camera permission not granted. You can still add foods manually from your diary.
        </Text>
        <TouchableOpacity style={[styles.btn, { marginTop: 16 }]} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: BG }]}>
      {/* Camera Preview */}
      <View style={StyleSheet.absoluteFill}>
        <Camera
          ref={cameraRef}
          style={StyleSheet.absoluteFill}
          // ✅ Fix: use Camera.Constants.Type
          type={Camera.Constants?.Type?.back}
          onCameraReady={() => setIsReady(true)}
          ratio={Platform.OS === "ios" ? "16:9" : undefined}
          // ✅ Fix: use Camera.Constants.FlashMode
          flashMode={
            flashOn
              ? Camera.Constants?.FlashMode?.torch
              : Camera.Constants?.FlashMode?.off
          }
        />
      </View>

      {/* Overlay */}
      <CameraOverlayWidget
        onFlashToggle={toggleFlash}
        onBackPressed={() => navigation.goBack()}
        isFlashOn={flashOn}
        showFlash={Platform.OS !== "web"}
      />

      {/* Bottom scan button */}
      <ScanButtonWidget onPress={capturePhoto} isScanning={isScanning} />

      {/* Gallery button */}
      {isReady && !isScanning && (
        <View style={{ position: "absolute", right: 16, bottom: 140 }}>
          <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
            <Ionicons name="images-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      )}

      {/* Scanning overlay */}
      <Modal transparent visible={isScanning} animationType="fade">
        <View style={[styles.fill, styles.center, { backgroundColor: "rgba(0,0,0,0.7)" }]}>
          <ActivityIndicator size="large" color={INFO} />
          <Text style={{ color: "#fff", marginTop: 10, fontWeight: "600" }}>Analyzing food…</Text>
          <Text style={{ color: "#cbd5e1", marginTop: 4 }}>
            Please wait while we identify your food
          </Text>
        </View>
      </Modal>

      {/* Results bottom sheet */}
      <BottomSheet visible={sheetOpen} onClose={() => setSheetOpen(false)}>
        {resultFood && (
          <NutritionResultsSheet
            foodData={resultFood}
            imageUri={capturedUri}
            onAddToMeal={onAddToMeal}
            onManualEntry={onManualEntry}
            onClose={() => setSheetOpen(false)}
          />
        )}
      </BottomSheet>

      {/* Toast */}
      <Toast data={toast} onHide={() => setToast(null)} />
    </View>
  );
}

/* ============================== Widgets ============================== */

// CameraOverlayWidget
function CameraOverlayWidget({ onFlashToggle, onBackPressed, isFlashOn = false, showFlash = true }) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {/* Top gradient bar */}
      <LinearGradient
        colors={["rgba(17,24,39,0.8)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={{ position: "absolute", left: 0, right: 0, top: 0, height: height * 0.14 }}
      >
        <SafeAreaView>
          <View
            style={{
              paddingHorizontal: 16,
              paddingTop: 8,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            {/* Back */}
            <TouchableOpacity onPress={onBackPressed} style={styles.roundBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            {/* Flash toggle */}
            {showFlash && (
              <TouchableOpacity onPress={onFlashToggle} style={styles.roundBtn}>
                <Ionicons name={isFlashOn ? "flash" : "flash-off"} size={20} color={isFlashOn ? SUCCESS : "#fff"} />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      {/* Reticle square with corner accents */}
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
        <View style={styles.reticleBox}>
          <View style={[styles.corner, { top: -2, left: -2, borderTopColor: SUCCESS, borderLeftColor: SUCCESS }]} />
          <View style={[styles.corner, { top: -2, right: -2, borderTopColor: SUCCESS, borderRightColor: SUCCESS }]} />
          <View style={[styles.corner, { bottom: -2, left: -2, borderBottomColor: SUCCESS, borderLeftColor: SUCCESS }]} />
          <View style={[styles.corner, { bottom: -2, right: -2, borderBottomColor: SUCCESS, borderRightColor: SUCCESS }]} />
          <View
            style={{
              position: "absolute",
              width: 4,
              height: 4,
              backgroundColor: SUCCESS,
              borderRadius: 2,
              alignSelf: "center",
              top: "50%",
              left: "50%",
              marginLeft: -2,
              marginTop: -2,
            }}
          />
        </View>
      </View>

      {/* Instruction pill */}
      <View
        style={{ position: "absolute", top: height * 0.7, left: 0, right: 0, alignItems: "center" }}
        pointerEvents="none"
      >
        <View style={{ backgroundColor: "rgba(17,24,39,0.8)", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 24 }}>
          <Text style={{ color: TEXT, fontWeight: "600" }}>Position food item within the frame</Text>
        </View>
      </View>
    </View>
  );
}

// ScanButtonWidget
function ScanButtonWidget({ onPress, isScanning }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1.2, duration: 750, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
          Animated.timing(pulse, { toValue: 1.0, duration: 750, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
      Animated.timing(scale, { toValue: 0.95, duration: 150, useNativeDriver: true }).start(() => {
        Animated.timing(scale, { toValue: 1.0, duration: 200, useNativeDriver: true }).start();
      });
    }
  }, [isScanning]);

  const BTN_SIZE = Math.min(width * 0.2, 112);

  return (
    <SafeAreaView pointerEvents="box-none" style={{ position: "absolute", left: 0, right: 0, bottom: 0 }}>
      <LinearGradient
        colors={["rgba(17,24,39,0.9)", "transparent"]}
        start={{ x: 0.5, y: 1 }}
        end={{ x: 0.5, y: 0 }}
        style={{ paddingHorizontal: 24, paddingTop: 16, paddingBottom: 24 }}
      >
        <View style={{ alignItems: "center" }}>
          <Animated.View style={{ transform: [{ scale: isScanning ? pulse : scale }] }}>
            <TouchableOpacity
              activeOpacity={0.9}
              disabled={isScanning}
              onPress={() => onPress?.()}
              style={{
                width: BTN_SIZE,
                height: BTN_SIZE,
                borderRadius: BTN_SIZE / 2,
                backgroundColor: isScanning ? INFO : SUCCESS,
                alignItems: "center",
                justifyContent: "center",
                shadowColor: "#000",
                shadowOpacity: 0.3,
                shadowRadius: 16,
                shadowOffset: { width: 0, height: 4 },
              }}
            >
              {isScanning ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Ionicons name="camera" size={32} color="#fff" />
              )}
            </TouchableOpacity>
          </Animated.View>

          <View style={{ height: 12 }} />
          <Text style={{ color: TEXT, fontWeight: "700" }}>
            {isScanning ? "Analyzing food…" : "Tap to Scan"}
          </Text>
          <View style={{ height: 4 }} />
          <Text style={{ color: MUTED, textAlign: "center" }}>
            {isScanning ? "Please wait while we identify your food" : "Position food in frame and tap to capture"}
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

// NutritionResultsSheet (content only; hosted in BottomSheet)
function NutritionResultsSheet({ foodData, imageUri, onAddToMeal, onManualEntry, onClose }) {
  const [servingSize, setServingSize] = useState(1.0);
  const [selectedMealType, setSelectedMealType] = useState("Breakfast");
  const mealTypes = ["Breakfast", "Lunch", "Dinner", "Snack"];

  const base = foodData?.nutrition || { calories: 0, fat: 0, carbs: 0, protein: 0 };

  const adj = useMemo(
    () => ({
      calories: Math.round((base.calories || 0) * servingSize),
      fat: ((base.fat || 0) * servingSize).toFixed(1),
      carbs: ((base.carbs || 0) * servingSize).toFixed(1),
      protein: ((base.protein || 0) * servingSize).toFixed(1),
    }),
    [base, servingSize]
  );

  return (
    <View style={{ paddingBottom: 18 }}>
      {/* Handle bar + header */}
      <View style={{ alignItems: "center", paddingTop: 8 }}>
        <View style={{ width: 48, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb" }} />
      </View>

      <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Food Analysis</Text>
        <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
          <Ionicons name="close" size={20} color="#64748b" />
        </TouchableOpacity>
      </View>

      {/* Identification card */}
      <View
        style={{
          marginHorizontal: 16,
          backgroundColor: "#ecfdf5",
          borderColor: "#a7f3d0",
          borderWidth: 1,
          borderRadius: 12,
          padding: 12,
        }}
      >
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <Ionicons name="checkmark-circle" size={22} color={SUCCESS} />
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#065f46" }}>{foodData?.name}</Text>
        </View>
        <Text style={{ color: "#065f46", marginTop: 6 }}>
          Confidence: <Text style={{ fontWeight: "700" }}>{foodData?.confidence}%</Text>
        </Text>
      </View>

      {/* Optional captured image + stats */}
      <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 14 }}>
        {imageUri ? (
          <Image source={{ uri: imageUri }} style={{ width: 110, height: 110, borderRadius: 12 }} />
        ) : (
          <View style={{ width: 110, height: 110, borderRadius: 12, backgroundColor: "#e5e7eb" }} />
        )}
        <View style={{ flex: 1, justifyContent: "space-between" }}>
          <MacroStat label="Calories" value={`${adj.calories}`} suffix="kcal" tint={INFO} />
          <View style={{ height: 8 }} />
          <View style={{ flexDirection: "row", gap: 8 }}>
            <MacroStat label="Fat" value={`${adj.fat}`} suffix="g" tint={WARNING} flex />
            <MacroStat label="Carbs" value={`${adj.carbs}`} suffix="g" tint={INFO} flex />
            <MacroStat label="Protein" value={`${adj.protein}`} suffix="g" tint={SUCCESS} flex />
          </View>
        </View>
      </View>

      {/* Serving size */}
      <View style={{ marginTop: 16, marginHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Serving Size</Text>
        <View
          style={{
            marginTop: 8,
            backgroundColor: "#fff",
            borderColor: "#e5e7eb",
            borderWidth: 1,
            borderRadius: 12,
            paddingVertical: 10,
            paddingHorizontal: 12,
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#111827" }}>{servingSize.toFixed(1)} serving(s)</Text>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
            <TouchableOpacity
              onPress={() => setServingSize((s) => Math.max(0.5, +(s - 0.5).toFixed(1)))}
              style={[styles.roundBtn, { backgroundColor: "#f1f5f9", borderColor: "#e2e8f0" }]}
            >
              <Ionicons name="remove" size={18} color="#111827" />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setServingSize((s) => Math.min(5.0, +(s + 0.5).toFixed(1)))}
              style={[styles.roundBtn, { backgroundColor: SUCCESS }]}
            >
              <Ionicons name="add" size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add to meal */}
      <View style={{ marginTop: 16, marginHorizontal: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Add to Meal</Text>
        <View style={{ marginTop: 8, backgroundColor: "#fff", borderColor: "#e5e7eb", borderWidth: 1, borderRadius: 12, paddingHorizontal: 8 }}>
          <Picker selectedValue={selectedMealType} onValueChange={(v) => setSelectedMealType(v)} dropdownIconColor="#64748b" style={{ color: "#111827" }}>
            {["Breakfast", "Lunch", "Dinner", "Snack"].map((t) => (
              <Picker.Item key={t} label={t} value={t} />
            ))}
          </Picker>
        </View>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 16 }}>
        <TouchableOpacity onPress={onManualEntry} style={[styles.secondaryBtn, { flex: 1 }]}>
          <Text style={styles.secondaryBtnText}>Manual Entry</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onAddToMeal} style={[styles.primaryBtn, { flex: 2 }]}>
          <Text style={styles.primaryBtnText}>Add to {selectedMealType}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function MacroStat({ label, value, suffix, tint = "#111827", flex }) {
  return (
    <View
      style={{
        flex: flex ? 1 : undefined,
        borderWidth: 1,
        borderColor: "#e5e7eb",
        backgroundColor: "#fff",
        padding: 8,
        borderRadius: 12,
        alignItems: "center",
      }}
    >
      <Text style={{ color: "#6b7280", fontSize: 12 }}>{label}</Text>
      <Text style={{ color: "#111827", fontSize: 16, fontWeight: "700" }}>
        {value}
        {suffix ? <Text style={{ color: "#6b7280", fontSize: 12 }}> {suffix}</Text> : null}
      </Text>
    </View>
  );
}

/* ============================== BottomSheet & Toast ============================== */

function BottomSheet({ visible, onClose, children }) {
  const translateY = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(translateY, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
        easing: Easing.out(Easing.cubic),
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: height,
        duration: 220,
        useNativeDriver: true,
        easing: Easing.in(Easing.cubic),
      }).start();
    }
  }, [visible]);

  return (
    <Modal transparent visible={visible} onRequestClose={onClose}>
      <View style={styles.sheetOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <Animated.View style={[styles.sheetCard, { transform: [{ translateY }] }]}>
          {children}
        </Animated.View>
      </View>
    </Modal>
  );
}

function Toast({ data, onHide }) {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!data) return;
    Animated.timing(anim, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    const id = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(({ finished }) => finished && onHide());
    }, 2200);
    return () => clearTimeout(id);
  }, [data]);

  if (!data) return null;
  const bg = data.type === "success" ? "#059669" : data.type === "error" ? "#dc2626" : "#111827";

  return (
    <Animated.View
      pointerEvents="none"
      style={{
        position: "absolute",
        bottom: 28,
        alignSelf: "center",
        backgroundColor: bg,
        paddingHorizontal: 14,
        paddingVertical: 10,
        borderRadius: 12,
        transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) }],
        opacity: anim,
      }}
    >
      <Text style={{ color: "#fff" }}>{data.msg}</Text>
    </Animated.View>
  );
}

/* ================================== Utils ================================== */
function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

/* ================================== Styles ================================= */
const styles = StyleSheet.create({
  fill: { flex: 1 },
  center: { alignItems: "center", justifyContent: "center" },

  roundBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.35)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },

  reticleBox: {
    width: width * 0.6,
    height: width * 0.6,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: SUCCESS,
  },
  corner: {
    position: "absolute",
    width: width * 0.13,
    height: width * 0.13,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderColor: "transparent",
    borderRadius: 12,
  },

  galleryBtn: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },

  sheetOverlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.4)" },
  sheetCard: { backgroundColor: "#fff", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingBottom: 18 },

  btn: {
    backgroundColor: "#1f2a44",
    borderColor: "#22314f",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  btnText: { color: TEXT, fontWeight: "700" },

  primaryBtn: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    backgroundColor: "#111827",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  primaryBtnText: { color: "#fff", fontWeight: "700" },
  secondaryBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    justifyContent: "center",
  },
  secondaryBtnText: { color: "#111827", fontWeight: "700" },
});