import { collection, doc, addDoc, updateDoc, serverTimestamp, getDoc, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from './firebaseApp';

// Session shape (1:1 coach <-> client or group later)
// {
//   coachId, clientId, status: 'scheduled'|'completed'|'cancelled',
//   startTime: Timestamp, endTime: Timestamp, type, notes, createdAt, updatedAt
// }

export async function createSession({ coachId, clientId, startTime, endTime, type='General', notes='' }) {
  const col = collection(db, 'sessions');
  return await addDoc(col, { coachId, clientId, startTime, endTime, type, notes, status: 'scheduled', createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
}

export async function updateSession(sessionId, patch) {
  const ref = doc(db, 'sessions', sessionId);
  await updateDoc(ref, { ...patch, updatedAt: serverTimestamp() });
}

export async function cancelSession(sessionId, reason='') { await updateSession(sessionId, { status: 'cancelled', cancelReason: reason }); }
export async function completeSession(sessionId) { await updateSession(sessionId, { status: 'completed' }); }

export function listenUpcomingSessions(coachId, { onChange, horizonHours = 168 }) {
  const now = new Date();
  const future = new Date(now.getTime() + horizonHours*60*60*1000);
  const q = query(collection(db, 'sessions'), where('coachId','==',coachId), where('startTime','>=', now), where('startTime','<=', future), orderBy('startTime','asc'));
  return onSnapshot(q, snap => {
    const list = []; snap.forEach(d=> list.push({ id: d.id, ...d.data() }));
    onChange(list);
  });
}

export async function getSession(sessionId) { const ref = doc(db,'sessions',sessionId); const s= await getDoc(ref); return s.exists()? { id: s.id, ...s.data() }: null; }

export default { createSession, updateSession, cancelSession, completeSession, listenUpcomingSessions, getSession };
