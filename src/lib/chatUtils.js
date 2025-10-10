import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebaseApp';

// Deterministic chat id for 1:1 chats
export function oneToOneChatId(a, b) {
	return [a, b].sort().join('_');
}

export async function fetchParticipantProfile(uid) {
	try {
		// user doc (base role + potential name parts)
		const userRef = doc(db, 'users', uid);
		let userSnap, userData = {}, role = 'user';
		try { userSnap = await getDoc(userRef); } catch(_) {}
		if (userSnap?.exists()) {
			userData = userSnap.data() || {};
			role = userData.role || 'user';
		}

		// coach doc (preferred public name). Infer coach status if approved flags present even if user.role missing.
		let coachSnap, coachData = null;
		try {
			coachSnap = await getDoc(doc(db, 'coaches', uid));
			if (coachSnap.exists()) {
				coachData = coachSnap.data() || {};
				const explicitCoach = (userData.role || '').toLowerCase() === 'coach';
				const inferredCoach = !!(userData.coachApproved || coachData.status === 'approved' || coachData.public === true);
				if (explicitCoach || inferredCoach) {
					role = 'coach';
				}
			}
		} catch(_) {}

		// Derive name priority list
		const userFirst = userData.firstName?.trim();
		const userLast = userData.lastName?.trim();
		const combined = [userFirst, userLast].filter(Boolean).join(' ');
		const emailPrefix = (userData.email || '').split('@')[0];

	const candidates = [
			coachData?.name,
			coachData?.displayName,
			combined,
			userData.displayName,
			userData.name,
			userData.username,
			emailPrefix,
			'User'
		].map(v => (typeof v === 'string' ? v.trim() : v)).filter(Boolean);

		// Pick first non-empty not equal to generic placeholders if later better exists
		let name = candidates[0] || 'User';

	const emailVal = userData.email || coachData?.email;
	const profile = { id: uid, name, role };
	if (emailVal) profile.email = emailVal; // only include when defined
	return profile;
	} catch (e) {
		console.warn('[chatUtils] fetchParticipantProfile failed', e);
		return { id: uid, name: 'Unknown', role: 'user' };
	}
}

export async function getOrCreateOneToOneChat(uidA, uidB) {
	const chatId = oneToOneChatId(uidA, uidB);
	const chatRef = doc(db, 'chats', chatId);
	let snap;
	try {
		snap = await getDoc(chatRef);
	} catch (e) {
		console.warn('[chatUtils] getDoc failed (will still attempt create)', e);
	}
	if (snap?.exists()) return { id: chatId, ...snap.data() };

	const [rawA, rawB] = await Promise.all([
		fetchParticipantProfile(uidA),
		fetchParticipantProfile(uidB)
	]);
	// Strip undefined fields defensively
	const sanitize = (obj) => Object.fromEntries(Object.entries(obj || {}).filter(([_, v]) => v !== undefined));
	const pA = sanitize(rawA);
	const pB = sanitize(rawB);
	const participantDetails = { [pA.id]: pA, [pB.id]: pB };
	const base = {
		participants: [pA.id, pB.id],
		participantDetails,
		createdAt: serverTimestamp(),
		updatedAt: serverTimestamp(),
		lastMessage: null,
		unreadCount: { [pA.id]: 0, [pB.id]: 0 },
		lastReadAt: { [pA.id]: serverTimestamp(), [pB.id]: serverTimestamp() },
		type: 'direct'
	};
	await setDoc(chatRef, base, { merge: false });
	return { id: chatId, ...base };
}

export default { oneToOneChatId, fetchParticipantProfile, getOrCreateOneToOneChat };
