import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  StyleSheet,
  Dimensions,
  RefreshControl,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCoachProfile } from "../hooks/useCoachProfile";
import { db, firebaseAuth } from '../lib/firebaseApp';
import { collection, onSnapshot, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';

const COLORS = {
  bg: "#0B1220",
  cardBg: "#1A2332",
  primary: "#6366F1",
  secondary: "#8B5CF6",
  accent: "#10B981",
  text: "#F8FAFC",
  textSecondary: "#94A3B8",
  muted: "#64748B",
  success: "#10B981",
  warning: "#F59E0B",
  danger: "#EF4444",
  border: "#334155",
};

const STATUS_FILTERS = [
  { label: "All", value: "all" },
  { label: "Active", value: "active" },
  { label: "Paused", value: "paused" },
  { label: "Trial", value: "trial" },
];

export default function CoachClientsScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [clients, setClients] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const screenWidth = Dimensions.get("window").width;
  const chipWidth = screenWidth / STATUS_FILTERS.length - 24;
  
  const { coach } = useCoachProfile();

  // Fetch real client data from UserCoachRelationships collection
  useEffect(() => {
    if (!coach?.id) {
      console.log('[CoachClientsScreen] No coach ID available yet, waiting...');
      setLoading(false);
      return;
    }
    
    // Use the authentication UID for consistency with security rules
    const authUid = firebaseAuth.currentUser?.uid;
    console.log('[CoachClientsScreen] Setting up UserCoachRelationships listener for auth UID:', authUid);
    
    const userCoachRelationshipsRef = collection(db, 'UserCoachRelationships');
    const q = query(
      userCoachRelationshipsRef,
      where('coach.id', '==', authUid)
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('[CoachClientsScreen] Found', snapshot.docs.length, 'UserCoachRelationships');
      
      const relationships = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Transform the data for display
      const clientsData = relationships.map(rel => {
        const client = rel.client;
        const progress = rel.progress || {};
        const sessions = rel.sessions || {};
        
        console.log('[CoachClientsScreen] Processing client:', client.name, 'status:', rel.status);
        
        return {
          id: client.id,
          relationshipId: rel.id,
          name: client.name,
          avatar: client.photoURL,
          email: client.email,
          goal: Array.isArray(client.fitnessGoals) && client.fitnessGoals.length > 0 
                ? client.fitnessGoals[0] 
                : client.weightGoal || 'General Fitness',
          joinDate: rel.startDate,
          status: rel.status,
          isActive: rel.status === 'active',
          lastSession: sessions.lastSession || 'Recently',
          progress: progress.percentage || 75,
          totalSessions: sessions.completed || 0,
          nextSession: sessions.nextSession || 'TBD',
          
          // Additional client data
          age: client.age,
          gender: client.gender,
          heightCm: client.heightCm,
          weightKg: client.weightKg,
          fitnessLevel: client.fitnessLevel,
          allGoals: client.fitnessGoals || []
        };
      });
      
      console.log('[CoachClientsScreen] Final clients data:', clientsData.length, 'clients');
      setClients(clientsData);
      setLoading(false);
      
    }, (error) => {
      console.warn('[CoachClientsScreen] UserCoachRelationships listener error:', error);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [coach?.id]);

  const filteredClients = useMemo(() => {
    let filtered = clients;

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((client) => client.status === selectedStatus);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (client) =>
          client.name.toLowerCase().includes(query) ||
          client.goal.toLowerCase().includes(query) ||
          client.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedStatus, clients]);

  const getStatusColor = (status) => {
    switch (status) {
      case "active":
        return COLORS.success;
      case "trial":
        return COLORS.warning;
      case "paused":
        return COLORS.danger;
      default:
        return COLORS.muted;
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    // The listener will automatically update
    setTimeout(() => setRefreshing(false), 1000);
  };

  const renderClientCard = ({ item }) => (
    <TouchableOpacity
      style={styles.clientCard}
      onPress={() => navigation.navigate("CoachClientProfile", { client: item })}
      activeOpacity={0.7}
    >
      <Image source={{ uri: item.avatar }} style={styles.clientAvatar} />

      <View style={styles.clientInfo}>
        <View style={styles.clientHeader}>
          <Text style={styles.clientName}>{item.name}</Text>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(item.status) + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(item.status) },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: getStatusColor(item.status) },
              ]}
            >
              {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
            </Text>
          </View>
        </View>

        <Text style={styles.clientGoal}>{item.goal}</Text>
        <Text style={styles.clientEmail}>{item.email}</Text>

        <View style={styles.clientStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.totalSessions}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.progress}%</Text>
            <Text style={styles.statLabel}>Progress</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{item.lastSession}</Text>
            <Text style={styles.statLabel}>Last</Text>
          </View>
        </View>

        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${item.progress}%` },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity style={styles.messageButton}>
        <Ionicons name="chatbubble-outline" size={20} color={COLORS.primary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );

  const renderStatusFilter = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.filterChip,
        { width: chipWidth },
        selectedStatus === item.value && styles.filterChipActive,
      ]}
      onPress={() => setSelectedStatus(item.value)}
    >
      <Text
        style={[
          styles.filterChipText,
          selectedStatus === item.value && styles.filterChipTextActive,
        ]}
      >
        {item.label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Clients</Text>
        <View style={styles.headerRight}>
          <Text style={styles.clientCount}>{filteredClients.length}</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={COLORS.muted} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search clients..."
          placeholderTextColor={COLORS.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name="close-circle" size={20} color={COLORS.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Status Filters */}
      <FlatList
        data={STATUS_FILTERS}
        renderItem={renderStatusFilter}
        keyExtractor={(item) => item.value}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersContainer}
      />

      {/* Clients List */}
      <FlatList
        data={filteredClients}
        renderItem={renderClientCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.clientsList}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={COLORS.primary}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyStateText}>No clients found</Text>
            <Text style={styles.emptyStateSubtext}>
              {searchQuery
                ? "Try adjusting your search criteria"
                : "Your clients will appear here"}
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.cardBg,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  headerRight: {
    width: 40,
    alignItems: "center",
  },
  clientCount: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.primary,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.cardBg,
    margin: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  filtersContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  filterChip: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 12,
    backgroundColor: COLORS.cardBg,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "500",
  },
  filterChipTextActive: {
    color: COLORS.text,
  },
  clientsList: {
    paddingHorizontal: 20,
  },
  clientCard: {
    flexDirection: "row",
    backgroundColor: COLORS.cardBg,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  clientAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginRight: 16,
  },
  clientInfo: {
    flex: 1,
  },
  clientHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  clientName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  clientGoal: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 2,
  },
  clientEmail: {
    fontSize: 12,
    color: COLORS.muted,
    marginBottom: 12,
  },
  clientStats: {
    flexDirection: "row",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
    marginRight: 24,
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.muted,
    marginTop: 2,
  },
  progressBar: {
    height: 4,
    backgroundColor: COLORS.border,
    borderRadius: 2,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 2,
  },
  messageButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary + "20",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: 16,
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },
});
