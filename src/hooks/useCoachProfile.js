import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { db } from '../lib/firebaseApp';

// Subscribes to /coaches/{uid} for currently signed-in coach.
// Returns { loading, coach, exists }.
export function useCoachProfile() {
  const [coach, setCoach] = useState(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Listen to auth state changes
  useEffect(() => {
    const auth = getAuth();
    const unsubAuth = onAuthStateChanged(auth, (user) => {
      console.log('[useCoachProfile] Auth state changed, user:', user?.uid);
      setCurrentUser(user);
    });
    
    return () => unsubAuth();
  }, []);

  useEffect(() => {
    console.log('[useCoachProfile] Hook effect triggered, currentUser:', currentUser?.uid);
    
    if (!currentUser) {
      console.log('[useCoachProfile] No authenticated user, clearing state');
      setCoach(null); setExists(false); setLoading(false);
      return;
    }
    
    console.log('[useCoachProfile] Setting up listener for coach:', currentUser.uid);
    const ref = doc(db, 'coaches', currentUser.uid);
    const unsub = onSnapshot(ref, snap => {
      console.log('[useCoachProfile] Snapshot received - exists:', snap.exists());
      setExists(snap.exists());
      const coachData = snap.exists() ? { id: snap.id, ...snap.data() } : null;
      console.log('[useCoachProfile] Setting coach data:', coachData);
      setCoach(coachData);
      setLoading(false);
    }, err => {
      console.warn('[useCoachProfile] snapshot error', err);
      setLoading(false);
    });
    return () => {
      console.log('[useCoachProfile] Cleaning up listener');
      unsub();
    };
  }, [currentUser]);

  return { loading, coach, exists };
}

export default useCoachProfile;