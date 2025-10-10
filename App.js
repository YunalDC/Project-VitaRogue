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
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, db } from "./src/lib/firebaseApp";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { signOut } from "firebase/auth";

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
import CoachSettingsScreen from "./src/screens/CoachSettingsScreen";

/* --- User app --- */
import Onboarding from "./src/screens/OnboardingWizard";
import HomeScreen from "./src/screens/HomeScreen";
import GymDiscoveryScreen from "./src/screens/GymDiscoveryScreen";
import CoachMarketPlaceScreen from "./src/screens/CoachMarketPlaceScreen";
import FoodScanningScreen from "./src/screens/FoodScanningScreen";
import FoodConfirmationScreen from "./src/screens/FoodConfirmationScreen";
import FoodDetailsScreen from "./src/screens/FoodDetailsScreen";
import ExerciseRecommendationsScreen from "./src/screens/ExerciseRecommendationsScreen";
import WorkoutDetailScreen from "./src/screens/WorkoutDetailScreen";
import WorkoutTimerScreen from "./src/screens/WorkoutTimerScreen";
import WorkoutCompletionScreen from "./src/screens/WorkoutCompletionScreen";
import CoachMessagesScreen from "./src/screens/CoachMessagesScreen";
import SettingsScreen from "./src/screens/SettingsScreen";
import HealthyDishesScreen from "./src/screens/HealthyDishes";
import BMIScreen from "./src/screens/BMI";
import ChatListScreen from "./src/screens/ChatListScreen";
import ChatScreen from "./src/screens/ChatScreen";
import EditProfileScreen from './src/screens/EditProfileScreen';
import CoachesListScreen from "./src/screens/CoachesListScreen";
import DiscoverScreen from "./src/screens/DiscoverScreen";
import FitnessNewsScreen from "./src/screens/FitnessNewsScreen";
import NearbyGymsScreenUser from "./src/screens/NearbyGymsScreen";
import HealthyHabitsScreen from "./src/screens/HealthyHabitsScreen";
import WorkoutsScreen from "./src/screens/WorkoutsScreen";
import SleepScreen from "./src/screens/SleepScreen";
import ExerciseDetailScreen from "./src/screens/ExerciseDetailScreen";
import ArticleDetailScreen from "./src/screens/ArticleDetailScreen";
import CoachPublicProfileScreen from "./src/screens/CoachPublicProfileScreen";
import ProgressScreen from './src/screens/ProgressScreen';

// Settings screens
import CoachAccountSettingsScreen from "./src/screens/settings/CoachAccountSettingsScreen";
import AccountSettingsScreen from "./src/screens/settings/AccountSettingsScreen";
import ProfileGoalsSettingsScreen from "./src/screens/settings/ProfileGoalsSettingsScreen";
import NutritionSettingsScreen from "./src/screens/settings/NutritionSettingsScreen";
import NotificationSettingsScreen from "./src/screens/settings/NotificationSettingsScreen";
import UnitsDisplaySettingsScreen from "./src/screens/settings/UnitsDisplaySettingsScreen";
import PrivacyDataSettingsScreen from "./src/screens/settings/PrivacyDataSettingsScreen";
import SupportSettingsScreen from "./src/screens/settings/SupportSettingsScreen";
import AboutSettingsScreen from "./src/screens/settings/AboutSettingsScreen";

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
      <Stack.Screen name="EditProfileScreen" component={EditProfileScreen} options={{ headerShown: false }} />
      
      {/* ===== Settings Screens ===== */}
      <Stack.Screen name="CoachSettings" component={CoachSettingsScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="CoachAccountSettings" component={CoachAccountSettingsScreen} />
      <Stack.Screen name="AccountSettings" component={AccountSettingsScreen} />
      <Stack.Screen name="ProfileGoalsSettings" component={ProfileGoalsSettingsScreen} />
      <Stack.Screen name="NutritionSettings" component={NutritionSettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="UnitsDisplaySettings" component={UnitsDisplaySettingsScreen} />
      <Stack.Screen name="PrivacyDataSettings" component={PrivacyDataSettingsScreen} />
      <Stack.Screen name="SupportSettings" component={SupportSettingsScreen} />
      <Stack.Screen name="AboutSettings" component={AboutSettingsScreen} />
      {/* ===== End Settings Screens ===== */}
      
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen
        name="GymDiscovery"
        component={GymDiscoveryScreen}
        options={{ animation: "slide_from_bottom" }}
      />
      <Stack.Screen name="CoachMarket" component={CoachMarketPlaceScreen} />
      <Stack.Screen name="CoachPublicProfile" component={CoachPublicProfileScreen} />
      <Stack.Screen
        name="FoodScanning"
        component={FoodScanningScreen}
        options={{ headerShown: false, gestureEnabled: false }}
      />
      <Stack.Screen name="Progress" component={ProgressScreen} options={{ headerShown: false }}/>
      <Stack.Screen name="FoodConfirmation" component={FoodConfirmationScreen} />
      <Stack.Screen name="FoodDetails" component={FoodDetailsScreen} />
      <Stack.Screen name="ExerciseRecommendations" component={ExerciseRecommendationsScreen} />
      <Stack.Screen name="WorkoutDetailScreen" component={WorkoutDetailScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutTimerScreen" component={WorkoutTimerScreen} options={{ headerShown: false }} />
      <Stack.Screen name="WorkoutCompletionScreen" component={WorkoutCompletionScreen} options={{ headerShown: false }} />
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
      <Stack.Screen name="Discover" component={DiscoverScreen} />
      <Stack.Screen name="CoachClients" component={CoachClientsScreen} />
      <Stack.Screen name="CoachClientProfile" component={CoachClientProfile} />
      <Stack.Screen name="ClientMessaging" component={CoachClientMessaging} />
      <Stack.Screen name="CoachMessages" component={CoachMessagesScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="WorkoutNutritionPlans" component={WorkoutNutritionPlansScreen} />
      <Stack.Screen name="WorkoutPlanBuilder" component={WorkoutPlanBuilderScreen} />
      <Stack.Screen name="NutritionPlanBuilder" component={NutritionPlanBuilderScreen} />
      <Stack.Screen name="UpdateCoachClientProfile" component={UpdateCoachClientProfile} />
      <Stack.Screen name="CoachSettings" component={CoachSettingsScreen} />
      
      {/* ===== Settings Screens for Coaches ===== */}
      <Stack.Screen name="CoachAccountSettings" component={CoachAccountSettingsScreen} />
      <Stack.Screen name="NotificationSettings" component={NotificationSettingsScreen} />
      <Stack.Screen name="PrivacyDataSettings" component={PrivacyDataSettingsScreen} />
      <Stack.Screen name="SupportSettings" component={SupportSettingsScreen} />
      <Stack.Screen name="AboutSettings" component={AboutSettingsScreen} />
      {/* ===== End Settings Screens ===== */}
    </Stack.Navigator>
  );
}

/* Router component for direct rendering based on route */
function Router({ routeKey, authInitial = "SignIn" }) {
  switch (routeKey) {
    case "auth":
      return <AuthStack initialRouteName={authInitial} />;
    case "onboarding":
      return <OnboardingStack />;
    case "main":
      return <MainStack />;
    case "coach":
      return <CoachStack />;
    default:
      return null;
  }
}

/* Root */
export default function App() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState(null); // "auth" | "onboarding" | "main" | "coach"
  const [coachProfile, setCoachProfile] = useState(null);
  const [authGateTarget, setAuthGateTarget] = useState("SignIn");
  const [firstLaunch, setFirstLaunch] = useState(null);

  const navTheme = useMemo(
    () => ({ ...DefaultTheme, colors: { ...DefaultTheme.colors, background: "#0b1220" } }),
    []
  );

  // Check if this is the first app launch
  useEffect(() => {
    (async () => {
      try {
        const flag = await AsyncStorage.getItem("firstLaunchDone");
        if (!flag) {
          // First app open ever — force Sign In
          setFirstLaunch(true);
          if (firebaseAuth.currentUser) {
            try { await signOut(firebaseAuth); } catch {}
          }
          await AsyncStorage.setItem("firstLaunchDone", "1");
        } else {
          setFirstLaunch(false);
        }
      } catch {
        // If storage fails, default to not-first-launch to avoid blocking
        setFirstLaunch(false);
      }
    })();
  }, []);

  useEffect(() => {
    let unsubUser, unsubCoach;
    const stopAuth = onAuthStateChanged(firebaseAuth, async (user) => {
      console.log('[AuthListener] onAuthStateChanged fired user=', !!user && user.uid);
      unsubUser?.();
      unsubCoach?.();
      unsubUser = undefined;
      unsubCoach = undefined;

      if (!user) {
        console.log('[AuthListener] No user -> auth stack');
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
        console.log('[AuthListener] user doc exists?', userSnap.exists());
        
        if (!userSnap.exists()) {
          // Check if this is a coach by looking for /coaches/{uid} doc first
          try {
            console.log('[AuthListener] user doc does not exist, checking if coach...');
            const coachSnap = await getDoc(coachRef);
            
            if (coachSnap.exists()) {
              // This is a coach account - DO NOT create user doc, let CoachSignUpScreen handle it
              console.log('[AuthListener] coach doc found, waiting for user doc creation by CoachSignUpScreen');
              
              // Set up listeners and wait for the user doc to be created by CoachSignUpScreen
              unsubUser = onSnapshot(userRef, (snap) => {
                const data = snap.data() || {};
                console.log('[AuthListener][onSnapshot user] role=', data.role, 'coachOnboardingComplete=', data.coachOnboardingComplete);
                if (data.role === 'coach') {
                  const needsVerify = !data.coachOnboardingComplete || !data.phoneVerified || !data.coachEmailVerified;
                  if (needsVerify) {
                    setAuthGateTarget("CoachVerify");
                    setRoute("auth");
                  } else {
                    setRoute("coach");
                  }
                }
              });
              
              unsubCoach = onSnapshot(coachRef, (snap) => { 
                console.log('[AuthListener][onSnapshot coach] doc', !!snap.exists()); 
                setCoachProfile(snap.data() || null); 
              });
              
              setBooting(false);
              return;
            }
            
            // Not a coach - create regular user doc
            console.log('[AuthListener] creating baseline user doc');
            await setDoc(userRef, {
              role: 'user',
              email: user.email || null,
              username: (user.email || '').split('@')[0] || 'user',
              onboardingComplete: false,
              public: true,
              online: true,
              createdAt: serverTimestamp(),
              lastSeen: serverTimestamp(),
            }, { merge: true });
            // Treat as freshly signed-up user (send to onboarding)
            setRoute('onboarding');
          } catch (e) {
            console.warn('[AuthListener] failed to create baseline user doc', e);
            setAuthGateTarget('SignIn');
            setRoute('auth');
          } finally {
            // Still attach listener so future updates (e.g., onboarding completion) propagate
            unsubUser = onSnapshot(userRef, (snap) => {
              const data = snap.data() || {};
              console.log('[AuthListener][onSnapshot user] role=', data.role, 'onboardingComplete=', data.onboardingComplete);
              if (data.role === 'coach') {
                const needsVerify = !data.coachOnboardingComplete || !data.phoneVerified || !data.coachEmailVerified;
                if (needsVerify) {
                  setAuthGateTarget("CoachVerify");
                  setRoute("auth");
                } else {
                  setRoute("coach");
                }
              } else {
                setRoute(data.onboardingComplete ? 'main' : 'onboarding');
              }
            });
            unsubCoach = onSnapshot(coachRef, (snap) => { 
              console.log('[AuthListener][onSnapshot coach] doc', !!snap.exists()); 
              setCoachProfile(snap.data() || null); 
            });
            setBooting(false);
          }
          return; // exit early after creation/setup
        }

        const userData = userSnap.data() || {};
        const role = userData.role;
        console.log('[AuthListener] existing user role=', role, 'onboardingComplete=', userData.onboardingComplete);

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

        // Live listeners
        unsubUser = onSnapshot(userRef, (snap) => {
          const data = snap.data() || {};
          const userRole = data.role;
          console.log('[AuthListener][user live] role=', userRole, 'onboardingComplete=', data.onboardingComplete);
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
          console.log('[AuthListener][coach live] exists=', snap.exists());
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
  }, [firstLaunch]);

  // When nav is ready or route changes, reset to the right root
  // Resilient reset loop: keeps trying until nav container ready
  useEffect(() => {
    if (!route || booting) return;
    const map = { auth: 'AuthRoot', onboarding: 'OnboardingRoot', main: 'MainRoot', coach: 'CoachRoot' };
    const target = map[route];
    if (!target) return;
    let attempts = 0;
    const maxAttempts = 20; // ~3s (20 * 150ms)
    console.log('[NavResetLoop] starting for route', route, 'target', target);
    const interval = setInterval(() => {
      attempts++;
      const ready = navigationRef.isReady();
      if (ready) {
        console.log('[NavResetLoop] ready on attempt', attempts, 'resetting to', target);
        try { 
          navigationRef.reset({ index: 0, routes: [{ name: target }] }); 
        } catch (e) { 
          console.warn('[NavResetLoop] reset error', e); 
        }
        clearInterval(interval);
      } else {
        console.log('[NavResetLoop] not ready attempt', attempts);
      }
      if (attempts >= maxAttempts) {
        console.warn('[NavResetLoop] gave up after', attempts, 'attempts');
        clearInterval(interval);
      }
    }, 150);
    return () => clearInterval(interval);
  }, [route, booting]);

  // Fallback safety: if onboardingComplete is true but still on auth after 4s, force main
  useEffect(() => {
    if (route === 'auth') {
      const id = setTimeout(() => {
        // Attempt to peek at current user doc
        const u = firebaseAuth.currentUser;
        if (!u) return;
        getDoc(doc(db, 'users', u.uid)).then(s => {
          const d = s.data() || {};
          if (d.role === 'user' && d.onboardingComplete) {
            console.log('[Fallback] Forcing navigation to MainRoot');
            setRoute('main');
          }
        }).catch(() => { });
      }, 4000);
      return () => clearTimeout(id);
    }
  }, [route]);

  if (booting || firstLaunch === null || !route) return <LoadingScreen />;

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
      >
        <Router routeKey={route} authInitial={authGateTarget} />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}