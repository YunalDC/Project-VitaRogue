// src/screens/CoachMessagesScreen.js
import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebaseApp';
import { collection, query, where, onSnapshot } from 'firebase/firestore';

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const ACCENT = "#10B981";

export default function CoachMessagesScreen({ navigation }) {
  const [q, setQ] = useState("");
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState(null);

  // Subscribe to chats containing current user (coach or user)
  useEffect(() => {
    const auth = getAuth();
    const u = auth.currentUser;
    if (!u) { setLoading(false); return; }
    setCurrentUserId(u.uid);
    const chatsRef = collection(db, 'chats');
    // Removed orderBy to avoid composite index requirement; sort client-side.
    const qChats = query(chatsRef, where('participants', 'array-contains', u.uid));
    const unsub = onSnapshot(qChats, snap => {
      const arr = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      // Sort by updatedAt (desc); fallback to lastMessage.timestamp; undefined last.
      arr.sort((a, b) => {
        const ta = (a.updatedAt?.toMillis?.() || a.lastMessage?.timestamp?.toMillis?.() || 0);
        const tb = (b.updatedAt?.toMillis?.() || b.lastMessage?.timestamp?.toMillis?.() || 0);
        return tb - ta;
      });
      setChats(arr); setLoading(false);
    }, e => { console.warn('[CoachMessages] listen error', e); setLoading(false); });
    return () => unsub();
  }, []);

  const filterChats = useCallback(() => {
    const term = q.trim().toLowerCase();
    if (!term) return chats;
    return chats.filter(c => {
      const other = getOtherParticipant(c);
      return other?.name?.toLowerCase().includes(term);
    });
  }, [q, chats]);

  const getOtherParticipant = (chat) => {
    if (!currentUserId) return null;
    const otherId = chat.participants?.find(p => p !== currentUserId);
    return chat.participantDetails?.[otherId] || null;
  };

  const onOpenChat = (chat) => {
    const other = getOtherParticipant(chat);
    navigation.navigate('Chat', { chatId: chat.id, otherUser: other });
  };

  const formatTime = (ts) => {
    if (!ts?.toDate) return '';
    const d = ts.toDate();
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const data = filterChats();

  const renderItem = ({ item }) => {
    const other = getOtherParticipant(item);
    if (!other) return null;
    const unread = item.unreadCount?.[currentUserId] || 0;
    const lastText = item.lastMessage?.text || 'No messages yet';
    const time = formatTime(item.lastMessage?.timestamp);
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.thread}
        onPress={() => onOpenChat(item)}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarInitial}>{other.name?.charAt(0) || '?'}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <View style={styles.rowBetween}>
            <Text style={styles.name}>{other.name || 'Unknown'}</Text>
            {unread > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeTxt}>{unread}</Text>
              </View>
            )}
          </View>
          <Text style={styles.last} numberOfLines={1}>{lastText}</Text>
        </View>
        <Text style={styles.time}>{time}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.title}>Messages</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search */}
      <View style={styles.searchBox}>
        <Ionicons name="search" size={18} color={MUTED} />
        <TextInput
          style={styles.searchInput}
    placeholder="Search clients…"
          placeholderTextColor={MUTED}
          value={q}
          onChangeText={setQ}
        />
      </View>

      {/* Threads */}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24, flexGrow: data.length ? 0 : 1, justifyContent: data.length ? 'flex-start' : 'center' }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={renderItem}
        ListEmptyComponent={
          loading ? null : (
            <View style={{ alignItems: 'center', opacity: 0.6 }}>
              <Ionicons name="chatbubbles-outline" size={48} color={MUTED} />
              <Text style={{ color: TEXT, marginTop: 12, fontWeight: '600' }}>No conversations yet</Text>
              <Text style={{ color: MUTED, marginTop: 4, fontSize: 12 }}>Start one from a profile or client list</Text>
            </View>
          )
        }
      />

      {/* New message FAB */}
  {/* FAB reserved for future new chat UI */}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 8,
  },
  iconBtn: { padding: 8, width: 40, alignItems: "center" },
  title: { color: TEXT, fontSize: 20, fontWeight: "800", flex: 1, textAlign: "center" },

  searchBox: {
    marginHorizontal: 16,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    height: 44,
    borderRadius: 12,
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  searchInput: { color: TEXT, flex: 1 },

  thread: {
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 12,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
  },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#334155", alignItems: "center", justifyContent: "center",
  },
  avatarInitial: { color: TEXT, fontWeight: "800" },
  name: { color: TEXT, fontSize: 15, fontWeight: "700" },
  last: { color: MUTED, marginTop: 2 },
  rowBetween: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  sep: { height: 12 },

  badge: {
    minWidth: 22, height: 22, paddingHorizontal: 6,
    borderRadius: 11, backgroundColor: ACCENT, alignItems: "center", justifyContent: "center",
  },
  badgeTxt: { color: "#0B1220", fontWeight: "800", fontSize: 12 },
  time: { color: MUTED, fontSize: 10, marginLeft: 8 },

  // fab placeholder removed for core sync phase
});