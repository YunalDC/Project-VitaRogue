import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    StatusBar as RNStatusBar,
    Platform,
    Image,
    TextInput,
    FlatList,
    Dimensions,
    Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useCoachProfile } from "../hooks/useCoachProfile";
import { db } from '../lib/firebaseApp';
import { collection, onSnapshot, query, where, getDocs, doc, deleteDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const COLORS = {
    bg: "#0B1220",
    card: "#111827",
    card2: "#0f172a",
    border: "#1f2937",
    text: "#e5e7eb",
    muted: "#94a3b8",
    primary: "#10B981",
    secondary: "#60a5fa",
    accent: "#f59e0b",
    success: "#22c55e",
    warning: "#eab308",
    danger: "#ef4444",
};

const STATUS_FILTERS = [
    { id: "all", label: "All", color: COLORS.muted },
    { id: "active", label: "Active", color: COLORS.success },
    { id: "trial", label: "Trial", color: COLORS.warning },
    { id: "paused", label: "Paused", color: COLORS.danger },
];

export default function CoachClientsScreen({ navigation }) {
    const insets = useSafeAreaInsets();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedStatus, setSelectedStatus] = useState("all");
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const screenWidth = Dimensions.get("window").width;
    const coach = useCoachProfile();
    
    console.log('[CoachClientsScreen] Render - coach state:', {
      loading: coach.loading,
      exists: coach.exists,
      coachId: coach.coach?.id,
      coachName: coach.coach?.name
    });

    // Set up real-time listener for UserCoachRelationships
    useEffect(() => {
        console.log('[CoachClientsScreen] Effect triggered - coach.id:', coach.coach?.id, 'loading:', coach.loading, 'exists:', coach.exists);
        
        if (coach.loading) {
            console.log('[CoachClientsScreen] Coach still loading, waiting...');
            return;
        }
        
        if (!coach.exists || !coach.coach?.id) {
            console.log('[CoachClientsScreen] No coach data available');
            console.log('[CoachClientsScreen] Coach object:', coach);
            setLoading(false);
            setClients([]);
            return;
        }

        // Use the authentication UID for consistency with security rules (same as dashboard)
        const auth = getAuth();
        const authUid = auth.currentUser?.uid;
        const coachDocId = coach.coach?.id || coach.id || authUid;
        console.log('[CoachClientsScreen] Setting up UserCoachRelationships listener for coach ID:', coachDocId, 'auth UID:', authUid);
        
        const relationshipsRef = collection(db, 'UserCoachRelationships');
        const q = query(relationshipsRef, where('coach.id', '==', coachDocId || authUid));
        
        const unsubscribe = onSnapshot(q, (snapshot) => {
            console.log('[CoachClientsScreen] UserCoachRelationships query result, docs found:', snapshot.docs.length);
            
            if (snapshot.docs.length === 0) {
                console.log('[CoachClientsScreen] No relationships found for auth UID:', authUid);
                setClients([]);
                setLoading(false);
                return;
            }
            
            const clientsData = snapshot.docs.map(doc => {
                const data = doc.data();
                const client = data.client;
                const sessions = data.sessions || {};
                const progress = data.progress || {};
                
                console.log('[CoachClientsScreen] Processing client:', client?.name, 'Status:', data.status);
                
                return {
                    id: client.id,
                    relationshipId: doc.id,
                    name: client.name,
                    avatar: client.photoURL,
                    email: client.email,
                    goal: Array.isArray(client.fitnessGoals) && client.fitnessGoals.length > 0 
                          ? client.fitnessGoals[0] 
                          : client.weightGoal || 'General Fitness',
                    joinDate: data.startDate,
                    status: data.status,
                    lastSession: sessions.lastSession || 'Recently',
                    progress: progress.percentage || 75,
                    totalSessions: sessions.completed || 0,
                    nextSession: sessions.nextSession || 'TBD',
                    age: client.age,
                    gender: client.gender,
                    heightCm: client.heightCm,
                    weightKg: client.weightKg,
                    fitnessLevel: client.fitnessLevel,
                    allGoals: client.fitnessGoals || []
                };
            });
            
            console.log('[CoachClientsScreen] Final clients data:', clientsData.length, 'clients');
            console.log('[CoachClientsScreen] Client names:', clientsData.map(c => c.name));
            setClients(clientsData);
            setLoading(false);
        }, (error) => {
            console.warn('[CoachClientsScreen] UserCoachRelationships listener error:', error);
            setLoading(false);
        });
        return unsubscribe;
    }, [coach.coach?.id, coach.loading, coach.exists]);


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

    const removeAllClients = async () => {
        try {
            console.log('[CLEANUP] Starting cleanup of all relationships...');
            
            const relationshipsRef = collection(db, 'UserCoachRelationships');
            const snapshot = await getDocs(relationshipsRef);
            
            console.log(`[CLEANUP] Found ${snapshot.docs.length} relationships to delete`);
            
            // Delete each relationship
            const deletePromises = snapshot.docs.map(relationshipDoc => {
                console.log(`[CLEANUP] Deleting relationship: ${relationshipDoc.id}`, relationshipDoc.data());
                return deleteDoc(doc(db, 'UserCoachRelationships', relationshipDoc.id));
            });
            
            await Promise.all(deletePromises);
            
            console.log('[CLEANUP] All relationships deleted successfully!');
            Alert.alert("All Clients Removed", "All client relationships have been removed. Ready for fresh testing!");
            
        } catch (error) {
            console.error('[CLEANUP] Error cleaning up relationships:', error);
            Alert.alert("Error", "Failed to remove relationships. Please check permissions.");
        }
    };

    const removeClientRelationship = useCallback(async (client) => {
        try {
            if (!client?.relationshipId) {
                Alert.alert('Missing Relationship', 'Unable to remove this client because the relationship reference is missing.');
                return;
            }

            console.log('[CLEANUP] Removing relationship id:', client.relationshipId, 'for client:', client.name);
            await deleteDoc(doc(db, 'UserCoachRelationships', client.relationshipId));
            const removedName = client.name || 'Client';
            Alert.alert('Client Removed', removedName + ' has been removed from your roster.');
        } catch (error) {
            console.error('[CLEANUP] Error removing individual relationship:', error);
            Alert.alert('Error', 'Failed to remove this client. Please try again.');
        }
    }, []);

    const confirmRemoveClient = (client) => {
        const displayName = client.name || 'this client';
        Alert.alert(
            'Remove Client',
            'Are you sure you want to remove ' + displayName + ' from your roster?',
            [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Remove', style: 'destructive', onPress: () => removeClientRelationship(client) },
            ],
        );
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

                <View style={styles.clientStats}>
                    <View style={styles.statItem}>
                        <Ionicons name="calendar-outline" size={14} color={COLORS.muted} />
                        <Text style={styles.statText}>{item.totalSessions} sessions</Text>
                    </View>
                    <View style={styles.statItem}>
                        <Ionicons name="trending-up" size={14} color={COLORS.primary} />
                        <Text style={styles.statText}>{item.progress}% progress</Text>
                    </View>
                </View>

                <View style={styles.clientFooter}>
                    <Text style={styles.lastSession}>Last: {item.lastSession}</Text>
                    <TouchableOpacity
                        style={styles.messageIconButton}
                        onPress={() => navigation.navigate("ClientMessaging", { client: item })}
                    >
                        <Ionicons name="chatbubble-outline" size={18} color={COLORS.primary} />
                    </TouchableOpacity>
                </View>
            </View>
        </TouchableOpacity>
    );

    const renderStatusFilter = ({ item }) => {
        const screenWidth = Dimensions.get("window").width;
        const chipWidth = screenWidth / STATUS_FILTERS.length - 24;
        
        return (
            <TouchableOpacity
                style={[
                    styles.filterChip,
                    { width: chipWidth },
                    selectedStatus === item.id && styles.filterChipActive,
                ]}
                onPress={() => setSelectedStatus(item.id)}
            >
                <Text
                    style={[
                        styles.filterText,
                        { color: selectedStatus === item.id ? "white" : item.color },
                    ]}
                    numberOfLines={1}
                >
                    {item.label}
                </Text>
            </TouchableOpacity>
        );
    };

    return (
        <View style={styles.container}>
            <StatusBar style="light" backgroundColor={COLORS.bg} />
            {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

            {/* Header */}
            <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
                <TouchableOpacity
                    style={styles.backButton}
                    onPress={() => navigation.goBack()}
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.text} />
                </TouchableOpacity>

                <Text style={styles.headerTitle}>All Clients</Text>

                <View style={styles.headerRight}>
                    {filteredClients.length > 0 && (
                        <TouchableOpacity
                            style={styles.removeAllButton}
                            onPress={() => {
                                Alert.alert(
                                    'Remove All Clients',
                                    'This will permanently remove all client relationships. Are you sure?',
                                    [
                                        { text: 'Cancel', style: 'cancel' },
                                        { text: 'Remove All', style: 'destructive', onPress: removeAllClients }
                                    ]
                                );
                            }}
                        >
                            <Ionicons name="trash-outline" size={16} color={COLORS.danger} />
                        </TouchableOpacity>
                    )}
                    <Text style={styles.clientCount}>{filteredClients.length}</Text>
                </View>
            </View>

            {/* Search Bar */}
            <View style={styles.searchContainer}>
                <Ionicons name="search" size={20} color={COLORS.muted} />
                <TextInput
                    style={styles.searchInput}
                    placeholder="Search by name, goal, or email..."
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
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filtersContainer}
            />

            {/* Client List */}
            {loading ? (
                <View style={styles.emptyState}>
                    <Ionicons name="hourglass-outline" size={64} color={COLORS.muted} />
                    <Text style={styles.emptyTitle}>Loading clients...</Text>
                </View>
            ) : filteredClients.length > 0 ? (
                <FlatList
                    data={filteredClients}
                    renderItem={renderClientCard}
                    keyExtractor={(item, index) => `${item.id}-${item.relationshipId}-${index}`}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            ) : (
                <View style={styles.emptyState}>
                    <Ionicons name="people-outline" size={64} color={COLORS.muted} />
                    <Text style={styles.emptyTitle}>No clients found</Text>
                    <Text style={styles.emptyDesc}>
                        {searchQuery
                            ? "Try adjusting your search or filters"
                            : clients.length === 0 
                                ? "When clients request you as their coach, they'll appear here"
                                : "No clients match the selected filter"}
                    </Text>
                </View>
            )}
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
        paddingHorizontal: 16,
        paddingBottom: 16,
        backgroundColor: COLORS.bg,
        borderBottomWidth: 1,
        borderBottomColor: COLORS.border,
    },
    backButton: {
        padding: 8,
    },
    headerTitle: {
        fontSize: 20,
        fontWeight: "800",
        color: COLORS.text,
        flex: 1,
        marginLeft: 8,
    },
    headerRight: {
        flexDirection: "row",
        alignItems: "center",
        gap: 8,
    },
    removeAllButton: {
        padding: 8,
        backgroundColor: COLORS.danger + "20",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.danger,
    },
    clientCount: {
        fontSize: 14,
        fontWeight: "700",
        color: COLORS.primary,
        backgroundColor: COLORS.primary + "20",
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    searchContainer: {
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: COLORS.card,
        marginHorizontal: 16,
        marginTop: 16,
        paddingHorizontal: 16,
        paddingVertical: 12,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    searchInput: {
        flex: 1,
        marginLeft: 12,
        fontSize: 16,
        color: COLORS.text,
    },
    filtersContainer: {
        marginTop: 16,
        marginBottom: 8,
        height: 40,
    },
    filtersContent: {
        paddingHorizontal: 16,
        flexDirection: 'row',
        gap: 8,
    },
    filterChip: {
        width: 90,
        height: 36,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 18,
        borderWidth: 1.5,
        borderColor: COLORS.muted,
        backgroundColor: COLORS.muted + "20",
    },
    filterChipActive: {
        borderColor: COLORS.primary,
        backgroundColor: COLORS.primary,
    },
    filterText: {
        fontSize: 14,
        fontWeight: '600',
        includeFontPadding: false,
        textAlign: 'center',
    },

    listContent: {
        padding: 16,
        paddingBottom: 32,
    },
    clientCard: {
        flexDirection: "row",
        backgroundColor: COLORS.card,
        padding: 16,
        borderRadius: 12,
        marginBottom: 12,
        borderWidth: 1,
        borderColor: COLORS.border,
    },
    clientAvatar: {
        width: 60,
        height: 60,
        borderRadius: 30,
        backgroundColor: COLORS.card2,
    },
    clientInfo: {
        flex: 1,
        marginLeft: 16,
    },
    clientHeader: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 4,
    },
    clientName: {
        fontSize: 16,
        fontWeight: "700",
        color: COLORS.text,
        flex: 1,
    },
    statusBadge: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        gap: 4,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    statusText: {
        fontSize: 11,
        fontWeight: "600",
    },
    clientGoal: {
        fontSize: 14,
        color: COLORS.muted,
        marginBottom: 8,
    },
    clientStats: {
        flexDirection: "row",
        gap: 16,
        marginBottom: 8,
    },
    statItem: {
        flexDirection: "row",
        alignItems: "center",
        gap: 4,
    },
    statText: {
        fontSize: 12,
        color: COLORS.muted,
    },
    clientFooter: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
    },
    lastSession: {
        fontSize: 12,
        color: COLORS.muted,
    },
    messageIconButton: {
        padding: 6,
        backgroundColor: COLORS.primary + "20",
        borderRadius: 8,
        borderWidth: 1,
        borderColor: COLORS.primary,
    },
    emptyState: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
    },
    emptyTitle: {
        fontSize: 18,
        fontWeight: "600",
        color: COLORS.text,
        marginTop: 16,
    },
    emptyDesc: {
        fontSize: 14,
        color: COLORS.muted,
        textAlign: "center",
        marginTop: 8,
    },
});
