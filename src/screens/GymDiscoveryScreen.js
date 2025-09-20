// src/screens/GymDiscoveryScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Image,
  Platform,
  Modal,
  Linking,
  ActivityIndicator,
} from "react-native";
import MapView, { Marker, UrlTile as RNUrlTile, PROVIDER_DEFAULT } from "react-native-maps";
import { Ionicons } from "@expo/vector-icons";
import * as Location from "expo-location";
import Constants from "expo-constants";

const UrlTile = RNUrlTile || (() => null); // safe guard for SDK mismatches

const { width, height } = Dimensions.get("window");

/* ===========================
   THEME
=========================== */
const Theme = {
  bg: "#0B1220",
  card: "#111827",
  card2: "#0f172a",
  border: "#1f2937",
  text: "#e5e7eb",
  muted: "#94a3b8",
  accent: "#10B981",
  accent2: "#34D399",
  danger: "#ef4444",
  yellow: "#facc15",
};

/* ===========================
   PURE-JS SLIDER (no deps)
=========================== */
const SLIDER_THUMB = 20;

function InlineSlider({
  value = 0,
  onChange,
  min = 0,
  max = 1,
  step = 0,
  trackColor = Theme.border,
  fillColor = Theme.accent,
  thumbColor = Theme.accent,
}) {
  const [w, setW] = useState(0);
  const range = Math.max(1e-6, max - min);
  const usable = Math.max(1, w - SLIDER_THUMB);

  const clamp = (n, a, b) => Math.max(a, Math.min(b, n));
  const ratio = clamp((value - min) / range, 0, 1);
  const left = ratio * usable;

  const pick = (x) => {
    if (!usable) return;
    const px = clamp(x - SLIDER_THUMB / 2, 0, usable);
    let v = min + (px / usable) * range;
    if (step > 0) v = Math.round(v / step) * step;
    onChange?.(Number(v.toFixed(2)));
  };

  return (
    <View
      style={miniSliderStyles.root}
      onLayout={(e) => setW(e.nativeEvent.layout.width)}
      onStartShouldSetResponder={() => true}
      onResponderGrant={(e) => pick(e.nativeEvent.locationX)}
      onResponderMove={(e) => pick(e.nativeEvent.locationX)}
    >
      <View style={[miniSliderStyles.track, { backgroundColor: trackColor }]} />
      <View style={[miniSliderStyles.fill, { width: left + SLIDER_THUMB / 2, backgroundColor: fillColor }]} />
      <View
        style={[
          miniSliderStyles.thumb,
          { left, borderColor: fillColor, backgroundColor: thumbColor },
        ]}
      />
    </View>
  );
}

const miniSliderStyles = StyleSheet.create({
  root: { height: 28, justifyContent: "center", marginTop: 8, marginHorizontal: 4 },
  track: { position: "absolute", left: 0, right: 0, height: 6, borderRadius: 6 },
  fill: { position: "absolute", left: 0, height: 6, borderRadius: 6 },
  thumb: {
    position: "absolute",
    width: SLIDER_THUMB,
    height: SLIDER_THUMB,
    borderRadius: SLIDER_THUMB / 2,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
    elevation: 3,
  },
});

/* ===========================
   DATA (dynamic from Places)
=========================== */
const ALL_GYMS = [];

/* ===========================
   HELPERS
=========================== */
const parseKm = (s = "") => {
  const n = parseFloat(String(s).replace(" km", ""));
  return isNaN(n) ? 999 : n;
};
const is24h = (hours) =>
  typeof hours === "string" && hours.toLowerCase().includes("24");

function googlePhotoUrl(ref, maxwidth = 800) {
  const key =
    Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY ||
    Constants.manifest?.extra?.GOOGLE_PLACES_API_KEY;
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=${maxwidth}&photoreference=${encodeURIComponent(
    ref
  )}&key=${key}`;
}
function kmBetween(a, b) {
  if (!a || !b) return null;
  const toRad = (x) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.latitude - a.latitude);
  const dLon = toRad(b.longitude - a.longitude);
  const lat1 = toRad(a.latitude);
  const lat2 = toRad(b.latitude);
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.sin(dLon / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
  return R * c;
}

/* Google Places feature flag — don't block UI in Expo Go */
const PLACES_KEY =
  Constants.expoConfig?.extra?.GOOGLE_PLACES_API_KEY ||
  Constants.manifest?.extra?.GOOGLE_PLACES_API_KEY;
const USE_PLACES = !!PLACES_KEY;

async function fetchNearbyGymsGoogle({
  lat,
  lng,
  radiusMeters = 2000,
  minRating = 0,
  openNow = false,
  queryText = "",
}) {
  if (!PLACES_KEY) {
    throw new Error("Google Places key not configured in app.json/extra.");
  }

  const nearby = new URLSearchParams({
    location: `${lat},${lng}`,
    radius: String(radiusMeters),
    type: "gym",
    key: PLACES_KEY,
  });
  if (openNow) nearby.set("opennow", "true");
  if (queryText?.trim()) nearby.set("keyword", queryText.trim());

  const res = await fetch(
    `https://maps.googleapis.com/maps/api/place/nearbysearch/json?${nearby.toString()}`
  );
  const json = await res.json();
  if (json.status && json.status !== "OK") {
    throw new Error(`Places: ${json.status} ${json.error_message || ""}`.trim());
  }

  const results = (json.results || []).filter((r) => (r.rating || 0) >= minRating);
  const top = results.slice(0, 20);

  const detail = async (place_id) => {
    const p = new URLSearchParams({
      place_id,
      key: PLACES_KEY,
      fields:
        "place_id,name,formatted_address,formatted_phone_number,opening_hours,photos,rating,user_ratings_total,geometry",
    });
    const r = await fetch(
      `https://maps.googleapis.com/maps/api/place/details/json?${p.toString()}`
    );
    const j = await r.json();
    return j.result;
  };

  const details = await Promise.all(top.map((x) => detail(x.place_id)));

  return details.map((d, i) => {
    const photoRef = d?.photos?.[0]?.photo_reference;
    const imgs = (d?.photos || []).slice(0, 3).map((p) => googlePhotoUrl(p.photo_reference));
    return {
      id: d.place_id,
      name: d.name,
      latitude: d.geometry?.location?.lat ?? results[i]?.geometry?.location?.lat,
      longitude: d.geometry?.location?.lng ?? results[i]?.geometry?.location?.lng,
      rating: d.rating ?? results[i]?.rating ?? 0,
      reviewCount: d.user_ratings_total ?? results[i]?.user_ratings_total ?? 0,
      distance: "—",
      hours: d.opening_hours?.weekday_text
        ? "See schedule"
        : d.opening_hours?.open_now
        ? "Open now"
        : "Hours unavailable",
      isOpen: !!d.opening_hours?.open_now,
      isFavorite: false,
      image: photoRef
        ? googlePhotoUrl(photoRef)
        : "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800",
      images:
        imgs.length > 0
          ? imgs
          : [
              "https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/1431282/pexels-photo-1431282.jpeg?auto=compress&cs=tinysrgb&w=800",
              "https://images.pexels.com/photos/1229356/pexels-photo-1229356.jpeg?auto=compress&cs=tinysrgb&w=800",
            ],
      description: "Nearby gym",
      amenities: [],
      phone: d.formatted_phone_number || "",
      address: d.formatted_address || "",
      place_id: d.place_id,
    };
  });
}

/* ===========================
   LOADING COMPONENT
=========================== */
function LoadingOverlay({ visible, message = "Loading..." }) {
  if (!visible) return null;
  
  return (
    <View style={styles.loading}>
      <View style={styles.loadingContent}>
        <ActivityIndicator size="large" color={Theme.accent} />
        <Text style={styles.loadingText}>{message}</Text>
      </View>
    </View>
  );
}

/* ===========================
   SEARCH HEADER
=========================== */
function SearchHeader({ onSearch, onFilter, onToggleView, isListView, filterCount }) {
  const [query, setQuery] = useState("");

  return (
    <View style={styles.searchBar}>
      <View style={styles.searchInputWrap}>
        <Ionicons name="search-outline" size={18} color={Theme.muted} />
        <TextInput
          value={query}
          onChangeText={(t) => {
            setQuery(t);
            onSearch?.(t);
          }}
          placeholder="Search gyms"
          placeholderTextColor={Theme.muted}
          style={styles.searchInput}
        />
      </View>

      <TouchableOpacity style={styles.iconBtn} onPress={onFilter}>
        <Ionicons name="filter-outline" size={20} color={Theme.text} />
        {filterCount > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{filterCount}</Text>
          </View>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.iconBtn} onPress={onToggleView}>
        <Ionicons name={isListView ? "map-outline" : "list-outline"} size={20} color={Theme.text} />
      </TouchableOpacity>
    </View>
  );
}

/* ===========================
   FILTER MODAL (uses InlineSlider)
=========================== */
function FilterModal({ visible, onClose, currentFilters, onApply }) {
  const [distanceRadius, setDistanceRadius] = useState(currentFilters.distanceRadius ?? 5);
  const [minRating, setMinRating] = useState(currentFilters.minRating ?? 0);
  const [openNow, setOpenNow] = useState(currentFilters.openNow ?? false);
  const [open24Hours, setOpen24Hours] = useState(currentFilters.open24Hours ?? false);
  const [amenities, setAmenities] = useState(currentFilters.amenities ?? []);

  const ALL_AMENITIES = React.useMemo(
    () => ["Pool", "Parking", "Classes", "Sauna", "Personal Training", "Locker Room", "WiFi", "Showers", "24/7", "Free Weights", "Cardio Equipment"],
    []
  );

  useEffect(() => {
    if (!visible) return;
    setDistanceRadius(currentFilters.distanceRadius ?? 5);
    setMinRating(currentFilters.minRating ?? 0);
    setOpenNow(currentFilters.openNow ?? false);
    setOpen24Hours(currentFilters.open24Hours ?? false);
    setAmenities(currentFilters.amenities ?? []);
  }, [visible]);

  const toggleAmenity = (a) => {
    setAmenities((prev) => (prev.includes(a) ? prev.filter((x) => x !== a) : [...prev, a]));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={22} color={Theme.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
            <Text style={styles.modalLabel}>Distance radius: {distanceRadius.toFixed(1)} km</Text>
            <InlineSlider
              value={distanceRadius}
              onChange={setDistanceRadius}
              min={0.5}
              max={10}
              step={0.5}
              trackColor={Theme.border}
              fillColor={Theme.accent}
              thumbColor={Theme.accent}
            />

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Minimum rating: {minRating.toFixed(1)}</Text>
            <InlineSlider
              value={minRating}
              onChange={setMinRating}
              min={0}
              max={5}
              step={0.5}
              trackColor={Theme.border}
              fillColor={Theme.accent}
              thumbColor={Theme.accent}
            />

            <View style={styles.toggleRow}>
              <TouchableOpacity
                style={[styles.toggleChip, openNow ? styles.toggleChipActive : null]}
                onPress={() => setOpenNow((v) => !v)}
              >
                <Ionicons name="flash-outline" size={16} color={openNow ? "#0B1220" : Theme.text} />
                <Text style={[styles.toggleText, openNow ? styles.toggleTextActive : null]}>Open now</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.toggleChip, open24Hours ? styles.toggleChipActive : null]}
                onPress={() => setOpen24Hours((v) => !v)}
              >
                <Ionicons name="time-outline" size={16} color={open24Hours ? "#0B1220" : Theme.text} />
                <Text style={[styles.toggleText, open24Hours ? styles.toggleTextActive : null]}>24/7</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalLabel, { marginTop: 12 }]}>Amenities</Text>
            <View style={styles.amenityWrap}>
              {ALL_AMENITIES.map((a) => {
                const selected = amenities.includes(a);
                return (
                  <TouchableOpacity
                    key={a}
                    onPress={() => toggleAmenity(a)}
                    style={[styles.amenityChip, selected && styles.amenityChipActive]}
                  >
                    <Text style={[styles.amenityText, selected && styles.amenityTextActive]}>{a}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={[styles.btn, styles.btnSecondary]}>
              <Text style={styles.btnSecondaryText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                onApply?.({ distanceRadius, minRating, openNow, open24Hours, amenities });
                onClose?.();
              }}
              style={[styles.btn, styles.btnPrimary]}
            >
              <Text style={styles.btnPrimaryText}>Apply</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

/* ===========================
   GYM LIST ITEM
=========================== */
function GymCard({ gym, onPress, onFavorite, onDirections }) {
  return (
    <TouchableOpacity onPress={() => onPress?.(gym)} activeOpacity={0.9} style={styles.card}>
      <Image source={{ uri: gym.image }} style={styles.cardImg} />
      <View style={{ flex: 1, padding: 12 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <Text numberOfLines={1} style={styles.cardTitle}>{gym.name}</Text>
          <TouchableOpacity onPress={() => onFavorite?.(gym)}>
            <Ionicons name={gym.isFavorite ? "heart" : "heart-outline"} size={20} color={gym.isFavorite ? "#ef4444" : Theme.text} />
          </TouchableOpacity>
        </View>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 4 }}>
          <Ionicons name="star" size={14} color="#fbbf24" />
          <Text style={styles.cardMeta}> {gym.rating} · {gym.reviewCount} reviews</Text>
        </View>

        <Text style={[styles.cardMeta, { marginTop: 2 }]}>{gym.address}</Text>

        <View style={{ flexDirection: "row", alignItems: "center", marginTop: 8, justifyContent: "space-between" }}>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            <Ionicons name="location-outline" size={14} color={Theme.muted} />
            <Text style={styles.cardMeta}> {gym.distance}</Text>
            <View style={styles.dot} />
            <Text style={[styles.cardMeta, { color: gym.isOpen ? Theme.accent2 : Theme.muted }]}>
              {gym.isOpen ? "Open" : "Closed"}
            </Text>
          </View>

          <TouchableOpacity onPress={() => onDirections?.(gym)} style={styles.smallBtn}>
            <Ionicons name="navigate-outline" size={14} color="#0B1220" />
            <Text style={styles.smallBtnText}>Directions</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
}

/* ===========================
   BOTTOM SHEET (Map mode)
=========================== */
function GymBottomSheet({ gyms, onGymTap, onFavorite, onDirections, selectedGym }) {
  return (
    <View style={styles.sheet} pointerEvents="box-none">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 12 }}
      >
        {gyms.map((g) => {
          const selected = selectedGym?.id === g.id;
          return (
            <TouchableOpacity
              key={g.id}
              activeOpacity={0.9}
              onPress={() => onGymTap?.(g)}
              style={[styles.sheetCard, selected && styles.sheetCardActive]}
            >
              <Image source={{ uri: g.image }} style={styles.sheetImg} />
              <View style={{ flex: 1 }}>
                <Text numberOfLines={1} style={styles.sheetTitle}>{g.name}</Text>
                <Text style={styles.sheetMeta}>{g.distance} • {g.rating}★</Text>
                <View style={{ flexDirection: "row", marginTop: 6 }}>
                  <TouchableOpacity onPress={() => onFavorite?.(g)} style={[styles.pillBtn, { marginRight: 6 }]}>
                    <Ionicons name={g.isFavorite ? "heart" : "heart-outline"} size={14} color={g.isFavorite ? "#ef4444" : Theme.text} />
                    <Text style={styles.pillBtnText}>{g.isFavorite ? "Saved" : "Save"}</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={() => onDirections?.(g)} style={[styles.pillBtn, styles.pillBtnAccent]}>
                    <Ionicons name="navigate-outline" size={14} color="#0B1220" />
                    <Text style={[styles.pillBtnText, { color: "#0B1220" }]}>Go</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

/* ===========================
   MAIN SCREEN
=========================== */
export default function GymDiscoveryScreen() {
  const [isListView, setIsListView] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState("Loading...");

  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({});
  const [selectedGym, setSelectedGym] = useState(null);
  const [favoriteGyms, setFavoriteGyms] = useState(new Set());
  const [filterVisible, setFilterVisible] = useState(false);

  const [gyms, setGyms] = useState(ALL_GYMS);

  // user location & region
  const [userLoc, setUserLoc] = useState(null);
  const [initialRegion, setInitialRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [currentRegion, setCurrentRegion] = useState({
    latitude: 6.9271,
    longitude: 79.8612,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [errorMsg, setErrorMsg] = useState("");

  // Map ref to animate on card tap
  const mapRef = useRef(null);

  const filteredGyms = useMemo(
    () => applyFilters(gyms, searchQuery, filters),
    [gyms, searchQuery, filters]
  );

  useEffect(() => {
    let watchSub = null;
    let isMounted = true;

    (async () => {
      try {
        setLoadingMessage("Getting location...");
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          setErrorMsg("Location permission denied. Enable it to find nearby gyms.");
          const fallback = { latitude: 6.9271, longitude: 79.8612 };
          setUserLoc(fallback);
          setInitialRegion({ ...fallback, latitudeDelta: 0.05, longitudeDelta: 0.05 });
          setCurrentRegion({ ...fallback, latitudeDelta: 0.05, longitudeDelta: 0.05 });
          if (USE_PLACES) {
            await refetchGyms(fallback);
          } else {
            setIsLoading(false);
          }
          return;
        }

        const curr = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
          timeout: 10000,
        });
        const pos = { latitude: curr.coords.latitude, longitude: curr.coords.longitude };
        if (!isMounted) return;

        setUserLoc(pos);
        setInitialRegion({ ...pos, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        setCurrentRegion({ ...pos, latitudeDelta: 0.05, longitudeDelta: 0.05 });

        if (USE_PLACES) {
          await refetchGyms(pos);
        } else {
          setIsLoading(false);
        }

        watchSub = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.Balanced,
            timeInterval: 30000,
            distanceInterval: 500,
          },
          async (loc) => {
            if (!isMounted) return;
            const npos = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
            setUserLoc((prev) => {
              const distance = kmBetween(prev, npos);
              if (distance && distance > 0.5 && USE_PLACES) refetchGyms(npos);
              return npos;
            });
          }
        );
      } catch (e) {
        console.warn("Location error:", e);
        setErrorMsg("Could not get location. Using default location.");
        const defaultPos = { latitude: 6.9271, longitude: 79.8612 };
        setUserLoc(defaultPos);
        setInitialRegion({ ...defaultPos, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        setCurrentRegion({ ...defaultPos, latitudeDelta: 0.05, longitudeDelta: 0.05 });
        if (USE_PLACES) {
          await refetchGyms(defaultPos);
        } else {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
      if (watchSub) watchSub.remove();
    };
  }, []);

  // Debounced refetch when filters/search change (only if Places is enabled)
  useEffect(() => {
    if (!userLoc || !USE_PLACES) return;
    const t = setTimeout(() => {
      refetchGyms(userLoc);
    }, 300);
    return () => clearTimeout(t);
  }, [searchQuery, filters]); // eslint-disable-line react-hooks/exhaustive-deps

  function focusOnGym(g) {
    setSelectedGym(g);
    const newRegion = {
      latitude: g.latitude,
      longitude: g.longitude,
      latitudeDelta: 0.02,
      longitudeDelta: 0.02,
    };
    setCurrentRegion(newRegion);
    mapRef.current?.animateToRegion(newRegion, 600);
  }

  function applyFilters(list, query, f) {
    let out = [...list];
    if (query?.trim()) {
      const q = query.toLowerCase();
      out = out.filter((g) => g.name.toLowerCase().includes(q));
    }
    if (f.distanceRadius != null) {
      const maxKm = Number(f.distanceRadius);
      out = out.filter((g) => parseKm(g.distance) <= maxKm);
    }
    if (f.minRating != null && Number(f.minRating) > 0) {
      out = out.filter((g) => Number(g.rating) >= Number(f.minRating));
    }
    if (f.openNow) out = out.filter((g) => !!g.isOpen);
    if (f.open24Hours) out = out.filter((g) => is24h(g.hours));
    if (Array.isArray(f.amenities) && f.amenities.length > 0) {
      out = out.filter(
        (g) => (g.amenities || []).length && f.amenities.every((a) => (g.amenities || []).includes(a))
      );
    }
    return out;
  }

  function filterCount() {
    let c = 0;
    if (filters.distanceRadius != null && filters.distanceRadius !== 5) c++;
    if (filters.minRating != null && Number(filters.minRating) > 0) c++;
    if (filters.openNow) c++;
    if (filters.open24Hours) c++;
    if (Array.isArray(filters.amenities) && filters.amenities.length > 0) c++;
    return c;
  }

  function onFavoriteToggle(gym) {
    setGyms((prev) =>
      prev.map((x) => (x.id === gym.id ? { ...x, isFavorite: !x.isFavorite } : x))
    );
    setFavoriteGyms((prev) => {
      const next = new Set(prev);
      if (next.has(gym.id)) next.delete(gym.id);
      else next.add(gym.id);
      return next;
    });
  }

  async function onGetDirections(gym) {
    const lat = gym.latitude;
    const lng = gym.longitude;
    const label = encodeURIComponent(gym.name);
    const place = gym.place_id ? `&destination_place_id=${gym.place_id}` : "";
    let url = "";
    if (Platform.OS === "ios") {
      url = `http://maps.apple.com/?daddr=${lat},${lng}&q=${label}`;
    } else {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}${place}`;
    }
    try {
      const can = await Linking.canOpenURL(url);
      if (can) await Linking.openURL(url);
    } catch (error) {
      console.warn("Error opening maps:", error);
    }
  }

  const refetchGyms = async (pos) => {
    if (!USE_PLACES) {
      // No Places key configured — render map immediately with zero gyms
      setGyms([]);
      setSelectedGym(null);
      setIsLoading(false);
      return;
    }
    try {
      setLoadingMessage("Loading nearby gyms...");
      const radiusKm = Number(filters?.distanceRadius ?? 5);
      const minRating = Number(filters?.minRating ?? 0);
      const openNow = !!filters?.openNow;

      const gymsData = await fetchNearbyGymsGoogle({
        lat: pos.latitude,
        lng: pos.longitude,
        radiusMeters: Math.max(300, Math.min(10000, Math.round(radiusKm * 1000))),
        minRating,
        openNow,
        queryText: searchQuery,
      });

      const withDistance = gymsData.map((g) => {
        const km = kmBetween(pos, { latitude: g.latitude, longitude: g.longitude });
        const dist = km != null ? `${km.toFixed(km < 1 ? 2 : 1)} km` : "—";
        return { ...g, distance: dist, isFavorite: favoriteGyms.has(g.id) };
      });

      setGyms(withDistance);
      if (withDistance.length > 0 && !selectedGym) setSelectedGym(withDistance[0]);
    } catch (e) {
      setErrorMsg(e?.message || "Failed to load nearby gyms.");
      console.warn("refetchGyms error:", e);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* AppBar */}
      <View style={styles.appBar}>
        <Text style={styles.appBarTitle}>Gym Discovery</Text>
        <View style={{ flexDirection: "row" }}>
          <TouchableOpacity style={styles.appBarBtn}>
            <Ionicons name="notifications-outline" size={20} color={Theme.text} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.appBarBtn}>
            <Ionicons name="settings-outline" size={20} color={Theme.text} />
          </TouchableOpacity>
        </View>
      </View>

      {!!errorMsg && (
        <View style={{ backgroundColor: "#451a03", padding: 8 }}>
          <Text style={{ color: "#fde68a", textAlign: "center" }}>{errorMsg}</Text>
        </View>
      )}

      {/* Search header */}
      <SearchHeader
        onSearch={setSearchQuery}
        onFilter={() => setFilterVisible(true)}
        onToggleView={() => setIsListView((v) => !v)}
        isListView={isListView}
        filterCount={filterCount()}
      />

      {/* Content */}
      <View style={{ flex: 1 }}>
        {isListView ? (
          <FlatList
            data={filteredGyms}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ padding: 12, paddingBottom: 100 }}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <GymCard
                gym={item}
                onPress={setSelectedGym}
                onFavorite={onFavoriteToggle}
                onDirections={onGetDirections}
              />
            )}
          />
        ) : (
          <View style={{ flex: 1 }}>
            <MapView
              ref={mapRef}
              style={styles.mapView}
              provider={PROVIDER_DEFAULT}
              region={currentRegion}
              onRegionChangeComplete={setCurrentRegion}
              showsUserLocation
              showsMyLocationButton
              followsUserLocation={false}
              showsCompass
              showsScale
              rotateEnabled
              scrollEnabled
              zoomEnabled
              pitchEnabled
              toolbarEnabled={false}
              moveOnMarkerPress={false}
              showsBuildings
              showsIndoors
              showsIndoorLevelPicker
              showsPointsOfInterest={false}
              showsTraffic={false}
              onMapReady={() => {
                setIsMapReady(true);
                if (!USE_PLACES && isLoading) {
                  setIsLoading(false);
                }
              }}
              onMapLoaded={() => {
                setIsMapReady(true);
                if (!USE_PLACES && isLoading) {
                  setIsLoading(false);
                }
              }}
              onMapError={(e) => {
                setErrorMsg(`Map error: ${e?.nativeEvent?.message || "unknown"}`);
                setIsLoading(false);
              }}
            >
              {/* OpenStreetMap tiles for Expo Go compatibility */}
              <UrlTile
                urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
                maximumZ={19}
                flipY={false}
                shouldReplaceMapContent={true}
                zIndex={-1}
              />

              {userLoc && (
                <Marker coordinate={userLoc} title="You are here" identifier="user-location">
                  <View style={[styles.pin, { backgroundColor: "#fbbf24" }]}>
                    <Ionicons name="person" size={16} color="#0B1220" />
                  </View>
                </Marker>
              )}

              {filteredGyms.map((g) => (
                <Marker
                  key={g.id}
                  coordinate={{ latitude: g.latitude, longitude: g.longitude }}
                  title={g.name}
                  description={`${g.rating}★ · ${g.distance}`}
                  onPress={() => setSelectedGym(g)}
                  identifier={g.id}
                >
                  <View style={[styles.pin, selectedGym?.id === g.id && styles.pinActive]}>
                    <Ionicons name="barbell" size={16} color="#0B1220" />
                  </View>
                </Marker>
              ))}
            </MapView>

            {filteredGyms.length > 0 && (
              <GymBottomSheet
                gyms={filteredGyms}
                onGymTap={focusOnGym}
                onFavorite={onFavoriteToggle}
                onDirections={onGetDirections}
                selectedGym={selectedGym}
              />
            )}
          </View>
        )}
      </View>

      {/* Bottom Nav */}
      <View style={styles.bottomBar}>
        <NavItem icon="home" label="Home" active />
        <NavItem icon="book-outline" label="Diary" />
        <TouchableOpacity style={styles.fab} onPress={() => {}}>
          <Ionicons name="add" size={26} color="#0B1220" />
        </TouchableOpacity>
        <NavItem icon="stats-chart-outline" label="Progress" />
        <NavItem icon="ellipsis-horizontal" label="More" />
      </View>

      {/* Filter modal */}
      <FilterModal
        visible={filterVisible}
        onClose={() => setFilterVisible(false)}
        currentFilters={filters}
        onApply={(f) => setFilters(f)}
      />

      {/* Unified loading overlay */}
      <LoadingOverlay visible={isLoading} message={loadingMessage} />
    </View>
  );
}

/* ===========================
   Bottom Nav Item
=========================== */
function NavItem({ icon, label, active }) {
  return (
    <View style={styles.navItem}>
      <Ionicons name={icon} size={22} color={active ? Theme.accent : "#64748B"} />
      <Text style={[styles.navText, active && { color: Theme.accent }]}>{label}</Text>
    </View>
  );
}

/* ===========================
   STYLES
=========================== */
const SHEET_H = 160;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Theme.bg,
  },

  appBar: {
    height: 56,
    backgroundColor: Theme.bg,
    borderBottomColor: Theme.border,
    borderBottomWidth: 1,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  appBarTitle: {
    color: Theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  appBarBtn: {
    padding: 8,
    marginLeft: 4,
  },

  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: Theme.bg,
  },
  searchInputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#0e1626",
    borderWidth: 1,
    borderColor: Theme.border,
    paddingHorizontal: 10,
    paddingVertical: Platform.OS === "ios" ? 10 : 8,
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    color: Theme.text,
    fontSize: 15,
  },
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#0e1626",
  },
  badge: {
    position: "absolute",
    top: -6,
    right: -6,
    backgroundColor: Theme.yellow,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  badgeText: {
    color: "#0B1220",
    fontWeight: "800",
    fontSize: 11,
  },

  mapView: {
    flex: 1,
    backgroundColor: Theme.bg,
    minHeight: height - 200,
  },

  card: {
    backgroundColor: Theme.card,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Theme.border,
    marginBottom: 12,
  },
  cardImg: {
    width: "100%",
    height: 140,
    backgroundColor: Theme.card2,
  },
  cardTitle: {
    color: Theme.text,
    fontSize: 16,
    fontWeight: "800",
  },
  cardMeta: {
    color: Theme.muted,
    fontSize: 12,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Theme.muted,
    marginHorizontal: 6,
  },

  smallBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Theme.accent,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  smallBtnText: {
    color: "#0B1220",
    fontWeight: "800",
    fontSize: 12,
  },

  pin: {
    backgroundColor: Theme.accent2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0B1220",
  },
  pinActive: {
    backgroundColor: "#60a5fa",
  },

  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 72,
    height: SHEET_H,
    backgroundColor: "#0e1626",
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    paddingVertical: 12,
  },
  sheetCard: {
    width: width * 0.78,
    flexDirection: "row",
    gap: 10,
    backgroundColor: Theme.card,
    borderWidth: 1,
    borderColor: Theme.border,
    borderRadius: 12,
    padding: 10,
    marginRight: 10,
  },
  sheetCardActive: {
    borderColor: Theme.accent,
  },
  sheetImg: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: Theme.card2,
  },
  sheetTitle: {
    color: Theme.text,
    fontWeight: "800",
  },
  sheetMeta: {
    color: Theme.muted,
    fontSize: 12,
    marginTop: 2,
  },
  pillBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Theme.border,
    gap: 6,
  },
  pillBtnText: {
    color: Theme.text,
    fontSize: 12,
    fontWeight: "700",
  },
  pillBtnAccent: {
    backgroundColor: Theme.accent,
    borderColor: Theme.accent,
  },

  bottomBar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 72,
    backgroundColor: "#0e1626",
    borderTopWidth: 1,
    borderTopColor: Theme.border,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    paddingHorizontal: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 72,
  },
  navText: {
    color: "#64748B",
    fontSize: 11,
    marginTop: 4,
  },

  fab: {
    position: "absolute",
    bottom: 20,
    alignSelf: "center",
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Theme.accent,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowOffset: { width: 0, height: 6 },
    shadowRadius: 8,
  },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalCard: {
    backgroundColor: Theme.card,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    borderWidth: 1,
    borderColor: Theme.border,
    padding: 14,
    maxHeight: height * 0.82,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  modalTitle: {
    color: Theme.text,
    fontSize: 18,
    fontWeight: "800",
  },
  modalLabel: {
    color: Theme.text,
    fontSize: 14,
    fontWeight: "700",
    marginTop: 8,
  },
  toggleRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 12,
  },
  toggleChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: "#0e1626",
  },
  toggleChipActive: {
    backgroundColor: Theme.accent,
    borderColor: Theme.accent,
  },
  toggleText: {
    color: Theme.text,
    fontWeight: "700",
  },
  toggleTextActive: {
    color: "#0B1220",
  },

  amenityWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 10,
  },
  amenityChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Theme.border,
    backgroundColor: "#0e1626",
  },
  amenityChipActive: {
    backgroundColor: Theme.accent2,
    borderColor: Theme.accent2,
  },
  amenityText: {
    color: Theme.text,
    fontWeight: "700",
    fontSize: 12,
  },
  amenityTextActive: {
    color: "#0B1220",
  },

  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 12,
  },
  btn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnSecondary: {
    backgroundColor: "#0e1626",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  btnSecondaryText: {
    color: Theme.text,
    fontWeight: "800",
  },
  btnPrimary: {
    backgroundColor: Theme.accent,
  },
  btnPrimaryText: {
    color: "#0B1220",
    fontWeight: "800",
  },

  loading: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(11,18,32,0.9)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  loadingContent: {
    backgroundColor: Theme.card,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Theme.border,
  },
  loadingText: {
    color: Theme.text,
    marginTop: 12,
    fontSize: 16,
    fontWeight: "600",
  },
});
