// App.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Platform, StatusBar, View } from "react-native";
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, onSnapshot } from "firebase/firestore";
import { firebaseAuth, db } from "./src/lib/firebaseApp";

/* --- Auth (user) --- */
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";

/* --- Coach Auth & setup --- */
import VerifyPhoneScreen from "./src/screens/VerifyPhoneScreen";
import CoachSignInScreen from "./src/screens/CoachSignInScreen";
import CoachSignUpScreen from "./src/screens/CoachSignUpScreen";
import CoachEmailVerification from "./src/screens/CoachEmailVerification";
import CoachVerificationScreen from "./src/screens/CoachOnboardingWizardScreen";

/* --- Coach app --- */
import CoachDashboardScreen from "./src/screens/CoachDashboardScreen";
import CoachClientsScreen from "./src/screens/CoachClientsScreen";
import CoachClientProfile from "./src/screens/CoachClientProfile";
import CoachClientMessaging from "./src/screens/CoachClientMessaging";
import WorkoutNutritionPlansScreen from "./src/screens/WorkoutNutritionPlansScreen";
import WorkoutPlanBuilderScreen from "./src/screens/WorkoutPlanBuilderScreen";
import NutritionPlanBuilderScreen from "./src/screens/NutritionPlanBuilderScreen";
import UpdateCoachClientProfile from "./src/screens/UpdateCoachClientProfile";

/* --- User app --- */
import Onboarding from "./src/screens/OnboardingWizard";
import HomeScreen from "./src/screens/HomeScreen";
import GymDiscoveryScreen from "./src/screens/GymDiscoveryScreen";
import CoachMarketPlaceScreen from "./src/screens/CoachMarketPlaceScreen";
import FoodScanningScreen from "./src/screens/FoodScanningScreen";
import FoodConfirmationScreen from "./src/screens/FoodConfirmationScreen";
import FoodDetailsScreen from "./src/screens/FoodDetailsScreen";
import ExerciseRecommendationsScreen from "./src/screens/ExerciseRecommendationsScreen";
import CoachMessagesScreen from "./src/screens/CoachMessagesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import HealthyDishesScreen from "./src/screens/HealthyDishes";
import BMIScreen from "./src/screens/BMI";
import ChatListScreen from "./src/screens/ChatListScreen";
import ChatScreen from "./src/screens/ChatScreen";
import CoachesListScreen from "./src/screens/CoachesListScreen";
import DiscoverScreen from "./src/screens/DiscoverScreen";
import FitnessNewsScreen from "./src/screens/FitnessNewsScreen";
import NearbyGymsScreenUser from "./src/screens/NearbyGymsScreen";
import HealthyHabitsScreen from "./src/screens/HealthyHabitsScreen";
import WorkoutsScreen from "./src/screens/WorkoutsScreen";
import SleepScreen from "./src/screens/SleepScreen";
import ExerciseDetailScreen from "./src/screens/ExerciseDetailScreen";
import ArticleDetailScreen from "./src/screens/ArticleDetailScreen";

/* ─────────────────────────────────────────────────────────── */

const Stack = createNativeStackNavigator();
const Root = createNativeStackNavigator();
const navigationRef = createNavigationContainerRef();

/* Loading */
function LoadingScreen() {
  return (
    <SafeAreaProvider>
      <View
        style={{
          flex: 1,
          backgroundColor: "#0b1220",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <StatusBar barStyle="light-content" backgroundColor="#0b1220" />
        <ActivityIndicator color="#10B981" size="large" />
      </View>
    </SafeAreaProvider>
  );
}

/* Auth stack */
function AuthStack({ initialRouteName = "SignIn" }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
      screenOptions={{
        headerShown: false,
        animation: Platform.OS === "ios" ? "slide_from_right" : "fade_from_bottom",
        animationDuration: 200,
      }}
    >
      {/* User auth */}
      <Stack.Screen name="SignIn" component={SignInScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
      <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />

      {/* Coach pre-auth / wizard */}
      <Stack.Screen name="VerifyPhone" component={VerifyPhoneScreen} />
      <Stack.Screen name="CoachSignIn" component={CoachSignInScreen} />
      <Stack.Screen name="CoachSignUp" component={CoachSignUpScreen} />
      <Stack.Screen name="CoachVerify" component={CoachVerificationScreen} />
      <Stack.Screen name="CoachEmail" component={CoachEmailVerification} />
    </Stack.Navigator>
  );
}

/* Onboarding */
function OnboardingStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 200 }}
    >
      <Stack.Screen name="Onboarding" component={Onboarding} />
    </Stack.Navigator>
  );
}

/* User app */
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
      <Stack.Screen
        name="GymDiscovery"
        component={GymDiscoveryScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="CoachMarket" component={CoachMarketPlaceScreen} />
      <Stack.Screen
        name="FoodScanning"
        component={FoodScanningScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="FoodConfirmation" component={FoodConfirmationScreen} />
      <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
      <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
      <Stack.Screen name="CoachMessages" component={CoachMessagesScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CoachesListScreen" component={CoachesListScreen} />
      <Stack.Screen name="BMI" component={BMIScreen} />
      <Stack.Screen name="HealthyDishes" component={HealthyDishesScreen} />
      <Stack.Screen name="More" component={SettingsScreen} />
      <Stack.Screen
        name="Discover"
        component={DiscoverScreen}
        options={{
          headerShown: true,
          title: "Discover",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="FitnessNews"
        component={FitnessNewsScreen}
        options={{
          headerShown: true,
          title: "Fitness News",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="NearbyGyms"
        component={NearbyGymsScreenUser}
        options={{
          headerShown: true,
          title: "Nearby Gyms",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="HealthyHabits"
        component={HealthyHabitsScreen}
        options={{
          headerShown: true,
          title: "Healthy Habits",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="Workouts"
        component={WorkoutsScreen}
        options={{
          headerShown: true,
          title: "Workouts",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="Sleep"
        component={SleepScreen}
        options={{
          headerShown: true,
          title: "Sleep",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen
        name="ExerciseDetails"
        component={ExerciseDetailScreen}
        options={{
          headerShown: true,
          title: "Exercise Details",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen name="ArticleDetail" component={ArticleDetailScreen} />
    </Stack.Navigator>
  );
}

/* Coach app */
function CoachStack() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 200 }}
    >
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
      <Stack.Screen name="CoachClients" component={CoachClientsScreen} />
      <Stack.Screen name="CoachClientProfile" component={CoachClientProfile} />
      <Stack.Screen name="ClientMessaging" component={CoachClientMessaging} />
      <Stack.Screen name="WorkoutNutritionPlans" component={WorkoutNutritionPlansScreen} />
      <Stack.Screen name="WorkoutPlanBuilder" component={WorkoutPlanBuilderScreen} />
      <Stack.Screen name="NutritionPlanBuilder" component={NutritionPlanBuilderScreen} />
      <Stack.Screen name="UpdateCoachClientProfile" component={UpdateCoachClientProfile} />
      <Stack.Screen name="CoachSettings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

/* Root navigator that is ALWAYS mounted */
function RootNavigator({ authInitial = "SignIn" }) {
  return (
    <Root.Navigator screenOptions={{ headerShown: false }}>
      <Root.Screen
        name="AuthRoot"
        children={() => <AuthStack initialRouteName={authInitial} />}
      />
      <Root.Screen name="OnboardingRoot" component={OnboardingStack} />
      <Root.Screen name="MainRoot" component={MainStack} />
      <Root.Screen name="CoachRoot" component={CoachStack} />
    </Root.Navigator>
  );
}

/* Root */
export default function App() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState(null); // "auth" | "onboarding" | "main" | "coach"
  const [coachProfile, setCoachProfile] = useState(null);
  const [authGateTarget, setAuthGateTarget] = useState("SignIn");
  const [navReady, setNavReady] = useState(false);

  const navTheme = useMemo(
    () => ({ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#0b1220" } }),
    []
  );

  useEffect(() => {
    let unsubUser, unsubCoach;
    const stopAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      unsubUser?.();
      unsubCoach?.();
      unsubUser = undefined;
      unsubCoach = undefined;

      if (!user) {
        setAuthGateTarget("SignIn");
        setRoute("auth");
        setCoachProfile(null);
        setBooting(false);
        return;
      }

      setBooting(true);
      const uid = user.uid;
      const userRef = doc(db, "users", uid);
      const coachRef = doc(db, "coaches", uid);

      try {
        const userSnap = await getDoc(userRef);
        if (!userSnap.exists()) {
          setAuthGateTarget("SignIn");
          setRoute("auth");
          setBooting(false);
          return;
        }

        const userData = userSnap.data() || {};
        const role = userData.role;

        if (role === "coach") {
          const needsVerify =
            !userData.coachOnboardingComplete ||
            !userData.phoneVerified ||
            !userData.coachEmailVerified;

          if (needsVerify) {
            setAuthGateTarget("CoachVerify");
            setRoute("auth");
          } else {
            setRoute("coach");
          }
        } else if (role === "user") {
          setRoute(userData.onboardingComplete ? "main" : "onboarding");
        } else {
          setAuthGateTarget("SignIn");
          setRoute("auth");
        }

        // live listeners
        unsubUser = onSnapshot(userRef, (snap) => {
          const data = snap.data() || {};
          const userRole = data.role;
          if (userRole === "coach") {
            const needsVerify =
              !data.coachOnboardingComplete ||
              !data.phoneVerified ||
              !data.coachEmailVerified;
            if (needsVerify) {
              setAuthGateTarget("CoachVerify");
              setRoute("auth");
            } else {
              setRoute("coach");
            }
          } else if (userRole === "user") {
            setRoute(data.onboardingComplete ? "main" : "onboarding");
          }
        });

        unsubCoach = onSnapshot(coachRef, (snap) => {
          setCoachProfile(snap.data() || null);
        });
      } catch (error) {
        console.warn("Auth route error:", error);
        setAuthGateTarget("SignIn");
        setRoute("auth");
      } finally {
        setBooting(false);
      }
    });

    return () => {
      unsubUser?.();
      unsubCoach?.();
      stopAuth();
    };
  }, []);

  // When nav is ready or route changes, reset to the right root
  useEffect(() => {
    if (!navReady || !route || booting) return;
    const map = {
      auth: "AuthRoot",
      onboarding: "OnboardingRoot",
      main: "MainRoot",
      coach: "CoachRoot",
    };
    const target = map[route];
    if (navigationRef.isReady() && target) {
      navigationRef.reset({ index: 0, routes: [{ name: target }] });
    }
  }, [navReady, route, booting]);

  if (booting || !route) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor="#0b1220"
        translucent={Platform.OS === "android"}
      />
      <NavigationContainer
        ref={navigationRef}
        theme={navTheme}
        onReady={() => setNavReady(true)}
      >
        <RootNavigator authInitial={authGateTarget} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
