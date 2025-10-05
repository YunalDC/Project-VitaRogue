import React, { useEffect, useState, useMemo } from "react";
import { ActivityIndicator, View, StatusBar, Platform } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp, onSnapshot } from "firebase/firestore";
import { firebaseAuth, db } from "./src/lib/firebaseApp";
import { getAuthInitialRoute, subscribeAuthInitialRoute } from "./src/state/authRoute";

import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";

// Coach flow screens
import CoachSignInScreen from "./src/screens/CoachSignInScreen";
import CoachSignUpScreen from "./src/screens/CoachSignUpScreen";
import CoachEmailVerification from "./src/screens/CoachEmailVerification";
import CoachDashboardScreen from "./src/screens/CoachDashboardScreen";
import UpdateCoachProfileScreen from "./src/screens/UpdateCoachProfileScreen";
import CoachVerificationScreen from "./src/screens/CoachVerificationScreen";

import CoachClientsScreen from "./src/screens/CoachClientsScreen";
import CoachClientProfile from "./src/screens/CoachClientProfile";
import CoachClientMessaging from "./src/screens/CoachClientMessaging";
import WorkoutNutritionPlansScreen from "./src/screens/WorkoutNutritionPlansScreen";
import WorkoutPlanBuilderScreen from "./src/screens/WorkoutPlanBuilderScreen";
import NutritionPlanBuilderScreen from "./src/screens/NutritionPlanBuilderScreen";
import UpdateCoachClientProfile from "./src/screens/UpdateCoachClientProfile";

// User flow screens
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
import MoreScreen from "./src/screens/More";

// Settings sub-screens
import AccountSettings from "./src/screens/settings/AccountSettings";
import NotificationSettings from "./src/screens/settings/NotificationSettings";
import ProfileGoalsSettings from "./src/screens/settings/ProfileGoalsSettings";
import NutritionSettings from "./src/screens/settings/NutritionSettings";
import UnitsDisplaySettings from "./src/screens/settings/UnitsDisplaySettings";
import PrivacyDataSettings from "./src/screens/settings/PrivacyDataSettings";
import SupportSettings from "./src/screens/settings/SupportSettings";
import AboutSettings from "./src/screens/settings/AboutSettings";

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

function AuthStack({ initialRouteName }) {
  return (
    <Stack.Navigator
      initialRouteName={initialRouteName}
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
      <Stack.Screen name="AccountSettings" component={AccountSettings} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettings} />
      <Stack.Screen name="ProfileGoalsSettings" component={ProfileGoalsSettings} />
      <Stack.Screen name="NutritionSettings" component={NutritionSettings} />
      <Stack.Screen name="UnitsDisplaySettings" component={UnitsDisplaySettings} />
      <Stack.Screen name="PrivacyDataSettings" component={PrivacyDataSettings} />
      <Stack.Screen name="SupportSettings" component={SupportSettings} />
      <Stack.Screen name="AboutSettings" component={AboutSettings} />

      <Stack.Screen name="GymDiscovery" component={GymDiscoveryScreen} options={{ animation: "slide_from_bottom" }} />
      <Stack.Screen name="CoachMarket" component={CoachMarketPlaceScreen} />
      <Stack.Screen name="FoodScanning" component={FoodScanningScreen} options={{ headerShown: false, gestureEnabled: false }} />
      <Stack.Screen name="FoodConfirmation" component={FoodConfirmationScreen} />
      <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
      <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
      <Stack.Screen name="CoachMessages" component={CoachMessagesScreen} />
      <Stack.Screen name="ChatList" component={ChatListScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="CoachesListScreen" component={CoachesListScreen} />
      <Stack.Screen name="BMI" component={BMIScreen} />
      <Stack.Screen name="HealthyDishes" component={HealthyDishesScreen} />
      <Stack.Screen name="More" component={MoreScreen} />
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

function CoachStack({ coachProfileComplete, coachProfile }) {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right", animationDuration: 200 }}>
      <Stack.Screen name="CoachDashboard" component={CoachDashboardScreen} />
      <Stack.Screen name="CoachClients" component={CoachClientsScreen} />
      <Stack.Screen name="CoachClientProfile" component={CoachClientProfile} />
      <Stack.Screen name="ClientMessaging" component={CoachClientMessaging} />
      <Stack.Screen name="WorkoutNutritionPlans" component={WorkoutNutritionPlansScreen} />
      <Stack.Screen name="WorkoutPlanBuilder" component={WorkoutPlanBuilderScreen} />
      <Stack.Screen name="NutritionPlanBuilder" component={NutritionPlanBuilderScreen} />
      <Stack.Screen name="UpdateCoachClientProfile" component={UpdateCoachClientProfile} />
      <Stack.Screen 
        name="CoachVerification" 
        component={CoachVerificationScreen}
        options={{
          headerShown: true,
          title: "Coach Verification",
          headerStyle: { backgroundColor: "#0B1220" },
          headerTintColor: "#e5e7eb",
          headerTitleStyle: { fontWeight: "bold" },
        }}
      />
      <Stack.Screen name="CoachSettings" component={SettingsScreen} />
      <Stack.Screen name="UpdateCoachProfile" component={UpdateCoachProfileScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState(null);
  const [authInitialRouteState, setAuthInitialRouteState] = useState(getAuthInitialRoute());
  const [coachProfileComplete, setCoachProfileComplete] = useState(false);
  const [coachProfile, setCoachProfile] = useState(null);

  const navTheme = useMemo(
    () => ({
      ...DefaultTheme,
      colors: { ...DefaultTheme.colors, background: "#0b1220" },
    }),
    []
  );

  useEffect(() => subscribeAuthInitialRoute(setAuthInitialRouteState), []);

  useEffect(() => {
    let unsubscribeUserDoc;
    let unsubscribeCoachDoc;
    let userRef;
    let coachRef;
    let latestUserData = null;
    let latestCoachData = null;
    let applyQueue = Promise.resolve();

    const qualifiesCoachAccount = (userData = {}, coachData = {}) => {
      if (userData.coachAccountStatus === "active") return true;
      if (userData.role !== "coach") return false;
      if (!coachData) return false;
      if (coachData.approved === true || coachData.status === "approved") return true;
      if (coachData.profileComplete === true) return true;
      if (typeof coachData.name === "string" && coachData.name.trim().length > 0) return true;
      return false;
    };

    const detachCoachListener = () => {
      if (typeof unsubscribeCoachDoc === "function") {
        unsubscribeCoachDoc();
        unsubscribeCoachDoc = undefined;
      }
    };

    const scheduleApply = (data, options = {}) => {
      applyQueue = applyQueue
        .then(() => applyData(data, options))
        .catch((error) => console.warn("Failed to apply auth state", error));
      return applyQueue;
    };

    function ensureCoachListener() {
      if (!coachRef || unsubscribeCoachDoc) return;
      unsubscribeCoachDoc = onSnapshot(coachRef, (docSnap) => {
        const coachPayload = docSnap.data() || null;
        latestCoachData = coachPayload;
        setCoachProfile(coachPayload);
        if (latestUserData) {
          scheduleApply(latestUserData, { skipCoachFetch: true, coachDataOverride: coachPayload });
        }
      });
    }

    async function applyData(incomingData = {}, options = {}) {
      if (!userRef) return;
      let data = incomingData || {};
      latestUserData = data;

      const { skipCoachFetch = false, coachDataOverride } = options;

      let coachData = coachDataOverride ?? latestCoachData ?? null;
      let allowCoach = false;

      if (data.role === "coach" || data.coachAccountStatus === "active") {
        if (!coachRef) return;
        if (!skipCoachFetch || !coachData) {
          const coachSnap = await getDoc(coachRef);
          coachData = coachSnap.exists() ? coachSnap.data() : null;
          latestCoachData = coachData;
        }

        if (qualifiesCoachAccount(data, coachData)) {
          allowCoach = true;
          if (data.coachAccountStatus !== "active") {
            await setDoc(userRef, { coachAccountStatus: "active" }, { merge: true });
            data = { ...data, coachAccountStatus: "active" };
          }
          ensureCoachListener();
        } else {
          const updates = {};
          if (data.role !== "user") updates.role = "user";
          if (data.coachAccountStatus !== "inactive") updates.coachAccountStatus = "inactive";
          if (data.coachProfileComplete) updates.coachProfileComplete = false;

          if (Object.keys(updates).length) {
            await setDoc(userRef, updates, { merge: true });
            data = { ...data, ...updates };
          }
          allowCoach = false;
          detachCoachListener();
          latestCoachData = null;
        }
      } else {
        if (data.coachAccountStatus !== "inactive") {
          await setDoc(userRef, { coachAccountStatus: "inactive" }, { merge: true });
          data = { ...data, coachAccountStatus: "inactive" };
        }
        allowCoach = false;
        detachCoachListener();
        latestCoachData = null;
      }

      if (allowCoach) {
        const resolvedComplete =
          coachData?.profileComplete !== undefined ? coachData.profileComplete : data.coachProfileComplete;
        setCoachProfile(coachData || null);
        setCoachProfileComplete(!!resolvedComplete);
        setRoute("coach");
      } else {
        setCoachProfile(null);
        setCoachProfileComplete(false);
        setRoute(data.onboardingComplete ? "main" : "onboarding");
      }

      latestUserData = data;
    }

    const unsubscribeAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      if (unsubscribeUserDoc) {
        unsubscribeUserDoc();
        unsubscribeUserDoc = undefined;
      }
      detachCoachListener();
      userRef = undefined;
      coachRef = undefined;
      latestUserData = null;
      latestCoachData = null;
      applyQueue = Promise.resolve();

      if (!user) {
        setRoute("auth");
        setCoachProfile(null);
        setCoachProfileComplete(false);
        setBooting(false);
        return;
      }

      setBooting(true);
      try {
        userRef = doc(db, "users", user.uid);
        coachRef = doc(db, "coaches", user.uid);

        let snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(
            userRef,
            {
              role: "user",
              email: user.email,
              onboardingComplete: false,
              coachProfileComplete: false,
              coachEmailVerified: true,
              coachAccountStatus: "inactive",
              createdAt: serverTimestamp(),
            },
            { merge: true }
          );
          snap = await getDoc(userRef);
        }

        let data = snap.data() || {};
        const defaults = {};

        if (!data.role) {
          defaults.role = "user";
          data = { ...data, role: "user" };
        }
        if (!data.email && user.email) {
          defaults.email = user.email;
          data = { ...data, email: user.email };
        }
        if (data.onboardingComplete === undefined) {
          defaults.onboardingComplete = false;
          data = { ...data, onboardingComplete: false };
        }
        if (data.coachProfileComplete === undefined) {
          defaults.coachProfileComplete = false;
          data = { ...data, coachProfileComplete: false };
        }
        if (data.coachEmailVerified === undefined) {
          defaults.coachEmailVerified = true;
          data = { ...data, coachEmailVerified: true };
        }
        if (data.coachAccountStatus === undefined) {
          defaults.coachAccountStatus = "inactive";
          data = { ...data, coachAccountStatus: "inactive" };
        }

        if (Object.keys(defaults).length) {
          await setDoc(userRef, defaults, { merge: true });
        }

        await scheduleApply(data);

        unsubscribeUserDoc = onSnapshot(userRef, (docSnap) => {
          const fresh = docSnap.data() || {};
          scheduleApply(fresh);
        });
      } catch (error) {
        console.warn("Failed to resolve auth route", error);
        setRoute("auth");
        setCoachProfile(null);
        setCoachProfileComplete(false);
      } finally {
        setBooting(false);
      }
    });

    return () => {
      if (unsubscribeUserDoc) unsubscribeUserDoc();
      detachCoachListener();
      unsubscribeAuth();
    };
  }, []);


  if (booting || !route) return <LoadingScreen />;

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0b1220" translucent={Platform.OS === "android"} />
      <NavigationContainer 
        theme={navTheme}
        initialState={null}
      >
        {route === "auth" && <AuthStack initialRouteName="SignIn" />}
        {route === "onboarding" && <OnboardingStack />}
        {route === "main" && <MainStack />}
        {route === "coach" && (
          <CoachStack
            key={coachProfileComplete ? "coach-ready" : "coach-setup"}
            coachProfileComplete={coachProfileComplete}
            coachProfile={coachProfile}
          />
        )}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
