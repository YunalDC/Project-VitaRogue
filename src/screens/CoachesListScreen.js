import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar as RNStatusBar,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { getAllCoaches, getOrCreateChat } from "../utils/chatHelper";

const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1f2937";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const SUCCESS = "#10B981";

export default function CoachesListScreen({ navigation }) {
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingChatId, setLoadingChatId] = useState(null);

  useEffect(() => {
    loadCoaches();
  }, []);

  const loadCoaches = async () => {
    try {
      const coachesList = await getAllCoaches();
      setCoaches(coachesList);
    } catch (error) {
      Alert.alert("Error", "Failed to load coaches. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleStartChat = async (coach) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;

    if (!currentUser) {
      Alert.alert("Error", "Please log in to start a chat.");
      return;
    }

    setLoadingChatId(coach.id);

    try {
      const { chatId, otherUser } = await getOrCreateChat(
        currentUser.uid,
        coach.id
      );

      // Navigate to chat screen
      navigation.navigate("Chat", {
        chatId,
        otherUser,
      });
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start chat. Please try again.");
    } finally {
      setLoadingChatId(null);
    }
  };

  const renderCoach = ({ item }) => (
    <TouchableOpacity
      style={styles.coachCard}
      onPress={() => handleStartChat(item)}
      activeOpacity={0.7}
      disabled={loadingChatId === item.id}
    >
      <View style={styles.coachAvatar}>
        <Text style={styles.coachAvatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.coachInfo}>
        <View style={styles.coachHeader}>
          <Text style={styles.coachName}>{item.name}</Text>
          <View style={styles.coachBadge}>
            <Ionicons name="fitness" size={10} color={SUCCESS} />
            <Text style={styles.coachBadgeText}>Coach</Text>
          </View>
        </View>

        {item.specialization && (
          <Text style={styles.coachSpecialization}>
            {item.specialization}
          </Text>
        )}

        {item.bio && (
          <Text style={styles.coachBio} numberOfLines={2}>
            {item.bio}
          </Text>
        )}

        <View style={styles.chatButton}>
          {loadingChatId === item.id ? (
            <ActivityIndicator size="small" color={SUCCESS} />
          ) : (
            <>
              <Ionicons name="chatbubbles" size={16} color={SUCCESS} />
              <Text style={styles.chatButtonText}>Start Chat</Text>
            </>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={64} color={MUTED} />
      <Text style={styles.emptyTitle}>No coaches available</Text>
      <Text style={styles.emptySubtitle}>
        Check back later for available coaches
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Find a Coach</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Subtitle */}
      <View style={styles.subtitleContainer}>
        <Text style={styles.subtitle}>
          Connect with certified fitness coaches for personalized guidance
        </Text>
      </View>

      {/* Coaches List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={SUCCESS} />
          <Text style={styles.loadingText}>Loading coaches...</Text>
        </View>
      ) : (
        <FlatList
          data={coaches}
          renderItem={renderCoach}
          keyExtractor={(item) => item.id}
          contentContainerStyle={
            coaches.length === 0
              ? styles.emptyListContainer
              : styles.listContainer
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
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
  headerTitle: {
    color: TEXT,
    fontSize: 18,
    fontWeight: "800",
  },
  subtitleContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: CARD,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  subtitle: {
    color: MUTED,
    fontSize: 13,
    textAlign: "center",
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  coachCard: {
    flexDirection: "row",
    backgroundColor: CARD,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  coachAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#334155",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 14,
  },
  coachAvatarText: {
    color: TEXT,
    fontSize: 24,
    fontWeight: "700",
  },
  coachInfo: {
    flex: 1,
  },
  coachHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  coachName: {
    color: TEXT,
    fontSize: 17,
    fontWeight: "700",
  },
  coachBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: SUCCESS + "20",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    gap: 3,
  },
  coachBadgeText: {
    color: SUCCESS,
    fontSize: 10,
    fontWeight: "700",
  },
  coachSpecialization: {
    color: SUCCESS,
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 6,
  },
  coachBio: {
    color: MUTED,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 10,
  },
  chatButton: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: SUCCESS + "20",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    borderWidth: 1,
    borderColor: SUCCESS + "40",
  },
  chatButtonText: {
    color: SUCCESS,
    fontSize: 13,
    fontWeight: "700",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: MUTED,
    fontSize: 14,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    color: TEXT,
    fontSize: 20,
    fontWeight: "700",
    marginTop: 16,
  },
  emptySubtitle: {
    color: MUTED,
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
  },
});