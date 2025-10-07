import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { firebaseAuth, db } from '../lib/firebaseApp';

// Subscribes to /coaches/{uid} for currently signed-in coach.
// Returns { loading, coach, exists }.
export function useCoachProfile() {
  const [coach, setCoach] = useState(null);
  const [exists, setExists] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const u = firebaseAuth.currentUser;
    if (!u) {
      setCoach(null); setExists(false); setLoading(false);
      return;
    }
    const ref = doc(db, 'coaches', u.uid);
    const unsub = onSnapshot(ref, snap => {
      setExists(snap.exists());
      setCoach(snap.exists() ? { id: snap.id, ...snap.data() } : null);
      setLoading(false);
    }, err => {
      console.warn('[useCoachProfile] snapshot error', err);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { loading, coach, exists };
}

export default useCoachProfile;