import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
<<<<<<< HEAD
=======

// Coach flow screens
import CoachSignInScreen from "./src/screens/CoachSignInScreen";
import CoachSignUpScreen from "./src/screens/CoachSignUpScreen";
import CoachEmailVerification from "./src/screens/CoachEmailVerification";
import CoachDashboardScreen from "./src/screens/CoachDashboardScreen";
import CoachClientProfile from "./src/screens/CoachClientProfile";
import CoachClientMessaging from "./src/screens/CoachClientMessaging";
import CoachClientsScreen from './src/screens/CoachClientsScreen';
import WorkoutNutritionPlansScreen from './src/screens/WorkoutNutritionPlansScreen';
import WorkoutPlanBuilderScreen from './src/screens/WorkoutPlanBuilderScreen';
import NutritionPlanBuilderScreen from './src/screens/NutritionPlanBuilderScreen';

import Onboarding from "./src/screens/OnboardingWizard";
>>>>>>> 5146822 (Added workout and nutrition plan builder features)
import HomeScreen from "./src/screens/HomeScreen";
import Onboarding from "./src/screens/OnboardingWizard";
import CoachEmailVerification from "./src/screens/CoachEmailVerification";

const Stack = createNativeStackNavigator();

<<<<<<< HEAD
export default function App() {
=======
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
      <Stack.Screen name="CoachClients" component={CoachClientsScreen} />
      <Stack.Screen name="CoachClientProfile" component={CoachClientProfile} />
      <Stack.Screen name="ClientMessaging" component={CoachClientMessaging} />
      <Stack.Screen name="WorkoutNutritionPlans" component={WorkoutNutritionPlansScreen} />
      <Stack.Screen name="WorkoutPlanBuilder" component={WorkoutPlanBuilderScreen} />
      <Stack.Screen name="NutritionPlanBuilder" component={NutritionPlanBuilderScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState(null);

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

>>>>>>> 5146822 (Added workout and nutrition plan builder features)
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false, // hide headers by default
        }}
      >
        {/* Auth screens */}
        <Stack.Screen name="SignIn" component={SignInScreen} />
        <Stack.Screen name="SignUp" component={SignUpScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="Onboarding" component={Onboarding} options={{ headerShown: false }} />
        <Stack.Screen name="CoachEmails" component={CoachEmailVerification} options={{ headerShown: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}