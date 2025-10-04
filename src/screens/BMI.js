import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { getAuth } from "firebase/auth";
import { db } from "../lib/firebaseApp";
import { doc, getDoc } from "firebase/firestore";

const { width } = Dimensions.get("window");

const BG = "#0B1220";
const CARD = "#111827";
const CARD2 = "#0f172a";
const TEXT = "#e5e7eb";
const MUTED = "#94a3b8";
const BORDER = "#1f2937";

const BMI_RANGES = [
  {
    range: "< 18.5",
    category: "Underweight",
    color: "#60a5fa",
    health: "May indicate malnutrition or underlying health issues",
    risks: [
      "Weakened immune system",
      "Osteoporosis risk",
      "Nutrient deficiencies",
      "Fertility issues"
    ],
    guidance: "Focus on nutrient-dense foods and gradual weight gain through balanced meals. Consult a healthcare provider to rule out underlying conditions."
  },
  {
    range: "18.5 - 24.9",
    category: "Normal Weight",
    color: "#10b981",
    health: "Healthy weight range associated with lower health risks",
    risks: [
      "Lowest risk for chronic diseases",
      "Optimal metabolic health",
      "Better cardiovascular health"
    ],
    guidance: "Maintain your healthy lifestyle with balanced nutrition and regular physical activity. Continue monitoring your health with regular check-ups."
  },
  {
    range: "25 - 29.9",
    category: "Overweight",
    color: "#f59e0b",
    health: "Increased risk for several health conditions",
    risks: [
      "Higher blood pressure risk",
      "Type 2 diabetes risk",
      "Heart disease risk",
      "Joint stress"
    ],
    guidance: "Small, sustainable changes in diet and activity can make a significant difference. Focus on whole foods and gradual weight loss of 1-2 lbs per week."
  },
  {
    range: "≥ 30",
    category: "Obese",
    color: "#ef4444",
    health: "Significantly elevated health risks",
    risks: [
      "Cardiovascular disease",
      "Type 2 diabetes",
      "Sleep apnea",
      "Certain cancers",
      "Joint problems"
    ],
    guidance: "Consider working with healthcare professionals for a comprehensive weight management plan. Small steps toward healthier habits can lead to meaningful improvements."
  }
];

const MOTIVATIONAL_QUOTES = [
  "Your health is an investment, not an expense.",
  "Progress, not perfection. Every small step counts.",
  "You are stronger than you think.",
  "Health is not about the weight you lose, but the life you gain.",
  "Take care of your body. It's the only place you have to live.",
  "Your body can do amazing things. Fuel it well.",
];

export default function BMIScreen({ navigation }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      const auth = getAuth();
      const user = auth.currentUser;
      if (user) {
        const docRef = doc(db, "users", user.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setProfile(docSnap.data()?.profile || null);
        }
      }
      setLoading(false);
    };
    loadProfile();
  }, []);

  const calculateBMI = () => {
    const h = Number(profile?.heightCm) / 100;
    const w = Number(profile?.weightKg);
    if (!h || !w) return null;
    return w / (h * h);
  };

  const getBMICategory = (bmi) => {
    if (!bmi) return null;
    if (bmi < 18.5) return BMI_RANGES[0];
    if (bmi < 25) return BMI_RANGES[1];
    if (bmi < 30) return BMI_RANGES[2];
    return BMI_RANGES[3];
  };

  const bmi = calculateBMI();
  const currentCategory = getBMICategory(bmi);
  const randomQuote = MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];

  const BMIChart = () => {
    const chartWidth = width - 64;
    const getMarkerPosition = () => {
      if (!bmi) return 0;
      // Map BMI to position (15-40 range to 0-100%)
      const minBMI = 15;
      const maxBMI = 40;
      const position = ((bmi - minBMI) / (maxBMI - minBMI)) * 100;
      return Math.max(0, Math.min(100, position));
    };

    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>BMI Range Visualization</Text>
        
        {/* BMI Scale */}
        <View style={styles.scale}>
          {BMI_RANGES.map((range, index) => (
            <View
              key={index}
              style={[
                styles.scaleSegment,
                {
                  backgroundColor: range.color,
                  opacity: currentCategory?.category === range.category ? 1 : 0.4,
                }
              ]}
            />
          ))}
        </View>

        {/* Current BMI Marker */}
        {bmi && (
          <View style={[styles.markerContainer, { left: `${getMarkerPosition()}%` }]}>
            <View style={styles.marker}>
              <Ionicons name="location" size={24} color="#fff" />
            </View>
            <Text style={styles.markerText}>{bmi.toFixed(1)}</Text>
          </View>
        )}

        {/* Scale Labels */}
        <View style={styles.scaleLabels}>
          <Text style={styles.scaleLabel}>15</Text>
          <Text style={styles.scaleLabel}>20</Text>
          <Text style={styles.scaleLabel}>25</Text>
          <Text style={styles.scaleLabel}>30</Text>
          <Text style={styles.scaleLabel}>35</Text>
          <Text style={styles.scaleLabel}>40</Text>
        </View>
      </View>
    );
  };

  const InfoCard = ({ range }) => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <View style={[styles.colorDot, { backgroundColor: range.color }]} />
        <View style={{ flex: 1 }}>
          <Text style={styles.categoryTitle}>{range.category}</Text>
          <Text style={styles.rangeText}>BMI: {range.range}</Text>
        </View>
      </View>

      <Text style={styles.healthText}>{range.health}</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Health Considerations:</Text>
        {range.risks.map((risk, index) => (
          <View key={index} style={styles.bulletItem}>
            <Ionicons name="ellipse" size={6} color={MUTED} style={{ marginTop: 6 }} />
            <Text style={styles.bulletText}>{risk}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Guidance:</Text>
        <Text style={styles.guidanceText}>{range.guidance}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" backgroundColor={BG} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={TEXT} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Body Mass Index</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Current BMI Card */}
        {bmi ? (
          <View style={styles.currentBMICard}>
            <Text style={styles.currentBMILabel}>Your BMI</Text>
            <Text style={styles.currentBMIValue}>{bmi.toFixed(1)}</Text>
            <View style={[styles.categoryBadge, { backgroundColor: currentCategory.color + '30' }]}>
              <Text style={[styles.categoryBadgeText, { color: currentCategory.color }]}>
                {currentCategory.category}
              </Text>
            </View>
            <Text style={styles.statsText}>
              {profile?.weightKg}kg • {profile?.heightCm}cm
            </Text>
          </View>
        ) : (
          <View style={styles.currentBMICard}>
            <Ionicons name="body-outline" size={48} color={MUTED} />
            <Text style={styles.noBMIText}>Add your height and weight</Text>
            <TouchableOpacity 
              style={styles.addDataButton}
              onPress={() => navigation.navigate("Onboarding", { fromDashboard: true })}
            >
              <Text style={styles.addDataButtonText}>Update Profile</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* BMI Chart */}
        <BMIChart />

        {/* Important Disclaimer */}
        <View style={styles.disclaimerCard}>
          <Ionicons name="information-circle" size={20} color="#60a5fa" />
          <Text style={styles.disclaimerText}>
            BMI is a screening tool and doesn't measure body fat directly. It may not accurately reflect health for athletes, elderly, or pregnant individuals. Always consult healthcare professionals for personalized advice.
          </Text>
        </View>

        {/* BMI Categories Information */}
        <Text style={styles.sectionHeader}>Understanding BMI Categories</Text>
        {BMI_RANGES.map((range, index) => (
          <InfoCard key={index} range={range} />
        ))}

        {/* Motivational Quote */}
        <View style={styles.quoteCard}>
          <Ionicons name="heart" size={24} color="#10b981" />
          <Text style={styles.quoteText}>{randomQuote}</Text>
        </View>

        {/* Additional Resources */}
        <View style={styles.resourcesCard}>
          <Text style={styles.resourcesTitle}>Take Action</Text>
          <Text style={styles.resourcesSubtitle}>
            Small, consistent changes lead to lasting results
          </Text>

<TouchableOpacity 
  style={styles.resourceButton}
  onPress={() => {
    console.log("Workouts button pressed!");
    navigation.navigate("Workouts");
  }}
  activeOpacity={0.7}
>
  <Ionicons name="fitness-outline" size={20} color="#10b981" />
  <Text style={styles.resourceButtonText}>View Workout Plans</Text>
  <Ionicons name="chevron-forward" size={18} color={MUTED} />
</TouchableOpacity>

          <TouchableOpacity 
  style={styles.resourceButton}
  onPress={() => navigation.navigate("HealthyDishes")}
  activeOpacity={0.7}
>
  <Ionicons name="restaurant-outline" size={20} color="#10b981" />
  <Text style={styles.resourceButtonText}>View Healthy Dishes</Text>
  <Ionicons name="chevron-forward" size={18} color={MUTED} />
</TouchableOpacity>

          <TouchableOpacity style={styles.resourceButton}>
            <Ionicons name="people-outline" size={20} color="#10b981" />
            <Text style={styles.resourceButtonText}>Connect with a Coach</Text>
            <Ionicons name="chevron-forward" size={18} color={MUTED} />
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
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
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
  },
  scrollContent: {
    padding: 20,
  },
  currentBMICard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 20,
  },
  currentBMILabel: {
    fontSize: 14,
    color: MUTED,
    fontWeight: "600",
    marginBottom: 8,
  },
  currentBMIValue: {
    fontSize: 48,
    fontWeight: "900",
    color: TEXT,
    marginBottom: 12,
  },
  categoryBadge: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 8,
  },
  categoryBadgeText: {
    fontSize: 14,
    fontWeight: "700",
  },
  statsText: {
    fontSize: 13,
    color: MUTED,
    fontWeight: "600",
  },
  noBMIText: {
    fontSize: 16,
    color: MUTED,
    marginTop: 12,
    marginBottom: 16,
  },
  addDataButton: {
    backgroundColor: "#10b981",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
  },
  addDataButtonText: {
    color: "#0b1220",
    fontSize: 14,
    fontWeight: "700",
  },
  chartContainer: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 20,
    textAlign: "center",
  },
  scale: {
    flexDirection: "row",
    height: 40,
    borderRadius: 20,
    overflow: "hidden",
    marginBottom: 40,
  },
  scaleSegment: {
    flex: 1,
  },
  markerContainer: {
    position: "absolute",
    top: 70,
    alignItems: "center",
    transform: [{ translateX: -12 }],
  },
  marker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  markerText: {
    marginTop: 4,
    fontSize: 14,
    fontWeight: "800",
    color: TEXT,
  },
  scaleLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  scaleLabel: {
    fontSize: 11,
    color: MUTED,
    fontWeight: "600",
  },
  disclaimerCard: {
    backgroundColor: CARD2,
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#60a5fa30",
  },
  disclaimerText: {
    flex: 1,
    fontSize: 12,
    color: MUTED,
    lineHeight: 18,
    marginLeft: 12,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 16,
  },
  infoCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  infoHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
  },
  rangeText: {
    fontSize: 13,
    color: MUTED,
    marginTop: 2,
  },
  healthText: {
    fontSize: 14,
    color: TEXT,
    marginBottom: 16,
    lineHeight: 20,
  },
  section: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: "row",
    marginBottom: 6,
    paddingLeft: 4,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: MUTED,
    marginLeft: 8,
    lineHeight: 18,
  },
  guidanceText: {
    fontSize: 13,
    color: MUTED,
    lineHeight: 20,
  },
  quoteCard: {
    backgroundColor: "#10b98120",
    borderRadius: 16,
    padding: 20,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#10b98140",
  },
  quoteText: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: TEXT,
    marginLeft: 12,
    fontStyle: "italic",
    lineHeight: 22,
  },
  resourcesCard: {
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  resourcesTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: TEXT,
    marginBottom: 4,
  },
  resourcesSubtitle: {
    fontSize: 13,
    color: MUTED,
    marginBottom: 16,
  },
  resourceButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: CARD2,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  resourceButtonText: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: TEXT,
    marginLeft: 12,
  },
});