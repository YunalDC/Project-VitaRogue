import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";

// ✅ Your real config (copied from Firebase console)
const firebaseConfig = {
  apiKey: "AIzaSyCHUKT4E8sP6WYWCXNlLcZ0yMayhn0O7pU",
  authDomain: "vitarogue-d74f9.firebaseapp.com",
  projectId: "vitarogue-d74f9",
  storageBucket: "vitarogue-d74f9.appspot.com", // <- must be appspot.com
  messagingSenderId: "661558221830",
  appId: "1:661558221830:web:170e9bf6fed3339dc7f787",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// RN requires persistence explicitly
let auth;
try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  auth = getAuth(app); // if already initialized during fast refresh
}

// 🔍 sanity log (remove later)
console.log("🔥 Firebase app:", app?.name, app?.options?.projectId);

export const firebaseAuth = auth;
export const db = getFirestore(app);
export default app;
