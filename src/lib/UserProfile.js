import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebaseApp"; // your initialized Firestore

export async function ensureUserDoc(uid, extra = {}) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, { onboardingComplete: false, createdAt: serverTimestamp(), ...extra });
    return { onboardingComplete: false };
  }
  return snap.data();
}
