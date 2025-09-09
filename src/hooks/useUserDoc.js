import { useEffect, useState } from "react";
import { onAuthStateChanged, getAuth } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebaseApp";

export function useUserDoc() {
  const [status, setStatus] = useState("loading"); // loading | authed | noauth
  const [user, setUser] = useState(null);
  const [userDoc, setUserDoc] = useState(null);    // full Firestore doc data (including profile)

  useEffect(() => {
    const auth = getAuth();
    let unsubFS = null;

    const unsubAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setUserDoc(null);

      if (!u) {
        setStatus("noauth");
        if (unsubFS) { unsubFS(); unsubFS = null; }
        return;
      }

      const ref = doc(db, "users", u.uid);
      unsubFS = onSnapshot(ref, (snap) => {
        setUserDoc(snap.exists() ? snap.data() : null);
        setStatus("authed");
      });
    });

    return () => {
      unsubAuth();
      if (unsubFS) unsubFS();
    };
  }, []);

  return { status, user, userDoc, profile: userDoc?.profile || null };
}
