import { db } from "../lib/firebaseApp";
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  serverTimestamp,
  doc,
  getDoc
} from "firebase/firestore";

/**
 * Gets or creates a chat between two users
 */
export async function getOrCreateChat(currentUserId, otherUserId) {
  try {
    // Check if chat already exists
    const chatsRef = collection(db, "chats");
    const q = query(
      chatsRef,
      where("participants", "array-contains", currentUserId)
    );
    
    const querySnapshot = await getDocs(q);
    let existingChat = null;
    
    // Look for existing chat with both participants
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.participants.includes(otherUserId)) {
        existingChat = { id: doc.id, ...data };
      }
    });

    // If chat exists, return it
    if (existingChat) {
      const otherUserData = existingChat.participantDetails[otherUserId];
      return {
        chatId: existingChat.id,
        otherUser: otherUserData,
      };
    }

    // Otherwise, create new chat
    const currentUserRef = doc(db, "users", currentUserId);
    const otherUserRef = doc(db, "users", otherUserId);
    
    const [currentUserDoc, otherUserDoc] = await Promise.all([
      getDoc(currentUserRef),
      getDoc(otherUserRef),
    ]);

    if (!currentUserDoc.exists() || !otherUserDoc.exists()) {
      throw new Error("User not found");
    }

    const currentUserData = currentUserDoc.data();
    const otherUserData = otherUserDoc.data();

    // Create new chat document
    const newChat = {
      participants: [currentUserId, otherUserId],
      participantDetails: {
        [currentUserId]: {
          id: currentUserId,
          name: currentUserData.profile?.firstName || "User",
          role: currentUserData.profile?.role || "user",
          photoURL: currentUserData.profile?.photoURL || null,
        },
        [otherUserId]: {
          id: otherUserId,
          name: otherUserData.profile?.firstName || "User",
          role: otherUserData.profile?.role || "user",
          photoURL: otherUserData.profile?.photoURL || null,
        },
      },
      lastMessage: {
        text: "",
        senderId: "",
        timestamp: serverTimestamp(),
      },
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      },
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(chatsRef, newChat);

    return {
      chatId: docRef.id,
      otherUser: newChat.participantDetails[otherUserId],
    };
  } catch (error) {
    console.error("Error in getOrCreateChat:", error);
    throw error;
  }
}

/**
 * Get all trainers/coaches from the database
 */
export async function getAllCoaches() {
  try {
    const usersRef = collection(db, "users");
    const q = query(usersRef, where("profile.role", "==", "trainer"));
    
    const querySnapshot = await getDocs(q);
    const coaches = [];
    
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      coaches.push({
        id: doc.id,
        name: data.profile?.firstName || "Coach",
        role: data.profile?.role || "trainer",
        specialization: data.profile?.specialization || "General Fitness",
        photoURL: data.profile?.photoURL || null,
        bio: data.profile?.bio || "",
      });
    });
    
    return coaches;
  } catch (error) {
    console.error("Error fetching coaches:", error);
    return [];
  }
}

