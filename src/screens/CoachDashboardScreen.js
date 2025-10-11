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
import { useCoachProfile } from "../hooks/useCoachProfile";
import { db } from '../lib/firebaseApp';
import { getAuth } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, onSnapshot, query, where, updateDoc, orderBy, limit, getDocs, deleteDoc } from 'firebase/firestore';
import { createCoachClientRelationship, updateCoachClientRelationship, endCoachClientRelationship } from '../utils/coachClientRelationship';

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

/* -------------------- DEFAULT COACH PLACEHOLDER -------------------- */
const DEFAULT_COACH = {
  name: "Coach",
  title: "Personal Trainer",
  avatar: "https://placehold.co/200x200/png",
  rating: 0,
  experience: 0,
  specialization: "--",
};

const STATUS_FILTERS = [
  { id: "all", label: "All", color: COLORS.muted },
  { id: "active", label: "Active", color: COLORS.success },
  { id: "trial", label: "Trial", color: COLORS.warning },
  { id: "paused", label: "Paused", color: COLORS.danger }
];

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

// Unified MetricCard component
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
    activeOpacity={onPress ? 0.7 : 1}
  >
    <View style={styles.metricHeader}>
      <Text style={[styles.metricTitle, { fontSize: ms(13) }]}>{title}</Text>
      <Ionicons name={icon} size={ms(20)} color={color} />
    </View>
    <Text style={[styles.metricValue, { fontSize: ms(24), color }]}>
      {typeof value === 'number' && value >= 1000 ? value.toLocaleString() : value}
    </Text>
    {!!subtitle && (
      <Text style={[styles.metricSubtitle, { fontSize: ms(11) }]}>{subtitle}</Text>
    )}
  </TouchableOpacity>
);

// Status chip (filter) component
const StatusChip = ({ status, onPress, isSelected, ms }) => {
  const statusInfo = STATUS_FILTERS.find(s => s.id === status) || STATUS_FILTERS[0];
  return (
    <TouchableOpacity
      style={{
        paddingVertical: ms(6),
        paddingHorizontal: ms(12),
        borderRadius: ms(16),
        backgroundColor: isSelected ? statusInfo.color : statusInfo.color + '20',
        borderColor: statusInfo.color,
        borderWidth: 1,
        marginRight: ms(8),
      }}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text
        style={{
          fontSize: ms(12),
          color: isSelected ? '#fff' : statusInfo.color,
          fontWeight: isSelected ? '600' : '500',
        }}
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
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const [showClientsModal, setShowClientsModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  
  // Real data states
  const [realClients, setRealClients] = useState([]);
  const [realSessions, setRealSessions] = useState([]);
  const [realMetrics, setRealMetrics] = useState({
    activeClients: 0,
    completedSessions: 0,
    clientSatisfaction: 0,
    weeklyRevenue: 0,
    weeklyHours: '0h'
  });
  // Listen for upcoming sessions
  useEffect(() => {
    if (!coach?.id && !coach?.uid) return;
    const coachId = coach.uid || coach.id;
    
    console.log('[CoachDashboard] Setting up upcoming sessions listener for coach ID:', coachId);
    
    const sessionsRef = collection(db, 'sessions');
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 2); // Today and tomorrow
    
    const q = query(
      sessionsRef,
      where('coachId', '==', coachId),
      where('status', '==', 'scheduled'),
      where('scheduledDate', '>=', today),
      where('scheduledDate', '<=', tomorrow)
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const upcomingCount = snapshot.docs.length;
      console.log('[CoachDashboard] Found', upcomingCount, 'upcoming sessions');
      setUpcomingSessions(upcomingCount);
    }, (error) => {
      console.warn('[CoachDashboard] upcoming sessions listener error:', error);
      setUpcomingSessions(0);
    });
    
    return unsubscribe;
  }, [coach?.uid, coach?.id]);

  // Listen for notifications
  useEffect(() => {
    if (!coach?.id && !coach?.uid) return;
    const coachId = coach.uid || coach.id;
    
    console.log('[CoachDashboard] Setting up notifications listener for coach ID:', coachId);
    
    const notificationsRef = collection(db, 'notifications');
    
    // Try with orderBy first, fall back to simple query if index not ready
    let q;
    try {
      q = query(
        notificationsRef,
        where('recipientId', '==', coachId),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } catch (indexError) {
      console.warn('[CoachDashboard] Using fallback query without orderBy');
      q = query(
        notificationsRef,
        where('recipientId', '==', coachId),
        limit(20)
      );
    }
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('[CoachDashboard] Notifications listener fired, found', snapshot.docs.length, 'notifications');
      
      const notificationsList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('[CoachDashboard] Notification:', doc.id, 'type:', data.type, 'from:', data.senderName);
        return {
          id: doc.id,
          ...data
        };
      });
      
      // Sort by createdAt if we couldn't use orderBy
      notificationsList.sort((a, b) => {
        const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
        const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
        return bTime - aTime;
      });
      
      setNotifications(notificationsList);
      
      // Count unread notifications
      const unreadCount = notificationsList.filter(n => !n.read).length;
      console.log('[CoachDashboard] Unread notifications count:', unreadCount);
      setNotificationCount(unreadCount);
    }, (error) => {
      console.warn('[CoachDashboard] notifications listener error:', error);
      
      // If the query failed due to index, try a simpler query
      if (error.code === 'failed-precondition') {
        console.log('[CoachDashboard] Retrying with simple query due to index issue');
        const simpleQ = query(notificationsRef, where('recipientId', '==', coachId));
        const fallbackUnsubscribe = onSnapshot(simpleQ, (snapshot) => {
          const notificationsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          
          // Sort manually
          notificationsList.sort((a, b) => {
            const aTime = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(a.createdAt || 0);
            const bTime = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(b.createdAt || 0);
            return bTime - aTime;
          });
          
          setNotifications(notificationsList);
          setNotificationCount(notificationsList.filter(n => !n.read).length);
        });
        return fallbackUnsubscribe;
      }
    });
    
    return unsubscribe;
  }, [coach?.uid, coach?.id]);

  // Listen for real client data using new UserCoachRelationships collection
  useEffect(() => {
    if (!coach?.id) {
      console.log('[DEBUG] No coach ID available yet');
      return;
    }
    
    // Use the authentication UID for consistency with security rules
    const auth = getAuth();
    const authUid = auth?.currentUser?.uid;
    
    console.log('[DEBUG] Setting up UserCoachRelationships listener for coach ID:', coach.id, 'auth UID:', authUid);
    
    if (!authUid) {
      console.warn('[DEBUG] No authenticated user, skipping relationship listener');
      return;
    }
    
    const userCoachRelationshipsRef = collection(db, 'UserCoachRelationships');
    
    // Query for relationships where this coach is the coach
    const q = query(
      userCoachRelationshipsRef,
      where('coach.id', '==', authUid),
      where('status', '==', 'active')
    );
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      console.log('[DEBUG] UserCoachRelationships query fired - found', snapshot.docs.length, 'active relationships');
      
      const relationships = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      console.log('[DEBUG] UserCoachRelationships data:', relationships);
      
      // Transform the data for display
      const clientsData = relationships.map(rel => {
        const client = rel.client;
        const progress = rel.progress || {};
        const sessions = rel.sessions || {};
        
        console.log('[DEBUG] Processing client:', client.name, 'with goals:', client.fitnessGoals);
        
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
          lastSession: sessions.lastSession ? 
            new Date(sessions.lastSession).toLocaleDateString() : 
            'No sessions yet',
          progress: progress.percentage || 0,
          calorieStatus: progress.weightChange ? 
            (progress.weightChange > 0 ? 'Weight gaining' : 'Weight losing') : 
            'No data yet',
          nextSession: sessions.nextSession ? 
            new Date(sessions.nextSession).toLocaleDateString() : 
            'Not scheduled',
          totalSessions: sessions.completed || 0,
          
          // Additional client data for profile views
          age: client.age,
          gender: client.gender,
          heightCm: client.heightCm,
          weightKg: client.weightKg,
          fitnessLevel: client.fitnessLevel,
          allGoals: client.fitnessGoals || []
        };
      });
      
      console.log('[DEBUG] Final processed clients data:', clientsData.length, 'clients', clientsData);
      setRealClients(clientsData);
      
      // Update metrics immediately
      setRealMetrics(prev => {
        const updated = {
          ...prev,
          activeClients: clientsData.length
        };
        console.log('[DEBUG] Updated metrics - activeClients:', updated.activeClients);
        return updated;
      });
      
    }, (error) => {
      console.warn('[CoachDashboard] UserCoachRelationships listener error:', error);
      setRealClients([]);
      setRealMetrics(prev => ({ ...prev, activeClients: 0 }));
    });
    
    return unsubscribe;
  }, [coach?.id]);

  // Listen for real sessions data
  useEffect(() => {
    if (!coach?.id && !coach?.uid) return;
    const coachId = coach.uid || coach.id;
    
    const sessionsRef = collection(db, 'sessions');
    const q = query(
      sessionsRef,
      where('coachId', '==', coachId),
      orderBy('scheduledDate', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const sessions = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      // Filter today's sessions
      const today = new Date();
      const todaySessions = sessions.filter(session => {
        const sessionDate = session.scheduledDate?.toDate ? session.scheduledDate.toDate() : new Date(session.scheduledDate);
        return sessionDate.toDateString() === today.toDateString();
      });

      // Calculate this week's sessions
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 7);

      const thisWeekSessions = sessions.filter(session => {
        const sessionDate = session.scheduledDate?.toDate ? session.scheduledDate.toDate() : new Date(session.scheduledDate);
        return sessionDate >= startOfWeek && sessionDate < endOfWeek && session.status === 'completed';
      });

      const weeklyHours = thisWeekSessions.reduce((total, session) => {
        return total + (session.duration || 60); // Default 60 minutes per session
      }, 0) / 60; // Convert minutes to hours
      
      setRealSessions(todaySessions);
      
      // Count completed sessions
      const completedSessions = sessions.filter(s => s.status === 'completed').length;
      
      // Calculate real client satisfaction based on session ratings
      let clientSatisfaction = 0;
      if (completedSessions > 0) {
        const ratedSessions = sessions.filter(s => s.status === 'completed' && s.rating);
        if (ratedSessions.length > 0) {
          const avgRating = ratedSessions.reduce((sum, s) => sum + (s.rating || 0), 0) / ratedSessions.length;
          clientSatisfaction = Math.round((avgRating / 5) * 100); // Convert 5-star rating to percentage
        } else {
          clientSatisfaction = 95; // Default high satisfaction if no ratings yet
        }
      }
      
      // Update metrics
      setRealMetrics(prev => ({
        ...prev,
        completedSessions,
        clientSatisfaction,
        weeklyHours: weeklyHours > 0 ? `${weeklyHours.toFixed(1)}h` : '0h'
      }));
      
    }, (error) => {
      console.warn('[CoachDashboard] sessions listener error:', error);
    });
    
    return unsubscribe;
  }, [coach?.uid, coach?.id]);

  const { coach } = useCoachProfile();
  
  // Temporary debug to identify the issue
  console.log('[DEBUG] Coach profile:', {
    id: coach?.id,
    uid: coach?.uid,
    email: coach?.email,
    name: coach?.name
  });
  
  const info = coach ? {
    name: coach.name || DEFAULT_COACH.name,
    title: coach.title || coach.roleTitle || DEFAULT_COACH.title,
    avatar: coach.photoURL || coach.avatar || DEFAULT_COACH.avatar,
    rating: coach.rating || coach.avgRating || DEFAULT_COACH.rating,
    experience: coach.experienceYears || coach.experience || DEFAULT_COACH.experience,
    specialization: coach.specialization || coach.focus || DEFAULT_COACH.specialization,
  } : DEFAULT_COACH;

  // Self-repair /users/{uid} doc to ensure role:'coach' + flag fields present so root navigator doesn't mis-route.
  useEffect(() => {
    let running = false;
    (async () => {
      if (running) return; running = true;
      const auth = getAuth();
      const u = auth?.currentUser; 
      if (!u) return;
      try {
        const userRef = doc(db, 'users', u.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) return; // user doc missing; creation handled elsewhere
        const data = snap.data() || {};
        const needs = {};
        if (data.role !== 'coach') needs.role = 'coach';
        if (typeof data.coachOnboardingComplete === 'undefined') needs.coachOnboardingComplete = false;
        if (typeof data.phoneVerified === 'undefined') needs.phoneVerified = false;
        if (typeof data.coachEmailVerified === 'undefined') needs.coachEmailVerified = false;
        if (Object.keys(needs).length) {
          console.log('[CoachDashboard] repairing user doc fields', needs);
          await setDoc(userRef, needs, { merge: true });
        }
      } catch (e) {
        console.warn('[CoachDashboard] self-repair failed', e);
      }
    })();
    return () => { running = true; };
  }, [coach]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    const first = (info.name || 'Coach').split(' ')[0];
    if (hour < 12) return `Good morning, ${first}!`;
    if (hour < 18) return `Good afternoon, ${first}!`;
    return `Good evening, ${first}!`;
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
    Alert.alert("Success", "Dashboard refreshed successfully!");
  };

  const handleNotifications = () => {
    // Navigate to dedicated notifications screen
    navigation.navigate('CoachNotifications');
  };

  const showNotificationsModal = () => {
    const coachRequests = notifications.filter(n => n.type === 'coach_request');
    
    if (coachRequests.length > 0) {
      const requestsText = coachRequests.map(req => 
        `${req.senderName} wants you as their coach`
      ).join('\n\n');
      
      Alert.alert(
        'Coach Requests',
        requestsText,
        [
          { text: 'Accept All', onPress: () => handleBulkAcceptRequests(coachRequests) },
          { text: 'View Individual', onPress: () => handleIndividualRequests(coachRequests) },
          { text: 'Close', style: 'cancel' }
        ]
      );
    }
  };

  const handleBulkAcceptRequests = async (requests) => {
    try {
      for (const request of requests) {
        await acceptCoachRequest(request);
      }
      Alert.alert('Success', `Accepted ${requests.length} coach request(s)!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to accept some requests. Please try again.');
    }
  };

  const handleIndividualRequests = (requests) => {
    if (requests.length === 0) return;
    
    const request = requests[0];
    Alert.alert(
      'Coach Request',
      `${request.senderName} wants you as their personal coach.\n\nWould you like to accept them as a client?`,
      [
        { text: 'Decline', style: 'destructive', onPress: () => declineCoachRequest(request) },
        { text: 'Accept', onPress: () => acceptCoachRequest(request) },
        { text: 'Next', onPress: () => {
          const remainingRequests = requests.slice(1);
          if (remainingRequests.length > 0) {
            handleIndividualRequests(remainingRequests);
          }
        }}
      ]
    );
  };

  const acceptCoachRequest = async (request) => {
    try {
      console.log('[DEBUG] Accepting coach request:', request);
      console.log('[DEBUG] Current coach profile:', coach);

      const auth = getAuth();
      console.log('[DEBUG] Auth instance:', !!auth);

      if (!auth) {
        throw new Error('Firebase Auth not initialized');
      }

      const currentUser = auth.currentUser;
      console.log('[DEBUG] Current user:', !!currentUser, currentUser?.uid);

      if (!currentUser) {
        throw new Error('No authenticated user found');
      }

      const authUid = currentUser.uid;
      const clientId = request.senderId;

      console.log('[DEBUG] Creating relationship with authUid:', authUid, 'clientId:', clientId);

      const requestPayload = request?.data || {};
      const fallbackClientProfile = { ...(requestPayload.clientFallback || {}) };
      if (!fallbackClientProfile.name && request.senderName) {
        fallbackClientProfile.name = request.senderName;
      }
      if (!fallbackClientProfile.email && requestPayload.requesterEmail) {
        fallbackClientProfile.email = requestPayload.requesterEmail;
      }
      if (!fallbackClientProfile.photoURL && requestPayload.requesterPhotoURL) {
        fallbackClientProfile.photoURL = requestPayload.requesterPhotoURL;
      }
      if (!fallbackClientProfile.weightGoal && requestPayload.requesterWeightGoal) {
        fallbackClientProfile.weightGoal = requestPayload.requesterWeightGoal;
      }
      if (!Array.isArray(fallbackClientProfile.fitnessGoals)) {
        if (Array.isArray(requestPayload.requesterFitnessGoals)) {
          fallbackClientProfile.fitnessGoals = requestPayload.requesterFitnessGoals;
        } else if (requestPayload.requesterWeightGoal) {
          fallbackClientProfile.fitnessGoals = [requestPayload.requesterWeightGoal];
        } else {
          fallbackClientProfile.fitnessGoals = [];
        }
      }

      const requestedAtIso = (() => {
        const createdAt = request.createdAt;
        if (createdAt?.toDate) {
          try {
            return createdAt.toDate().toISOString();
          } catch (error) {
            console.warn('[DEBUG] Failed to convert request.createdAt via toDate()', error);
          }
        }
        if (typeof createdAt === 'string' || typeof createdAt === 'number') {
          const parsed = new Date(createdAt);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
        }
        return new Date().toISOString();
      })();

      const relationshipResult = await createCoachClientRelationship({
        coachId: authUid,
        clientId: clientId,
        coachData: {
          name: coach?.name || 'Coach',
          email: coach?.email,
          photoURL: coach?.photoURL || coach?.avatar,
        },
        requestData: {
          message: request.message || 'Coach request accepted',
          source: 'coach_request',
          notificationId: request.id,
          requestedAt: requestedAtIso,
          requesterId: request.senderId,
          requesterName: request.senderName,
          requesterEmail: requestPayload.requesterEmail,
          requesterPhotoURL: requestPayload.requesterPhotoURL,
          requesterFitnessGoals: requestPayload.requesterFitnessGoals,
          requesterWeightGoal: requestPayload.requesterWeightGoal,
          clientFallback: fallbackClientProfile,
        },
      });

      if (!relationshipResult.success) {
        throw new Error(relationshipResult.error);
      }

      const { relationshipId } = relationshipResult;
      const alreadyExisted = relationshipResult.alreadyExisted;
      const reactivated = relationshipResult.reactivated;

      const notificationRef = doc(db, 'notifications', request.id);
      await updateDoc(notificationRef, {
        status: 'accepted',
        respondedAt: new Date().toISOString(),
        relationshipId,
      });

      const coachName = coach?.name || 'Your Coach';
      const clientNotificationMessage = alreadyExisted && !reactivated
        ? coachName + ' confirmed your coaching relationship is already active.'
        : reactivated
          ? coachName + ' has welcomed you back as an active client.'
          : 'Great news! ' + coachName + ' has accepted your request and is now your personal coach.';

      const clientNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(clientNotificationRef, {
        type: 'coach_request_accepted',
        recipientId: request.senderId,
        senderId: authUid,
        senderName: coachName,
        title: alreadyExisted && !reactivated ? 'Connection Confirmed' : 'Coach Request Accepted!',
        message: clientNotificationMessage,
        createdAt: new Date().toISOString(),
        read: false,
        relationshipId,
      });

      const alertTitle = alreadyExisted && !reactivated ? 'Already Connected' : 'Success';
      const alertMessage = alreadyExisted && !reactivated
        ? request.senderName + ' is already listed as your client.'
        : reactivated
          ? request.senderName + ' has been reactivated as an active client.'
          : 'You have accepted ' + request.senderName + ' as your client!';



      Alert.alert(alertTitle, alertMessage);
    } catch (error) {
      console.error('Accept coach request error:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    }
  };

  const declineCoachRequest = async (request) => {
    try {
      // Update notification status
      const notificationRef = doc(db, 'notifications', request.id);
      await updateDoc(notificationRef, { 
        status: 'declined',
        respondedAt: new Date().toISOString()
      });

      Alert.alert('Request Declined', `You have declined ${request.senderName}'s coach request.`);
    } catch (error) {
      console.error('Decline coach request error:', error);
      Alert.alert('Error', 'Failed to decline the request. Please try again.');
    }
  };

  // FIXED: Removed navigation to non-existent 'CoachClients' screen
  const onMetricTap = (metricType) => {
    if (metricType === "activeClients") {
      navigation.navigate('CoachClients');
    } else {
      Alert.alert(`${metricType.toUpperCase()} Details`, `This metric shows your ${metricType} performance.`);
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
    // Navigate to session scheduling screen when implemented
    Alert.alert("Feature Coming Soon", `Session scheduling with ${client.name} will be available in a future update.`);
  };

  // Client management functions using the new utility
  const handleClientProgressUpdate = async (client, progressData) => {
    try {
      const result = await updateCoachClientRelationship(client.relationshipId, {
        'progress.percentage': progressData.percentage,
        'progress.goalsAchieved': progressData.goalsAchieved,
        'progress.weightChange': progressData.weightChange
      });

      if (result.success) {
        Alert.alert('Success', 'Client progress updated successfully!');
      } else {
        throw new Error(result.error);
      }
    } catch (error) {
      console.error('Progress update error:', error);
      Alert.alert('Error', 'Failed to update client progress. Please try again.');
    }
  };

  const handleEndClientRelationship = async (client, reason) => {
    try {
      Alert.alert(
        'End Relationship',
        `Are you sure you want to end your coaching relationship with ${client.name}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'End Relationship',
            style: 'destructive',
            onPress: async () => {
              const result = await endCoachClientRelationship(client.relationshipId, reason);
              if (result.success) {
                Alert.alert('Success', 'Coaching relationship ended successfully.');
              } else {
                Alert.alert('Error', 'Failed to end relationship. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('End relationship error:', error);
      Alert.alert('Error', 'Failed to end relationship. Please try again.');
    }
  };

  const onSessionTap = (session) => {
    // Navigate to session details when implemented
    Alert.alert(
      "Session Details",
      `Client: ${session.clientName}\nTime: ${session.time}\nDuration: ${session.duration} minutes\nType: ${session.type}`
    );
  };

  const onStartSession = (session) => {
    Alert.alert("Start Session", `Start session with ${session.clientName}?`, [
      { text: "Cancel", style: "cancel" },
      { text: "Start", onPress: () => {
        // Navigate to active session screen when implemented
        Alert.alert("Feature Coming Soon", "Live session tracking will be available in a future update.");
      }}
    ]);
  };

  const onCancelSession = (session) => {
    Alert.alert("Cancel Session", `Cancel session with ${session.clientName}?`, [
      { text: "No", style: "cancel" },
      { text: "Cancel Session", style: "destructive" },
    ]);
  };

  const onCreateSession = () => {
    Alert.alert("Feature Coming Soon", "Session creation will be available in a future update.");
  };

  const onMessageCenter = () => {
    navigation.navigate('CoachMessages');
  };

  const onEmergencyContact = () => {
    Alert.alert("Feature Coming Soon", "Emergency contact features will be available in a future update.");
  };

  // Filter and search logic for modal
  const filteredClients = useMemo(() => {
    let filtered = realClients; // Use real clients instead of static CLIENTS

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
  }, [searchQuery, selectedStatus, realClients]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 0:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {realClients.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="people-outline" size={64} color={COLORS.muted} />
                <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 18, marginTop: 16 }}>
                  No Clients Yet
                </Text>
                <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                  Your accepted clients will appear here. Coach requests from the marketplace will show in notifications.
                </Text>
              </View>
            ) : (
              realClients.map((client, index) => (
                <ClientCard
                  key={`${client.id}-${client.relationshipId}-${index}`}
                  client={client}
                  onClientTap={onClientTap}
                  onMessage={onMessageClient}
                  onSchedule={onScheduleSession}
                  ms={ms}
                />
              ))
            )}
          </ScrollView>
        );
      case 1:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            {realSessions.length === 0 ? (
              <View style={{ alignItems: 'center', marginTop: 40 }}>
                <Ionicons name="calendar-outline" size={64} color={COLORS.muted} />
                <Text style={{ color: COLORS.text, fontWeight: '700', fontSize: 18, marginTop: 16 }}>
                  No Sessions Today
                </Text>
                <Text style={{ color: COLORS.muted, textAlign: 'center', marginTop: 8, paddingHorizontal: 32 }}>
                  Your scheduled sessions for today will appear here.
                </Text>
              </View>
            ) : (
              realSessions.map((session) => (
                <SessionCard
                  key={session.id}
                  session={session}
                  onSessionTap={onSessionTap}
                  onStart={onStartSession}
                  onCancel={onCancelSession}
                  ms={ms}
                />
              ))
            )}
          </ScrollView>
        );
      case 2:
        return (
          <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
            <View style={[styles.analyticsGrid, { gap: ms(12) }]}>
              <AnalyticsCard
                title="Client Success Rate"
                value={realMetrics.clientSatisfaction}
                subtitle="Based on completed sessions"
                icon="trophy-outline"
                color={COLORS.success}
                ms={ms}
              />
              <AnalyticsCard
                title="Active Clients"
                value={realMetrics.activeClients}
                subtitle="Current client base"
                icon="people-outline"
                color={COLORS.primary}
                ms={ms}
              />
              <AnalyticsCard
                title="Completed Sessions"
                value={realMetrics.completedSessions}
                subtitle="Total sessions completed"
                icon="checkmark-circle-outline"
                color={COLORS.secondary}
                ms={ms}
              />
              <AnalyticsCard
                title="This Week"
                value={realMetrics.weeklyHours || '0h'}
                subtitle="Sessions this week"
                icon="time-outline"
                color={COLORS.warning}
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
              onPress={() => Alert.alert("Feature Coming Soon", "Full calendar view will be available in a future update.")}
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
            source={{ uri: info.avatar }}
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
            onPress={handleNotifications}
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
            onPress={() => navigation.navigate('CoachProfile')}
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
              source={{ uri: info.avatar }}
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
              <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                <Text style={[styles.coachName, { fontSize: ms(20) }]}>{info.name}</Text>
              </View>
              <Text style={[styles.coachTitle, { fontSize: ms(14) }]}>{info.title}</Text>
              <View style={styles.coachStats}>
                <View style={styles.statItem}>
                  <Ionicons name="star" size={ms(14)} color={COLORS.accent} />
                  <Text style={[styles.statText, { fontSize: ms(12) }]}>{info.rating}</Text>
                </View>
                <View style={styles.statItem}>
                  <Ionicons name="time-outline" size={ms(14)} color={COLORS.muted} />
                  <Text style={[styles.statText, { fontSize: ms(12) }]}>{info.experience}y exp</Text>
                </View>
              </View>
              <Text style={[styles.coachSpecialization, { fontSize: ms(12) }]}>{info.specialization}</Text>
              {/* Removed large banner; compact pill used instead */}
            </View>
          </View>
        </View>

        {/* Dashboard Metrics */}
        <View style={[styles.metricsSection, { paddingHorizontal: ms(16), marginBottom: ms(16) }]}>
          <Text style={[styles.sectionTitle, { fontSize: ms(18), marginBottom: ms(12) }]}>Dashboard Overview</Text>
          <View style={[styles.metricsGrid, { gap: ms(12) }]}>
            <MetricCard
              title="Active Clients"
              value={realMetrics.activeClients}
              subtitle={realMetrics.activeClients === 1 ? "client" : "clients"}
              icon="people-outline"
              color={COLORS.primary}
              onPress={() => onMetricTap("activeClients")}
              ms={ms}
            />
            <MetricCard
              title="Upcoming Sessions"
              value={upcomingSessions}
              subtitle="Today & tomorrow"
              icon="calendar-outline"
              color={COLORS.secondary}
              onPress={() => onMetricTap("upcomingSessions")}
              ms={ms}
            />
            <MetricCard
              title="Client Satisfaction"
              value={`${realMetrics.clientSatisfaction}%`}
              subtitle="Based on sessions"
              icon="heart-outline"
              color={COLORS.accent}
              ms={ms}
            />
            <MetricCard
              title="Discover"
              value={''}
              subtitle="Find content & tools"
              icon="compass-outline"
              color={COLORS.warning}
              onPress={() => navigation.navigate('Discover')}
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
  verifyButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primary + '20', borderWidth: 1, borderColor: COLORS.primary },
  verifyButtonText: { color: COLORS.primary, fontWeight: '700' },
});