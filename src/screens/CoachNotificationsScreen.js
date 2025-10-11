import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  doc, 
  updateDoc,
  setDoc,
  getDoc,
} from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../lib/firebaseApp';
import { useCoachProfile } from '../hooks/useCoachProfile';
import { createCoachClientRelationship } from '../utils/coachClientRelationship';

const COLORS = {
  bg: '#0B1220',
  card: '#111827',
  border: '#1f2937',
  text: '#e5e7eb',
  muted: '#94a3b8',
  primary: '#10B981',
  danger: '#ef4444',
  warning: '#f59e0b',
  success: '#22c55e',
};

export default function CoachNotificationsScreen({ navigation }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { coach } = useCoachProfile();

  useEffect(() => {
    if (!coach?.id && !coach?.uid) return;
    const coachId = coach.uid || coach.id;
    
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', coachId),
      orderBy('createdAt', 'desc')
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      
      setNotifications(notificationsList);
      setLoading(false);
    }, (error) => {
      console.warn('[CoachNotifications] error:', error);
      setLoading(false);
    });
    
    return unsubscribe;
  }, [coach?.uid, coach?.id]);

  const markAsRead = async (notificationId) => {
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
    } catch (error) {
      console.error('Mark as read error:', error);
    }
  };

  const acceptCoachRequest = async (notification) => {
    try {
      console.log('[CoachNotifications] Accepting coach request:', notification);
      console.log('[CoachNotifications] Current coach profile:', coach);
      
      // Use the authentication UID for consistency with security rules
      const auth = getAuth();
      const authUid = auth.currentUser?.uid;
      const clientId = notification.senderId;
      
      if (!authUid) {
        throw new Error('No authenticated user found');
      }
      
      console.log('[CoachNotifications] Creating relationship with authUid:', authUid, 'clientId:', clientId);
      
      // Create the coach-client relationship using the utility function
      const relationshipResult = await createCoachClientRelationship({
        coachId: authUid,
        clientId: clientId,
        coachData: {
          name: coach?.name || 'Coach',
          email: coach?.email,
          photoURL: coach?.photoURL || coach?.avatar
        },
        requestData: {
          message: notification.message || 'Coach request accepted',
          source: 'notification_screen'
        }
      });

      if (!relationshipResult.success) {
        throw new Error(relationshipResult.error);
      }

      console.log('[CoachNotifications] Created coach-client relationship successfully:', relationshipResult.relationshipId);

      // Update notification status
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, { 
        status: 'accepted',
        respondedAt: new Date().toISOString(),
        relationshipId: relationshipResult.relationshipId
      });

      // Create acceptance notification for client
      const clientNotificationRef = doc(collection(db, 'notifications'));
      await setDoc(clientNotificationRef, {
        type: 'coach_request_accepted',
        recipientId: notification.senderId,
        senderId: authUid,
        senderName: coach?.name || 'Your Coach',
        title: 'Coach Request Accepted!',
        message: `Great news! ${coach?.name || 'Your coach'} has accepted your request and is now your personal coach.`,
        createdAt: new Date().toISOString(), // Use ISO string instead of serverTimestamp for now
        read: false,
        relationshipId: relationshipResult.relationshipId
      });

      Alert.alert('Success', `You have accepted ${notification.senderName} as your client!`);
    } catch (error) {
      console.error('Accept coach request error:', error);
      Alert.alert('Error', 'Failed to accept the request. Please try again.');
    }
  };

  const declineCoachRequest = async (notification) => {
    try {
      // Update notification status
      const notificationRef = doc(db, 'notifications', notification.id);
      await updateDoc(notificationRef, { 
        status: 'declined',
        respondedAt: new Date().toISOString()
      });

      Alert.alert('Request Declined', `You have declined ${notification.senderName}'s coach request.`);
    } catch (error) {
      console.error('Decline coach request error:', error);
      Alert.alert('Error', 'Failed to decline the request. Please try again.');
    }
  };

  const handleNotificationPress = async (notification) => {
    // Mark as read
    if (!notification.read) {
      await markAsRead(notification.id);
    }

    if (notification.type === 'coach_request' && notification.status === 'pending') {
      Alert.alert(
        'Coach Request',
        `${notification.senderName} wants you as their personal coach.\n\n"${notification.message}"\n\nWould you like to accept them as a client?`,
        [
          { text: 'Decline', style: 'destructive', onPress: () => declineCoachRequest(notification) },
          { text: 'Accept', onPress: () => acceptCoachRequest(notification) },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
    }
  };

  const getNotificationIcon = (type, status) => {
    if (type === 'coach_request') {
      if (status === 'accepted') return { name: 'checkmark-circle', color: COLORS.success };
      if (status === 'declined') return { name: 'close-circle', color: COLORS.danger };
      return { name: 'person-add', color: COLORS.warning };
    }
    return { name: 'notifications', color: COLORS.primary };
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  };

  const renderNotification = ({ item }) => {
    const icon = getNotificationIcon(item.type, item.status);
    const isCoachRequest = item.type === 'coach_request';
    const isPending = item.status === 'pending';
    
    return (
      <TouchableOpacity
        style={[styles.notificationCard, !item.read && styles.unreadCard]}
        onPress={() => handleNotificationPress(item)}
        activeOpacity={0.8}
      >
        <View style={styles.notificationHeader}>
          <View style={styles.notificationLeft}>
            {item.senderPhotoURL ? (
              <Image source={{ uri: item.senderPhotoURL }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatarPlaceholder, { backgroundColor: icon.color + '20' }]}>
                <Ionicons name={icon.name} size={24} color={icon.color} />
              </View>
            )}
            <View style={styles.notificationContent}>
              <Text style={styles.notificationTitle}>{item.title}</Text>
              <Text style={styles.notificationMessage}>{item.message}</Text>
              {isCoachRequest && item.status && (
                <View style={[styles.statusBadge, { backgroundColor: icon.color + '20' }]}>
                  <Ionicons name={icon.name} size={12} color={icon.color} />
                  <Text style={[styles.statusText, { color: icon.color }]}>
                    {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                  </Text>
                </View>
              )}
            </View>
          </View>
          <View style={styles.notificationRight}>
            <Text style={styles.timeText}>{formatTime(item.createdAt)}</Text>
            {!item.read && <View style={styles.unreadDot} />}
          </View>
        </View>
        
        {isCoachRequest && isPending && (
          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.declineButton]}
              onPress={() => declineCoachRequest(item)}
            >
              <Text style={styles.declineButtonText}>Decline</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionButton, styles.acceptButton]}
              onPress={() => acceptCoachRequest(item)}
            >
              <Text style={styles.acceptButtonText}>Accept</Text>
            </TouchableOpacity>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Notifications</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="chevron-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notifications</Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-outline" size={64} color={COLORS.muted} />
            <Text style={styles.emptyTitle}>No Notifications</Text>
            <Text style={styles.emptyMessage}>
              You'll see coach requests and updates here
            </Text>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.card,
  },
  headerTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
  },
  listContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationCard: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  unreadCard: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
  },
  notificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  notificationLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  notificationMessage: {
    color: COLORS.muted,
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  notificationRight: {
    alignItems: 'flex-end',
  },
  timeText: {
    color: COLORS.muted,
    fontSize: 12,
    marginBottom: 4,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },
  actionButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButton: {
    backgroundColor: COLORS.danger + '20',
    borderWidth: 1,
    borderColor: COLORS.danger,
  },
  declineButtonText: {
    color: COLORS.danger,
    fontWeight: '600',
  },
  acceptButton: {
    backgroundColor: COLORS.success,
  },
  acceptButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    color: COLORS.muted,
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 64,
  },
  emptyTitle: {
    color: COLORS.text,
    fontSize: 18,
    fontWeight: '700',
    marginTop: 16,
  },
  emptyMessage: {
    color: COLORS.muted,
    textAlign: 'center',
    marginTop: 8,
  },
});
