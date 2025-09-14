// /src/lib/auth.js
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
  signOut,
  onAuthStateChanged,
} from "firebase/auth";
import { firebaseAuth } from "./firebaseApp";

// Pretty error messages
const niceError = (e) => {
  const code = e?.code || "";
  if (code.includes("auth/invalid-email")) return "Invalid email address.";
  if (code.includes("auth/user-disabled")) return "This user is disabled.";
  if (code.includes("auth/user-not-found")) return "No account found for this email.";
  if (code.includes("auth/wrong-password")) return "Incorrect password.";
  if (code.includes("auth/email-already-in-use")) return "Email already in use.";
  if (code.includes("auth/weak-password")) return "Use a stronger password (min 6 chars).";
  if (code.includes("auth/too-many-requests")) return "Too many attempts. Please try again later.";
  if (code.includes("auth/network-request-failed")) return "Network error. Check your connection and try again.";
  return e?.message || "Something went wrong.";
};

export async function signUp(email, password) {
  try {
    const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
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

export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(firebaseAuth, email);
    return true;
  } catch (e) {
    const err = new Error(niceError(e));
    err.original = e;
    throw err;
  }
}

export async function logOut() {
  return signOut(firebaseAuth); // clears persisted session
}

// Optional: subscribe from anywhere
export function subscribeAuth(cb) {
  return onAuthStateChanged(firebaseAuth, cb); // cb(user|null)
}
