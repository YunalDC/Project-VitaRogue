// App.js
import React, { useEffect, useState, useMemo } from "react";
import { ActivityIndicator, View, StatusBar, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, db } from "./src/lib/firebaseApp";

import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";

// 👇 Coach flow screens
import CoachSignInScreen from "./src/screens/CoachSignInScreen";
import CoachSignUpScreen from "./src/screens/CoachSignUpScreen";
import CoachEmailVerification from "./src/screens/CoachEmailVerification";
import CoachDashboardScreen from "./src/screens/CoachDashboardScreen";

import Onboarding from "./src/screens/OnboardingWizard";
import HomeScreen from "./src/screens/HomeScreen";
import GymDiscoveryScreen from "./src/screens/GymDiscoveryScreen";
import CoachMarketPlaceScreen from "./src/screens/CoachMarketPlaceScreen";
import FoodScanningScreen from "./src/screens/FoodScanningScreen";
import ExerciseRecommendationsScreen from "./src/screens/ExerciseRecommendationsScreen";
import CoachMessagesScreen from "./src/screens/CoachMessagesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";

const Stack = createNativeStackNavigator();

function LoadingScreen() {
  return (
    <SafeAreaProvider>
      <View style={{ flex: 1, backgroundColor: "#0b1220", alignItems: "center", justifyContent: "center" }}>
        <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    </SafeAreaProvider>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* Coach auth routes */}
      <Stack.Screen name="CoachSignIn" component={CoachSignInScreen} />
      <Stack.Screen name="CoachSignUp" component={CoachSignUpScreen} />
      <Stack.Screen name="CoachEmail" component={CoachEmailVerification} />
    </Stack.Navigator>
  );
}

function OnboardingStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 200 }}>
      <Stack.Screen name="Onboarding" component={Onboarding} />
    </Stack.Navigator>
  );
}

function MainStack() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
        animationDuration: 200,
      }}
    >
      <Stack.Screen name="Home" component={HomeScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="GymDiscovery" component={GymDiscoveryScreen} options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="CoachMarket" component={CoachMarketPlaceScreen} />
      <Stack.Screen name="FoodScanning" component={FoodScanningScreen} />
      <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
      <Stack.Screen name="CoachMessages" component={CoachMessagesScreen} />
    </Stack.Navigator>
  );
}

function CoachStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 200 }}>
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState/** @type {"auth" | "onboarding" | "main" | "coach" | null} */(null);

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: { ...DefaultTheme.colors, background: "#0b1220" },
    }),
    []
  );

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
      try {
        if (!user) {
          setRoute("auth");
          return;
        }
        const ref = doc(db, "users", user.uid);
        const snap = await getDoc(ref);

        if (!snap.exists()) {
          await setDoc(ref, { onboardingComplete: false, createdAt: serverTimestamp() });
          setRoute("onboarding");
          return;
        }

        const data = snap.data() || {};
        if (data.role === "coach") {
          setRoute("coach");
          return;
        }

        const onboardingComplete = !!data.onboardingComplete;
        setRoute(onboardingComplete ? "main" : "onboarding");
      } catch {
        setRoute("auth");
      } finally {
        setBooting(false);
      }
    });

    return unsubscribe;
  }, []);

  if (booting || !route) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b1220" translucent={Platform.OS === "android"} />
      <NavigationContainer theme={navTheme}>
        {route === "auth" && <AuthStack />}
        {route === "onboarding" && <OnboardingStack />}
        {route === "main" && <MainStack />}
        {route === "coach" && <CoachStack />}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
