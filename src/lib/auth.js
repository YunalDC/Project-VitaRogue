// /lib/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { firebaseAuth } from "./firebaseApp";

// Optional: map Firebase errors to nicer messages
const niceError = (e) => {
  const code = e?.code || "";
  if (code.includes("auth/invalid-email")) return "Invalid email address.";
  if (code.includes("auth/user-disabled")) return "This user is disabled.";
  if (code.includes("auth/user-not-found")) return "No account found for this email.";
  if (code.includes("auth/wrong-password")) return "Incorrect password.";
  if (code.includes("auth/email-already-in-use")) return "Email already in use.";
  if (code.includes("auth/weak-password")) return "Use a stronger password (min 6 chars).";
  return e?.message || "Something went wrong.";
};

export async function signUp(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
    // (Optional) verify email
    try { await sendEmailVerification(cred.user); } catch {}
    return cred.user;
  } catch (e) {
    const err = new Error(niceError(e));
    err.original = e;
    throw err;
  }
}

export async function signIn(email, password) {
  try {
    const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
    return cred.user;
  } catch (e) {
    const err = new Error(niceError(e));
    err.original = e;
    throw err;
  }
}

export async function logOut() {
  return signOut(firebaseAuth);
}

// Hook up in your app root if you want auto-redirects
export function subscribeAuth(cb) {
  // cb(user | null)
  return onAuthStateChanged(firebaseAuth, cb);
}
