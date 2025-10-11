// src/screens/CoachMarketPlaceScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  TextInput,
  LayoutAnimation,
  UIManager,
  Platform,
  ScrollView,
  Alert,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { collection, onSnapshot, query, where, doc, getDoc, setDoc, serverTimestamp, addDoc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../lib/firebaseApp';
import { getAuth } from 'firebase/auth';
import { getOrCreateOneToOneChat } from '../lib/chatUtils';
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets, SafeAreaView } from "react-native-safe-area-context";

/* -------- Enable LayoutAnimation on Android -------- */
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* ---------------------- Theme ---------------------- */
const BG = "#0B1220";
const CARD = "#101927";
const ELEVATED = "#0f1b2e";
const BORDER = "#263446";
const TEXT = "#E7EDF6";
const MUTED = "#8EA1B8";
const ACCENT = "#10B981";
const CHIP_BG = "rgba(18, 35, 57, 0.7)";

const categories = ["All", "Strength", "Yoga", "Cardio", "Pilates"];

/* ------------------ Small helper icon ------------------ */
const CatIcon = ({ cat, size = 14, color = TEXT }) => {
  const map = {
    All: "grid-outline",
    Strength: "barbell-outline",
    Yoga: "leaf-outline",
    Cardio: "flash-outline",
    Pilates: "body-outline",
  };
  return <Ionicons name={map[cat] || "grid-outline"} size={size} color={color} />;
};

/* ===================== Component ===================== */
export default function CoachMarketplaceScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const [coaches, setCoaches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [reviewInputs, setReviewInputs] = useState({});
  const [reviewStars, setReviewStars] = useState({});
  const [sort, setSort] = useState("Top rated");
  const [creatingChatCoachId, setCreatingChatCoachId] = useState(null);

  const auth = getAuth();
  const currentUser = auth.currentUser;

  // Subscribe to ALL coaches from Firebase - improved query
  useEffect(() => {
    const coachesRef = collection(db, 'coaches');
    
    // Query for coaches that are either:
    // 1. public: true, OR
    // 2. status: 'approved', OR  
    // 3. coachApproved: true
    // Note: Firestore doesn't support OR queries directly, so we'll fetch all and filter in code
    
    const unsub = onSnapshot(coachesRef, snap => {
      let list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      
      // Filter for approved/public coaches
      list = list.filter(coach => {
        const isPublic = coach.public === true;
        const isApproved = coach.status?.toLowerCase() === 'approved';
        const hasCoachApproved = coach.coachApproved === true;
        
        // Show coach if ANY of these conditions are true
        return isPublic || isApproved || hasCoachApproved;
      });
      
      console.log(`[CoachMarketplace] Loaded ${list.length} approved/public coaches from Firebase`);
      
      setCoaches(list);
      setLoading(false);
    }, e => { 
      console.warn('[CoachMarketplace] listen error', e); 
      setLoading(false); 
    });
    
    return () => unsub();
  }, []);

  const startChat = useCallback(async (coach) => {
    if (!currentUser) { 
      console.log('[CoachMarketplace] startChat aborted: no currentUser'); 
      return; 
    }
    if (currentUser.uid === coach.id) {
      Alert.alert('Cannot Message Yourself', 'You cannot message your own coach profile.');
      return;
    }
    if (creatingChatCoachId) return;
    
    setCreatingChatCoachId(coach.id);
    let chat; 
    let stage = 'create';
    
    try {
      console.log('[CoachMarketplace] startChat -> getOrCreateOneToOneChat');
      chat = await getOrCreateOneToOneChat(currentUser.uid, coach.id);
      console.log('[CoachMarketplace] chat id', chat.id, 'has lastMessage?', !!chat.lastMessage);
      
      stage = 'seed-check';
      if (!chat.lastMessage || !chat._seededGreeting) {
        console.log('[CoachMarketplace] seeding greeting');
        stage = 'seed-write-message';
        const greeting = 'Hi coach! I would like to connect.';
        const messagesRef = collection(db, 'chats', chat.id, 'messages');
        await addDoc(messagesRef, {
          text: greeting,
          senderId: currentUser.uid,
          timestamp: serverTimestamp(),
          read: false,
        });
        
        stage = 'seed-update-chat';
        const chatRef = doc(db, 'chats', chat.id);
        await updateDoc(chatRef, {
          lastMessage: { text: greeting, senderId: currentUser.uid, timestamp: serverTimestamp() },
          updatedAt: serverTimestamp(),
          _seededGreeting: true,
          [`unreadCount.${coach.id}`]: increment(1),
        });
      }
      
      stage = 'navigate';
      navigation.navigate('Chat', { 
        chatId: chat.id, 
        otherUser: chat.participantDetails[coach.id] || { 
          id: coach.id, 
          name: coach.name || coach.displayName || 'Coach', 
          role: 'coach' 
        } 
      });
    } catch (e) {
      console.warn('[CoachMarketplace] startChat error stage='+stage, e);
      const msg = e?.message || 'Unknown error';
      Alert.alert('Chat Error', `Could not start chat (stage: ${stage}). ${msg}`);
      
      if (chat?.id && stage !== 'navigate') {
        navigation.navigate('Chat', { 
          chatId: chat.id, 
          otherUser: chat?.participantDetails?.[coach.id] || { 
            id: coach.id, 
            name: coach.name || 'Coach', 
            role: 'coach' 
          } 
        });
      }
    } finally {
      setCreatingChatCoachId(null);
    }
  }, [currentUser, navigation, creatingChatCoachId]);

  const requestCoach = useCallback(async (coach) => {
    if (!currentUser) {
      Alert.alert('Authentication Required', 'Please sign in to request a coach.');
      return;
    }
    
    if (currentUser.uid === coach.id) {
      Alert.alert('Cannot Request Yourself', 'You cannot send a coach request to yourself.');
      return;
    }

    console.log('[CoachMarketplace] requestCoach starting for coach:', coach.id, 'from user:', currentUser.uid);

    // Debug: Check if this coach exists in the coaches collection
    const coachRef = doc(db, 'coaches', coach.id);
    const coachSnap = await getDoc(coachRef);
    console.log('[CoachMarketplace] Coach document exists:', coachSnap.exists(), 'coach data keys:', coachSnap.exists() ? Object.keys(coachSnap.data()) : 'none');

    try {
      // Get current user's profile data
      const userRef = doc(db, 'users', currentUser.uid);
      const userSnap = await getDoc(userRef);
      const userData = userSnap.exists() ? userSnap.data() : {};
      
      const userName = userData.name || userData.displayName || currentUser.displayName || 'User';
      
      console.log('[CoachMarketplace] Creating notification for recipient:', coach.id, 'from sender:', currentUser.uid);
      
      // Create coach request notification
      const notificationRef = doc(collection(db, 'notifications'));
      await setDoc(notificationRef, {
        type: 'coach_request',
        recipientId: coach.id,
        senderId: currentUser.uid,
        senderName: userName,
        senderPhotoURL: userData.photoURL || currentUser.photoURL || null,
        coachName: coach.name || coach.displayName || 'Coach',
        title: 'New Coach Request',
        message: `${userName} wants you as their personal coach. They're looking for professional guidance to achieve their fitness goals.`,
        data: {
          requesterId: currentUser.uid,
          requesterName: userName,
          requesterPhotoURL: userData.photoURL || currentUser.photoURL || null,
          coachId: coach.id,
          coachName: coach.name || coach.displayName || 'Coach',
        },
        status: 'pending',
        createdAt: serverTimestamp(),
        read: false,
      });

      console.log('[CoachMarketplace] Notification created successfully with ID:', notificationRef.id);

      Alert.alert(
        'Request Sent!', 
        `Your coaching request has been sent to ${coach.name || 'the coach'}. They will be notified and can choose to accept you as a client.`
      );

    } catch (error) {
      console.error('[CoachMarketplace] requestCoach error:', error);
      Alert.alert('Request Failed', `Unable to send coach request. Error: ${error.message}`);
    }
  }, [currentUser]);

  const toggleExpand = (id) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedId(expandedId === id ? null : id);
  };

  const handleSubmitReview = (coachId) => {
    const newComment = reviewInputs[coachId];
    const stars = reviewStars[coachId] || 5;
    if (!newComment || newComment.trim() === "") return;

    const updatedCoaches = coaches.map((coach) => {
      if (coach.id === coachId) {
        const updatedReviews = [
          ...(coach.reviewsList || []),
          { id: `r${Date.now()}`, reviewer: "You", comment: newComment, stars },
        ];
        const avgRating =
          updatedReviews.reduce((sum, r) => sum + r.stars, 0) / updatedReviews.length;
        return { ...coach, reviewsList: updatedReviews, rating: avgRating };
      }
      return coach;
    });

    setCoaches(updatedCoaches);
    setReviewInputs({ ...reviewInputs, [coachId]: "" });
    setReviewStars({ ...reviewStars, [coachId]: 5 });
  };

  /* -------------- Derived filtered/sorted list -------------- */
  const filtered = useMemo(() => coaches.filter(c => {
    // Filter by category
    const cat = selectedCategory === 'All' || 
                (c.category || c.specializationCategory) === selectedCategory;
    
    // Filter by search term
    const term = search.trim().toLowerCase();
    const nameMatch = !term || 
                      (c.name || c.displayName || '').toLowerCase().includes(term) ||
                      (c.specialization || c.focus || '').toLowerCase().includes(term);
    
    return cat && nameMatch;
  }), [coaches, selectedCategory, search]);

  const sorted =
    sort === "Name"
      ? [...filtered].sort((a, b) => (a.name || a.displayName || '').localeCompare(b.name || b.displayName || ''))
      : [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));

  /* --------------------------- UI --------------------------- */
  const renderStarsPicker = (coachId) => (
    <View style={{ flexDirection: "row", marginVertical: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setReviewStars({ ...reviewStars, [coachId]: star })}
        >
          <Ionicons
            name={(reviewStars[coachId] || 5) >= star ? "star" : "star-outline"}
            size={20}
            color="#facc15"
            style={{ marginRight: 4 }}
          />
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderCoach = ({ item }) => {
    const expanded = expandedId === item.id;
    const coachName = item.name || item.displayName || 'Coach';
    const specialization = item.specialization || item.focus || 'Fitness';
    const rating = item.rating || item.avgRating || 0;
    const category = item.category || item.specializationCategory || 'General';
    const photo = item.photoURL || item.avatar || 'https://placehold.co/120x120/png';
    const bio = item.shortBio || item.bio || 'No bio provided yet.';
    const reviews = item.reviewsList || [];
    
    const isOwnProfile = currentUser?.uid === item.id;
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, expanded && { backgroundColor: ELEVATED }]}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Top row */}
        <View style={styles.row}>
          <Image source={{ uri: photo }} style={styles.photo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{coachName}</Text>
            <Text style={styles.specialization}>{specialization}</Text>

            <View style={styles.badgesRow}>
              <View style={styles.smallChip}>
                <CatIcon cat={category} size={12} color={ACCENT} />
                <Text style={styles.smallChipText}>{category}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={15} color={MUTED} />
                <Text style={styles.statText}>{reviews.length} reviews</Text>
              </View>
            </View>
          </View>

          <View style={styles.ratingBubble}>
            <Ionicons name="star" size={13} color="#facc15" />
            <Text style={styles.ratingText}>{Number(rating).toFixed(1)}</Text>
          </View>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expanded}>
            <Text style={styles.bio}>{bio}</Text>

            <View style={{ flexDirection:'row', gap:8, marginBottom:12, flexWrap: 'wrap' }}>
              {!isOwnProfile && (
                <>
                  <TouchableOpacity
                    style={styles.whatsappButton}
                    onPress={() => startChat(item)}
                    disabled={creatingChatCoachId===item.id}
                  >
                    <Ionicons name="chatbubbles" size={18} color={BG} />
                    <Text style={styles.whatsappText}>
                      {creatingChatCoachId===item.id ? 'Loading...' : 'Message'}
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.whatsappButton, { backgroundColor: '#2563eb' }]}
                    onPress={() => requestCoach(item)}
                  >
                    <Ionicons name="person-add" size={18} color="#fff" />
                    <Text style={[styles.whatsappText, { color: '#fff' }]}>Request Coach</Text>
                  </TouchableOpacity>
                </>
              )}
              
              <TouchableOpacity
                style={[styles.whatsappButton,{ backgroundColor:'#334155' }]}
                onPress={() => navigation.navigate('CoachPublicProfile', { coachId: item.id })}
              >
                <Ionicons name="person-circle" size={18} color={ACCENT} />
                <Text style={[styles.whatsappText,{ color:ACCENT }]}>View Profile</Text>
              </TouchableOpacity>
            </View>
            
            <Text style={styles.sectionTitle}>Reviews</Text>
            {reviews.length === 0 ? (
              <Text style={{ color: MUTED, fontSize: 12, fontStyle: 'italic', marginBottom: 8 }}>
                No reviews yet. Be the first to leave one!
              </Text>
            ) : (
              reviews.map((review) => (
                <View key={review.id} style={styles.reviewItem}>
                  <Text style={styles.reviewer}>
                    {(review.reviewer||'User')} ({review.stars||5}⭐)
                  </Text>
                  <Text style={styles.reviewComment}>{review.comment}</Text>
                </View>
              ))
            )}

            {!isOwnProfile && (
              <View style={styles.leaveReview}>
                {renderStarsPicker(item.id)}
                <TextInput
                  style={styles.reviewInput}
                  placeholder="Leave a review…"
                  placeholderTextColor="#94a3b8"
                  value={reviewInputs[item.id] || ""}
                  onChangeText={(text) =>
                    setReviewInputs({ ...reviewInputs, [item.id]: text })
                  }
                />
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={() => handleSubmitReview(item.id)}
                >
                  <Text style={styles.submitText}>Submit</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* HEADER */}
      <LinearGradient
        colors={["#061425", "#0c2748"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.header,
          {
            paddingTop: (insets?.top || 0) + 8,
            paddingRight: (insets?.right || 0) + 16,
            paddingLeft: 16,
          },
        ]}
      >
        <View style={styles.headerTopRow}>
          {/* Back button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}
            accessibilityLabel="Go back"
          >
            <Ionicons name="chevron-back" size={22} color={TEXT} />
          </TouchableOpacity>

          <Text style={styles.title} numberOfLines={1}>
            Coach Marketplace
          </Text>

          {/* right spacer to keep title centered */}
          <View style={{ width: 32, height: 32 }} />
        </View>

        {/* Sort row */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.sortScroll}
        >
          <TouchableOpacity
            onPress={() => setSort("Top rated")}
            style={[styles.sortPill, sort === "Top rated" && styles.sortActive]}
          >
            <Ionicons
              name="sparkles-outline"
              size={13}
              color={sort === "Top rated" ? BG : TEXT}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.sortText, sort === "Top rated" && { color: BG }]}>
              Top rated
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setSort("Name")}
            style={[styles.sortPill, sort === "Name" && styles.sortActive]}
          >
            <Ionicons
              name="text-outline"
              size={13}
              color={sort === "Name" ? BG : TEXT}
              style={{ marginRight: 6 }}
            />
            <Text style={[styles.sortText, sort === "Name" && { color: BG }]}>Name</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Search */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={MUTED} style={{ marginHorizontal: 10 }} />
          <TextInput
            placeholder="Search coaches…"
            placeholderTextColor="#7f92ad"
            value={search}
            onChangeText={setSearch}
            style={styles.searchInput}
          />
        </View>

        {/* Category chips */}
        <View style={styles.categories}>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <TouchableOpacity
                key={cat}
                onPress={() => setSelectedCategory(cat)}
                style={[styles.catPill, active && styles.catPillActive]}
              >
                <CatIcon cat={cat} size={14} color={active ? BG : TEXT} />
                <Text style={[styles.catText, active && { color: BG }]} numberOfLines={1}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </LinearGradient>

      {/* LIST */}
      <FlatList
        data={sorted}
        renderItem={renderCoach}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
        ListEmptyComponent={!loading && (
          <View style={{ alignItems:'center', marginTop:40 }}>
            <Ionicons name='people-circle-outline' size={56} color={MUTED} />
            <Text style={{ color:TEXT, fontWeight:'700', marginTop:12 }}>No coaches found</Text>
            <Text style={{ color:MUTED, fontSize:12, marginTop:4 }}>
              {coaches.length === 0 
                ? 'No approved coaches in Firebase yet'
                : 'Try adjusting search or categories'}
            </Text>
          </View>
        )}
      />
    </SafeAreaView>
  );
}

/* ===================== Styles ===================== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  /* Header */
  header: {
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  backBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(16,25,46,0.35)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  title: {
    color: TEXT,
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: 0.3,
    flexShrink: 1,
  },

  sortScroll: {
    paddingVertical: 6,
    paddingRight: 6,
    gap: 8,
  },
  sortPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(16,25,46,0.55)",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    height: 38,
    borderRadius: 20,
    marginRight: 8,
  },
  sortActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  sortText: { color: TEXT, fontWeight: "800" },

  searchBar: {
    height: 48,
    borderRadius: 16,
    backgroundColor: "#0d1a2b",
    borderWidth: 1,
    borderColor: BORDER,
    marginTop: 8,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { flex: 1, color: TEXT, paddingRight: 12 },

  categories: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  catPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    height: 36,
    borderRadius: 18,
    backgroundColor: CHIP_BG,
    borderWidth: 1,
    borderColor: BORDER,
  },
  catPillActive: {
    backgroundColor: ACCENT,
    borderColor: ACCENT,
  },
  catText: { color: TEXT, fontSize: 12, fontWeight: "700" },

  /* List cards */
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
  },
  row: { flexDirection: "row", alignItems: "center" },
  photo: { width: 60, height: 60, borderRadius: 14, marginRight: 12 },
  name: { color: TEXT, fontSize: 18, fontWeight: "900" },
  specialization: { color: MUTED, fontSize: 13, marginTop: 2, marginBottom: 4 },
  badgesRow: { flexDirection: "row", alignItems: "center", gap: 10 },

  smallChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0d1a2b",
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 10,
    height: 28,
    borderRadius: 14,
  },
  smallChipText: { color: TEXT, fontSize: 12, fontWeight: "700" },

  statItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  statText: { color: "#b1c2d7", fontSize: 12, fontWeight: "700" },

  ratingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#132338",
    borderWidth: 1,
    borderColor: BORDER,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: 16,
  },
  ratingText: { color: TEXT, fontWeight: "800" },

  expanded: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: BORDER,
    paddingTop: 12,
  },
  bio: { color: TEXT, fontSize: 13, marginBottom: 10, lineHeight: 18 },

  whatsappButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: ACCENT,
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: "flex-start",
  },
  whatsappText: { color: BG, fontWeight: "800", marginLeft: 8 },

  sectionTitle: { color: TEXT, fontWeight: "800", marginTop: 4, marginBottom: 8 },
  reviewItem: {
    backgroundColor: "#0d1a2b",
    borderWidth: 1,
    borderColor: BORDER,
    padding: 8,
    borderRadius: 10,
    marginBottom: 6,
  },
  reviewer: { color: "#facc15", fontWeight: "800", fontSize: 12 },
  reviewComment: { color: TEXT, fontSize: 12, marginTop: 2 },

  leaveReview: { marginTop: 8 },
  reviewInput: {
    backgroundColor: "#0d1a2b",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    color: TEXT,
    fontSize: 12,
  },
  submitButton: {
    backgroundColor: ACCENT,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: BG, fontWeight: "800" },
});