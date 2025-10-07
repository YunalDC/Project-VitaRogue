// src/screens/FoodScanningScreen.js
// Compatible with Expo SDK 54 & expo-camera v17
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
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { Picker } from "@react-native-picker/picker";
import { saveFoodEntry } from "../utils/foodStorage";

const { width, height } = Dimensions.get("window");

// Theme
const BG = "#0B1220";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";
const INFO = "#0ea5e9";
const WARNING = "#f59e0b";
const ERROR = "#ef4444";

// Gemini API Configuration
const GEMINI_API_KEY = "AIzaSyBYk-O6RFxd5zZfGXaTXnXoiE-r1htaNgQ";

// Use the latest available models from your API key
const GEMINI_VISION_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
const GEMINI_TEXT_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Test if API key is valid
const testAPIKey = async () => {
  try {
    console.log("Testing API connection...");
    
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Say hello in one word" }] }]
        })
      }
    );
    
    console.log("API Test Status:", response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log("API Test Response:", data.candidates?.[0]?.content?.parts?.[0]?.text);
      console.log("✅ API connection successful - using Gemini 2.5 Flash");
      return true;
    } else {
      const errorData = await response.json();
      console.error("API Test Failed:", errorData);
      return false;
    }
  } catch (error) {
    console.error("API Key Test Failed:", error);
    return false;
  }
};

export default function FoodScanningScreen({ navigation }) {
  // Scan mode selection
  const [scanOptionsVisible, setScanOptionsVisible] = useState(true);
  const [scanMode, setScanMode] = useState(null); // 'camera' or 'manual'

  // Camera permissions (expo-camera v17 way)
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [isReady, setIsReady] = useState(false);
  const [flashOn, setFlashOn] = useState(false);

  // Flow
  const [isScanning, setIsScanning] = useState(false);
  const [capturedUri, setCapturedUri] = useState("");
  const [scanningMessage, setScanningMessage] = useState("Analyzing food...");

  // Bottom sheet & result
  const [sheetOpen, setSheetOpen] = useState(false);
  const [resultFood, setResultFood] = useState(null);

  // Manual entry
  const [manualEntryVisible, setManualEntryVisible] = useState(false);
  const [manualFoodName, setManualFoodName] = useState("");
  const [manualPortion, setManualPortion] = useState("100");
  const [manualUnit, setManualUnit] = useState("g");

  // Toast
  const [toast, setToast] = useState(null);

  // Request permissions on mount
  useEffect(() => {
    if (!permission) return;
    if (!permission.granted) {
      requestPermission();
    }
  }, [permission]);

  // Test API key on mount
  useEffect(() => {
    testAPIKey().then(isValid => {
      if (!isValid) {
        console.error("⚠️ API Key validation failed!");
        setToast({ type: "error", msg: "API connection issue detected" });
      } else {
        console.log("✅ API Key is valid");
      }
    });
  }, []);

  // API Functions
  const analyzeImageWithGemini = async (imageUri) => {
    try {
      console.log("Starting image analysis...");
      
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64data = reader.result.split(',')[1];
          resolve(base64data);
        };
        reader.readAsDataURL(blob);
      });

      console.log("Image converted to base64");

      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Analyze this food image and provide detailed nutritional information. 
                
                Response format (JSON only, no markdown):
                {
                  "recognized": true/false,
                  "foodName": "name of the food",
                  "confidence": 0-100 (percentage),
                  "servingSize": "estimated portion size",
                  "servingSizeGrams": number,
                  "nutrition": {
                    "calories": number,
                    "protein": number,
                    "fat": number,
                    "carbs": number,
                    "fiber": number,
                    "sugar": number,
                    "sodium": number
                  },
                  "allergens": ["list of common allergens"],
                  "healthBenefits": ["list of 3 health benefits"]
                }
                
                If you cannot clearly identify the food or if it's not food, set recognized to false and confidence to 0.`
              },
              {
                inline_data: {
                  mime_type: "image/jpeg",
                  data: base64
                }
              }
            ]
          }
        ]
      };

      console.log("Sending request to Gemini Vision API...");

      const apiResponse = await fetch(GEMINI_VISION_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("API Response status:", apiResponse.status);

      const data = await apiResponse.json();
      console.log("API Response:", JSON.stringify(data, null, 2));
      
      if (!data.candidates || !data.candidates[0]) {
        console.error("No candidates in response:", data);
        throw new Error("No response from Gemini API");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("Text response:", textResponse);
      
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.error("Could not find JSON in response:", textResponse);
        throw new Error("Could not parse API response");
      }
      
      const foodData = JSON.parse(jsonMatch[0]);
      console.log("Parsed food data:", foodData);
      
      return foodData;
    } catch (error) {
      console.error("Gemini API Error:", error);
      console.error("Error details:", error.message);
      throw error;
    }
  };

  const getNutritionByName = async (foodName, portion, unit) => {
    try {
      console.log("Looking up nutrition for:", foodName, portion, unit);
      
      const requestBody = {
        contents: [
          {
            parts: [
              {
                text: `Provide detailed nutritional information for "${foodName}" with portion size of ${portion}${unit}.
                
                Response format (JSON only, no markdown):
                {
                  "recognized": true/false,
                  "foodName": "standardized name",
                  "confidence": 0-100,
                  "servingSize": "${portion}${unit}",
                  "servingSizeGrams": number (convert to grams),
                  "nutrition": {
                    "calories": number,
                    "protein": number,
                    "fat": number,
                    "carbs": number,
                    "fiber": number,
                    "sugar": number,
                    "sodium": number
                  },
                  "allergens": ["list"],
                  "healthBenefits": ["list of 3 benefits"]
                }
                
                If this is not a real food item, set recognized to false.`
              }
            ]
          }
        ]
      };

      console.log("Sending manual lookup request...");

      const response = await fetch(GEMINI_TEXT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      console.log("Manual lookup response status:", response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error("API Error Response:", errorText);
        throw new Error(`API returned ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log("Manual lookup response:", JSON.stringify(data, null, 2));
      
      if (!data.candidates || !data.candidates[0]) {
        console.error("No candidates in manual lookup:", data);
        throw new Error("No response from API");
      }

      const textResponse = data.candidates[0].content.parts[0].text;
      console.log("Manual lookup text:", textResponse);
      
      const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
      
      if (!jsonMatch) {
        console.error("Could not find JSON in manual lookup response");
        throw new Error("Could not parse API response");
      }
      
      const parsedData = JSON.parse(jsonMatch[0]);
      console.log("Parsed manual data:", parsedData);
      
      return parsedData;
    } catch (error) {
      console.error("Nutrition API Error:", error);
      console.error("Error type:", error.constructor.name);
      console.error("Error message:", error.message);
      throw error;
    }
  };

  // Actions
  const toggleFlash = useCallback(() => setFlashOn((v) => !v), []);

  const handleScanModeSelect = (mode) => {
    setScanMode(mode);
    setScanOptionsVisible(false);
    
    if (mode === "manual") {
      setManualEntryVisible(true);
    }
  };

  const capturePhoto = useCallback(async () => {
    try {
      if (!cameraRef.current) return;
      setIsScanning(true);
      setScanningMessage("Capturing image...");
      
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      setCapturedUri(photo?.uri || "");
      setScanningMessage("Analyzing food with AI...");
      
      const foodData = await analyzeImageWithGemini(photo.uri);
      
      if (!foodData.recognized || foodData.confidence < 30) {
        setIsScanning(false);
        Alert.alert(
          "Food Not Recognized",
          "We couldn't identify the food in this image. Would you like to enter it manually?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Manual Entry",
              onPress: () => {
                setManualEntryVisible(true);
              },
            },
          ]
        );
        return;
      }
      
      setResultFood(foodData);
      setSheetOpen(true);
    } catch (error) {
      setToast({ type: "error", msg: "Failed to analyze food. Please try again." });
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const pickFromGallery = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        setToast({ type: "info", msg: "Allow photo library access to pick an image." });
        return;
      }
      
      setIsScanning(true);
      setScanningMessage("Loading image...");
      
      const res = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });
      
      if (!res.canceled && res.assets?.length) {
        setCapturedUri(res.assets[0].uri);
        setScanningMessage("Analyzing food with AI...");
        
        const foodData = await analyzeImageWithGemini(res.assets[0].uri);
        
        if (!foodData.recognized || foodData.confidence < 30) {
          setIsScanning(false);
          Alert.alert(
            "Food Not Recognized",
            "We couldn't identify the food in this image. Would you like to enter it manually?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Manual Entry",
                onPress: () => setManualEntryVisible(true),
              },
            ]
          );
          return;
        }
        
        setResultFood(foodData);
        setSheetOpen(true);
      }
    } catch (error) {
      setToast({ type: "error", msg: "Failed to analyze image." });
      console.error(error);
    } finally {
      setIsScanning(false);
    }
  }, []);

  const handleManualSubmit = async () => {
    if (!manualFoodName.trim()) {
      setToast({ type: "error", msg: "Please enter a food name" });
      return;
    }
    
    if (!manualPortion || isNaN(Number(manualPortion))) {
      setToast({ type: "error", msg: "Please enter a valid portion size" });
      return;
    }
    
    setManualEntryVisible(false);
    setIsScanning(true);
    setScanningMessage("Looking up nutrition data...");
    
    try {
      console.log("Manual submit:", manualFoodName, manualPortion, manualUnit);
      
      const foodData = await getNutritionByName(
        manualFoodName,
        manualPortion,
        manualUnit
      );
      
      console.log("Got food data:", foodData);
      
      if (!foodData || !foodData.recognized) {
        setIsScanning(false);
        Alert.alert(
          "Food Not Found",
          "Could not find nutritional information for this food. Please check the spelling or try a different name.",
          [
            { text: "OK", onPress: () => {
              setManualEntryVisible(true);
            }}
          ]
        );
        return;
      }
      
      setResultFood(foodData);
      setSheetOpen(true);
      setManualFoodName("");
      setManualPortion("100");
    } catch (error) {
      console.error("Manual submit error:", error);
      setToast({ type: "error", msg: `Failed: ${error.message}` });
      setManualEntryVisible(true);
    } finally {
      setIsScanning(false);
    }
  };

  const onAddToMeal = useCallback(() => {
    // This will be called from NutritionResultsSheet
    // Data is saved there with the meal type and serving size
    setSheetOpen(false);
    setScanMode(null);
    setToast({ type: "success", msg: "Food added to meal successfully!" });
    setScanOptionsVisible(true);
  }, []);

  // Renders
  if (!permission) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: BG }]}>
        <ActivityIndicator color="#38bdf8" />
        <Text style={{ color: TEXT, marginTop: 10 }}>Requesting camera permission…</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={[styles.fill, styles.center, { backgroundColor: BG }]}>
        <Text style={{ color: TEXT, paddingHorizontal: 24, textAlign: "center", marginBottom: 16 }}>
          Camera permission not granted. You can still add foods manually.
        </Text>
        <TouchableOpacity
          style={[styles.btn, { marginBottom: 12 }]}
          onPress={requestPermission}
        >
          <Text style={styles.btnText}>Grant Permission</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.btn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.btnText}>Go back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.fill, { backgroundColor: BG }]}>
      {/* Camera Preview */}
      {scanMode === "camera" && (
        <View style={StyleSheet.absoluteFill}>
          <CameraView
            ref={cameraRef}
            style={StyleSheet.absoluteFill}
            facing="back"
            enableTorch={flashOn}
            onCameraReady={() => setIsReady(true)}
          />
        </View>
      )}

      {/* Overlay */}
      {scanMode === "camera" && (
        <CameraOverlayWidget
          onFlashToggle={toggleFlash}
          onBackPressed={() => {
            setScanMode(null);
            setScanOptionsVisible(true);
          }}
          isFlashOn={flashOn}
          showFlash={Platform.OS !== "web"}
        />
      )}

      {/* Scan button for camera mode */}
      {scanMode === "camera" && isReady && (
        <>
          <ScanButtonWidget onPress={capturePhoto} isScanning={isScanning} />
          <View style={{ position: "absolute", right: 16, bottom: 140 }}>
            <TouchableOpacity style={styles.galleryBtn} onPress={pickFromGallery}>
              <Ionicons name="images-outline" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Scan Options Modal */}
      <ScanOptionsModal
        visible={scanOptionsVisible}
        onClose={() => {
          setScanOptionsVisible(false);
          navigation.goBack();
        }}
        onSelectMode={handleScanModeSelect}
      />

      {/* Manual Entry Modal */}
      <ManualEntryModal
        visible={manualEntryVisible}
        onClose={() => {
          setManualEntryVisible(false);
          setScanOptionsVisible(true);
        }}
        foodName={manualFoodName}
        setFoodName={setManualFoodName}
        portion={manualPortion}
        setPortion={setManualPortion}
        unit={manualUnit}
        setUnit={setManualUnit}
        onSubmit={handleManualSubmit}
      />

      {/* Scanning overlay */}
      <Modal transparent visible={isScanning} animationType="fade">
        <View style={[styles.fill, styles.center, { backgroundColor: "rgba(0,0,0,0.85)" }]}>
          <ActivityIndicator size="large" color={INFO} />
          <Text style={{ color: "#fff", marginTop: 16, fontWeight: "700", fontSize: 16 }}>
            {scanningMessage}
          </Text>
          <Text style={{ color: "#cbd5e1", marginTop: 6, textAlign: "center", paddingHorizontal: 32 }}>
            This may take a few moments
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

function ScanOptionsModal({ visible, onClose, onSelectMode }) {
  const slideAnim = useRef(new Animated.Value(height)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        friction: 9,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  const options = [
    {
      id: "camera",
      icon: "camera",
      title: "Scan Food",
      subtitle: "Take a photo of your food",
      color: SUCCESS,
    },
    {
      id: "manual",
      icon: "create",
      title: "Manual Entry",
      subtitle: "Type food name and portion",
      color: WARNING,
    },
  ];

  return (
    <Modal transparent visible={visible} animationType="fade">
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <Animated.View
          style={[
            styles.scanOptionsCard,
            { transform: [{ translateY: slideAnim }] },
          ]}
        >
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View style={styles.handleBar} />
          </View>

          <View style={{ paddingHorizontal: 20, paddingBottom: 8 }}>
            <Text style={styles.modalTitle}>How would you like to add food?</Text>
            <Text style={styles.modalSubtitle}>
              Choose your preferred method to track nutrition
            </Text>
          </View>

          <View style={{ paddingHorizontal: 16, paddingBottom: 20 }}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.scanOption}
                onPress={() => onSelectMode(option.id)}
                activeOpacity={0.7}
              >
                <View style={[styles.scanOptionIcon, { backgroundColor: option.color + "20" }]}>
                  <Ionicons name={option.icon} size={28} color={option.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.scanOptionTitle}>{option.title}</Text>
                  <Text style={styles.scanOptionSubtitle}>{option.subtitle}</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={MUTED} />
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Modal>
  );
}

function ManualEntryModal({
  visible,
  onClose,
  foodName,
  setFoodName,
  portion,
  setPortion,
  unit,
  setUnit,
  onSubmit,
}) {
  return (
    <Modal transparent visible={visible} animationType="slide">
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.modalOverlay}
      >
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.manualEntryCard}>
          <View style={{ alignItems: "center", paddingTop: 12, paddingBottom: 8 }}>
            <View style={styles.handleBar} />
          </View>

          <View style={{ padding: 20 }}>
            <Text style={styles.modalTitle}>Manual Food Entry</Text>
            <Text style={styles.modalSubtitle}>
              Enter food details to get nutrition information
            </Text>

            <View style={{ marginTop: 20 }}>
              <Text style={styles.inputLabel}>Food Name</Text>
              <TextInput
                style={styles.textInput}
                value={foodName}
                onChangeText={setFoodName}
                placeholder="e.g., Grilled Chicken Breast"
                placeholderTextColor={MUTED}
              />
            </View>

            <View style={{ marginTop: 16, flexDirection: "row", gap: 12 }}>
              <View style={{ flex: 2 }}>
                <Text style={styles.inputLabel}>Portion Size</Text>
                <TextInput
                  style={styles.textInput}
                  value={portion}
                  onChangeText={setPortion}
                  placeholder="100"
                  keyboardType="numeric"
                  placeholderTextColor={MUTED}
                />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.inputLabel}>Unit</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={unit}
                    onValueChange={setUnit}
                    style={styles.picker}
                    dropdownIconColor={TEXT}
                  >
                    <Picker.Item label="g" value="g" />
                    <Picker.Item label="oz" value="oz" />
                    <Picker.Item label="cup" value="cup" />
                    <Picker.Item label="tbsp" value="tbsp" />
                    <Picker.Item label="piece" value="piece" />
                  </Picker>
                </View>
              </View>
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={onSubmit}>
              <Ionicons name="search" size={20} color="#fff" />
              <Text style={styles.submitButtonText}>Get Nutrition Info</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.cancelButtonAlt} onPress={onClose}>
              <Text style={styles.cancelButtonTextAlt}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CameraOverlayWidget({ onFlashToggle, onBackPressed, isFlashOn, showFlash }) {
  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
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
            <TouchableOpacity onPress={onBackPressed} style={styles.roundBtn}>
              <Ionicons name="arrow-back" size={20} color="#fff" />
            </TouchableOpacity>
            {showFlash && (
              <TouchableOpacity onPress={onFlashToggle} style={styles.roundBtn}>
                <Ionicons
                  name={isFlashOn ? "flash" : "flash-off"}
                  size={20}
                  color={isFlashOn ? SUCCESS : "#fff"}
                />
              </TouchableOpacity>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} pointerEvents="none">
        <View style={styles.reticleBox}>
          <View style={[styles.corner, { top: -2, left: -2, borderTopColor: SUCCESS, borderLeftColor: SUCCESS }]} />
          <View style={[styles.corner, { top: -2, right: -2, borderTopColor: SUCCESS, borderRightColor: SUCCESS }]} />
          <View style={[styles.corner, { bottom: -2, left: -2, borderBottomColor: SUCCESS, borderLeftColor: SUCCESS }]} />
          <View style={[styles.corner, { bottom: -2, right: -2, borderBottomColor: SUCCESS, borderRightColor: SUCCESS }]} />
        </View>
      </View>

      <View
        style={{ position: "absolute", top: height * 0.7, left: 0, right: 0, alignItems: "center" }}
        pointerEvents="none"
      >
        <View style={styles.instructionPill}>
          <Text style={{ color: TEXT, fontWeight: "600" }}>Position food within the frame</Text>
        </View>
      </View>
    </View>
  );
}

function ScanButtonWidget({ onPress, isScanning }) {
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (isScanning) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, {
            toValue: 1.2,
            duration: 750,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
          Animated.timing(pulse, {
            toValue: 1.0,
            duration: 750,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.ease),
          }),
        ])
      ).start();
    } else {
      pulse.stopAnimation();
      pulse.setValue(1);
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
              onPress={onPress}
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
            {isScanning ? "Analyzing..." : "Tap to Scan"}
          </Text>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
}

function NutritionResultsSheet({ foodData, imageUri, onAddToMeal, onClose }) {
  const [servingSize, setServingSize] = useState(1.0);
  const [selectedMealType, setSelectedMealType] = useState("Breakfast");
  const [isSaving, setIsSaving] = useState(false);

  const base = foodData?.nutrition || {};
  const adj = useMemo(
    () => ({
      calories: Math.round((base.calories || 0) * servingSize),
      fat: ((base.fat || 0) * servingSize).toFixed(1),
      carbs: ((base.carbs || 0) * servingSize).toFixed(1),
      protein: ((base.protein || 0) * servingSize).toFixed(1),
      fiber: ((base.fiber || 0) * servingSize).toFixed(1),
      sugar: ((base.sugar || 0) * servingSize).toFixed(1),
      sodium: Math.round((base.sodium || 0) * servingSize),
    }),
    [base, servingSize]
  );

  const handleAddToMeal = async () => {
    setIsSaving(true);
    
    try {
      // Prepare food data with adjusted nutrition
      const dataToSave = {
        foodName: foodData.foodName,
        confidence: foodData.confidence,
        servingSize: servingSize,
        originalServingSize: foodData.servingSize,
        nutrition: {
          calories: parseFloat(adj.calories),
          protein: parseFloat(adj.protein),
          fat: parseFloat(adj.fat),
          carbs: parseFloat(adj.carbs),
          fiber: parseFloat(adj.fiber),
          sugar: parseFloat(adj.sugar),
          sodium: parseFloat(adj.sodium),
        },
        imageUri: imageUri || null,
        allergens: foodData.allergens || [],
        healthBenefits: foodData.healthBenefits || [],
      };
      
      console.log('Saving food entry:', dataToSave, selectedMealType);
      
      const success = await saveFoodEntry(dataToSave, selectedMealType);
      
      if (success) {
        console.log('Food saved successfully!');
        onAddToMeal();
      } else {
        Alert.alert('Error', 'Failed to save food entry. Please try again.');
      }
    } catch (error) {
      console.error('Error saving food:', error);
      Alert.alert('Error', 'Failed to save food entry. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ScrollView style={{ maxHeight: height * 0.8 }}>
      <View style={{ paddingBottom: 18 }}>
        <View style={{ alignItems: "center", paddingTop: 8 }}>
          <View style={styles.handleBar} />
        </View>

        <View style={{ padding: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text style={{ fontSize: 20, fontWeight: "800", color: "#111827" }}>Food Analysis</Text>
          <TouchableOpacity onPress={onClose} style={{ padding: 8 }}>
            <Ionicons name="close" size={20} color="#64748b" />
          </TouchableOpacity>
        </View>

        <View style={[styles.identificationCard, {
          backgroundColor: foodData.confidence >= 70 ? "#ecfdf5" : foodData.confidence >= 50 ? "#fef3c7" : "#fee2e2",
          borderColor: foodData.confidence >= 70 ? "#a7f3d0" : foodData.confidence >= 50 ? "#fcd34d" : "#fecaca",
        }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
            <Ionicons 
              name={foodData.confidence >= 70 ? "checkmark-circle" : foodData.confidence >= 50 ? "alert-circle" : "warning"} 
              size={22} 
              color={foodData.confidence >= 70 ? SUCCESS : foodData.confidence >= 50 ? WARNING : ERROR} 
            />
            <Text style={{ fontSize: 16, fontWeight: "700", color: "#065f46" }}>{foodData?.foodName}</Text>
          </View>
          <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 6 }}>
            <Text style={{ color: "#065f46" }}>
              Confidence: <Text style={{ fontWeight: "700" }}>{foodData?.confidence}%</Text>
            </Text>
            <Text style={{ color: "#065f46", fontSize: 12 }}>
              Serving: {foodData?.servingSize}
            </Text>
          </View>
        </View>

        <View style={{ flexDirection: "row", gap: 12, marginHorizontal: 16, marginTop: 14 }}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={{ width: 110, height: 110, borderRadius: 12 }} />
          ) : (
            <View style={{ width: 110, height: 110, borderRadius: 12, backgroundColor: "#e5e7eb", alignItems: "center", justifyContent: "center" }}>
              <Ionicons name="restaurant" size={40} color="#9ca3af" />
            </View>
          )}
          <View style={{ flex: 1, justifyContent: "space-between" }}>
            <MacroStat label="Calories" value={`${adj.calories}`} suffix="kcal" tint={INFO} />
            <View style={{ height: 8 }} />
            <View style={{ flexDirection: "row", gap: 8 }}>
              <MacroStat label="Protein" value={`${adj.protein}`} suffix="g" tint={SUCCESS} flex />
              <MacroStat label="Carbs" value={`${adj.carbs}`} suffix="g" tint={INFO} flex />
              <MacroStat label="Fat" value={`${adj.fat}`} suffix="g" tint={WARNING} flex />
            </View>
          </View>
        </View>

        <View style={{ marginHorizontal: 16, marginTop: 14 }}>
          <Text style={{ fontSize: 14, fontWeight: "700", color: "#111827", marginBottom: 8 }}>
            Additional Nutrients
          </Text>
          <View style={{ flexDirection: "row", gap: 8 }}>
            <MacroStat label="Fiber" value={`${adj.fiber}`} suffix="g" tint="#8b5cf6" flex />
            <MacroStat label="Sugar" value={`${adj.sugar}`} suffix="g" tint="#ec4899" flex />
            <MacroStat label="Sodium" value={`${adj.sodium}`} suffix="mg" tint="#6366f1" flex />
          </View>
        </View>

        <View style={{ marginTop: 16, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Serving Size</Text>
          <View style={styles.servingSizeControl}>
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

        <View style={{ marginTop: 16, marginHorizontal: 16 }}>
          <Text style={{ fontSize: 16, fontWeight: "700", color: "#111827" }}>Add to Meal</Text>
          <View style={styles.pickerContainerLight}>
            <Picker
              selectedValue={selectedMealType}
              onValueChange={setSelectedMealType}
              dropdownIconColor="#64748b"
              style={{ color: "#111827" }}
            >
              {["Breakfast", "Lunch", "Dinner", "Snack"].map((t) => (
                <Picker.Item key={t} label={t} value={t} />
              ))}
            </Picker>
          </View>
        </View>

        <TouchableOpacity 
          onPress={handleAddToMeal} 
          style={styles.addToMealBtn}
          disabled={isSaving}
        >
          {isSaving ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
              <Text style={styles.addToMealBtnText}>Add to {selectedMealType}</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
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
      Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(
        ({ finished }) => finished && onHide()
      );
    }, 2800);
    return () => clearTimeout(id);
  }, [data]);

  if (!data) return null;
  const bg =
    data.type === "success" ? "#059669" : data.type === "error" ? "#dc2626" : "#111827";

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
        transform: [
          { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [12, 0] }) },
        ],
        opacity: anim,
      }}
    >
      <Text style={{ color: "#fff" }}>{data.msg}</Text>
    </Animated.View>
  );
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
    width: width * 0.65,
    height: width * 0.65,
    borderRadius: 16,
    borderWidth: 3,
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

  instructionPill: {
    backgroundColor: "rgba(17,24,39,0.85)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
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

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.5)",
  },

  scanOptionsCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },

  manualEntryCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: Platform.OS === "ios" ? 34 : 20,
  },

  handleBar: {
    width: 48,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#d1d5db",
  },

  modalTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#111827",
    marginBottom: 6,
  },

  modalSubtitle: {
    fontSize: 14,
    color: "#6b7280",
  },

  scanOption: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 16,
    marginTop: 12,
    gap: 12,
  },

  scanOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  scanOptionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
  },

  scanOptionSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  cancelButton: {
    marginHorizontal: 16,
    marginTop: 8,
    padding: 16,
    alignItems: "center",
  },

  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#6b7280",
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },

  textInput: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: "#111827",
  },

  pickerContainer: {
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 12,
    overflow: "hidden",
  },

  pickerContainerLight: {
    marginTop: 8,
    backgroundColor: "#fff",
    borderColor: "#e5e7eb",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 8,
  },

  picker: {
    color: "#111827",
  },

  submitButton: {
    backgroundColor: SUCCESS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },

  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  cancelButtonAlt: {
    padding: 14,
    alignItems: "center",
    marginTop: 12,
  },

  cancelButtonTextAlt: {
    color: "#6b7280",
    fontSize: 15,
    fontWeight: "600",
  },

  identificationCard: {
    marginHorizontal: 16,
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
  },

  servingSizeControl: {
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
  },

  addToMealBtn: {
    backgroundColor: SUCCESS,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 16,
    marginTop: 20,
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },

  addToMealBtnText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },

  sheetOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.4)",
  },

  sheetCard: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
  },

  btn: {
    backgroundColor: "#1f2a44",
    borderColor: "#22314f",
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },

  btnText: { color: TEXT, fontWeight: "700" },
});