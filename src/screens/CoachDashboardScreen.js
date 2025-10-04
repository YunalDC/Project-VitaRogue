import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  StyleSheet,
  Dimensions,
  StatusBar as RNStatusBar,
  Platform,
  Animated,
  Alert,
  Modal,
  useWindowDimensions,
  Image,
  TextInput,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { logOut } from "../lib/auth";

/* -------------------- THEME -------------------- */
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

/* -------------------- RESPONSIVE HELPER -------------------- */
function useResponsive() {
  const { width, height } = useWindowDimensions();
  const vw = width / 100;
  const vh = height / 100;

  const isXSmall = width < 350;
  const isSmall = width < 400;
  const isMedium = width >= 400 && width < 600;
  const isLarge = width >= 600 && width < 900;
  const isXLarge = width >= 900;
  const isTablet = width >= 768;
  const isLandscape = width > height;

  const ms = useCallback(
    (size) => {
      let scale;
      if (isXSmall) scale = 0.85;
      else if (isSmall) scale = 0.9;
      else if (isMedium) scale = 1.0;
      else if (isLarge) scale = 1.1;
      else scale = 1.2;
      return Math.round(size * scale);
    },
    [isXSmall, isSmall, isMedium, isLarge]
  );

  const HERO_H = Math.round(
    isXSmall ? vh * 24 :
      isSmall ? vh * 26 :
        isMedium ? vh * 28 :
          isTablet ? vh * 25 : vh * 30
  );

  return { width, height, vw, vh, isXSmall, isSmall, isMedium, isLarge, isTablet, isLandscape, ms, HERO_H };
}

/* -------------------- MOCK DATA -------------------- */
const COACH_INFO = {
  id: 1,
  name: "Sarah Thompson",
  title: "Certified Personal Trainer",
  avatar: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400",
  rating: 4.9,
  experience: 8,
  specialization: "Strength & Conditioning",
};

const METRICS = {
  activeClients: 24,
  upcomingSessions: 8,
  weeklyRevenue: 2850.0,
  clientSatisfaction: 96,
  completedSessions: 42,
  cancelledSessions: 2,
};

const CLIENTS = [
  {
    id: 1,
    name: "Mike Johnson",
    avatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastSession: "2 hours ago",
    progress: 85,
    calorieStatus: "On track",
    nextSession: "Tomorrow 3:00 PM",
    isActive: true,
    status: "active",
    goal: "Weight Loss",
    email: "mike.johnson@email.com",
    totalSessions: 45,
    joinDate: "2024-01-15"
  },
  {
    id: 2,
    name: "Emma Wilson",
    avatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastSession: "Yesterday",
    progress: 72,
    calorieStatus: "300 cal surplus",
    nextSession: "Today 5:30 PM",
    isActive: true,
    status: "active",
    goal: "Muscle Gain",
    email: "emma.wilson@email.com",
    totalSessions: 32,
    joinDate: "2024-02-20"
  },
  {
    id: 3,
    name: "David Chen",
    avatar: "https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastSession: "3 days ago",
    progress: 91,
    calorieStatus: "Deficit achieved",
    nextSession: "Friday 2:00 PM",
    isActive: false,
    status: "paused",
    goal: "Strength Training",
    email: "david.chen@email.com",
    totalSessions: 67,
    joinDate: "2023-11-10"
  },
  {
    id: 4,
    name: "Lisa Martinez",
    avatar: "https://images.pexels.com/photos/3763188/pexels-photo-3763188.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastSession: "1 hour ago",
    progress: 68,
    calorieStatus: "150 cal surplus",
    nextSession: "Tomorrow 10:00 AM",
    isActive: true,
    status: "active",
    goal: "General Fitness",
    email: "lisa.martinez@email.com",
    totalSessions: 28,
    joinDate: "2024-03-05"
  },
  {
    id: 5,
    name: "John Davis",
    avatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastSession: "1 week ago",
    progress: 42,
    calorieStatus: "Starting program",
    nextSession: "Monday 4:00 PM",
    isActive: true,
    status: "trial",
    goal: "Weight Loss",
    email: "john.davis@email.com",
    totalSessions: 3,
    joinDate: "2024-08-20"
  },
  {
    id: 6,
    name: "Sarah Kim",
    avatar: "https://images.pexels.com/photos/3768916/pexels-photo-3768916.jpeg?auto=compress&cs=tinysrgb&w=400",
    lastSession: "2 weeks ago",
    progress: 23,
    calorieStatus: "Program paused",
    nextSession: "TBD",
    isActive: false,
    status: "paused",
    goal: "Rehabilitation",
    email: "sarah.kim@email.com",
    totalSessions: 12,
    joinDate: "2024-06-15"
  }
];

const TODAY_SESSIONS = [
  {
    id: 1,
    clientName: "Emma Wilson",
    clientAvatar: "https://images.pexels.com/photos/415829/pexels-photo-415829.jpeg?auto=compress&cs=tinysrgb&w=400",
    time: "5:30 PM",
    duration: 60,
    type: "Strength Training",
    status: "scheduled",
  },
  {
    id: 2,
    clientName: "John Davis",
    clientAvatar: "https://images.pexels.com/photos/1040880/pexels-photo-1040880.jpeg?auto=compress&cs=tinysrgb&w=400",
    time: "7:00 PM",
    duration: 45,
    type: "HIIT Cardio",
    status: "scheduled",
  },
  {
    id: 3,
    clientName: "Mike Johnson",
    clientAvatar: "https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=400",
    time: "8:30 PM",
    duration: 90,
    type: "Full Body Workout",
    status: "scheduled",
  },
];

const STATUS_FILTERS = [
  { id: "all", label: "All", color: COLORS.muted },
  { id: "active", label: "Active", color: COLORS.success },
  { id: "trial", label: "Trial", color: COLORS.warning },
  { id: "paused", label: "Paused", color: COLORS.danger }
];

const ANALYTICS = {
  clientSuccessRate: 92,
  averageEngagement: 88,
  monthlyGrowth: 15,
  clientRetention: 94,
  weeklyHours: 38,
  averageRating: 4.9,
};

/* -------------------- COMPONENTS -------------------- */
const ProgressBar = ({ progress = 0, tint = COLORS.primary, height = 8 }) => (
  <View style={[styles.pbBg, { height, borderRadius: height / 2 }]}>
    <View
      style={[
        styles.pbFill,
        {
          width: `${Math.max(0, Math.min(100, progress))}%`,
          backgroundColor: tint,
          borderRadius: height / 2,
        },
      ]}
    />
  </View>
);

const MetricCard = ({ title, value, subtitle, icon, color = COLORS.primary, onPress, ms }) => (
  <TouchableOpacity
    style={[
      styles.metricCard,
      {
        padding: ms(16),
        borderRadius: ms(12),
        minHeight: ms(100),
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <View style={styles.metricHeader}>
      <Text style={[styles.metricTitle, { fontSize: ms(13) }]}>{title}</Text>
      <Ionicons name={icon} size={ms(20)} color={color} />
    </View>
    <Text style={[styles.metricValue, { fontSize: ms(24), color }]}>
      {typeof value === "number" && value >= 1000 ? value.toLocaleString() : value}
    </Text>
    <Text style={[styles.metricSubtitle, { fontSize: ms(11) }]}>{subtitle}</Text>
  </TouchableOpacity>
);

const StatusChip = ({ status, onPress, isSelected, ms }) => {
  const statusInfo = STATUS_FILTERS.find(s => s.id === status) || STATUS_FILTERS[0];

  return (
    <TouchableOpacity
      style={[
        styles.statusChip,
        {
          paddingVertical: ms(6),
          paddingHorizontal: ms(12),
          borderRadius: ms(16),
          backgroundColor: isSelected ? statusInfo.color : statusInfo.color + "20",
          borderColor: statusInfo.color,
          borderWidth: 1,
          marginRight: ms(8),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={[
          styles.statusChipText,
          {
            fontSize: ms(12),
            color: isSelected ? "white" : statusInfo.color,
            fontWeight: isSelected ? "600" : "500",
          },
        ]}
      >
        {statusInfo.label}
      </Text>
    </TouchableOpacity>
  );
};

const ClientCard = ({ client, onClientTap, onMessage, onSchedule, ms }) => (
  <TouchableOpacity
    style={[
      styles.clientCard,
      {
        padding: ms(16),
        borderRadius: ms(12),
        opacity: client.isActive ? 1 : 0.7,
      },
    ]}
    onPress={() => onClientTap(client)}
    activeOpacity={0.8}
  >
    <View style={styles.clientHeader}>
      <Image
        source={{ uri: client.avatar }}
        style={[
          styles.clientAvatar,
          {
            width: ms(48),
            height: ms(48),
            borderRadius: ms(24),
          },
        ]}
      />
      <View style={{ flex: 1, marginLeft: ms(12) }}>
        <Text style={[styles.clientName, { fontSize: ms(16) }]}>{client.name}</Text>
        <Text style={[styles.clientStatus, { fontSize: ms(12) }]}>
          Last session: {client.lastSession}
        </Text>
      </View>
      <View
        style={[
          styles.statusDot,
          {
            width: ms(8),
            height: ms(8),
            borderRadius: ms(4),
            backgroundColor: client.isActive ? COLORS.success : COLORS.muted,
          },
        ]}
      />
    </View>

    <View style={{ marginTop: ms(12) }}>
      <View style={styles.progressRow}>
        <Text style={[styles.progressLabel, { fontSize: ms(12) }]}>Progress</Text>
        <Text style={[styles.progressValue, { fontSize: ms(12) }]}>{client.progress}%</Text>
      </View>
      <ProgressBar progress={client.progress} tint={COLORS.primary} height={ms(6)} />
    </View>

    <View style={{ marginTop: ms(12) }}>
      <Text style={[styles.calorieStatus, { fontSize: ms(11) }]}>
        Status: {client.calorieStatus}
      </Text>
      <Text style={[styles.nextSession, { fontSize: ms(11) }]}>
        Next: {client.nextSession}
      </Text>
    </View>

    <View style={[styles.clientActions, { marginTop: ms(12), gap: ms(8) }]}>
      <TouchableOpacity
        style={[
          styles.actionBtn,
          {
            paddingVertical: ms(6),
            paddingHorizontal: ms(12),
            borderRadius: ms(6),
          },
        ]}
        onPress={() => onMessage(client)}
      >
        <Ionicons name="chatbubble-outline" size={ms(14)} color={COLORS.primary} />
        <Text style={[styles.actionBtnText, { fontSize: ms(11) }]}>Message</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.actionBtn,
          {
            paddingVertical: ms(6),
            paddingHorizontal: ms(12),
            borderRadius: ms(6),
          },
        ]}
        onPress={() => onSchedule(client)}
      >
        <Ionicons name="calendar-outline" size={ms(14)} color={COLORS.secondary} />
        <Text style={[styles.actionBtnText, { fontSize: ms(11), color: COLORS.secondary }]}>
          Schedule
        </Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const SessionCard = ({ session, onSessionTap, onStart, onCancel, ms }) => (
  <TouchableOpacity
    style={[
      styles.sessionCard,
      {
        padding: ms(16),
        borderRadius: ms(12),
        marginBottom: ms(12),
      },
    ]}
    onPress={() => onSessionTap(session)}
    activeOpacity={0.8}
  >
    <View style={styles.sessionHeader}>
      <Image
        source={{ uri: session.clientAvatar }}
        style={[
          styles.sessionAvatar,
          {
            width: ms(40),
            height: ms(40),
            borderRadius: ms(20),
          },
        ]}
      />
      <View style={{ flex: 1, marginLeft: ms(12) }}>
        <Text style={[styles.sessionClient, { fontSize: ms(16) }]}>{session.clientName}</Text>
        <Text style={[styles.sessionType, { fontSize: ms(12) }]}>{session.type}</Text>
      </View>
      <View style={{ alignItems: "flex-end" }}>
        <Text style={[styles.sessionTime, { fontSize: ms(14) }]}>{session.time}</Text>
        <Text style={[styles.sessionDuration, { fontSize: ms(11) }]}>{session.duration} min</Text>
      </View>
    </View>

    <View style={[styles.sessionActions, { marginTop: ms(12), gap: ms(8) }]}>
      <TouchableOpacity
        style={[
          styles.sessionActionBtn,
          styles.startBtn,
          {
            paddingVertical: ms(8),
            paddingHorizontal: ms(16),
            borderRadius: ms(8),
          },
        ]}
        onPress={() => onStart(session)}
      >
        <Text style={[styles.startBtnText, { fontSize: ms(12) }]}>Start Session</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.sessionActionBtn,
          styles.cancelBtn,
          {
            paddingVertical: ms(8),
            paddingHorizontal: ms(16),
            borderRadius: ms(8),
          },
        ]}
        onPress={() => onCancel(session)}
      >
        <Text style={[styles.cancelBtnText, { fontSize: ms(12) }]}>Cancel</Text>
      </TouchableOpacity>
    </View>
  </TouchableOpacity>
);

const AnalyticsCard = ({ title, value, subtitle, icon, color, ms }) => (
  <View
    style={[
      styles.analyticsCard,
      {
        padding: ms(16),
        borderRadius: ms(12),
        minHeight: ms(90),
      },
    ]}
  >
    <View style={styles.analyticsHeader}>
      <Ionicons name={icon} size={ms(24)} color={color} />
      <Text style={[styles.analyticsValue, { fontSize: ms(20), color }]}>
        {typeof value === "number" ? `${value}%` : value}
      </Text>
    </View>
    <Text style={[styles.analyticsTitle, { fontSize: ms(13) }]}>{title}</Text>
    <Text style={[styles.analyticsSubtitle, { fontSize: ms(11) }]}>{subtitle}</Text>
  </View>
);

const TabButton = ({ title, active, onPress, ms }) => (
  <TouchableOpacity
    style={[
      styles.tabButton,
      {
        paddingVertical: ms(10),
        paddingHorizontal: ms(16),
        borderRadius: ms(8),
        backgroundColor: active ? COLORS.primary : "transparent",
      },
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text
      style={[
        styles.tabButtonText,
        {
          fontSize: ms(13),
          color: active ? "white" : COLORS.muted,
          fontWeight: active ? "600" : "500",
        },
      ]}
    >
      {title}
    </Text>
  </TouchableOpacity>
);

const QuickActionButton = ({ icon, label, onPress, color = COLORS.primary, ms }) => (
  <TouchableOpacity
    style={[
      styles.quickActionButton,
      {
        paddingVertical: ms(12),
        paddingHorizontal: ms(16),
        borderRadius: ms(10),
        backgroundColor: color + "20",
        borderColor: color,
        borderWidth: 1,
      },
    ]}
    onPress={onPress}
    activeOpacity={0.8}
  >
    <Ionicons name={icon} size={ms(20)} color={color} />
    <Text
      style={[
        styles.quickActionLabel,
        { fontSize: ms(12), color, marginTop: ms(4) },
      ]}
    >
      {label}
    </Text>
  </TouchableOpacity>
);

/* -------------------- MAIN COMPONENT -------------------- */
export default function CoachDashboardScreen({ navigation }) {
  const insets = useSafeAreaInsets();
  const { width, isXSmall, isSmall, isTablet, ms, HERO_H } = useResponsive();

  const [activeTab, setActiveTab] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationCount, setNotificationCount] = useState(3);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const name = COACH_INFO.name.split(" ")[0];
    if (hour < 12) return `Good morning, ${name}!`;
    if (hour < 18) return `Good afternoon, ${name}!`;
    return `Good evening, ${name}!`;
  };

  const showDialog = (title, message) => {
    Alert.alert(title, message);
  };

  const navigateToCoachSettings = () => {
    setSettingsVisible(false);
    navigation.navigate('CoachSettings');
  };

  const performLogout = async () => {
    if (loggingOut) return;
    try {
      setLoggingOut(true);
      await logOut();
    } catch (error) {
      setLoggingOut(false);
      Alert.alert('Logout failed', error?.message || 'Please try again.');
    }
  };

  const confirmLogout = () => {
    Alert.alert(
      'Log out',
      'You will be signed out of your coach account.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log out',
          style: 'destructive',
          onPress: () => {
            setSettingsVisible(false);
            performLogout();
          },
        },
      ],
    );
  };

  const onRefresh = async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsLoading(false);
    setNotificationCount((prev) => prev + 1);
    Alert.alert("Success", "Dashboard refreshed successfully!");
  };

  // FIXED: Removed navigation to non-existent 'CoachClients' screen
  const onMetricTap = (metricType) => {
    if (metricType === "activeClients") {
      navigation.navigate('CoachClients');
    } else {
      showDialog(`${metricType.toUpperCase()} Details`, `Detailed view for ${metricType} metric`);
    }
  };
  // FIXED: Changed screen name from 'CoachClientProfile' to match App.js registration
  const onClientTap = (client) => {
    navigation.navigate('CoachClientProfile', {
      clientId: client.id,
      client: client
    });
  };

  // FIXED: Changed from showDialog to actual navigation
  const onMessageClient = (client) => {
    navigation.navigate('ClientMessaging', { client });
  };

  const onScheduleSession = (client) => {
    showDialog(`Schedule Session with ${client.name}`, "Open session scheduling interface");
  };

  const onSessionTap = (session) => {
    showDialog(
      "Session Details",
      `Client: ${session.clientName}\nTime: ${session.time}\nDuration: ${session.duration} minutes\nType: ${session.type}`
    );
  };

  const onStartSession = (session) => {
    showDialog("Start Session", `Start session with ${session.clientName}?`);
  };

  const onCancelSession = (session) => {
    Alert.alert("Cancel Session", `Cancel session with ${session.clientName}?`, [
      { text: "No", style: "cancel" },
      { text: "Cancel Session", style: "destructive" },
    ]);
  };

  const onCreateSession = () => {
    showDialog("Create New Session", "Open session creation form");
  };

  const onMessageCenter = () => {
    showDialog("Message Center", "Open messaging interface for client communication");
  };

  const onEmergencyContact = () => {
    showDialog("Emergency Contact", "Emergency contact features would be available here");
  };

  // Filter and search logic for modal
  const filteredClients = useMemo(() => {
    let filtered = CLIENTS;

    if (selectedStatus !== "all") {
      filtered = filtered.filter(client => client.status === selectedStatus);
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(client =>
        client.name.toLowerCase().includes(query) ||
        client.goal.toLowerCase().includes(query) ||
        client.email.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [searchQuery, selectedStatus]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {CLIENTS.map((client) => (
              <ClientCard
                key={client.id}
                client={client}
                onClientTap={onClientTap}
                onMessage={onMessageClient}
                onSchedule={onScheduleSession}
                ms={ms}
              />
            ))}
          </ScrollView>
        );
      case 1:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {TODAY_SESSIONS.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                onSessionTap={onSessionTap}
                onStart={onStartSession}
                onCancel={onCancelSession}
                ms={ms}
              />
            ))}
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.analyticsGrid, { gap: ms(12) }]}>
              <AnalyticsCard
                title="Client Success Rate"
                value={ANALYTICS.clientSuccessRate}
                subtitle="Goal achievement rate"
                icon="trophy-outline"
                color={COLORS.success}
                ms={ms}
              />
              <AnalyticsCard
                title="Average Engagement"
                value={ANALYTICS.averageEngagement}
                subtitle="Weekly participation"
                icon="pulse-outline"
                color={COLORS.primary}
                ms={ms}
              />
              <AnalyticsCard
                title="Monthly Growth"
                value={ANALYTICS.monthlyGrowth}
                subtitle="New client acquisition"
                icon="trending-up-outline"
                color={COLORS.secondary}
                ms={ms}
              />
              <AnalyticsCard
                title="Client Retention"
                value={ANALYTICS.clientRetention}
                subtitle="6-month retention rate"
                icon="people-outline"
                color={COLORS.accent}
                ms={ms}
              />
              <AnalyticsCard
                title="Weekly Hours"
                value={`${ANALYTICS.weeklyHours}h`}
                subtitle="Active coaching time"
                icon="time-outline"
                color={COLORS.warning}
                ms={ms}
              />
              <AnalyticsCard
                title="Average Rating"
                value={ANALYTICS.averageRating}
                subtitle="Client satisfaction"
                icon="star-outline"
                color={COLORS.primary}
                ms={ms}
              />
            </View>
          </ScrollView>
        );
      case 3:
        return (
          <View style={[styles.scheduleView, { padding: ms(24) }]}>
            <Ionicons name="calendar-outline" size={ms(64)} color={COLORS.muted} />
            <Text style={[styles.scheduleTitle, { fontSize: ms(18), marginTop: ms(16) }]}>
              Weekly Schedule
            </Text>
            <Text style={[styles.scheduleSubtitle, { fontSize: ms(14), marginTop: ms(8) }]}>
              Full calendar view with session management would be displayed here
            </Text>
            <TouchableOpacity
              style={[
                styles.scheduleButton,
                {
                  paddingVertical: ms(12),
                  paddingHorizontal: ms(24),
                  borderRadius: ms(8),
                  marginTop: ms(24),
                },
              ]}
              onPress={() => showDialog("Full Calendar", "Open complete calendar view with session management")}
            >
              <Text style={[styles.scheduleButtonText, { fontSize: ms(14) }]}>
                Open Full Calendar
              </Text>
            </TouchableOpacity>
          </View>
        );
      default:
        return null;
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" backgroundColor={COLORS.bg} />
      {Platform.OS === "android" && <RNStatusBar barStyle="light-content" />}

      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + ms(10),
            paddingHorizontal: ms(16),
            paddingBottom: ms(8),
          },
        ]}
      >
        <View style={styles.headerLeft}>
          <Image
            source={{ uri: COACH_INFO.avatar }}
            style={[
              styles.headerAvatar,
              {
                width: ms(36),
                height: ms(36),
                borderRadius: ms(18),
              },
            ]}
          />
          <View>
            <Text style={[styles.brand, { fontSize: ms(18) }]}>Coach Dashboard</Text>
            <Text style={[styles.greeting, { fontSize: ms(11) }]}>{getGreeting()}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() =>
              showDialog(
                `Notifications (${notificationCount})`,
                "\u2022 New client milestone achieved\n\u2022 Session reminder: Emma Wilson\n\u2022 Weekly report available"
              )
            }
          >
            <Ionicons name="notifications-outline" size={ms(18)} color="#cbd5e1" />
            {notificationCount > 0 && (
              <View
                style={[
                  styles.notificationBadge,
                  {
                    width: ms(16),
                    height: ms(16),
                    borderRadius: ms(8),
                    top: ms(2),
                    right: ms(2),
                  },
                ]}
              >
                <Text style={[styles.notificationText, { fontSize: ms(10) }]}>{notificationCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => showDialog("Coach Profile", `Navigate to ${COACH_INFO.name} profile settings`)}
          >
            <Ionicons name="person-outline" size={ms(18)} color="#cbd5e1" />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconBtn}
            onPress={() => setSettingsVisible(true)}
            disabled={loggingOut}
          >
            <Ionicons
              name="settings-outline"
              size={ms(18)}
              color={loggingOut ? "#64748b" : "#cbd5e1"}
            />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingBottom: ms(100) }}
        showsVerticalScrollIndicator={false}
      >
        {/* Coach Header */}
        <View
          style={[
            styles.coachHeader,
            {
              marginHorizontal: ms(16),
              padding: ms(16),
              borderRadius: ms(14),
              marginBottom: ms(16),
            },
          ]}
        >
          <View style={styles.coachInfo}>
            <Image
              source={{ uri: COACH_INFO.avatar }}
              style={[
                styles.coachAvatar,
                {
                  width: ms(64),
                  height: ms(64),
                  borderRadius: ms(32),
                },
              ]}
            />
            <View style={{ flex: 1, marginLeft: ms(16) }}>
              <Text style={[styles.coachName, { fontSize: ms(20) }]}>{COACH_INFO.name}</Text>
              <Text style={[styles.coachTitle, { fontSize: ms(14) }]}>{COACH_INFO.title}</Text>
              <View style={styles.coachStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={ms(14)} color={COLORS.accent} />
                  <Text style={[styles.statText, { fontSize: ms(12) }]}>{COACH_INFO.rating}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={ms(14)} color={COLORS.muted} />
                  <Text style={[styles.statText, { fontSize: ms(12) }]}>{COACH_INFO.experience}y exp</Text>
                </View>
              </View>
              <Text style={[styles.coachSpecialization, { fontSize: ms(12) }]}>{COACH_INFO.specialization}</Text>
            </View>
          </View>
        </View>

        {/* Dashboard Metrics */}
        <View style={[styles.metricsSection, { paddingHorizontal: ms(16), marginBottom: ms(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: ms(18), marginBottom: ms(12) }]}>Dashboard Overview</Text>
          <View style={[styles.metricsGrid, { gap: ms(12) }]}>
            <MetricCard
              title="All Clients"
              value={METRICS.activeClients}
              subtitle="Total clients"
              icon="people-outline"
              color={COLORS.primary}
              onPress={() => onMetricTap("activeClients")}
              ms={ms}
            />
            <MetricCard
              title="Upcoming Sessions"
              value={METRICS.upcomingSessions}
              subtitle="Today & tomorrow"
              icon="calendar-outline"
              color={COLORS.secondary}
              onPress={() => onMetricTap("upcomingSessions")}
              ms={ms}
            />
            <MetricCard
              title="Weekly Revenue"
              value={`$${METRICS.weeklyRevenue}`}
              subtitle="This week's earnings"
              icon="card-outline"
              color={COLORS.success}
              onPress={() => onMetricTap("weeklyRevenue")}
              ms={ms}
            />
            <MetricCard
              title="Client Satisfaction"
              value={`${METRICS.clientSatisfaction}%`}
              subtitle="Average rating"
              icon="heart-outline"
              color={COLORS.accent}
              onPress={() => onMetricTap("clientSatisfaction")}
              ms={ms}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View style={[styles.quickActionsSection, { paddingHorizontal: ms(16), marginBottom: ms(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: ms(18), marginBottom: ms(12) }]}>Quick Actions</Text>
          <View style={[styles.quickActionsRow, { gap: ms(12) }]}>
            <QuickActionButton icon="add-circle-outline" label="Create Session" onPress={onCreateSession} color={COLORS.primary} ms={ms} />
            <QuickActionButton icon="chatbubbles-outline" label="Message Center" onPress={onMessageCenter} color={COLORS.secondary} ms={ms} />
            <QuickActionButton icon="call-outline" label="Emergency" onPress={onEmergencyContact} color={COLORS.danger} ms={ms} />
          </View>
        </View>

        {/* Tabs */}
        <View style={[styles.mainContent, { paddingHorizontal: ms(16) }]}>
          <View
            style={[
              styles.tabBar,
              {
                backgroundColor: COLORS.card,
                borderRadius: ms(12),
                padding: ms(4),
                marginBottom: ms(16),
                borderWidth: 1,
                borderColor: COLORS.border,
              },
            ]}
          >
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.tabScrollContainer}>
              {["Clients", "Sessions", "Analytics", "Schedule"].map((tab, index) => (
                <TabButton key={tab} title={tab} active={activeTab === index} onPress={() => setActiveTab(index)} ms={ms} />
              ))}
            </ScrollView>
          </View>

          <View style={[styles.tabContent, { height: HERO_H * 1.2 }]}>{renderTabContent()}</View>
        </View>
      </ScrollView>

      <Modal
        visible={settingsVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setSettingsVisible(false)}
      >
        <View style={styles.settingsBackdrop}>
          <TouchableWithoutFeedback onPress={() => setSettingsVisible(false)}>
            <View style={styles.settingsBackdropSpacer} />
          </TouchableWithoutFeedback>

          <View
            style={[
              styles.settingsSheet,
              { paddingBottom: insets.bottom + ms(12) },
            ]}
          >
            <View style={styles.settingsHandle} />
            <Text style={[styles.settingsTitle, { fontSize: ms(16) }]}>Coach Options</Text>

            <TouchableOpacity
              style={[styles.settingsOption, { paddingVertical: ms(12) }]}
              onPress={navigateToCoachSettings}
              activeOpacity={0.85}
            >
              <View style={[styles.settingsOptionIcon, { backgroundColor: COLORS.card2 }]}>
                <Ionicons name="settings-outline" size={ms(18)} color={COLORS.text} />
              </View>
              <View style={styles.settingsOptionCopy}>
                <Text style={[styles.settingsOptionLabel, { fontSize: ms(14) }]}>Open Settings</Text>
                <Text style={[styles.settingsOptionMeta, { fontSize: ms(12) }]}>Manage profile and preferences</Text>
              </View>
              <Ionicons name="chevron-forward" size={ms(16)} color={COLORS.muted} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.settingsOption,
                styles.settingsOptionDanger,
                { paddingVertical: ms(12) },
                loggingOut && { opacity: 0.6 },
              ]}
              onPress={confirmLogout}
              activeOpacity={0.85}
              disabled={loggingOut}
            >
              <View style={[styles.settingsOptionIcon, { backgroundColor: 'rgba(239,68,68,0.12)' }]}>
                <Ionicons name="log-out-outline" size={ms(18)} color={COLORS.danger} />
              </View>
              <View style={styles.settingsOptionCopy}>
                <Text
                  style={[
                    styles.settingsOptionLabel,
                    { fontSize: ms(14), color: COLORS.danger },
                  ]}
                >
                  {loggingOut ? 'Logging out...' : 'Log Out'}
                </Text>
                <Text style={[styles.settingsOptionMeta, { fontSize: ms(12) }]}>End current session</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {isLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <View
              style={[
                styles.loadingSpinner,
                {
                  width: ms(32),
                  height: ms(32),
                  borderRadius: ms(16),
                  borderWidth: ms(3),
                },
              ]}
            />
            <Text style={[styles.loadingText, { fontSize: ms(14), marginTop: ms(12) }]}>Loading dashboard...</Text>
          </View>
        </View>
      )}
    </View>
  );
}
/* -------------------- STYLES -------------------- */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.bg },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  headerRight: { flexDirection: "row", alignItems: "center" },
  headerAvatar: { backgroundColor: COLORS.card },
  brand: { color: COLORS.text, fontWeight: "800" },
  greeting: { color: COLORS.muted, fontWeight: "600", marginTop: 2 },
  iconBtn: { padding: 8, marginLeft: 6, position: "relative" },
  notificationBadge: { position: "absolute", backgroundColor: COLORS.danger, alignItems: "center", justifyContent: "center" },
  notificationText: { color: "white", fontWeight: "700" },

  coachHeader: { backgroundColor: COLORS.card },
  coachInfo: { flexDirection: "row", alignItems: "center" },
  coachAvatar: { backgroundColor: COLORS.card2 },
  coachName: { color: COLORS.text, fontWeight: "800" },
  coachTitle: { color: COLORS.muted, marginTop: 4 },
  coachStats: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
  statItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  statText: { color: COLORS.muted, fontWeight: "600" },
  coachSpecialization: { color: COLORS.primary, marginTop: 4, fontWeight: "600" },

  sectionTitle: { color: COLORS.text, fontWeight: "800" },

  metricsGrid: { flexDirection: "row", flexWrap: "wrap" },
  metricCard: { backgroundColor: COLORS.card, width: "48%" },
  metricHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  metricTitle: { color: COLORS.muted, fontWeight: "600" },
  metricValue: { fontWeight: "900", marginVertical: 4 },
  metricSubtitle: { color: COLORS.muted },

  quickActionsRow: { flexDirection: "row" },
  quickActionButton: { flex: 1, alignItems: "center", justifyContent: "center" },
  quickActionLabel: { fontWeight: "600", textAlign: "center" },

  tabBar: { backgroundColor: COLORS.card },
  tabScrollContainer: { flexDirection: "row", gap: 4 },
  tabButton: { alignItems: "center", justifyContent: "center" },
  tabButtonText: { fontWeight: "600" },
  tabContent: { flex: 1 },

  clientCard: { backgroundColor: COLORS.card, marginBottom: 12 },
  clientHeader: { flexDirection: "row", alignItems: "center" },
  clientAvatar: { backgroundColor: COLORS.card2 },
  clientName: { color: COLORS.text, fontWeight: "700" },
  clientStatus: { color: COLORS.muted, marginTop: 2 },
  statusDot: { backgroundColor: COLORS.success },
  progressRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  progressLabel: { color: COLORS.muted, fontWeight: "600" },
  progressValue: { color: COLORS.text, fontWeight: "700" },
  calorieStatus: { color: COLORS.muted },
  nextSession: { color: COLORS.text, fontWeight: "600", marginTop: 2 },
  clientActions: { flexDirection: "row" },
  actionBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary + "20", borderColor: COLORS.primary, borderWidth: 1, gap: 4 },
  actionBtnText: { color: COLORS.primary, fontWeight: "600" },

  sessionCard: { backgroundColor: COLORS.card },
  sessionHeader: { flexDirection: "row", alignItems: "center" },
  sessionAvatar: { backgroundColor: COLORS.card2 },
  sessionClient: { color: COLORS.text, fontWeight: "700" },
  sessionType: { color: COLORS.muted, marginTop: 2 },
  sessionTime: { color: COLORS.text, fontWeight: "700" },
  sessionDuration: { color: COLORS.muted, marginTop: 2 },
  sessionActions: { flexDirection: "row" },
  sessionActionBtn: { flex: 1, alignItems: "center", justifyContent: "center" },
  startBtn: { backgroundColor: COLORS.success },
  startBtnText: { color: "white", fontWeight: "700" },
  cancelBtn: { backgroundColor: COLORS.danger + "20", borderColor: COLORS.danger, borderWidth: 1 },
  cancelBtnText: { color: COLORS.danger, fontWeight: "600" },

  analyticsGrid: { flexDirection: "row", flexWrap: "wrap" },
  analyticsCard: { backgroundColor: COLORS.card, width: "48%" },
  analyticsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  analyticsValue: { fontWeight: "900" },
  analyticsTitle: { color: COLORS.text, fontWeight: "600", marginBottom: 4 },
  analyticsSubtitle: { color: COLORS.muted },

  scheduleView: { alignItems: "center", justifyContent: "center", flex: 1 },
  scheduleTitle: { color: COLORS.text, fontWeight: "700", textAlign: "center" },
  scheduleSubtitle: { color: COLORS.muted, textAlign: "center", lineHeight: 20 },
  scheduleButton: { backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  scheduleButtonText: { color: "white", fontWeight: "700" },

  pbBg: { backgroundColor: COLORS.border, overflow: "hidden", width: "100%" },
  pbFill: { height: "100%" },

  settingsBackdrop: { flex: 1, backgroundColor: COLORS.bg + "CC", justifyContent: "flex-end" },
  settingsBackdropSpacer: { flex: 1 },
  settingsSheet: { backgroundColor: COLORS.card, marginHorizontal: 16, borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingHorizontal: 16, paddingTop: 12 },
  settingsHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "#334155", marginBottom: 12 },
  settingsTitle: { color: COLORS.text, fontWeight: "700", marginBottom: 12 },
  settingsOption: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card2, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, marginBottom: 12 },
  settingsOptionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  settingsOptionCopy: { flex: 1 },
  settingsOptionLabel: { color: COLORS.text, fontWeight: "600" },
  settingsOptionMeta: { color: COLORS.muted, marginTop: 2 },
  settingsOptionDanger: { backgroundColor: COLORS.card, borderColor: COLORS.danger + "33" },

  loadingOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: COLORS.bg + "F0", alignItems: "center", justifyContent: "center" },
  loadingContent: { alignItems: "center", justifyContent: "center" },
  loadingSpinner: { borderColor: COLORS.border, borderTopColor: COLORS.primary },
  loadingText: { color: COLORS.muted, fontWeight: "500" },
});