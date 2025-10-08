import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  TextInput,
  StyleSheet,
  StatusBar as RNStatusBar,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { db } from "../lib/firebaseApp";
import { getFunctions, httpsCallable } from 'firebase/functions';
import { fetchParticipantProfile } from '../lib/chatUtils';
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
  doc,
  updateDoc,
  increment,
  getDoc,
  limit,
  startAfter,
  getDocs,
  onSnapshot as onDocSnapshot,
} from "firebase/firestore";

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";

export default function ChatScreen({ route, navigation }) {
  const { chatId, otherUser: initialOtherUser } = route.params;
  const [otherUser, setOtherUser] = useState(initialOtherUser || null);
  const [messages, setMessages] = useState([]);
  const [pageCursor, setPageCursor] = useState(null);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [myRole, setMyRole] = useState('user');
  const [loadingMore, setLoadingMore] = useState(false);
  const [chatMeta, setChatMeta] = useState(null); // includes lastReadAt, typing map
  const [pendingMessages, setPendingMessages] = useState([]); // optimistic/pending/error
  const [otherTyping, setOtherTyping] = useState(false);
  const typingTimeoutRef = useRef(null);
  const lastTypedRef = useRef(0);
  const flatListRef = useRef(null);
  const PAGE_SIZE = 40;

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) { setLoading(false); return; }
    setCurrentUserId(user.uid);
  // fetch my role
  (async () => { try { const uSnap = await getDoc(doc(db,'users', user.uid)); if (uSnap.exists()) setMyRole(uSnap.data()?.role||'user'); } catch(_) {} })();
  const messagesRef = collection(db, 'chats', chatId, 'messages');
    const qNewest = query(messagesRef, orderBy('timestamp', 'desc'), limit(PAGE_SIZE));
    const unsub = onSnapshot(qNewest, snap => {
      const docs = snap.docs;
      const list = docs.map(d => ({ id: d.id, ...d.data() }));
      setPageCursor(docs[docs.length - 1] || null);
      setMessages(list.slice().reverse());
      setLoading(false);
      markMessagesAsRead();
    }, err => { console.error('[ChatScreen] listen error', err); setLoading(false); });
    return () => unsub();
  }, [chatId, markMessagesAsRead]);

  // Listen to chat metadata (typing, lastReadAt)
  useEffect(() => {
    if (!chatId) return;
    const chatRef = doc(db, 'chats', chatId);
    const unsub = onDocSnapshot(chatRef, snap => {
      if (snap.exists()) {
        const data = snap.data();
        setChatMeta(data);
        // Determine other typing
        const me = getAuth().currentUser?.uid;
        if (me && data?.typing) {
          const otherId = Object.keys(data.typing).find(k => k !== me);
            setOtherTyping(!!(otherId && data.typing[otherId]));
        } else {
          setOtherTyping(false);
        }
      }
    });
    return () => unsub();
  }, [chatId]);

  useEffect(() => {
    // Auto-repair participant details if missing, placeholder, or outdated
    (async () => {
      try {
        const auth = getAuth();
        const me = auth.currentUser?.uid;
        if (!me) return;
        const chatRef = doc(db, 'chats', chatId);
        const snap = await getDoc(chatRef);
        if (!snap.exists()) return;
        const data = snap.data() || {};
        const otherId = (data.participants || []).find(p => p !== me);
        if (!otherId) return;
        const stored = data.participantDetails?.[otherId];
        const fresh = await fetchParticipantProfile(otherId);
        const placeholderNames = ['User', 'Unknown', (fresh.email||'').split('@')[0]];
        const needsPatch = !stored || placeholderNames.includes(stored.name) || stored.name !== fresh.name || stored.role !== fresh.role;
        if (needsPatch) {
          await updateDoc(chatRef, { [`participantDetails.${otherId}`]: { id: fresh.id, name: fresh.name, role: fresh.role } });
        }
        // Update local state if initial param missing or outdated
        if (!otherUser || otherUser.name !== fresh.name) {
          setOtherUser({ id: fresh.id, name: fresh.name, role: fresh.role });
        }
      } catch(e) { console.warn('[ChatScreen] participant auto-repair failed', e); }
    })();
  }, [chatId]);

  const markMessagesAsRead = useCallback(async () => {
    try {
      const auth = getAuth();
      const me = auth.currentUser?.uid;
      if (!me) return;
      const functions = getFunctions();
      const callable = httpsCallable(functions, 'markChatRead');
      await callable({ chatId });
    } catch(_) {}
  }, [chatId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !currentUserId || sending) return;

    const messageText = inputText.trim();
    setInputText("");
    setSending(true);

    // optimistic message
    const tempId = `temp_${Date.now()}`;
    const optimistic = { id: tempId, text: messageText, senderId: currentUserId, timestamp: { toDate: () => new Date() }, _optimistic: true, _error: false };
    setPendingMessages(prev => [...prev, optimistic]);

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, { text: messageText, senderId: currentUserId, timestamp: serverTimestamp() });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
      // remove optimistic once real snapshot brings the message (simple timeout cleanup)
      setTimeout(() => {
        setPendingMessages(prev => prev.filter(m => m.id !== tempId));
      }, 4000);
    } catch (error) {
      console.error("Error sending message:", error);
      // mark optimistic failed
      setPendingMessages(prev => prev.map(m => m.id === tempId ? { ...m, _error: true } : m));
    } finally {
      setSending(false);
    }
  };

  const loadEarlier = async () => {
    if (loadingMore || !pageCursor) return;
    setLoadingMore(true);

    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const qOlder = query(messagesRef, orderBy('timestamp', 'desc'), startAfter(pageCursor), limit(PAGE_SIZE));
      const snap = await getDocs(qOlder);
      const docs = snap.docs;
      const list = docs.map(d => ({ id: d.id, ...d.data() }));

      setPageCursor(docs[docs.length - 1] || null);
      setMessages(prev => [...prev, ...list.reverse()]);
    } catch (error) {
      console.error("Error loading earlier messages:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  const formatMessageTime = (timestamp) => {
    if (!timestamp) return "";

    const date = timestamp.toDate();
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  const renderMessage = ({ item, index }) => {
    const isCurrentUser = item.senderId === currentUserId;
    const isOptimistic = item._optimistic;
    const failed = item._error;
    const showTimestamp =
      index === 0 ||
      (messages[index - 1] &&
        Math.abs(
          item.timestamp?.toMillis() - messages[index - 1].timestamp?.toMillis()
        ) > 300000); // 5 minutes

    // Determine read receipt for last outgoing message
    let showSeen = false;
    if (isCurrentUser && !isOptimistic && !failed) {
      const myOutgoing = [...messages].filter(m => m.senderId === currentUserId);
      const lastOutgoing = myOutgoing[myOutgoing.length - 1];
      if (lastOutgoing && lastOutgoing.id === item.id && chatMeta?.lastReadAt) {
        const otherId = (chatMeta.participants || []).find(p => p !== currentUserId);
        const otherReadTs = chatMeta.lastReadAt?.[otherId];
        if (otherReadTs && item.timestamp?.toMillis) {
          const msgTs = item.timestamp.toMillis();
          const readMillis = (otherReadTs.toMillis ? otherReadTs.toMillis() : Date.now());
          if (readMillis >= msgTs) showSeen = true;
        }
      }
    }

    return (
      <View style={styles.messageContainer}>
        {showTimestamp && item.timestamp && (
          <View style={styles.timestampContainer}>
            <Text style={styles.timestampText}>
              {formatMessageTime(item.timestamp)}
            </Text>
          </View>
        )}

        <View
          style={[
            styles.messageBubble,
            isCurrentUser ? styles.myMessage : styles.theirMessage,
            isOptimistic && { opacity: 0.6 },
            failed && { borderWidth: 1, borderColor: '#ef4444' },
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isCurrentUser ? styles.myMessageText : styles.theirMessageText,
            ]}
          >
            {item.text}
          </Text>
          {failed && (
            <TouchableOpacity onPress={() => retrySend(item)} style={{ marginTop: 4 }}>
              <Text style={{ color: '#ef4444', fontSize: 11, fontWeight: '600' }}>Failed. Tap to retry.</Text>
            </TouchableOpacity>
          )}
          {showSeen && (
            <Text style={{ color: '#155e75', fontSize: 10, marginTop: 4, fontWeight: '600' }}>Seen</Text>
          )}
        </View>
      </View>
    );
  };

  const retrySend = async (msg) => {
    if (!msg?._error) return;
    setPendingMessages(prev => prev.map(m => m.id === msg.id ? { ...m, _error: false } : m));
    try {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      await addDoc(messagesRef, { text: msg.text, senderId: currentUserId, timestamp: serverTimestamp() });
      setPendingMessages(prev => prev.filter(m => m.id !== msg.id));
    } catch(e) {
      setPendingMessages(prev => prev.map(m => m.id === msg.id ? { ...m, _error: true } : m));
    }
  };

  // Typing indicator logic
  const updateTyping = useCallback(async (active) => {
    try {
      const me = getAuth().currentUser?.uid; if (!me) return;
      const chatRef = doc(db, 'chats', chatId);
      await updateDoc(chatRef, { [`typing.${me}`]: active });
    } catch(_) {}
  }, [chatId]);

  const handleInputChange = (text) => {
    setInputText(text);
    const now = Date.now();
    lastTypedRef.current = now;
    updateTyping(true);
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      if (Date.now() - lastTypedRef.current >= 2500) updateTyping(false);
    }, 2500);
  };

  useEffect(() => {
    return () => { // cleanup typing state
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      updateTyping(false);
    };
  }, [updateTyping]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <StatusBar style="light" backgroundColor={BG} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <View style={styles.headerAvatar}>
            <Text style={styles.headerAvatarText}>
              {otherUser?.name?.charAt(0).toUpperCase() || "?"}
            </Text>
          </View>
          <View>
            <Text style={styles.headerName}>{otherUser?.name || "Unknown"}</Text>
            {otherUser?.role === 'coach' && <Text style={styles.headerRole}>Coach</Text>}
            {otherUser?.role !== 'coach' && myRole === 'coach' && <Text style={styles.headerRole}>Client</Text>}
          </View>
        </View>

        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Messages */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={SUCCESS} />
          </View>
        ) : (
       <FlatList
         ref={flatListRef}
         data={[...messages, ...pendingMessages]}
             renderItem={renderMessage}
             keyExtractor={(item) => item.id}
             contentContainerStyle={styles.messagesContainer}
             showsVerticalScrollIndicator={false}
             onContentSizeChange={() =>
               flatListRef.current?.scrollToEnd({ animated: false })
             }
             ListHeaderComponent={pageCursor ? (
              <TouchableOpacity style={styles.loadMoreBtn} onPress={loadEarlier} disabled={loadingMore}>
                <Text style={styles.loadMoreText}>{loadingMore ? 'Loading…' : 'Load earlier messages'}</Text>
              </TouchableOpacity>
            ) : null}
             ListEmptyComponent={
               <View style={styles.emptyContainer}>
                 <Ionicons name="chatbubble-outline" size={48} color={MUTED} />
                 <Text style={styles.emptyText}>No messages yet</Text>
                 <Text style={styles.emptySubtext}>
                   Start the conversation!
                 </Text>
               </View>
             }
          />
        )}

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={MUTED}
              value={inputText}
              onChangeText={handleInputChange}
              multiline
              maxLength={1000}
            />
            {otherTyping && (
              <View style={{ position: 'absolute', left: 16, bottom: -18 }}>
                <Text style={{ color: MUTED, fontSize: 11 }}>Typing…</Text>
              </View>
            )}
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!inputText.trim() || sending) && styles.sendButtonDisabled,
              ]}
              onPress={sendMessage}
              disabled={!inputText.trim() || sending}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#0B1220" />
              ) : (
                <Ionicons name="send" size={20} color="#0B1220" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backButton: {
    padding: 8,
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 8,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  headerAvatarText: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  headerName: {
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  headerRole: {
    color: SUCCESS,
    fontSize: 11,
    fontWeight: "600",
  },
  messagesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
  },
  timestampContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  timestampText: {
    color: MUTED,
    fontSize: 11,
    fontWeight: "600",
  },
  messageBubble: {
    maxWidth: "75%",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    backgroundColor: SUCCESS,
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    backgroundColor: CARD,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#0B1220",
  },
  theirMessageText: {
    color: TEXT,
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: BG,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: CARD,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    color: TEXT,
    fontSize: 15,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: SUCCESS,
    alignItems: "center",
    justifyContent: "center",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  emptySubtext: {
    color: MUTED,
    fontSize: 14,
    marginTop: 4,
  },
  loadMoreBtn: {
    alignSelf: 'center',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 16,
    backgroundColor: '#1e293b',
    marginBottom: 8,
  },
  loadMoreText: { color: SUCCESS, fontSize: 12, fontWeight: '600' },
});