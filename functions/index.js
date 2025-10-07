import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';

// Initialize admin
initializeApp({ credential: applicationDefault() });
const db = getFirestore();

/**
 * Trigger: onCreate of a message document
 * Path: chats/{chatId}/messages/{messageId}
 * Responsibilities:
 *  - Ensure parent chat lastMessage + updatedAt are updated atomically
 *  - Increment unread count for the non-sender only
 *  - Set / update per-participant lastReadAt for sender (they've obviously read up to this message)
 */
export const onMessageCreate = functions.firestore
  .document('chats/{chatId}/messages/{messageId}')
  .onCreate(async (snap, context) => {
    const { chatId } = context.params;
    const msg = snap.data() || {};
    const senderId = msg.senderId;
    if (!senderId) return null;

    const chatRef = db.collection('chats').doc(chatId);

    await db.runTransaction(async (tx) => {
      const chatSnap = await tx.get(chatRef);
      if (!chatSnap.exists) return; // Chat missing - skip
      const chatData = chatSnap.data() || {};
      const participants = chatData.participants || [];
      if (!participants.includes(senderId)) return; // Bad message
      const otherId = participants.find(p => p !== senderId);
      const updates = {
        lastMessage: {
          text: msg.text || '',
          senderId,
          timestamp: FieldValue.serverTimestamp(),
        },
        updatedAt: FieldValue.serverTimestamp(),
        [`lastReadAt.${senderId}`]: FieldValue.serverTimestamp(),
      };
      if (otherId) {
        updates[`unreadCount.${otherId}`] = FieldValue.increment(1);
      }
      tx.update(chatRef, updates);
    });
    return null;
  });

/**
 * Callable: markChatRead
 * Params: { chatId }
 * Sets lastReadAt for caller and zeroes their unreadCount in chat doc.
 */
export const markChatRead = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }
  const { chatId } = data || {};
  if (!chatId) {
    throw new functions.https.HttpsError('invalid-argument', 'chatId required');
  }
  const uid = context.auth.uid;
  const chatRef = db.collection('chats').doc(chatId);
  await db.runTransaction(async (tx) => {
    const snap = await tx.get(chatRef);
    if (!snap.exists) throw new functions.https.HttpsError('not-found', 'Chat not found');
    const d = snap.data() || {};
    if (!(d.participants || []).includes(uid)) {
      throw new functions.https.HttpsError('permission-denied', 'Not participant');
    }
    tx.update(chatRef, {
      [`unreadCount.${uid}`]: 0,
      [`lastReadAt.${uid}`]: FieldValue.serverTimestamp(),
    });
  });
  return { ok: true };
});
