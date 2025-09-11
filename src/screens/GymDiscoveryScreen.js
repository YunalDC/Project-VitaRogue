// GymDiscoveryScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

/** ------------------ Dummy data ------------------ */
const GYMS = [
  {
    id: "g1",
    name: "Iron Pulse Fitness",
    cover:
      "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=1200&auto=format&fit=crop",
    rating: 4.7,
    distanceKm: 0.8,
    price: "₹",
    openNow: true,
    tags: ["24/7", "CrossFit", "Weights"],
    address: "123 Main St",
  },
  {
    id: "g2",
    name: "Flex Nation Gym",
    cover:
      "https://images.unsplash.com/photo-1558611848-73f7eb4001a1?q=80&w=1200&auto=format&fit=crop",
    rating: 4.3,
    distanceKm: 2.1,
    price: "₹₹",
    openNow: false,
    tags: ["Cardio", "PT"],
    address: "45 Ocean Ave",
  },
  {
    id: "g3",
    name: "Barbell & Beyond",
    cover:
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?q=80&w=1200&auto=format&fit=crop",
    rating: 4.9,
    distanceKm: 3.4,
    price: "₹₹₹",
    openNow: true,
    tags: ["Olympic", "Sauna"],
    address: "777 Harbor Rd",
  },
  {
    id: "g4",
    name: "Studio HIIT",
    cover:
      "https://images.unsplash.com/photo-1517963628607-235ccdd5476e?q=80&w=1200&auto=format&fit=crop",
    rating: 4.1,
    distanceKm: 1.3,
    price: "₹",
    openNow: true,
    tags: ["HIIT", "Classes"],
    address: "9 Lake View",
  },
];

/** ------------------ UI helpers ------------------ */
function Chip({ label, active, onPress, icon }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[styles.chip, active && styles.chipActive]}
      activeOpacity={0.8}
    >
      {icon ? (
        <Ionicons
          name={icon}
          size={14}
          color={active ? "#0B1220" : "#9CA3AF"}
          style={{ marginRight: 6 }}
        />
      ) : null}
      <Text style={[styles.chipText, active && styles.chipTextActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function RatingStars({ rating }) {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const stars = Array.from({ length: 5 }).map((_, i) => {
    if (i < full) return "star";
    if (i === full && half) return "star-half";
    return "star-outline";
  });
  return (
    <View style={{ flexDirection: "row", alignItems: "center" }}>
      {stars.map((s, i) => (
        <Ionicons key={i} name={s} size={14} color="#F59E0B" />
      ))}
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
    </View>
  );
}

function GymCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.9} onPress={onPress}>
      <Image source={{ uri: item.cover }} style={styles.cardImage} />
      <View style={styles.cardBody}>
        <View style={styles.cardRow}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.name}
          </Text>
          <RatingStars rating={item.rating} />
        </View>

        <Text style={styles.cardSub} numberOfLines={1}>
          {item.address}
        </Text>

        <View style={styles.metaRow}>
          <View style={styles.metaBadge}>
            <Ionicons name="location-outline" size={14} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.distanceKm} km</Text>
          </View>
          <View style={styles.metaBadge}>
            <Ionicons name="cash-outline" size={14} color="#9CA3AF" />
            <Text style={styles.metaText}>{item.price}</Text>
          </View>
          <View
            style={[
              styles.statusPill,
              { backgroundColor: item.openNow ? "#DCFCE7" : "#FFE4E6" },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: item.openNow ? "#16A34A" : "#DC2626" },
              ]}
            />
            <Text
              style={[
                styles.statusText,
                { color: item.openNow ? "#166534" : "#991B1B" },
              ]}
            >
              {item.openNow ? "Open now" : "Closed"}
            </Text>
          </View>
        </View>

        <View style={styles.tagsRow}>
          {item.tags.map((t) => (
            <View key={t} style={styles.tag}>
              <Text style={styles.tagText}>{t}</Text>
            </View>
          ))}
        </View>
      </View>
    </TouchableOpacity>
  );
}

/** ------------------ Screen ------------------ */
export default function GymDiscoveryScreen() {
  const [query, setQuery] = useState("");
  const [onlyOpen, setOnlyOpen] = useState(false);
  const [cheapOnly, setCheapOnly] = useState(false);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState("distance"); // distance | rating

  const filtered = useMemo(() => {
    let out = GYMS;

    if (query.trim()) {
      const q = query.toLowerCase();
      out = out.filter(
        (g) =>
          g.name.toLowerCase().includes(q) ||
          g.address.toLowerCase().includes(q) ||
          g.tags.join(" ").toLowerCase().includes(q)
      );
    }

    if (onlyOpen) out = out.filter((g) => g.openNow);
    if (cheapOnly) out = out.filter((g) => g.price === "₹");
    if (minRating > 0) out = out.filter((g) => g.rating >= minRating);

    if (sort === "distance") {
      out = [...out].sort((a, b) => a.distanceKm - b.distanceKm);
    } else if (sort === "rating") {
      out = [...out].sort((a, b) => b.rating - a.rating);
    }
    return out;
  }, [query, onlyOpen, cheapOnly, minRating, sort]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Discover gyms</Text>
          <TouchableOpacity style={styles.iconBtn} onPress={() => {}}>
            <Ionicons name="map-outline" size={22} color="#E5E7EB" />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchBox}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            placeholder="Search gyms, classes, areas…"
            placeholderTextColor="#94A3B8"
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery("")}>
              <Ionicons name="close-circle" size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>

        {/* Quick filters */}
        <View style={styles.filtersRow}>
          <Chip
            label="Open now"
            active={onlyOpen}
            onPress={() => setOnlyOpen((v) => !v)}
            icon="time-outline"
          />
          <Chip
            label="₹ Budget"
            active={cheapOnly}
            onPress={() => setCheapOnly((v) => !v)}
            icon="pricetag-outline"
          />
          <Chip
            label="★ 4.0+"
            active={minRating >= 4}
            onPress={() => setMinRating((v) => (v >= 4 ? 0 : 4))}
            icon="star-outline"
          />
        </View>

        {/* Sort */}
        <View style={styles.sortRow}>
          <Text style={styles.sortLabel}>Sort by</Text>
          <View style={styles.sortBtns}>
            <TouchableOpacity
              style={[styles.sortBtn, sort === "distance" && styles.sortBtnActive]}
              onPress={() => setSort("distance")}
            >
              <Ionicons
                name="navigate-outline"
                size={14}
                color={sort === "distance" ? "#0B1220" : "#9CA3AF"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.sortBtnText,
                  sort === "distance" && styles.sortBtnTextActive,
                ]}
              >
                Distance
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.sortBtn, sort === "rating" && styles.sortBtnActive]}
              onPress={() => setSort("rating")}
            >
              <Ionicons
                name="star-outline"
                size={14}
                color={sort === "rating" ? "#0B1220" : "#9CA3AF"}
                style={{ marginRight: 6 }}
              />
              <Text
                style={[
                  styles.sortBtnText,
                  sort === "rating" && styles.sortBtnTextActive,
                ]}
              >
                Rating
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Results */}
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 24 }}
          renderItem={({ item }) => (
            <GymCard item={item} onPress={() => { /* navigate to details */ }} />
          )}
          ListEmptyComponent={
            <View style={{ padding: 40, alignItems: "center" }}>
              <Ionicons name="search" size={24} color="#6B7280" />
              <Text style={{ color: "#9CA3AF", marginTop: 8 }}>
                No gyms match your filters.
              </Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

/** ------------------ Styles ------------------ */
const BG = "#0B1220";
const CARD = "#111827";
const BORDER = "#1F2937";
const TEXT = "#E5E7EB";
const MUTED = "#94A3B8";

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: BG,
  },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: Platform.OS === "android" ? 8 : 0,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    flex: 1,
    color: TEXT,
    fontSize: 22,
    fontWeight: "800",
  },
  iconBtn: {
    height: 36,
    width: 36,
    borderRadius: 10,
    backgroundColor: CARD,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  searchBox: {
    height: 44,
    borderRadius: 12,
    backgroundColor: CARD,
    borderWidth: 1,
    borderColor: BORDER,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  searchInput: {
    flex: 1,
    color: TEXT,
    paddingVertical: 8,
    fontSize: 14,
  },
  filtersRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 12,
    marginBottom: 8,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
  },
  chipActive: {
    backgroundColor: "#E5E7EB",
    borderColor: "#E5E7EB",
  },
  chipText: {
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#0B1220",
  },
  sortRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginTop: 2,
  },
  sortLabel: {
    color: MUTED,
    marginRight: 10,
    fontSize: 12,
  },
  sortBtns: { flexDirection: "row", gap: 8 },
  sortBtn: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: CARD,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  sortBtnActive: { backgroundColor: "#E5E7EB", borderColor: "#E5E7EB" },
  sortBtnText: { color: MUTED, fontSize: 12, fontWeight: "700" },
  sortBtnTextActive: { color: "#0B1220" },
  card: {
    backgroundColor: CARD,
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: BORDER,
  },
  cardImage: { width: "100%", height: 140 },
  cardBody: { padding: 12 },
  cardRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  cardTitle: { flex: 1, color: TEXT, fontSize: 16, fontWeight: "800" },
  cardSub: { color: MUTED, fontSize: 12, marginBottom: 10 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 8 },
  metaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: BORDER,
    backgroundColor: "#0f172a",
  },
  metaText: { color: MUTED, fontSize: 12, fontWeight: "600" },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    marginLeft: "auto",
    gap: 6,
  },
  statusText: { fontSize: 12, fontWeight: "700" },
  dot: { width: 8, height: 8, borderRadius: 999 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 4 },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: "#0f172a",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: BORDER,
  },
  tagText: { color: MUTED, fontSize: 11, fontWeight: "600" },
  ratingText: { color: "#F59E0B", marginLeft: 6, fontSize: 12, fontWeight: "700" },
});
