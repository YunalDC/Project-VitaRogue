import { initializeApp, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import * as functions from 'firebase-functions';
// Use global fetch (Node 18 runtime). If you previously relied on node-fetch, Node 18 includes fetch by default.

// Initialize admin
initializeApp({ credential: applicationDefault() });
const db = getFirestore();
const BOT_USER_ID = "__bot__";
const BOT_NAME = "VitaBot";

// --- Push Notification Helpers -------------------------------------------------
/**
 * Fetches Expo push token for a user (stored at users/{uid}/meta/push)
 */
async function getUserPushToken(uid) {
  try {
    const snap = await db.collection('users').doc(uid).collection('meta').doc('push').get();
    if (!snap.exists) return null;
    const data = snap.data() || {};
    return data.token || null;
  } catch (e) {
    console.warn('getUserPushToken error', uid, e);
    return null;
  }
}

/**
 * Sends an Expo push notification (single token). Silent fail on invalid token.
 */
async function sendExpoPush({ token, title, body, data }) {
  if (!token) return;
  try {
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ to: token, title, body, data }),
    });
    if (!res.ok) {
      const text = await res.text();
      console.warn('Expo push send failed', res.status, text);
    }
  } catch (e) {
    console.warn('sendExpoPush error', e);
  }
}

async function sendPushToUser(uid, payload) {
  const token = await getUserPushToken(uid);
  if (!token) return;
  await sendExpoPush({ token, ...payload });
}

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

    // Push notification to the other participant (fire & forget outside transaction)
    try {
      const chatSnap = await chatRef.get();
      if (chatSnap.exists) {
        const chatData = chatSnap.data() || {};
        const participants = chatData.participants || [];
        const otherId = participants.find(p => p !== senderId);
        if (otherId) {
          // Fetch sender display name for nicer notification (fallback to 'New message')
          let senderName = 'New message';
            try {
              const userSnap = await db.collection('users').doc(senderId).get();
              if (userSnap.exists) {
                const u = userSnap.data() || {};
                senderName = u.displayName || u.name || senderName;
              }
            } catch (e) { /* ignore */ }
          await sendPushToUser(otherId, {
            title: senderName,
            body: msg.text ? (msg.text.length > 80 ? msg.text.slice(0,77)+'...' : msg.text) : 'Sent you a message',
            data: { type: 'chat.message', chatId, senderId },
          });
        }
      }
    } catch (e) {
      console.warn('onMessageCreate push error', e);
    }
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

// --- Session Notifications ------------------------------------------------------
/**
 * Notify client when a coach creates a session targeting them.
 */
export const onSessionCreate = functions.firestore
  .document('sessions/{sessionId}')
  .onCreate(async (snap) => {
    const session = snap.data() || {};
    if (!session.clientId || !session.coachId) return null;
    try {
      await sendPushToUser(session.clientId, {
        title: 'New Session Scheduled',
        body: session.title ? `${session.title} scheduled` : 'You have a new coaching session',
        data: { type: 'session.create', sessionId: snap.id },
      });
    } catch (e) {
      console.warn('onSessionCreate push error', e);
    }
    return null;
  });

// Internal shared generator for VitaBot replies
async function serverGenerateVitaBotReply({ text, ctx = {} }) {
  const cfg = functions.config() || {};
  const openaiKey = cfg?.openai?.key;
  const googleKey = cfg?.googleai?.key;

  const system = (
    `You are VitaBot, a concise, friendly assistant for a fitness and health app.\n\n` +
    `Scope: ONLY help with:\n` +
    `- Workouts/exercise, warmups, sets/reps, general progression\n` +
    `- Nutrition basics (calories, macros, meal ideas), hydration\n` +
    `- Sleep/recovery habits\n` +
    `- How to use the app (navigation and features)\n\n` +
    `Hard limits: Do NOT provide medical diagnoses, clinical treatment, or personalized medical advice.\n` +
    `Refuse non-fitness topics (crypto, taxes, politics, adult content, hacking, illegal).\n\n` +
    `Style: short, helpful, practical. Use bullet lists when helpful. If the question is unclear, ask 1 short clarifier.\n` +
    `If the user asks about calories in common foods, provide reasonable approximations (e.g., medium banana ~105 kcal).`
  );

  const offlinePrefix = ctx?.offline ? `Your coach is currently offline. I’m VitaBot, here to help for now. ` : '';

  // Hard out-of-scope guard
  const OUT_OF_SCOPE = /(crypto|stock|forex|tax|politic|religion|dating|sexual|nsfw|violence|weapons?|hacking|illegal|medical\s*(diagnosis|treatment|prescription|medication))/i;
  if (OUT_OF_SCOPE.test(text || '')) {
    return offlinePrefix + 'I can help with workouts, nutrition, hydration, sleep, and how to use the app. I can’t assist with that topic.';
  }

  // Provider: OpenAI
  if (openaiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${openaiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          temperature: 0.4,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: String(text).trim() },
          ],
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.warn('[serverGenerateVitaBotReply][openai] bad status', res.status, t);
        throw new Error('openai-failed');
      }
      const json = await res.json();
      const content = json?.choices?.[0]?.message?.content?.trim();
      return offlinePrefix + (content || 'I can help with workouts, nutrition, hydration, sleep, and app guidance.');
    } catch (e) {
      console.warn('[serverGenerateVitaBotReply][openai] error', e);
    }
  }

  // Provider: Google Generative AI (Gemini)
  if (googleKey) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${googleKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: `${system}\n\nUser: ${String(text).trim()}` }] }],
          generationConfig: { temperature: 0.4 },
        }),
      });
      if (!res.ok) {
        const t = await res.text();
        console.warn('[serverGenerateVitaBotReply][gemini] bad status', res.status, t);
        throw new Error('gemini-failed');
      }
      const json = await res.json();
      const cand = json?.candidates?.[0];
      const parts = cand?.content?.parts || [];
      const content = parts.map(p => p.text).filter(Boolean).join('\n').trim();
      return offlinePrefix + (content || 'I can help with workouts, nutrition, hydration, sleep, and app guidance.');
    } catch (e) {
      console.warn('[serverGenerateVitaBotReply][gemini] error', e);
    }
  }

  // Heuristic fallback (scope-restricted)
  const lower = String(text || '').toLowerCase();
  const maybe = (re) => re.test(lower);
  const parts = [];
  if (maybe(/banana/) && maybe(/cal(orie|ories|kcal)/)) parts.push('A medium banana (~118g) has about 105 kcal.');
  if (maybe(/egg/) && (maybe(/protein/) || maybe(/cal(orie|ories|kcal)/))) parts.push('One large egg ~70 kcal and ~6g protein.');
  if (maybe(/water|hydrate|hydration/)) parts.push('Most people do well with ~2–3L water/day; adjust for heat and workouts.');
  if (parts.length === 0) parts.push('I can help with workouts, nutrition, hydration, sleep, and app guidance. Ask me anything in that scope.');
  return offlinePrefix + parts.join('\n');
}

// --- VitaBot AI Reply (Callable) ----------------------------------------------
export const aiVitaBotReply = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }
  const { chatId, text, context: ctx = {} } = data || {};
  if (!chatId || !text || typeof text !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'chatId and text are required');
  }
  const reply = await serverGenerateVitaBotReply({ text, ctx });
  return { reply };
});

/**
 * Callable: aiVitaBotSend
 * Same as aiVitaBotReply, but also writes the reply to chats/{chatId}/messages as VitaBot.
 * Params: { chatId, text, context?: { offline?: boolean } }
 */
export const aiVitaBotSend = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Auth required');
  }
  const { chatId, text, context: ctx = {} } = data || {};
  if (!chatId || !text || typeof text !== 'string') {
    throw new functions.https.HttpsError('invalid-argument', 'chatId and text are required');
  }

  // Ensure caller is a participant of the chat
  const chatRef = db.collection('chats').doc(chatId);
  const chatSnap = await chatRef.get();
  if (!chatSnap.exists) throw new functions.https.HttpsError('not-found', 'Chat not found');
  const chatData = chatSnap.data() || {};
  const participants = chatData.participants || [];
  if (!participants.includes(context.auth.uid)) {
    throw new functions.https.HttpsError('permission-denied', 'Not a participant of this chat');
  }

  // Generate the reply using the shared helper
  const reply = await serverGenerateVitaBotReply({ text, ctx });

  // Write the VitaBot message
  const messagesRef = chatRef.collection('messages');
  await messagesRef.add({ text: reply, senderId: BOT_USER_ID, senderName: BOT_NAME, _bot: true, timestamp: FieldValue.serverTimestamp() });
  return { ok: true };
});

/**
 * Notify participant on significant session status change (confirm, cancel, complete)
 */
export const onSessionUpdate = functions.firestore
  .document('sessions/{sessionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data() || {};
    const after = change.after.data() || {};
    const { sessionId } = context.params;
    // Detect status change
    if (before.status === after.status) return null;
    const significant = ['confirmed','cancelled','completed'];
    if (!significant.includes(after.status)) return null;
    // Decide who to notify: if client confirmed -> coach; if coach cancelled/completed -> client; if client cancelled -> coach
    const targets = [];
    if (after.status === 'confirmed') {
      if (after.coachId) targets.push(after.coachId);
    } else if (after.status === 'cancelled') {
      // Whoever didn't initiate cancellation should be notified. Hard to know initiator; notify both but skip duplicates.
      if (after.coachId) targets.push(after.coachId);
      if (after.clientId) targets.push(after.clientId);
    } else if (after.status === 'completed') {
      if (after.clientId) targets.push(after.clientId);
    }
    const uniqueTargets = [...new Set(targets.filter(Boolean))];
    await Promise.all(uniqueTargets.map(uid => sendPushToUser(uid, {
      title: 'Session Update',
      body: `Session ${after.title || ''} ${after.status}`.trim(),
      data: { type: 'session.update', sessionId },
    })));
    return null;
  });

