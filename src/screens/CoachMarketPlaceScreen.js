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

// Enable LayoutAnimation on Android
if (Platform.OS === "android") {
  UIManager.setLayoutAnimationEnabledExperimental &&
    UIManager.setLayoutAnimationEnabledExperimental(true);
}

// Dummy coaches (13 coaches)
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
    reviewsList: [
      { id: "r1", reviewer: "Sophia", comment: "Very calming sessions.", stars: 5 },
    ],
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
    reviewsList: [
      { id: "r1", reviewer: "Tom", comment: "Effective workouts.", stars: 4 },
    ],
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
    reviewsList: [
      { id: "r1", reviewer: "Emma", comment: "Love her classes!", stars: 5 },
    ],
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
    reviewsList: [
      { id: "r1", reviewer: "Daniel", comment: "Super intense workouts!", stars: 4 },
    ],
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
    reviewsList: [
      { id: "r1", reviewer: "Mia", comment: "Very knowledgeable!", stars: 5 },
    ],
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
    reviewsList: [
      { id: "r1", reviewer: "Noah", comment: "Improved my stamina!", stars: 4 },
    ],
  },
];

const categories = ["All", "Strength", "Yoga", "Cardio", "Pilates"];

export default function CoachMarketplaceScreen() {
  const [coaches, setCoaches] = useState(dummyCoaches);
  const [expandedId, setExpandedId] = useState(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [reviewInputs, setReviewInputs] = useState({});
  const [reviewStars, setReviewStars] = useState({});

  const filteredCoaches = coaches.filter(
    (c) =>
      (selectedCategory === "All" || c.category === selectedCategory) &&
      c.name.toLowerCase().includes(search.toLowerCase())
  );

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

  const renderStarsPicker = (coachId) => (
    <View style={{ flexDirection: "row", marginVertical: 6 }}>
      {[1, 2, 3, 4, 5].map((star) => (
        <TouchableOpacity key={star} onPress={() => setReviewStars({ ...reviewStars, [coachId]: star })}>
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
        style={[styles.card, expanded && { backgroundColor: "#1f2937" }]}
        onPress={() => toggleExpand(item.id)}
      >
        <View style={styles.row}>
          <Image source={{ uri: item.photo }} style={styles.photo} />
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.specialization}>{item.specialization}</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Ionicons name="star" size={16} color="#facc15" />
                <Text style={styles.statText}>{item.rating.toFixed(1)}</Text>
              </View>
              <View style={styles.statItem}>
                <Ionicons name="chatbubble-outline" size={16} color="#94a3b8" />
                <Text style={styles.statText}>{item.reviewsList.length}</Text>
              </View>
            </View>
          </View>
          <Ionicons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={24}
            color="#e5e7eb"
          />
        </View>

        {expanded && (
          <View style={styles.expanded}>
            <Text style={styles.bio}>{item.bio}</Text>

            <TouchableOpacity
              style={styles.whatsappButton}
              onPress={() => alert(`WhatsApp: ${item.whatsapp}`)}
            >
              <FontAwesome name="whatsapp" size={20} color="#0B1220" />
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
                placeholder="Leave a review..."
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
      <Text style={styles.header}>Coach Marketplace</Text>

      <TextInput
        placeholder="Search coaches..."
        placeholderTextColor="#64748b"
        style={styles.searchInput}
        value={search}
        onChangeText={setSearch}
      />

      <View style={styles.filterRow}>
        {categories.map((cat) => (
          <TouchableOpacity
            key={cat}
            onPress={() => setSelectedCategory(cat)}
            style={[
              styles.filterTab,
              selectedCategory === cat && { backgroundColor: "#10B981" },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                selectedCategory === cat && { color: "#0B1220", fontWeight: "700" },
              ]}
            >
              {cat}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filteredCoaches}
        renderItem={renderCoach}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16, paddingBottom: 80 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
  header: { color: "#e5e7eb", fontSize: 22, fontWeight: "700", margin: 16 },
  searchInput: {
    backgroundColor: "#1f2937",
    marginHorizontal: 16,
    borderRadius: 12,
    paddingHorizontal: 12,
    color: "#e5e7eb",
    marginBottom: 12,
    height: 40,
  },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 12,
    justifyContent: "space-between",
  },
  filterTab: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#334155",
    alignItems: "center",
  },
  filterText: { color: "#e5e7eb", fontSize: 12 },
  card: { backgroundColor: "#111827", borderRadius: 12, padding: 12, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center" },
  photo: { width: 60, height: 60, borderRadius: 30, marginRight: 12 },
  name: { color: "#e5e7eb", fontSize: 16, fontWeight: "700" },
  specialization: { color: "#94a3b8", fontSize: 12, marginTop: 2, marginBottom: 4 },
  statsRow: { flexDirection: "row" },
  statItem: { flexDirection: "row", alignItems: "center", marginRight: 12 },
  statText: { color: "#e5e7eb", fontSize: 12 },
  expanded: { marginTop: 12, borderTopWidth: 1, borderTopColor: "#334155", paddingTop: 12 },
  bio: { color: "#e5e7eb", fontSize: 13, marginBottom: 8, lineHeight: 18 },
  whatsappButton: { flexDirection: "row", alignItems: "center", backgroundColor: "#10B981", padding: 8, borderRadius: 8, marginBottom: 12 },
  whatsappText: { color: "#0B1220", fontWeight: "700", marginLeft: 8 },
  sectionTitle: { color: "#e5e7eb", fontWeight: "700", marginTop: 8, marginBottom: 4 },
  reviewItem: { backgroundColor: "#1f2937", padding: 8, borderRadius: 8, marginBottom: 6 },
  reviewer: { color: "#facc15", fontWeight: "700", fontSize: 12 },
  reviewComment: { color: "#e5e7eb", fontSize: 12, marginTop: 2 },
  leaveReview: { marginTop: 8 },
  reviewInput: { backgroundColor: "#1f2937", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 6, color: "#e5e7eb", fontSize: 12 },
  submitButton: { backgroundColor: "#10B981", padding: 8, borderRadius: 8, alignItems: "center", marginTop: 8 },
  submitText: { color: "#0B1220", fontWeight: "700" },
});
