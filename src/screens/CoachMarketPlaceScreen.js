// src/screens/CoachMarketPlaceScreen.js
import React, { useState } from "react";
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
  SafeAreaView,
  ScrollView,
} from "react-native";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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

/* ----------------- Dummy Data (13) ----------------- */
const dummyCoaches = [
  {
    id: "1",
    name: "John Doe",
    photo: "https://randomuser.me/api/portraits/men/32.jpg",
    rating: 4.5,
    specialization: "Strength Training",
    category: "Strength",
    bio: "Certified personal trainer with 5 years of experience in strength and conditioning. Focuses on building muscle and functional strength with tailored programs.",
    whatsapp: "+1234567890",
    reviewsList: [
      { id: "r1", reviewer: "Alice", comment: "Great trainer, very motivating!", stars: 5 },
      { id: "r2", reviewer: "Bob", comment: "Helped me improve my form.", stars: 4 },
    ],
  },
  {
    id: "2",
    name: "Jane Smith",
    photo: "https://randomuser.me/api/portraits/women/44.jpg",
    rating: 4.8,
    specialization: "Yoga & Flexibility",
    category: "Yoga",
    bio: "Yoga instructor passionate about holistic health and mindfulness. Teaches Hatha and Vinyasa yoga for all levels.",
    whatsapp: "+1987654321",
    reviewsList: [
      { id: "r1", reviewer: "Charlie", comment: "Very calm and professional.", stars: 5 },
      { id: "r2", reviewer: "Diana", comment: "My flexibility improved a lot!", stars: 5 },
    ],
  },
  {
    id: "3",
    name: "Mike Johnson",
    photo: "https://randomuser.me/api/portraits/men/56.jpg",
    rating: 4.2,
    specialization: "HIIT & Cardio",
    category: "Cardio",
    bio: "High-intensity interval training expert focused on fat loss and endurance. Uses fun, challenging circuits.",
    whatsapp: "+1122334455",
    reviewsList: [
      { id: "r1", reviewer: "Eva", comment: "Intense sessions, highly recommend!", stars: 4 },
      { id: "r2", reviewer: "Frank", comment: "Challenging but fun workouts.", stars: 4 },
    ],
  },
  {
    id: "4",
    name: "Sarah Lee",
    photo: "https://randomuser.me/api/portraits/women/65.jpg",
    rating: 4.9,
    specialization: "Pilates",
    category: "Pilates",
    bio: "Pilates instructor with 7 years experience helping clients strengthen core and improve posture.",
    whatsapp: "+1098765432",
    reviewsList: [
      { id: "r1", reviewer: "Hannah", comment: "Amazing attention to detail!", stars: 5 },
      { id: "r2", reviewer: "Irene", comment: "Improved my posture significantly.", stars: 4 },
    ],
  },
  {
    id: "5",
    name: "David Brown",
    photo: "https://randomuser.me/api/portraits/men/72.jpg",
    rating: 4.6,
    specialization: "Crossfit",
    category: "Strength",
    bio: "Crossfit coach specialized in endurance, weightlifting, and functional training. Motivates clients to push boundaries.",
    whatsapp: "+1230984567",
    reviewsList: [
      { id: "r1", reviewer: "Jack", comment: "Great energy and guidance!", stars: 5 },
      { id: "r2", reviewer: "Kevin", comment: "Saw improvements quickly!", stars: 4 },
    ],
  },
  {
    id: "6",
    name: "Laura White",
    photo: "https://randomuser.me/api/portraits/women/30.jpg",
    rating: 4.7,
    specialization: "Cardio & Endurance",
    category: "Cardio",
    bio: "Passionate about long-distance running and stamina training. Helps clients increase endurance safely.",
    whatsapp: "+1987001122",
    reviewsList: [
      { id: "r1", reviewer: "Sam", comment: "Love her running tips!", stars: 5 },
      { id: "r2", reviewer: "Nina", comment: "Great motivational coach.", stars: 5 },
    ],
  },
  {
    id: "7",
    name: "Tom Harris",
    photo: "https://randomuser.me/api/portraits/men/45.jpg",
    rating: 4.3,
    specialization: "Strength & Conditioning",
    category: "Strength",
    bio: "Experienced coach in muscle building and strength programs for all levels.",
    whatsapp: "+1234556677",
    reviewsList: [
      { id: "r1", reviewer: "Liam", comment: "Great strength plans.", stars: 4 },
      { id: "r2", reviewer: "Olivia", comment: "Saw good results fast!", stars: 5 },
    ],
  },
  {
    id: "8",
    name: "Emily Clark",
    photo: "https://randomuser.me/api/portraits/women/12.jpg",
    rating: 4.5,
    specialization: "Yoga & Meditation",
    category: "Yoga",
    bio: "Specializes in mindfulness yoga and stress reduction techniques.",
    whatsapp: "+1234012345",
    reviewsList: [{ id: "r1", reviewer: "Sophia", comment: "Very calming sessions.", stars: 5 }],
  },
  {
    id: "9",
    name: "Chris Martin",
    photo: "https://randomuser.me/api/portraits/men/22.jpg",
    rating: 4.1,
    specialization: "Functional Training",
    category: "Strength",
    bio: "Functional training expert helping clients with mobility, balance, and strength.",
    whatsapp: "+1234023456",
    reviewsList: [{ id: "r1", reviewer: "Tom", comment: "Effective workouts.", stars: 4 }],
  },
  {
    id: "10",
    name: "Olivia Turner",
    photo: "https://randomuser.me/api/portraits/women/23.jpg",
    rating: 4.8,
    specialization: "Pilates & Core",
    category: "Pilates",
    bio: "Focuses on strengthening the core and improving posture for all ages.",
    whatsapp: "+1234034567",
    reviewsList: [{ id: "r1", reviewer: "Emma", comment: "Love her classes!", stars: 5 }],
  },
  {
    id: "11",
    name: "Ryan Scott",
    photo: "https://randomuser.me/api/portraits/men/24.jpg",
    rating: 4.4,
    specialization: "HIIT",
    category: "Cardio",
    bio: "Energetic HIIT coach to boost stamina and fat loss.",
    whatsapp: "+1234045678",
    reviewsList: [{ id: "r1", reviewer: "Daniel", comment: "Super intense workouts!", stars: 4 }],
  },
  {
    id: "12",
    name: "Sophia Adams",
    photo: "https://randomuser.me/api/portraits/women/25.jpg",
    rating: 4.6,
    specialization: "Strength & Conditioning",
    category: "Strength",
    bio: "Helps clients build strength safely and effectively.",
    whatsapp: "+1234056789",
    reviewsList: [{ id: "r1", reviewer: "Mia", comment: "Very knowledgeable!", stars: 5 }],
  },
  {
    id: "13",
    name: "Ethan Brooks",
    photo: "https://randomuser.me/api/portraits/men/26.jpg",
    rating: 4.3,
    specialization: "Cardio & Endurance",
    category: "Cardio",
    bio: "Endurance coach for running and high-intensity cardio programs.",
    whatsapp: "+1234067890",
    reviewsList: [{ id: "r1", reviewer: "Noah", comment: "Improved my stamina!", stars: 4 }],
  },
];

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

  const [coaches, setCoaches] = useState(dummyCoaches);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [reviewInputs, setReviewInputs] = useState({});
  const [reviewStars, setReviewStars] = useState({});
  const [sort, setSort] = useState("Top rated"); // "Top rated" | "Name"

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
          ...coach.reviewsList,
          { id: `r${coach.reviewsList.length + 1}`, reviewer: "You", comment: newComment, stars },
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
  const filtered = coaches.filter(
    (c) =>
      (selectedCategory === "All" || c.category === selectedCategory) &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

  const sorted =
    sort === "Name"
      ? [...filtered].sort((a, b) => a.name.localeCompare(b.name))
      : [...filtered].sort((a, b) => b.rating - a.rating);

  /* --------------------------- UI --------------------------- */
  const renderStarsPicker = (coachId) => (
    <View style={{ flexDirection: "row", marginVertical: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity
          key={star}
          onPress={() => setReviewStars({ ...reviewStars, [coachId]: star })}
        >
          <Ionicons
            name={reviewStars[coachId] >= star ? "star" : "star-outline"}
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
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        style={[styles.card, expanded && { backgroundColor: ELEVATED }]}
        onPress={() => toggleExpand(item.id)}
      >
        {/* Top row */}
        <View style={styles.row}>
          <Image source={{ uri: item.photo }} style={styles.photo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>

            <View style={styles.badgesRow}>
              <View style={styles.smallChip}>
                <CatIcon cat={item.category} size={12} color={ACCENT} />
                <Text style={styles.smallChipText}>{item.category}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={15} color={MUTED} />
                <Text style={styles.statText}>{item.reviewsList.length} reviews</Text>
              </View>
            </View>
          </View>

          <View style={styles.ratingBubble}>
            <Ionicons name="star" size={13} color="#facc15" />
            <Text style={styles.ratingText}>{item.rating.toFixed(1)}</Text>
          </View>
        </View>

        {/* Expanded content */}
        {expanded && (
          <View style={styles.expanded}>
            <Text style={styles.bio}>{item.bio}</Text>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => alert(`WhatsApp: ${item.whatsapp}`)}
            >
              <FontAwesome name="whatsapp" size={20} color={BG} />
              <Text style={styles.whatsappText}>{item.whatsapp}</Text>
            </TouchableOpacity>

            <Text style={styles.sectionTitle}>Reviews</Text>
            {item.reviewsList.map((review) => (
              <View key={review.id} style={styles.reviewItem}>
                <Text style={styles.reviewer}>
                  {review.reviewer} ({review.stars}⭐)
                </Text>
                <Text style={styles.reviewComment}>{review.comment}</Text>
              </View>
            ))}

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

        {/* Sort row (own line, horizontally scrollable) */}
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
