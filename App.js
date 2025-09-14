// /App.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseAuth, db } from "./src/lib/firebaseApp";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

// Your screens
import SignInScreen from "./src/screens/SignInScreen";
import SignUpScreen from "./src/screens/SignUpScreen";
import ForgotPasswordScreen from "./src/screens/ForgotPasswordScreen";
import HomeScreen from "./src/screens/HomeScreen";
import Onboarding from "./src/screens/OnboardingWizard";
import CoachEmailVerification from "./src/screens/CoachEmailVerification";
import GymDiscoveryScreen from "./src/screens/GymDiscoveryScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [booting, setBooting] = useState(true);
  const [route, setRoute] = useState(null); // "auth" | "onboarding" | "main"

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, async (user) => {
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
        const onboardingComplete = !!snap.data()?.onboardingComplete;
        setRoute(onboardingComplete ? "main" : "onboarding");
      } catch {
        setRoute("auth");
      } finally {
        setBooting(false);
      }
    });
    return () => unsub();
  }, []);

  if (booting || !route) {
    return (
      <View style={{ flex: 1, backgroundColor: "#0b1220", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {route === "auth" && (
          <>
            <Stack.Screen name="SignIn" component={SignInScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
            <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
            <Stack.Screen name="CoachEmail" component={CoachEmailVerification} />
          </>
        )}

        {route === "onboarding" && (
          <>
            <Stack.Screen name="Onboarding" component={Onboarding} />
          </>
        )}

        {route === "main" && (
          <>
            <Stack.Screen name="Home" component={HomeScreen} />
            <Stack.Screen name="GymDiscovery" component={GymDiscoveryScreen} />
            {/* add more app screens here */}
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
