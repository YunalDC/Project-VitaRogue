// src/screens/CoachMessagesScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const ACCENT = "#10B981";

const dummyThreads = [
  { id: "1", name: "Coach Sarah", last: "Great job today! Same time tomorrow?", unread: 2 },
  { id: "2", name: "Coach David", last: "I shared your split plan. Thoughts?", unread: 0 },
  { id: "3", name: "Coach Jane", last: "Proud of your consistency 💪", unread: 1 },
];

export default function CoachMessagesScreen({ navigation }) {
  const [q, setQ] = useState("");

  const data = dummyThreads.filter((t) =>
    t.name.toLowerCase().includes(q.trim().toLowerCase())
  );

  const renderItem = ({ item }) => (
    <TouchableOpacity
      activeOpacity={0.85}
      style={styles.thread}
      onPress={() => {
        // navigate to a chat detail screen if/when you add one
        // navigation.navigate("CoachChat", { threadId: item.id });
      }}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarInitial}>{item.name.charAt(0)}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.rowBetween}>
          <Text style={styles.name}>{item.name}</Text>
          {item.unread > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeTxt}>{item.unread}</Text>
            </View>
          )}
        </View>
        <Text style={styles.last} numberOfLines={1}>
          {item.last}
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={MUTED} />
    </TouchableOpacity>
  );

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
          placeholder="Search coaches…"
          placeholderTextColor={MUTED}
          value={q}
          onChangeText={setQ}
        />
      </View>

      {/* Threads */}
      <FlatList
        data={data}
        keyExtractor={(i) => i.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 24 }}
        ItemSeparatorComponent={() => <View style={styles.sep} />}
        renderItem={renderItem}
      />

      {/* New message FAB */}
      <TouchableOpacity style={styles.fab} activeOpacity={0.9}>
        <Ionicons name="create-outline" size={22} color="#0B1220" />
      </TouchableOpacity>
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

  fab: {
    position: "absolute",
    right: 16, bottom: 24,
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: ACCENT,
    alignItems: "center", justifyContent: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 6 },
  },
});